let D = require('../models/data')

async function delete_occor_stkarticle(){
    //On va récupérer les données 

    //Récupération des articles
    let article = await D.exec_params('select * from article')
    let depot = await D.exec_params('select * from depot')

    //Parcours des articles
    for (let i = 0; i < article.length; i++) {
        const ar = article[i];

        for (let j = 0; j < depot.length; j++) {

            
            const de = depot[j];
        
            //Détection des doublons pour le truc
            let link = await D.exec_params('select * from stock_article where stk_depot_id = ? and stk_art_id = ?',[de.depot_id,ar.art_id])

            if(link.length > 1){
                //Suppression des autres
                let stk_ids = link.map(x => x.stk_id )
                stk_ids.splice(0,1)
                //Suppression des autres occurences
                await  D.exec_params('delete from stock_article where stk_id in (?)',[stk_ids])
                

                console.log(`Rec : ${ar.art_label}, occ : ${link.length}`)
            }
        }
        
    }

    console.log('-- FIN --');
}

// delete_occor_stkarticle()

//Modificaation des numéros des encaissement s'il y a des répétitions
async function correctNumMvmt(){

    //récupération des listes d'encaissements
    let encs = await D.exec_params('select * from encaissement')
    let nb = 0

    let last_mvmt = await D.exec('select enc_num_mvmt from encaissement where enc_num_mvmt is not null order by enc_id desc limit 1')
    last_mvmt = (last_mvmt.length <= 0)?0:parseInt(last_mvmt[0].enc_num_mvmt)

    for (let i = 0; i < encs.length; i++) {
        const e1 = encs[i];

        for (let j = 0; j < encs.length; j++) {
            const e2 = encs[j];
            

            if(e2.enc_num_mvmt == e1.enc_num_mvmt && e2.enc_id != e1.enc_id && e2.enc_to_caisse && e1.enc_to_caisse){
                last_mvmt += 1
                encs[j].enc_num_mvmt = last_mvmt
                await D.updateWhere('encaissement',{enc_num_mvmt:last_mvmt},{enc_id:e2.enc_id})

                console.log(e2.enc_num_mvmt+' -- '+e1.enc_num_mvmt)
            }
        }

        console.log('-- * -- * --');
    }

    console.log('-- FIN --');
}


//Correction encmvmt
async function correctEncMvmt(){


    let encs = await D.exec_params('select enc_id from encaissement')

    let ids_enc = encs.map( x => parseInt(x.enc_id))

    await D.exec_params('delete from encmvmt where em_enc_id not in (?)',[ids_enc])

    console.log('-- FIN correctNumMvmt --')
} 


//fonction pour corriger les problèmes d'insertion de médicaments dans encmvmt
async function correctEncMvmtInsert(){

    let encs = await D.exec_params('select distinct encserv_enc_id from enc_serv where encserv_is_product = 1 and date(encserv_date_enreg) = date(?)',[new Date()])
    let encs2 = await D.exec_params('select em_enc_id from encmvmt')
    let ids_enc2 = encs2.map( x => parseInt(x.em_enc_id))
    let ids_enc = encs.map( x => parseInt(x.encserv_enc_id))

    let ids_tmp = ids_enc.filter( x => !ids_enc2.includes(x))

    let datas = []

    for (let i = 0; i < ids_tmp.length; i++) {
        const e = ids_tmp[i];
        datas.push([e])
    }
    
    if(ids_tmp.length > 0){
        await D.exec_params(`insert into encmvmt (em_enc_mvmt) values ?;`,[datas])
    }

    console.log(ids_tmp)
    console.log('-- FIN correctEncMvmtInsert --')

} 
correctEncMvmt()

correctEncMvmtInsert()
