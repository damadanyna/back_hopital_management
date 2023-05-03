let D = require('../models/data')
let U = require('../utils/utils')

let PDFDocument = require("pdfkit-table");
let fs = require('fs')
const { NumberToLetter } = require("convertir-nombre-lettre");


let stock = {
    mvmt_action:[
        {l:'Entrée',k:'entre'},
        {l:'Sortie',k:'sortie'},
    ],
    mvmt_type_entre:[
        {l:'Achat',k:'achat'},
    ],
    mvmt_type_sortie:[
        {l:'Sortie Interne',k:'sortie-interne'},
        {l:'Transfert',k:'transfert'},
        {l:'Vente',k:'vente'},
        {l:'Produits périmés',k:'produits-perimes'},
        {l:'Accord',k:'don'},
    ],
    prefix_num:{
        'achat':'AC',
        'sortie-interne':'SI',
        'transfert':'TR',
        'vente':'VE',
        'produits-perimes':'PP',
        'don':'DO'
    }
}

function getTypeEntre(t){
    for (let i = 0; i < stock.mvmt_type_entre.length; i++) {
        const e = stock.mvmt_type_entre[i];
        if(e.k == t){
            return e.l
        }
    }
}
function getTypeSortie(t){
    for (let i = 0; i < stock.mvmt_type_sortie.length; i++) {
        const e = stock.mvmt_type_sortie[i];
        if(e.k == t){
            return e.l
        }
    }
}

class Mouvement{

