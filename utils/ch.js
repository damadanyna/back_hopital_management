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

delete_occor_stkarticle()
