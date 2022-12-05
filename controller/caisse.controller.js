let D = require('../models/data')
let PDFDocument = require("pdfkit-table");
let fs = require('fs')
const { NumberToLetter } = require("convertir-nombre-lettre");

let _prep_enc_data = {
    enc_pat_id:{front_name:'enc_pat_id',fac:true,},
    enc_num_mvmt:{front_name:'enc_num_mvmt',fac:true,},
    enc_util_id:{front_name:'enc_util_id',fac:true,},
    enc_tarif_id:{front_name:'enc_tarif_id',fac:true,},
    enc_is_pec:{front_name:'enc_is_pec',fac:true},
    enc_ent_id:{front_name:'enc_ent_id',fac:true},
    enc_date:{front_name:'enc_date',fac:true,format:(a) => new Date(a)},
    enc_montant:{front_name:'enc_montant',fac:true},
    enc_date_entre:{front_name:'enc_date_entre',fac:true},
    enc_num_hosp:{front_name:'enc_num_hosp',fac:true},
    enc_dep_id:{front_name:'enc_dep_id',fac:true},
    enc_is_hosp:{front_name:'enc_is_hosp',fac:true},
    enc_total_avance:{front_name:'enc_total_avance',fac:true},
    enc_paie_final:{front_name:'enc_paie_final',fac:true},
    enc_date_sortie:{front_name:'enc_date_sortie',fac:true},
    enc_result_final:{front_name:'enc_result_final',fac:true},
    
}
let _prep_key = Object.keys(_prep_enc_data)