    //Enregistrement d'un mouvement pour le stock
    static async register(req,res){
        let {list_mart,mvmt} = req.body

        let mvmt_data={
            mvmt_num:{front_name:'mvmt_num',fac:false}, 
            mvmt_action :{front_name:'mvmt_action',fac:false},
            mvmt_type:{front_name:'mvmt_type',fac:false}, 
            mvmt_tiers:{front_name:'mvmt_tiers',fac:false},
            mvmt_depot_dest:{front_name:'mvmt_depot_dest',fac:false},
            mvmt_depot_exp:{front_name:'mvmt_depot_exp',fac:false}, 
            mvmt_util_id:{front_name:'mvmt_util_id',fac:true},
            mvmt_date:{front_name:'mvmt_date',fac:false,format:(a)=> new Date(a)}, 
        };

        //ao am list_mart no ahitana ny total des montants

        //calcul an'ny montant total izay hampidirina ao am mvmt
        let total_montant = 0,tmp = {}
        let c_tmp = 0

        if(list_mart.length <= 0){
            return res.send({status:false,message:"La liste des articles est vide"})
        }
        for(let i = 0; i<list_mart.length;i++){
            tmp = list_mart[i]
            c_tmp = parseInt(tmp.mart_montant)
            total_montant += (c_tmp.toString != 'NaN')?c_tmp:0 
        }
        //Haza zay ny total montant

        //Tokony ho insertion anle izy amzay
        const _pd_keys = Object.keys(mvmt_data)
        let _tmp = {}
        let _list_error = []

        try {
            

            //Vérification des inputs vides
            _pd_keys.forEach((v,i)=>{
                _tmp = mvmt_data[v]
                if(!_tmp.fac && !mvmt[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })

            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
            
            let _data = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = mvmt_data[v]
    
                mvmt[_tmp.front_name] = (_tmp.format)?_tmp.format(mvmt[_tmp.front_name]):mvmt[_tmp.front_name]
                 
                _data[v] = mvmt[_tmp.front_name]
            })

            _data.mvmt_montant = total_montant
            // _data.mvmt_util_id = req.user.util_id

            //Insertion du mouvement
            let _mvmt = await D.set('mvmt',_data) 

            //Eto amzay ara ny insertion des relations mouvement/articles
            for (let i = 0; i < list_mart.length; i++) {
                let el = list_mart[i]
                //premièrement, modification des stock de l'article actuel : mart_art_id,

                //Entrée alors on ajoute le nombre de l'article au dépot de stock actuel
                if(mvmt.mvmt_action == 'entre'){
                    //On vérifie d'abord si le lien existe
                    let link = await D.exec_params('select * from stock_article where stk_depot_id = ? and stk_art_id = ?',[mvmt.mvmt_depot_dest,el.mart_art_id])

                    //si existe en met à jour
                    if(link.length > 0){
                        if(link.length > 1){
                            //Suppression des autres
                            let stk_ids = link.map(x => x.stk_id )
                            stk_ids.splice(0,1)


                            //Suppression des autres occurences
                            await  D.exec_params('delete from stock_article where stk_id in (?)',[stk_ids])

                        }
                        await D.exec_params(`update stock_article set  stk_actuel = stk_actuel + ?
                        where stk_depot_id = ? and stk_art_id = ?`,[el.mart_qt,mvmt.mvmt_depot_dest,el.mart_art_id])
                    }else{
                        //si non on crée le lien
                        await D.set('stock_article',{
                            stk_actuel:el.mart_qt,
                            stk_depot_id:mvmt.mvmt_depot_dest,
                            stk_art_id:el.mart_art_id
                        })
                    }
                    //Trop be io zavatra ambony io 👌👌
                    
                }else if(mvmt.mvmt_action == 'sortie'){ //Resaka sortie de méicaments ty e !!
                    //eto am sortie ndray e

                    //On vérifie d'abord si le lien existe
                    let link = await D.exec_params('select * from stock_article where stk_depot_id = ? and stk_art_id = ?',[mvmt.mvmt_depot_exp,el.mart_art_id])
                    if(link.length > 0){
                        if(link.length > 1){
                            //Suppression des autres
                            let stk_ids = link.map(x => x.stk_id )
                            stk_ids.splice(0,1)
                            //Suppression des autres occurences
                            await  D.exec_params('delete from stock_article where stk_id in (?)',[stk_ids])
                            
                        }
                        //Angalana ny depot d'expédition satri izy no mandefa an'ilay fanfody
                        await D.exec_params(`update stock_article set stk_actuel = stk_actuel - ?
                        where stk_depot_id = ? and stk_art_id = ?`,[el.mart_qt,mvmt.mvmt_depot_exp,el.mart_art_id])
                    }else{
                        
                        //si non on crée le lien
                        await D.set('stock_article',{
                            stk_actuel:0,
                            stk_depot_id:mvmt.mvmt_depot_exp,
                            stk_art_id:el.mart_art_id
                        })
                    }

                    //cas exeptionnel pour le transfert
                    if(mvmt.mvmt_type == 'transfert'){
                        link = await D.exec_params('select * from stock_article where stk_depot_id = ? and stk_art_id = ?',[mvmt.mvmt_depot_dest,el.mart_art_id])

                        //si existe en met à jour
                        if(link.length > 0){
                            //Alefa any am depot e destination le raha, rehefa transfert
                            await D.exec_params(`update stock_article set stk_actuel = stk_actuel + ?
                            where stk_depot_id = ? and stk_art_id = ?`,[el.mart_qt,mvmt.mvmt_depot_dest,el.mart_art_id])
                        }else{
                            //si non on crée le lien
                            await D.set('stock_article',{
                                stk_actuel:el.mart_qt,
                                stk_depot_id:mvmt.mvmt_depot_dest,
                                stk_art_id:el.mart_art_id
                            })
                        }
                    }else{

                    }
                }

                //suppression des données non utilisées
                delete el.mart_art_unit
                delete el.mart_art_label
                
                 //De avy eo ajout an'ilay ligne dans mvmt_art

                 ////Eto mise à jour an'ilay détails de stock

                let rest_stock = await D.exec_params(`select * from depot 
                left join stock_article on depot_id = stk_depot_id 
                where stk_art_id = ?`,[el.mart_art_id])

                el.mart_det_stock = JSON.stringify(rest_stock)

                el.mart_mvmt_id = _mvmt.insertId
                await D.set('mvmt_art',el)
            }

            //Vita a 😎😉
            //Ouf zay vaot vita ny insertion an'ireny article reny ao am table mvmt_art
            
            //Suppression des occurences
            await U.delOccurStk()

            return res.send({status:true})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }


    static async getEncMvmt(req,res){
        try{

            let nbEncMvmt = (await D.exec_params(`select count(*) as nb from encmvmt 
                where em_validate = 0 and date(em_date_enreg) = date(?)`,[new Date()]))[0].nb

            return res.send({status:true,nbEncMvmt})

        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getEncMvmtPat(req,res){
        try{
            let filters = req.query.filters

            let list_pat = await D.exec_params(`select * from encmvmt
                left join encaissement on enc_id = em_enc_id
                left join patient on pat_id = enc_pat_id where date(em_date_enreg) = date(?)`,[new Date(filters.date)])

            return res.send({status:true,list_pat})

        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getEncMvmtListMed(req,res){
        try{
            let {enc_id} = req.query

            let list_med = await D.exec_params(`select * from enc_serv
            left join article on art_id = encserv_serv_id
            where encserv_enc_id = ? and encserv_is_product = 1`,[enc_id])

            return res.send({status:true,list_med})

        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async validateEncMvmt(req,res){
        try{
            let {enc_id,util_id} = req.query

            let list_med = await D.exec_params(`select * from enc_serv
            left join article on art_id = encserv_serv_id
            where encserv_enc_id = ? and encserv_is_product = 1`,[enc_id])




            //ici on va vraiment créer un mouvement de sortie
            let action = 'sortie',type = 'sortie-interne'
            //Récupération des dérniers mvmt de même type et action
            let mvmt_last = await D.exec_params('select * from mvmt where mvmt_action = ? and mvmt_type = ? order by mvmt_id desc limit 1',[action,type])

            //préparation de l'enregistrement
            let mvmt_num = ''
            if(mvmt_last.length > 0){
                mvmt_last = mvmt_last[0]
                mvmt_num = 'SI-'+((parseInt(mvmt_last.mvmt_num.split('-')[1]) + 1).toString().padStart(4,'0'))
            }else{
                mvmt_num = 'SI-'+('1'.padStart(4,'0'))
            }



            //Récupération du dépot
            let depot  = await D.exec('select * from depot')

            let depot_exp = -1
            for (var i = 0; i < depot.length; i++) {
                const e = depot[i]
                if(e.depot_code == 'M01'){
                    depot_exp = e.depot_id
                    break
                }
            }
            // --------------------



            //faut s'occuper aussi du département
            let dep = await D.exec_params('select * from departement where dep_label like ?',[`%disp%`])

            let dep_id = -1
            if(dep.length > 0){
                dep_id = dep[0].dep_id
            }
            // -----------------
            //Récupération de l'encaissement

            let enc = ( await D.exec_params('select * from  encaissement where enc_id = ?',[enc_id]) )[0]
            //

            let mt = {
                mvmt_action:action,
                mvmt_type:type,
                mvmt_num,
                mvmt_depot_exp:depot_exp, //Très dangereux de faire ça
                mvmt_tiers:enc.enc_dep_id?enc.enc_dep_id:dep_id,
                mvmt_caisse:1,
                mvmt_util_id:util_id,
                mvmt_date:new Date(),
                mvmt_montant:enc.enc_montant
            }

            //Eto ndray ny insertion an'ilay mouvement
            let _mvmt = await D.set('mvmt',mt) 

            // Vita iny aloha
            //Manipulation dépôt ndray eto

            //Parcours an'ilay list anle medicaments
            // Marihina fa ito zavatra ito dia Modification fotsiny ny stock
            for (var i = 0; i < list_med.length; i++) {
                const el = list_med[i]

                //On vérifie d'abord si le lien existe
                let link = await D.exec_params('select * from stock_article where stk_depot_id = ? and stk_art_id = ?',[mt.mvmt_depot_exp,el.art_id])
                if(link.length > 0){
                    //Angalana ny depot d'expédition satri izy no mandefa an'ilay fanfody
                    await D.exec_params(`update stock_article set stk_actuel = stk_actuel - ?
                    where stk_depot_id = ? and stk_art_id = ?`,[el.encserv_qt,mt.mvmt_depot_exp,el.art_id])
                }else{
                    
                    //si non on crée le lien
                    await D.set('stock_article',{
                        stk_actuel:0,
                        stk_depot_id:mt.mvmt_depot_exp,
                        stk_art_id:el.art_id
                    })
                }

                //

                let rest_stock = await D.exec_params(`select * from depot 
                left join stock_article on depot_id = stk_depot_id 
                where stk_art_id = ?`,[el.art_id])

                await D.set('mvmt_art',{
                    mart_det_stock:JSON.stringify(rest_stock),
                    mart_mvmt_id:_mvmt.insertId,
                    mart_qt:el.encserv_qt,
                    mart_art_id:el.art_id,
                    mart_prix_unit:el.encserv_prix_unit,
                    mart_montant:el.encserv_montant,
                })
                
            }

            //Mise à jour an'ilay ENCMVMT
            await D.updateWhere('encmvmt',{
                em_mvmt_id:_mvmt.insertId,
                em_validate:1
            },{em_enc_id:enc_id})

            //zay vao vita aaa 😂😂😂

            //Suppression des occurences
            await U.delOccurStk()

            return res.send({status:true})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getUtilsAdd(req,res){
        try {

            let {action,type} = req.query
            //Récupération des dérniers mvmt de même type et action

            let mvmt_last = await D.exec_params('select * from mvmt where mvmt_action = ? and mvmt_type = ? order by mvmt_id desc',[action,type])

            
            let list_depot = await D.exec('select * from depot')
            let list_fourn = await D.exec('select * from fournisseur')
            let list_dep = await D.exec('select * from departement')

            return res.send({status:true,list_depot,list_fourn,list_dep,mvmt_last})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getEntre(req,res){
        try {
            let {date,date2} = req.query

            date = new Date(date)
            date2 = new Date(date2)
            
            let sql = `select *,(select count(*) from mvmt_art where mart_mvmt_id = mvmt_id) as nb_art from mvmt 
            left join depot on mvmt_depot_dest = depot_id
            left join fournisseur on mvmt_tiers = fourn_id
            where DATE(mvmt_date) BETWEEN DATE(?) and DATE(?) and mvmt_action = 'entre'`

            let list = await D.exec_params(sql,[date2,date])

            return res.send({status:true,list})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getSortie(req,res){
        try {
            let {date,date2} = req.query

            date = new Date(date)
            date2 = new Date(date2)
            
            let sql = `select *,(select count(*) from mvmt_art where mart_mvmt_id = mvmt_id) as nb_art,
            d_dest.depot_label as depot_dest,d_exp.depot_label as depot_exp
            from mvmt 
            left join depot d_dest on mvmt_depot_dest = d_dest.depot_id
            left join depot d_exp on mvmt_depot_exp = d_exp.depot_id
            left join departement on mvmt_tiers = dep_id
            where DATE(mvmt_date) BETWEEN DATE(?) and DATE(?) and mvmt_action = 'sortie'`

            let list = await D.exec_params(sql,[date2,date])

            return res.send({status:true,list})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getDetails(req,res){
        try {
            let {mvmt_id} = req.params
            let {action} = req.query

            // console.log(mvmt_id,action);

            //récupération du mouvement
            let mvmt = {}
            if(action == 'entre'){
                mvmt = await D.exec_params(`select *,(select count(*) from mvmt_art where mart_mvmt_id = mvmt_id) as nb_art from mvmt 
                left join depot on mvmt_depot_dest = depot_id
                left join fournisseur on mvmt_tiers = fourn_id 
                where mvmt_id = ? and mvmt_action = 'entre'`,[mvmt_id])

                mvmt = mvmt[0]
            }else if(action == 'sortie'){
                mvmt = await D.exec_params(`select *,(select count(*) from mvmt_art where mart_mvmt_id = mvmt_id) as nb_art,
                d_dest.depot_label as depot_dest,d_exp.depot_label as depot_exp
                from mvmt 
                left join depot d_dest on mvmt_depot_dest = d_dest.depot_id
                left join depot d_exp on mvmt_depot_exp = d_exp.depot_id
                left join departement on mvmt_tiers = dep_id
                where mvmt_id = ?  and mvmt_action = 'sortie'`,[mvmt_id])

                mvmt = mvmt[0]
            }



            mvmt.mart = await D.exec_params(`select * from mvmt_art 
            left join article on art_id = mart_art_id
            where mart_mvmt_id = ?`,[mvmt_id])
            let depot = await D.exec('select * from depot')


            return res.send({status:true,mvmt,depot})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async setPDFDetMvmt(req,res){
        try {
            let {mvmt_id} = req.params
            let {action} = req.query

            // console.log(mvmt_id,action);

            //récupération du mouvement
            let mvmt = {}
            if(action == 'entre'){
                mvmt = await D.exec_params(`select *,(select count(*) from mvmt_art where mart_mvmt_id = mvmt_id) as nb_art from mvmt 
                left join depot on mvmt_depot_dest = depot_id
                left join fournisseur on mvmt_tiers = fourn_id 
                where mvmt_id = ? and mvmt_action = 'entre'`,[mvmt_id])

                mvmt = mvmt[0]
            }else if(action == 'sortie'){
                mvmt = await D.exec_params(`select *,(select count(*) from mvmt_art where mart_mvmt_id = mvmt_id) as nb_art,
                d_dest.depot_label as depot_dest,d_exp.depot_label as depot_exp
                from mvmt 
                left join depot d_dest on mvmt_depot_dest = d_dest.depot_id
                left join depot d_exp on mvmt_depot_exp = d_exp.depot_id
                left join departement on mvmt_tiers = dep_id
                where mvmt_id = ?  and mvmt_action = 'sortie'`,[mvmt_id])

                mvmt = mvmt[0]
            }



            mvmt.mart = await D.exec_params(`select * from mvmt_art 
            left join article on art_id = mart_art_id
            where mart_mvmt_id = ?`,[mvmt_id])
            let depot = await D.exec('select * from depot')


            await creatPDFDetMvmt(mvmt,depot)

            return res.send({status:true})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async downDetMvmt(req,res){
        try {
            let data = fs.readFileSync(`./files/det-mvmt.pdf`)
            res.contentType("application/pdf")
            // res.download(`./facture.pdf`)
            res.send(data);
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }


    static async printMvmt(req,res){
        try {
            let {action,date,date2} = req.query

            date = new Date(date)
            date2 = new Date(date2)
            
            let sql = ``

            if(action == 'entre'){
                sql = `select * from mvmt_art 
                left join mvmt on mvmt_id = mart_mvmt_id
                left join depot on mvmt_depot_dest = depot_id
                left join fournisseur on mvmt_tiers = fourn_id
                left join article on art_id = mart_art_id
                where DATE(mvmt_date) BETWEEN DATE(?) and DATE(?) and mvmt_action = 'entre'`
            }else{
                sql = `select *,d_dest.depot_label as depot_dest,d_exp.depot_label as depot_exp
                from mvmt_art 
                left join mvmt on mvmt_id = mart_mvmt_id
                left join depot d_dest on mvmt_depot_dest = d_dest.depot_id
                left join depot d_exp on mvmt_depot_exp = d_exp.depot_id
                left join departement on mvmt_tiers = dep_id
                left join article on art_id = mart_art_id
                where DATE(mvmt_date) BETWEEN DATE(?) and DATE(?) and mvmt_action = 'sortie'`
            }

            let mvmts = await D.exec_params(sql,[date2,date])


            let mt = {
                mart:mvmts,
                action
            }
            let depot = await D.exec('select * from depot')

            await creatPDFMvmt(mt,depot,date,date2)


            return res.send({status:true})

        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }

    }

    static downListMvmt(req,res){
        try {
            let data = fs.readFileSync(`./files/mvmt.pdf`)
            res.contentType("application/pdf")
            // res.download(`./facture.pdf`)
            res.send(data);
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

// ------------ /// ---------------- ffffff
//Options pour les tableaux
function opt_tab (head,datas,doc){
    return {
        // complex headers work with ROWS and DATAS  
        headers: head,
        // complex content
        datas:datas,
        options:{
            padding:5,
            align:'center',
            divider: {
                header: { disabled: false, width: 1, opacity: 0.5 },
                horizontal: { disabled: false, width: 0.5, opacity: 0 },
                vertical: { disabled: false, width: 0.5, opacity: 0.5 },
            },
            prepareHeader: () => {
                doc.font("fira_bold").fontSize(8)
                doc.fillAndStroke('#575a61')
            },
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                doc.font("fira").fontSize(8)
                doc.fillAndStroke('#47494d')
                //#47494d

                const {x, y, width, height} = rectCell;
                let head_h = 17

                // first line 
                if(indexColumn === 0){
                    doc
                    .lineWidth(.5)
                    .moveTo(x, y)
                    .lineTo(x, y + height+1)
                    .stroke();
                }

                if(indexRow == 0 && indexColumn === 0){
                    doc
                    .lineWidth(.5)
                    .moveTo(x, y)
                    .lineTo(x, y - head_h)
                    .stroke(); 

                    doc
                    .lineWidth(.5)
                    .moveTo(x+width, y)
                    .lineTo(x+width, y - head_h)
                    .stroke(); 

                    doc
                    .lineWidth(.5)
                    .moveTo(x, y-head_h)
                    .lineTo(x+width, y - head_h)
                    .stroke();


                }else if(indexRow == 0){
                    doc
                    .lineWidth(.5)
                    .moveTo(x+width, y)
                    .lineTo(x+width, y - head_h)
                    .stroke(); 

                    doc
                    .lineWidth(.5)
                    .moveTo(x, y-head_h)
                    .lineTo(x+width, y - head_h)
                    .stroke();
                }

                doc
                .lineWidth(.5)
                .moveTo(x + width, y)
                .lineTo(x + width, y + height+1)
                .stroke();

                if(indexRow == datas.length-1){
                    doc
                    .lineWidth(.5)
                    .moveTo(x, y)
                    .lineTo(x + width, y)
                    .stroke();

                    doc
                    .lineWidth(.5)
                    .moveTo(x, y+height)
                    .lineTo(x + width, y+height)
                    .stroke();

                    //doc.font("fira_bold")
                }
                // doc.fontSize(10).fillColor('#292929');
            },
        },
        // simple content (works fine!)
    } //Fin table options
} // --- fonction sur l'option des tables dans PDF kit

async function creatPDFDetMvmt(mt,depot){


    let year_cur = new Date().getFullYear()
    const separateNumber = (n)=>{
        return (n)?n.toLocaleString('fr-CA'):''
    }


    //Les options du PDF
    //Création de pdf amzay e 🤣😂, 
    let opt = {
        margin: 15, size: 'A4',
    }   
    let doc = new PDFDocument(opt)

    //les fonts
    doc.registerFont('fira', 'fonts/fira.ttf');
    doc.registerFont('fira_bold', 'fonts/fira-bold.ttf');
    doc.font("fira")

    //Ecriture du PDF
    doc.pipe(fs.createWriteStream(`./files/det-mvmt.pdf`))

    //les marges et le truc en bas
    //______________________________________
    let bottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    doc.fontSize(8)

    doc.text(
        `Hôpital Andranomadio ${year_cur}`, 
        0.5 * (doc.page.width - 300),
        doc.page.height - 20,
        {
            width: 300,
            align: 'center',
            lineBreak: false,
        })

    // Reset text writer position
    doc.text('', 15, 15);
    doc.page.margins.bottom = bottom;
    doc.on('pageAdded', () => {
        let bottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;
    
        doc.text(
            `Hôpital Andranomadio ${year_cur}`, 
            0.5 * (doc.page.width - 300),
            doc.page.height - 20,
            {
                width: 300,
                align: 'center',
                lineBreak: false,
            })
    
        // Reset text writer position
        doc.text('', 50, 50);
        doc.page.margins.bottom = bottom;
    })
    //-----------------___________________---------------
    //------------- Ajout des titres en haut

    //Toutes les textes dans le PDF
    let nom_hop = 'HOPITALY LOTERANA - ANDRANOMADIO'
    let title_pdf = `détails Mouvement - ${(mt.mvmt_type == 'entre')?'entrées':'sorties'} `.toUpperCase()
    let date_label = `Journée du : `
    let date_value = new Date(mt.mvmt_date).toLocaleDateString()

    // ----- LES TITRES D'EN HAUT ------------
    doc.font("fira_bold")
    let y_ttl = doc.y
    doc.text(nom_hop,{underline:true})

    let ttl_w = doc.widthOfString(title_pdf)
    
    doc.text(title_pdf,doc.page.width/2 - ttl_w/2,y_ttl)
    let ddl_w = doc.widthOfString(date_label)
    let ddlv_w = doc.widthOfString(date_value)
    doc.text(date_label,doc.page.width - (ddl_w + ddlv_w) - opt.margin,y_ttl)
    
    doc.text(date_value,doc.page.width - ddlv_w - opt.margin,y_ttl)

    y_ttl += 15
    //La ligne au dessous
    doc.lineWidth(.5)
    .moveTo(opt.margin, y_ttl)
    .lineTo(doc.page.width - opt.margin, y_ttl)
    .stroke();

    // ------- FIN HEADER

    doc.moveDown(3)
    doc.font('fira')

    let y_cur = doc.y
    let dist_info = 200
    let padding_cadre_info = 5
    let x_origin_info = opt.margin + padding_cadre_info

    let y_origin_info = y_cur

    doc.text('Numéro',x_origin_info,y_cur,{underline:true})
    doc.text(mt.mvmt_num)

    doc.text('Type',x_origin_info + dist_info ,y_cur,{underline:true})
    doc.text((mt.mvmt_action == 'entre')?getTypeEntre(mt.mvmt_type):getTypeSortie(mt.mvmt_type))

    doc.moveDown(2)
    y_cur = doc.y

    //Pour les sorties
    if(mt.mvmt_action == 'sortie'){
        doc.text('Dépôt de depart',x_origin_info,y_cur,{underline:true})
        doc.text(mt.depot_exp)

        doc.text('Dépôt de déstination',x_origin_info + dist_info ,y_cur,{underline:true})
        doc.text((mt.mvmt_type == 'transfert')?mt.depot_dest:mt.dep_label)

    }else if(mt.mvmt_action == 'entre'){
        doc.text('Fournisseur',x_origin_info,y_cur,{underline:true})
        doc.text((mt.fourn_label)?mt.fourn_label:'-')

        doc.text('Dépôt',x_origin_info + dist_info ,y_cur,{underline:true})
        doc.text(mt.depot_label)
    }

    doc.lineJoin().rect(x_origin_info - padding_cadre_info,y_origin_info - padding_cadre_info/2,
        doc.page.width - (opt.margin * 2),(doc.y + (padding_cadre_info) - y_origin_info)).stroke()


    //Les tableaux amzay
    let _head = []
    let _datas = []
    // --------

    doc.moveDown(3)
    doc.text('',opt.margin,doc.y)

    _head = [
        { label:"CODE", width:50, property: 'code',renderer: null ,headerAlign:"center",},
        { label:"DESIGNATION", width:245, property: 'desc',renderer: null ,headerAlign:"center",},
        { label:"quantité".toUpperCase(), width:70, property: 'qt',renderer: null ,headerAlign:"center",align:"right"},
    ]

    //ajout des dépots
    for (let i = 0; i < depot.length; i++) {
        const e = depot[i];
        //this.list_label.push({label:e.depot_label,key:`dp:${e.depot_id}`})

        _head.push({ label:e.depot_label, width:100, property: `dp:${e.depot_id}`,renderer: null ,headerAlign:"center",align:"right"})
    }

    _datas = []
    let tmp_d = {}
    for (var i = 0; i < mt.mart.length; i++) {
        const ma = mt.mart[i]
        tmp_d = {}
        tmp_d['code'] = ma.art_code
        tmp_d['desc'] = ma.art_label
        tmp_d['qt'] = ma.mart_qt.toLocaleString('fr-CA')

        for(var j = 0;j < depot.length;j++){
            const de = depot[j]
            tmp_d[`dp:${de.depot_id}`] = getStockArt(de.depot_id,ma)
        }

        _datas.push(tmp_d)

    }

    await doc.table(opt_tab(_head,_datas,doc), { /* options */ });

    doc.end()
}

//Impression des mouvements selon la date
async function creatPDFMvmt(mt,depot,date,date2){

    let year_cur = new Date().getFullYear()
    const separateNumber = (n)=>{
        return (n)?n.toLocaleString('fr-CA'):''
    }


    //Les options du PDF
    //Création de pdf amzay e 🤣😂, 
    let opt = {
        margin: 15, size: 'A4',layout:'landscape'
    }   
    let doc = new PDFDocument(opt)

    //les fonts
    doc.registerFont('fira', 'fonts/fira.ttf');
    doc.registerFont('fira_bold', 'fonts/fira-bold.ttf');
    doc.font("fira")

    //Ecriture du PDF
    doc.pipe(fs.createWriteStream(`./files/mvmt.pdf`))

    //les marges et le truc en bas
    //______________________________________
    let bottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    doc.fontSize(8)

    doc.text(
        `Hôpital Andranomadio ${year_cur}`, 
        0.5 * (doc.page.width - 300),
        doc.page.height - 20,
        {
            width: 300,
            align: 'center',
            lineBreak: false,
        })

    // Reset text writer position
    doc.text('', 15, 15);
    doc.page.margins.bottom = bottom;
    doc.on('pageAdded', () => {
        let bottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;
    
        doc.text(
            `Hôpital Andranomadio ${year_cur}`, 
            0.5 * (doc.page.width - 300),
            doc.page.height - 20,
            {
                width: 300,
                align: 'center',
                lineBreak: false,
            })
    
        // Reset text writer position
        doc.text('', 50, 50);
        doc.page.margins.bottom = bottom;
    })
    //-----------------___________________---------------
    //------------- Ajout des titres en haut

    //Toutes les textes dans le PDF
    let nom_hop = 'HOPITALY LOTERANA - ANDRANOMADIO'
    let title_pdf = `détails Mouvement - ${(mt.action == 'entre')?'entrées':'sorties'}`.toUpperCase()
    let date_label = `Journée du : `
    let date_value = `${new Date(date2).toLocaleDateString()} au ${new Date(date).toLocaleDateString()}`


    

    // ----- LES TITRES D'EN HAUT ------------
    doc.font("fira_bold")
    let y_ttl = doc.y
    doc.text(nom_hop,{underline:true})

    let ttl_w = doc.widthOfString(title_pdf)
    
    doc.text(title_pdf,doc.page.width/2 - ttl_w/2,y_ttl)
    let ddl_w = doc.widthOfString(date_label)
    let ddlv_w = doc.widthOfString(date_value)
    doc.text(date_label,doc.page.width - (ddl_w + ddlv_w) - opt.margin,y_ttl)
    
    doc.text(date_value,doc.page.width - ddlv_w - opt.margin,y_ttl)

    y_ttl += 15
    //La ligne au dessous
    doc.lineWidth(.5)
    .moveTo(opt.margin, y_ttl)
    .lineTo(doc.page.width - opt.margin, y_ttl)
    .stroke();

    // ------- FIN HEADER

    doc.moveDown(3)
    doc.font('fira')

    let y_cur = doc.y
    let dist_info = 200
    let padding_cadre_info = 5
    let x_origin_info = opt.margin + padding_cadre_info

    let y_origin_info = y_cur

    /*doc.text('Numéro',x_origin_info,y_cur,{underline:true})
    doc.text(mt.mvmt_num)

    doc.text('Type',x_origin_info + dist_info ,y_cur,{underline:true})
    doc.text((mt.mvmt_action == 'entre')?getTypeEntre(mt.mvmt_type):getTypeSortie(mt.mvmt_type))*/

    doc.moveDown(2)
    y_cur = doc.y

    //Pour les sorties
    /*if(mt.mvmt_action == 'sortie'){
        doc.text('Dépôt de depart',x_origin_info,y_cur,{underline:true})
        doc.text(mt.depot_exp)

        doc.text('Dépôt de déstination',x_origin_info + dist_info ,y_cur,{underline:true})
        doc.text((mt.mvmt_type == 'transfert')?mt.depot_dest:mt.dep_label)

    }else if(mt.mvmt_action == 'entre'){
        doc.text('Fournisseur',x_origin_info,y_cur,{underline:true})
        doc.text((mt.fourn_label)?mt.fourn_label:'-')

        doc.text('Dépôt',x_origin_info + dist_info ,y_cur,{underline:true})
        doc.text(mt.depot_label)
    }

    doc.lineJoin().rect(x_origin_info - padding_cadre_info,y_origin_info - padding_cadre_info/2,
        doc.page.width - (opt.margin * 2),(doc.y + (padding_cadre_info) - y_origin_info)).stroke() */


    //Les tableaux amzay
    let _head = []
    let _datas = []
    // --------

    doc.moveDown(3)
    doc.text('',opt.margin,doc.y)

    _head = [
        { label:"Numéro".toUpperCase(), width:50, property: 'num',renderer: null ,headerAlign:"center",},
        { label:"CODE", width:50, property: 'code',renderer: null ,headerAlign:"center",},
        { label:"DESIGNATION", width:245, property: 'desc',renderer: null ,headerAlign:"center",},        
        { label:"quantité".toUpperCase(), width:70, property: 'qt',renderer: null ,headerAlign:"center",align:"right"},
    ]

    // LE HEAD SI SORTIE
    if(mt.action == 'sortie'){
        _head.push({ label:"Dépôt départ".toUpperCase(), width:120, property: 'exp',renderer: null ,headerAlign:"center",})
        _head.push({ label:"Dépôt déstination".toUpperCase(), width:100, property: 'dest',renderer: null ,headerAlign:"center",})
    }else{ // LE HEAD SI ENTREE
        _head.push({ label:"Fournisseur".toUpperCase(), width:120, property: 'fourn',renderer: null ,headerAlign:"center",})
        _head.push({ label:"Dépôt".toUpperCase(), width:100, property: 'dep',renderer: null ,headerAlign:"center",})
    }

    //ajout des dépots
    for (let i = 0; i < depot.length; i++) {
        const e = depot[i];
        //this.list_label.push({label:e.depot_label,key:`dp:${e.depot_id}`})
        _head.push({ label:e.depot_label, width:90, property: `dp:${e.depot_id}`,renderer: null ,headerAlign:"center",align:"right"})
    }

    _datas = []
    let tmp_d = {}


    for (var i = 0; i < mt.mart.length; i++) {
        const ma = mt.mart[i]
        tmp_d = {}
        tmp_d['code'] = ma.art_code
        tmp_d['num'] = ma.mvmt_num
        tmp_d['desc'] = ma.art_label
        tmp_d['qt'] = ma.mart_qt.toLocaleString('fr-CA')


        if(mt.action == 'sortie'){
            tmp_d['exp'] = ma.depot_exp
            tmp_d['dest'] = (ma.mvmt_type == 'transfert')?ma.depot_dest:ma.depot_label
        }else{

            //quelque calcul pour la mise en  forme du nom fournisseur
            tmp_d['fourn'] = (ma.fourn_label)? (doc.widthOfString(ma.fourn_label) > 80)?ma.fourn_label.substr(0,15)+'...':ma.fourn_label :'-'
            tmp_d['dep'] = ma.depot_label
        }

        for(var j = 0;j < depot.length;j++){
            const de = depot[j]
            tmp_d[`dp:${de.depot_id}`] = getStockArt(de.depot_id,ma)
        }

        _datas.push(tmp_d)

    }
    //console.log(_datas)

    await doc.table(opt_tab(_head,_datas,doc), { /* options */ });

    doc.end()
}

function getStockArt(id,mart){
    let depot_id = id

    if(mart.mart_det_stock == null){
        return '-'
    }

    let stk = JSON.parse(mart.mart_det_stock)

    if(Array.isArray(stk)){
        if(stk.length == 0){
            return '-'
        }else{
            for (let i = 0; i < stk.length; i++) {
                const e = stk[i];
                if(e.depot_id == depot_id){
                    return e.stk_actuel.toLocaleString('fr-CA')
                }
            }
            return '-'
        }
    }else{
        return '-'
    }
}



module.exports = Mouvement