class Caisse{
    static async encaissement(req,res){ //Insertion d'encaissement eto
        //Ici on ajoute l'encaissement de puis le front-end

        // console.log(req.body)

        let _d = req.body.enc //l'encaissement en question
        let _es = req.body.encserv //Liste des services qui devront être inscrit dans l'encaissement
        let encav = req.body.encav


        

        if(_es.length <= 0){
            return res.send({status:false,message:"Erreur d'insertion. La liste des dervices est vide."})
        }

        //Objet pour le post
        let enc = {},_tmp = {}

        _prep_key.forEach( (v,i)=>{
            _tmp = _prep_enc_data[v]
            _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
            enc[v] = _d[_tmp.front_name]
        })

        //quelques modification sur la date
        enc.enc_date = (enc.enc_is_hosp)?new Date():new Date(enc.enc_date)
        enc.enc_date.setHours((new Date()).getHours())
        enc.enc_date.setMinutes((new Date()).getMinutes())


        //Pour la date d'entrée
        enc.enc_date_entre = new Date(enc.enc_date_entre)
        enc.enc_date_entre.setHours((new Date()).getHours())
        enc.enc_date_entre.setMinutes((new Date()).getMinutes())
        //----------------------------

        //ajout de prep_encaissemnet dans la base
        try {
            let _e = await D.set('encaissement',enc)

            //Eto mbola misy ny insertion an'ireny encaissement service reny
            let datas = []
            let sql = `insert into enc_serv (encserv_serv_id,encserv_enc_id,encserv_is_product,encserv_qt,encserv_montant,encserv_prix_unit) values ?;` //sql pour le truc

            for (let i = 0; i < _es.length; i++) {
                const e = _es[i];
                datas.push([e.encserv_serv_id,_e.insertId,e.encserv_is_product,e.encserv_qt,e.encserv_montant,e.encserv_prix_unit])
            }
            await D.exec_params(sql,[datas])

            //Eto koa mbola misy ny insertion an'ireny avance izay miditra ao ireny,
            if(encav && encav.length > 0){
                datas = []
                sql = `insert into enc_avance (encav_util_id,encav_enc_id,encav_montant,encav_date) values ?;`

                for (let i = 0; i < encav.length; i++) {
                    const e = encav[i];
                    datas.push([e.encav_util_id,_e.insertId,e.encav_montant,new Date(e.encav_date)])
                }
                await D.exec_params(sql,[datas])
            }
            

            return res.send({status:true,message:"Préparation encaissement bien insérée"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    //Récupértion de la liste de prep_encaissement
    static async getListEncaissement(req,res){
        let filters = req.query
        


        // console.log(filters)

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?100:parseInt(filters.limit)

        try {
            let d = (new Date(filters.date)).toLocaleDateString('fr-CA')
            let d2 = (new Date(filters.date2)).toLocaleDateString('fr-CA')
            
            let list_enc = await D.exec_params(`select * from encaissement
            left join patient on pat_id = enc_pat_id
            left join entreprise on ent_id = enc_ent_id
            left join tarif on tarif_id = enc_tarif_id
            where enc_to_caisse = 1 and date(enc_date) between ? and ?
            order by enc_date desc
            `,[d,d2])

            let nb_not_validate = (await D.exec_params(`select count(*) as nb from encaissement where enc_validate = 0 and enc_to_caisse = 1`))[0].nb
            return res.send({status:true,list_enc,nb_not_validate})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }

    }

    static async getListHosp(req,res){
        let filters = req.query
        // console.log(filters)

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?100:parseInt(filters.limit)

        try {
            let d = (new Date(filters.date)).toLocaleDateString('fr-CA')
            let d2 = (new Date(filters.date2)).toLocaleDateString('fr-CA')
            
            let list_enc = await D.exec_params(`select *, (select sum(encav_montant) from enc_avance where encav_enc_id = enc_id) as enc_avance from encaissement
            left join patient on pat_id = enc_pat_id
            left join entreprise on ent_id = enc_ent_id
            left join tarif on tarif_id = enc_tarif_id
            left join departement on dep_id = enc_dep_id
            where enc_is_hosp = 1 and date(enc_date) between ? and ?
            order by enc_date desc
            `,[d,d2])

            let nb_not_validate = (await D.exec_params(`select count(*) as nb from encaissement where enc_validate = 0`))[0].nb
            return res.send({status:true,list_enc,nb_not_validate})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }

    }

    //Les données utiles pour l'ajout d'encaissement
    static async getAddUtils(req,res){
        try {
            let soc = await D.exec('select * from entreprise')
            let tarif = await D.exec('select * from tarif')

            let last_mvmt = await D.exec('select enc_num_mvmt from encaissement where enc_num_mvmt is not null order by enc_id desc limit 1')
            if(last_mvmt.length <= 0){
                last_mvmt = 0
            }else{
                last_mvmt = parseInt(last_mvmt[0].enc_num_mvmt)
            }

            return res.send({status:true,soc,tarif,last_mvmt})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
    //Les données utiles pour l'ajout d'encaissement
    static async getAddUtilsHosp(req,res){
        let year = (new Date()).getFullYear().toString().substring(2)

        try {
            let soc = await D.exec('select * from entreprise')
            let tarif = await D.exec('select * from tarif')
            let dep = await D.exec('select * from departement')

            let last_num_hosp = await D.exec('select enc_num_hosp from encaissement where enc_is_hosp = 1 order by enc_id desc limit 1')
            if(last_num_hosp.length <= 0){
                last_num_hosp = `HP ${year}/${'1'.padStart(4,0)}`
            }else{
                let ln = parseInt(last_num_hosp[0].enc_num_hosp.split('/')[1])
                last_num_hosp = `HP ${year}/${(ln + 1).toString().padStart(4,0)}`
            }

            let enc = null
            let encav = null
            let encserv = null
            

            if(parseInt(req.query.enc_id)){
                let enc_id = req.query.enc_id
                enc = (await D.exec_params('select * from encaissement where enc_id = ?',[enc_id]))[0]
                enc.patient = (await D.exec_params('select * from patient where pat_id = ?',[enc.enc_pat_id]))[0]


                encav = await D.exec_params(`select * from enc_avance
                left join utilisateur on util_id = encav_util_id where encav_enc_id = ?`,[enc_id])

                let serv = await D.exec_params(`select * from enc_serv 
                left join service on service_id = encserv_serv_id
                where encserv_is_product = 0 and encserv_enc_id = ?`,[enc_id])
                let med = await D.exec_params(`select *,art_id as service_id,art_code as service_code, art_label as service_label from enc_serv 
                left join article on art_id = encserv_serv_id
                where encserv_is_product = 1 and encserv_enc_id = ?`,[enc_id])

                encserv = [...serv,...med]
            }

            return res.send({status:true,soc,tarif,last_num_hosp,dep,enc,encav,encserv})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async hospToCaisse(req,res){
        try {
            let { enc_id,enc_num_mvmt} = req.body

            console.log(req.body)
            let enc_date = new Date()
            //Modification simple anle izy
            await D.updateWhere('encaissement',{enc_to_caisse:1,enc_num_mvmt,enc_date,enc_validate:0},{enc_id})

            return res.send({status:true})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    //Modification d'une hospitalisation
    static async modifHosp(req,res){
        try {
            let {enc,encserv,encav} = req.body

            //Insertion des modifs pour l'encaissement tout court
            let up_enc = {
                enc_date_sortie:(enc.enc_date_sortie)?new Date(enc.enc_date_sortie):null,
                enc_date_entre:new Date(enc.enc_date_entre),
                enc_ent_id:enc.enc_ent_id,
                enc_tarif_id:enc.enc_tarif_id,
                enc_dep_id:enc.enc_dep_id,
                enc_is_pec:enc.enc_is_pec,
                enc_montant:enc.enc_montant,
                enc_total_avance:enc.enc_total_avance,
                enc_paie_final:enc.enc_paie_final
            }

            //Tonga de atao ny modification an'ilay encaissement
            await D.updateWhere('encaissement',up_enc,{enc_id:enc.enc_id})

            let datas = [], sql = ''
            //Ajout ndray zao, ajout an'ireny service vaivao reny
            if(encserv.add && encserv.add.length > 0){
                //Eto mbola misy ny insertion an'ireny encaissement service reny
                datas = []
                sql = `insert into enc_serv (encserv_serv_id,encserv_enc_id,encserv_is_product,encserv_qt,encserv_montant,encserv_prix_unit) values ?;` //sql pour le truc

                for (let i = 0; i < encserv.add.length; i++) {
                    const e = encserv.add[i];
                    datas.push([e.encserv_serv_id,enc.enc_id,e.encserv_is_product,e.encserv_qt,e.encserv_montant,e.encserv_prix_unit])
                }
                await D.exec_params(sql,[datas])
            }

            //Suppression ana service
            if(encserv.del && encserv.del.length > 0){
                await D.exec_params('delete from enc_serv where encserv_enc_id = ? and encserv_id in (?)',[enc.enc_id,encserv.del])
            }


            //Eto koa ny avance
            //Eto koa mbola misy ny insertion an'ireny avance izay miditra ao ireny,
            if(encav && encav.add.length > 0){
                datas = []
                sql = `insert into enc_avance (encav_util_id,encav_enc_id,encav_montant,encav_date) values ?;`

                for (let i = 0; i < encav.add.length; i++) {
                    const e = encav.add[i];
                    datas.push([e.encav_util_id,enc.enc_id,e.encav_montant,new Date(e.encav_date)])
                }
                await D.exec_params(sql,[datas])
            }

            //Suppression
            if(encav.del && encav.del.length > 0){
                await D.exec_params('delete from enc_avance where encav_enc_id = ? and encav_id in (?) ',[enc.enc_id,encav.del])
            }


            //? mety mbola hisy modification


            // console.log(enc,encserv,encav)
            return res.send({status:true,message:"Modificatin bien effectuée"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async recupFactUnvalidate(req,res){
        try {
            //on va juste récupérer les 6 premiers cas
            let facts = await D.exec(`select * from encaissement
            left join patient on pat_id = enc_pat_id
            left join utilisateur on util_id = enc_util_id
            where enc_validate = 0 and enc_to_caisse = 1 limit 6`)

            return res.send({status:true,facts})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async delEncaissement(req,res){
        try {
            let {enc_id} = req.params

            await D.del('enc_serv',{encserv_enc_id:enc_id})
            await D.del('encaissement',{enc_id})

            return res.send({status:true})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async setPdfFact(req,res){
        try {
            let enc_id = req.params.enc_id

            //Récupération des listes des services parents
            let list_serv = await D.exec(`select * from service where service_parent_id is null`)

            //récupération de la facture
            let fact = (await D.exec_params(`select * from encaissement
            left join patient on pat_id = enc_pat_id
            left join utilisateur on util_id = enc_util_id
            where enc_id = ?`,[enc_id]))[0]

            //Récupération de la liste des produits liés à la facture
            let fact_serv = await D.exec_params(`select * from enc_serv
            left join service on service_id = encserv_serv_id
            where encserv_enc_id = ? and encserv_is_product = 0`,[enc_id])

            let fact_med = await D.exec_params(`select * from enc_serv
            left join article on art_id = encserv_serv_id
            where encserv_enc_id = ? and encserv_is_product = 1`,[enc_id])

            //Manipulations des données
            let index_med = -1
            for (let i = 0; i < list_serv.length; i++) {
                const e = list_serv[i];
                index_med = (e.service_code == 'MED')?i:index_med

                list_serv[i].montant_total = 0
                for (let j = 0; j < fact_serv.length; j++) {
                    const es = fact_serv[j];
                    if(e.service_id == es.service_parent_id){
                        list_serv[i].montant_total += (es.encserv_montant)?parseInt(es.encserv_montant):0
                    }
                }
            }

            //et juste pour les médicaments -- Insertion des montants total dans médicaments
            for (let i = 0; i < fact_med.length; i++) {
                const e = fact_med[i]
                if(e.service_parent_id == null){
                    list_serv[index_med].montant_total += (e.encserv_montant)?parseInt(e.encserv_montant):0
                }
            }

            //conception anle PDF amzay eto an,
            // await createFactPDF(fact,list_serv,fact_serv)
            let mode = {}
            if(!parseInt(fact.enc_validate)){
                mode = req.query.mode
            }else{
                mode = {
                    label:(fact.enc_mode_paiement == 'esp')?'Espèce':'Chèque',
                    code:fact.enc_mode_paiement
                }
            }
            await createFactPDF(fact,list_serv,mode)


            //On enregistre le truc si c'est pas encore validée
            if(!parseInt(fact.enc_validate)){
                //Ici enregistrement des modifications
                let up = {
                    enc_validate:1,
                    enc_date_validation:new Date(),
                    enc_util_validate_id:req.query.util_id,
                    enc_num_banque:(req.query.mode.code == 'chq')?req.query.mode.num_banque:null,
                    enc_mode_paiement:req.query.mode.code
                }            
                await D.updateWhere('encaissement',up,{enc_id})
            }

            return res.send({status:true,message:"Encore en mode test"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async downloadFact(req,res){
        try {
            let data = fs.readFileSync(`./files/fact-caisse.pdf`)
            res.contentType("application/pdf")
            // res.download(`./facture.pdf`)
            res.send(data);
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getDetEncaissement(req,res){
        try {
            let enc_id = req.params.enc_id
            //Récupération de la liste des produits liés à la facture
            let fact_serv = await D.exec_params(`select * from enc_serv
            left join service on service_id = encserv_serv_id
            where encserv_enc_id = ? and encserv_is_product = 0`,[enc_id])

            let fact_med = await D.exec_params(`select *,art_code as service_code,art_label as service_label from enc_serv
            left join article on art_id = encserv_serv_id
            where encserv_enc_id = ? and encserv_is_product = 1`,[enc_id])

            let list_serv = [...fact_serv,...fact_med]

            return res.send({status:true,list_serv})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}


//Fonction pour la génération de PDF
async function createFactPDF(fact,list_serv,mode){

    let year_cur = new Date().getFullYear()
    const separateNumber = (n)=>{
        return (n)?n.toLocaleString('fr-CA'):''
    }

    let date_fact = new Date(fact.enc_date)
    let f_date = date_fact.toLocaleDateString()
    let f_time = date_fact.toLocaleTimeString().substr(0,5)

    //Les options du PDF
    //Création de pdf amzay e, 
    let opt = {
        margin: 15, size: 'A4' ,
    }   
    let doc = new PDFDocument(opt)

    //les fonts
    doc.registerFont('fira', 'fonts/fira.ttf');
    doc.registerFont('fira_bold', 'fonts/fira-bold.ttf');
    doc.font("fira")

    //Ecriture du PDF
    doc.pipe(fs.createWriteStream(`./files/fact-caisse.pdf`))

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

    //Définition des tailles
    let margin = 25
    let margin_middle = 15
    let y_begin = 25
    let w_cadre = (doc.page.width - (margin * 2) - (margin_middle * 2)) / 2
    let y_cur = 0
    let h_cadre = 0
    let margin_text_in_cadre = 3
    let x_begin = margin

    //Toutes les textes
    let nom_hop = 'HOPITALY LOTERANA ANDRANOMADIO'
    let t_caisse = (fact.enc_is_hosp)?`FACTURE DEFINITIVE - N° ${fact.enc_num_hosp}`:`RECU DE CAISSE - N° ${fact.enc_num_mvmt}`
    let t_date = `${f_date} -- ${f_time}`
    let t_caissier = `CAISSIER : ${fact.util_label}`
    let t_pat_code = `Patient: ${(fact.pat_numero)?fact.pat_numero:'-'}`
    let pat_name = (fact.pat_nom_et_prenom)?fact.pat_nom_et_prenom:'-'
    let t_pat_adresse = (fact.pat_adresse)?fact.pat_adresse:'-'
    let t_somme = 'Soit la somme de:'
    let t_mode = 'Paiement:'
    let t_avance = 'Avance:'
    let t_paiement_final = 'Paiement final:'
    let t_somme_m = NumberToLetter(parseInt(fact.enc_montant).toString())
    let t_avance_s = (fact.enc_is_hosp)?parseInt(fact.enc_total_avance).toString():''
    let t_paiement_final_s = (fact.enc_is_hosp)?(parseInt(fact.enc_montant) - parseInt(fact.enc_total_avance) ).toString():''
    t_somme_m = t_somme_m.charAt(0).toUpperCase() + t_somme_m.slice(1) + ' Ariary'

    //-------------
    let t_stat = 'Stat n ° 85113 12 200 60 00614'
    let t_nif =  'NIF n ° 20000038126'

    //Text en haut pour l'hôpital
    h_cadre = doc.heightOfString(nom_hop)+(margin_text_in_cadre * 2)
    doc.lineJoin('miter')
        .rect(x_begin,y_begin , w_cadre,h_cadre)
        .stroke();
    doc.text(nom_hop,(w_cadre/2 - doc.widthOfString(nom_hop)/2) + x_begin,y_begin+margin_text_in_cadre)
    y_cur = y_begin+h_cadre
    //------------------

    //Ajout stat
    doc.fontSize(7)
    h_cadre = doc.heightOfString(t_stat)+(margin_text_in_cadre * 2)
    //Pour la date 
    doc.lineJoin('miter')
        .rect(x_begin,y_cur , w_cadre / 2,h_cadre)
        .stroke();
    doc.text(t_stat,(w_cadre/4 - doc.widthOfString(t_stat)/2) + x_begin,y_cur+margin_text_in_cadre)
    //pour le nif
    doc.lineJoin('miter')
        .rect(x_begin + (w_cadre/2),y_cur , w_cadre / 2,h_cadre)
        .stroke();
    doc.text(t_nif,(w_cadre/4 - doc.widthOfString(t_nif)/2) + x_begin +(w_cadre/2),y_cur+margin_text_in_cadre)
    y_cur = y_cur+h_cadre 
    //------------------------------

    // doc.fontSize(8)
    //text écriture sur la caisse
    doc.font('fira_bold')
    doc.fontSize(10)
    h_cadre = doc.heightOfString(t_caisse)+(margin_text_in_cadre * 2)
    doc.lineJoin('miter')
        .rect(x_begin,y_cur , w_cadre,h_cadre)
        .stroke();
    doc.text(t_caisse,(w_cadre/2 - doc.widthOfString(t_caisse)/2) + x_begin,y_cur+margin_text_in_cadre)
    y_cur = y_cur+h_cadre
    //------------------

    //Les dates et le nom du caissier
    doc.font('fira')
    doc.fontSize(8)
    h_cadre = doc.heightOfString(f_date)+(margin_text_in_cadre * 2)
    //Pour la date 
    doc.lineJoin('miter')
        .rect(x_begin,y_cur , w_cadre / 2,h_cadre)
        .stroke();
    doc.text(t_date,(w_cadre/4 - doc.widthOfString(t_date)/2) + x_begin,y_cur+margin_text_in_cadre)
    //pour le nom caissier
    doc.lineJoin('miter')
        .rect(x_begin + (w_cadre/2),y_cur , w_cadre / 2,h_cadre)
        .stroke();
    doc.text(t_caissier,(w_cadre/4 - doc.widthOfString(t_caissier)/2) + x_begin +(w_cadre/2),y_cur+margin_text_in_cadre)
    y_cur = y_cur+h_cadre
    //_______________________________

    //Resaka patient ndray zao
    doc.text(t_pat_code,(w_cadre/2 - doc.widthOfString(t_pat_code)/2) + x_begin,y_cur+10)
    doc.font('fira_bold')
    doc.text(pat_name,(w_cadre/2 - doc.widthOfString(pat_name)/2) + x_begin)
    doc.font('fira')
    doc.text(t_pat_adresse,(w_cadre/2 - doc.widthOfString(t_pat_adresse)/2) + x_begin)

    //Tableau amzay
    doc.text('',x_begin,doc.y)
    doc.moveDown()

    //Insertion ana tableau amzay
    let _head = [
        { label:"Désignation des actes", width:(w_cadre * 3/4), property: 'desc',renderer: null },
        { label:"Montant", property: 'montant',width:(w_cadre * 1/4), renderer: null,align: "right" ,headerAlign:"center" },
    ]

    //les datas
    let _datas = [],cur_d = {}

    //Boucle sur le facture
    for (let i = 0; i < list_serv.length; i++) {
        const e = list_serv[i];
        _datas.push({
            desc: `- ${e.service_label}`,
            montant:separateNumber(e.montant_total),
        })
    }

    _datas.push({
        desc:'TOTAL',
        montant:separateNumber(fact.enc_montant),
    })


    // Table du truc
    const table = {
        // complex headers work with ROWS and DATAS  
        headers: _head,
        // complex content
        datas:_datas,
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

                if(indexRow == _datas.length-1){
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

                    doc.font("fira_bold")
                }
                // doc.fontSize(10).fillColor('#292929');
            },
        },
        // simple content (works fine!)
    }

    await doc.table(table, { /* options */ });

    //Bas de page avec le montant en lettre
    doc.moveDown()
    y_cur = doc.y
    doc.text(t_somme,{underline:true})
    doc.font("fira")
    doc.text(t_somme_m,doc.widthOfString(t_somme)+x_begin+5,y_cur,{width:w_cadre - doc.widthOfString(t_somme) -5 })

    if(!fact.enc_is_hosp){
        doc.moveDown()
        y_cur = doc.y
        doc.font("fira_bold")
        doc.text(t_mode,x_begin,y_cur,{underline:true})
        doc.font("fira")
        doc.text(mode.label,doc.widthOfString(t_mode)+x_begin+5,y_cur,{width:w_cadre - doc.widthOfString(t_mode) -5 })
    }else{
        //Insertion avance
        doc.moveDown()
        y_cur = doc.y
        doc.font("fira_bold")
        doc.text(t_avance,x_begin,y_cur,{underline:true})
        doc.font("fira")
        doc.text(t_avance_s,doc.widthOfString(t_avance)+x_begin+5,y_cur,{width:w_cadre - doc.widthOfString(t_avance) -5 })
        //Insertion paiement final

        let hxx = doc.widthOfString(`${t_avance}: ${t_avance_s}`)+x_begin+5
        doc.font("fira_bold")
        doc.text(t_paiement_final, hxx,y_cur,{underline:true})
        doc.font("fira")
        doc.text(t_paiement_final_s,hxx + doc.widthOfString(t_paiement_final)+5,y_cur,{width:w_cadre - (hxx + doc.widthOfString(t_paiement_final) -5) })

    }


    // ######################### La 2ème colonne maintenant
    //##################################
    x_begin = (doc.page.width /2) + margin_middle
    y_begin = 25 


    //Text en haut pour l'hôpital
    h_cadre = doc.heightOfString(nom_hop)+(margin_text_in_cadre * 2)
    doc.lineJoin('miter')
        .rect(x_begin,y_begin , w_cadre,h_cadre)
        .stroke();
    doc.text(nom_hop,(w_cadre/2 - doc.widthOfString(nom_hop)/2) + x_begin,y_begin+margin_text_in_cadre)
    y_cur = y_begin+h_cadre
    //------------------

    //Ajout stat
    doc.fontSize(7)
    h_cadre = doc.heightOfString(t_stat)+(margin_text_in_cadre * 2)
    //Pour la date 
    doc.lineJoin('miter')
        .rect(x_begin,y_cur , w_cadre / 2,h_cadre)
        .stroke();
    doc.text(t_stat,(w_cadre/4 - doc.widthOfString(t_stat)/2) + x_begin,y_cur+margin_text_in_cadre)
    //pour le nif
    doc.lineJoin('miter')
        .rect(x_begin + (w_cadre/2),y_cur , w_cadre / 2,h_cadre)
        .stroke();
    doc.text(t_nif,(w_cadre/4 - doc.widthOfString(t_nif)/2) + x_begin +(w_cadre/2),y_cur+margin_text_in_cadre)
    y_cur = y_cur+h_cadre 
    //------------------------------

    doc.fontSize(8)

    //text écriture sur la caisse
    doc.font('fira_bold')
    doc.fontSize(10)
    h_cadre = doc.heightOfString(t_caisse)+(margin_text_in_cadre * 2) -13
    doc.lineJoin('miter')
        .rect(x_begin,y_cur , w_cadre,h_cadre)
        .stroke();
    doc.text(t_caisse,(w_cadre/2 - doc.widthOfString(t_caisse)/2) + x_begin,y_cur+margin_text_in_cadre)
    y_cur = y_cur+h_cadre
    //------------------

    //Les dates et le nom du caissier
    doc.font('fira')
    doc.fontSize(8)
    h_cadre = doc.heightOfString(f_date)+(margin_text_in_cadre * 2)
    //Pour la date 
    doc.lineJoin('miter')
        .rect(x_begin,y_cur , w_cadre / 2,h_cadre)
        .stroke();
    doc.text(t_date,(w_cadre/4 - doc.widthOfString(t_date)/2) + x_begin,y_cur+margin_text_in_cadre)
    //pour le nom caissier
    doc.lineJoin('miter')
        .rect(x_begin + (w_cadre/2),y_cur , w_cadre / 2,h_cadre)
        .stroke();
    doc.text(t_caissier,(w_cadre/4 - doc.widthOfString(t_caissier)/2) + x_begin +(w_cadre/2),y_cur+margin_text_in_cadre)
    y_cur = y_cur+h_cadre
    //_______________________________

    //Resaka patient ndray zao
    doc.text(t_pat_code,(w_cadre/2 - doc.widthOfString(t_pat_code)/2) + x_begin,y_cur+10)
    doc.font('fira_bold')
    doc.text(pat_name,(w_cadre/2 - doc.widthOfString(pat_name)/2) + x_begin)
    doc.font('fira')
    doc.text(t_pat_adresse,(w_cadre/2 - doc.widthOfString(t_pat_adresse)/2) + x_begin)

    //Tableau amzay
    doc.text('',x_begin,doc.y)
    doc.moveDown()

    //Insertion ana tableau amzay
    await doc.table(table, { /* options */ });
    //Bas de page avec le montant en lettre
    doc.moveDown()
    y_cur = doc.y
    doc.text(t_somme,{underline:true})
    doc.font("fira")
    doc.text(t_somme_m,doc.widthOfString(t_somme)+x_begin+5,y_cur,{width:w_cadre - doc.widthOfString(t_somme) -5 })

    if(!fact.enc_is_hosp){
        doc.moveDown()
        y_cur = doc.y
        doc.font("fira_bold")
        doc.text(t_mode,x_begin,y_cur,{underline:true})
        doc.font("fira")
        doc.text(mode.label,doc.widthOfString(t_mode)+x_begin+5,y_cur,{width:w_cadre - doc.widthOfString(t_mode) -5 })
    }else{
        //Insertion avance
        doc.moveDown()
        y_cur = doc.y
        doc.font("fira_bold")
        doc.text(t_avance,x_begin,y_cur,{underline:true})
        doc.font("fira")
        doc.text(t_avance_s,doc.widthOfString(t_avance)+x_begin+5,y_cur,{width:w_cadre - doc.widthOfString(t_avance) -5 })
        //Insertion paiement final

        hxx = doc.widthOfString(`${t_avance}: ${t_avance_s}`)+x_begin+5
        doc.font("fira_bold")
        doc.text(t_paiement_final, hxx,y_cur,{underline:true})
        doc.font("fira")
        doc.text(t_paiement_final_s,hxx + doc.widthOfString(t_paiement_final)+5,y_cur,{width:w_cadre - (hxx + doc.widthOfString(t_paiement_final) -5) })

    }


    //Traçage de la ligne du milieu
    doc.lineWidth(1)
    doc.lineCap('butt')
        .moveTo(doc.page.width/2, y_begin)
        .lineTo(doc.page.width/2, doc.y)
        .dash(5, {space: 10})
        .stroke();

    //Famaranana an'ilay document
    doc.end();
}

module.exports = Caisse