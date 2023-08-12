let D = require('../models/data')
let U = require('../utils/utils')
let PDFDocument = require("pdfkit-table");
let fs = require('fs')
const { NumberToLetter } = require("convertir-nombre-lettre");
const ExcelJS = require('exceljs');

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
    enc_paie_final:{front_name:'enc_paie_final',fac:true,},
    enc_date_sortie:{front_name:'enc_date_sortie',fac:true},
    enc_result_final:{front_name:'enc_result_final',fac:true},
    enc_reste_paie:{front_name:'enc_reste_paie',fac:true},
    enc_to_caisse:{front_name:'enc_to_caisse',fac:true},
    enc_percent_tarif:{front_name:'enc_percent_tarif',fac:true},
    enc_is_externe:{front_name:'enc_is_externe',fac:true},
    enc_pat_externe:{front_name:'enc_pat_externe',fac:true},
    enc_montant_prescription:{front_name:'enc_montant_prescription',fac:true}
}
let _prep_key = Object.keys(_prep_enc_data)



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
                header: { disabled: false, width: 2, opacity: 1 },
                horizontal: { disabled: false, width: 2, opacity: 1 },
                vertical: { disabled: false, width: 2, opacity: 1 },
            },
            prepareHeader: () => {
                doc.font("fira_bold").fontSize(6)
                doc.fillAndStroke('black')
            },
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                doc.font("fira_bold").fontSize(7)
                doc.fillAndStroke('#47494d')
                //#47494d

                const {x, y, width, height} = rectCell;
                let head_h = 17
                let line_h = 2

                doc.lineWidth(line_h)

                // first line 
                if(indexColumn === 0){
                    doc
                    .moveTo(x, y)
                    .lineTo(x, y + height+1)
                    .stroke();
                }

                if(indexRow == 0 && indexColumn === 0){
                    doc
                    .lineWidth(line_h)
                    .moveTo(x, y)
                    .lineTo(x, y - head_h)
                    .stroke(); 

                    doc
                    .moveTo(x+width, y)
                    .lineTo(x+width, y - head_h)
                    .stroke(); 

                    doc
                    .moveTo(x, y-head_h)
                    .lineTo(x+width, y - head_h)
                    .stroke();


                }else if(indexRow == 0){
                    doc
                    .moveTo(x+width, y)
                    .lineTo(x+width, y - head_h)
                    .stroke(); 

                    doc
                    .moveTo(x, y-head_h)
                    .lineTo(x+width, y - head_h)
                    .stroke();
                }

                doc
                .moveTo(x + width, y)
                .lineTo(x + width, y + height+1)
                .stroke();

                if(indexRow == datas.length-1){
                    doc
                    .moveTo(x, y)
                    .lineTo(x + width, y)
                    .stroke();

                    doc
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

//Taille d'un cadre de chiffre
let num_w = 50

//fonction qui écrit du texte dans un cadre
function drawTextCadre(text,x,y,doc){
    let m = 5

    x +=m

    doc.font('fira_bold')
    doc.text(text,x+num_w - doc.widthOfString(text) - m,y)

    y -= m/2

    doc.lineWidth(1)
    doc.lineJoin('miter')
        .rect(x, y,
        num_w , doc.heightOfString(text) + m)
        .stroke();

    doc.font('fira')
}


class Caisse{
    static async encaissement(req,res){ //Insertion d'encaissement eto
        //Ici on ajoute l'encaissement de puis le front-end

        // console.log(req.body)

        let _d = req.body.enc //l'encaissement en question
        let _es = req.body.encserv //Liste des services qui devront être inscrit dans l'encaissement
        let epre = req.body.encprescri //Liste des prescriptions
        let encav = req.body.encav

        let user_id = req.body.user_id

        // console.log('User id : '+user_id);

        if(_es.length <= 0){
            return res.send({status:false,message:"La liste des services est vide."})
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

        if(enc.enc_date_sortie){
            enc.enc_date_sortie = new Date(enc.enc_date_sortie)
            enc.enc_date_sortie.setHours((new Date()).getHours())
            enc.enc_date_sortie.setMinutes((new Date()).getMinutes())
        }
        //----------------------------

        if(!enc.enc_is_hosp){
            enc.enc_to_caisse = 1
            //Juste quelques modifications sur le numéros de l''encaissement
            let last_mvmt = await D.exec('select enc_num_mvmt from encaissement where enc_num_mvmt is not null order by enc_id desc limit 1')
            last_mvmt = (last_mvmt.length <= 0)?0:parseInt(last_mvmt[0].enc_num_mvmt)

            enc.enc_num_mvmt = last_mvmt + 1
        }

        /**
         * Merde cette machine est vraiment lente
         */

        enc.enc_paie_final = (enc.enc_paie_final)?new Date(enc.enc_paie_final):null

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

            //Eto koa mbola misy ny insertion an'ireny prescription
            datas = []
            sql = `insert into enc_prescri (encp_serv_id,encp_enc_id,encp_is_product,encp_qt,encp_montant,encp_prix_unit) values ?;`

            if(epre && epre.length > 0){
                for (let i = 0; i < epre.length; i++) {
                    const e = epre[i];
                    datas.push([e.encp_serv_id,_e.insertId,e.encp_is_product,e.encp_qt,e.encp_montant,e.encp_prix_unit])
                }
                await D.exec_params(sql,[datas])
            }
            
            //Ici enregistrement de l'utilisateur
            enc.enc_id = _e.insertId

            let hist = {
                uh_user_id:user_id,
                uh_module:(_d.enc_is_hosp)?'Facturation':'Caisse Dispensaire',
                uh_extras:JSON.stringify({
                    datas:{
                        enc:(await D.exec_params(`select * from encaissement
                        left join patient on pat_id = enc_pat_id
                        where enc_id = ?`,[enc.enc_id]))[0],
                        encserv:await D.exec_params(`select * from enc_serv where encserv_enc_id = ?`,[enc.enc_id])
                    },
                    enc_id:enc.enc_id
                }),
                uh_code:(_d.enc_is_hosp)?req.uh.add_hosp.k:req.uh.add_disp.k,
                uh_description:(_d.enc_is_hosp)?req.uh.add_hosp.l:req.uh.add_disp.l,
            }
            await D.set('user_historic',hist)

            return res.send({status:true,message:"Préparation encaissement bien insérée"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    //Recherche de poduits et de services en même temps
    static async searchProdServ(req,res){
        try {
            
            let filters = req.query
            filters.limit = 50

            let list_serv = await D.exec_params(`select * from service 
            where service_label like ? and service_parent_id is not null limit ?`,[
                `%${filters.search}%`,filters.limit
            ])

            let list_med = await D.exec_params(`select *,art_code as service_code,art_label as service_label from article 
            where art_label like ? limit ? `,[
                `%${filters.search}%`,filters.limit
            ])

            //Test alo e, récupération reste des articles
            for (var i = 0; i < list_med.length; i++) {
                const e = list_med[i]

                list_med[i]['stock'] = await D.exec_params('select * from stock_article where stk_art_id = ? order by stk_depot_id',[e.art_id])
            }

            //let depot = await D.exec_params('select * from depot')

            let list = [...list_serv,...list_med]

            res.send({status:true,list})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getTarifProd(req,res){
        try {
            let t = req.query

            let tserv = await D.exec_params(`select * from tarif_service where tserv_service_id = ? and tserv_is_product = ?
            and tserv_tarif_id = ?`,[t.service_id,parseInt(t.is_product),t.tarif_id])

            tserv = (tserv.length > 0)?tserv[0]:{tserv_prix:0}

            return res.send({status:true,tserv})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    //Récupértion de la liste de prep_encaissement
    static async getListEncaissement(req,res){
        let filters = req.query

        //console.log(filters)

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?100:parseInt(filters.limit)

        try {
            let d = new Date(filters.date)
            let d2 = new Date(filters.date2)
            
            let list_enc = await D.exec_params(`select * from encaissement
            left join patient on pat_id = enc_pat_id
            left join entreprise on ent_id = enc_ent_id
            left join tarif on tarif_id = enc_tarif_id
            left join departement on dep_id = enc_dep_id
            where enc_to_caisse = 1 and date(enc_date) between date(?) and date(?)
            ${(filters.validate != '-1')?' and enc_validate = ?':''} order by enc_date desc
            `,[d,d2,parseInt(filters.validate)])


            //avant calcul total encaissement il faut aussi 
            //récupéré la liste des encaissement d'avance
            let dd = [d,d2]
            if(parseInt(filters.validate) != -1) dd.unshift(parseInt(filters.validate))
            let list_avance = await D.exec_params(`select *,encav_versement as enc_versement,encav_validate as enc_validate,
            encav_date_enreg as enc_date
            from enc_avance
            left join encaissement on enc_id = encav_enc_id
            left join patient on pat_id = enc_pat_id
            left join entreprise on ent_id = enc_ent_id
            left join tarif on tarif_id = enc_tarif_id
            left join departement on dep_id = enc_dep_id
            where ${(parseInt(filters.validate) != -1)?'encav_validate = ? and ':''} date(encav_date_enreg) between date(?) and date(?)`,dd)

            //Calcul montant total encaissé
            let total_encaisse = 0
            for (var i = 0; i < list_enc.length; i++) {
                const le = list_enc[i]
                if(le.enc_validate){
                    total_encaisse += parseInt(le.enc_montant) - parseInt((le.enc_total_avance)?le.enc_total_avance:0)
                }
            }

            //ajout des montans de l'avance encaissé
            for (let i = 0; i < list_avance.length; i++) {
                const e = list_avance[i];
                
                if(e.encav_validate){
                    total_encaisse += parseInt(e.encav_montant)
                }
            }

            // ------- 

            let nb_not_validate = (await D.exec_params(`select count(*) as nb from encaissement where enc_validate = 0 and enc_to_caisse = 1`))[0].nb
            let nb_not_validate_avance = (await D.exec_params(`select count(*) as nb from enc_avance where encav_validate = 0`))[0].nb

            // console.log(list_enc);
            // console.log(list_avance);
            list_enc = [...list_enc,...list_avance]


            
            return res.send({status:true,list_enc,nb_not_validate,total_encaisse,nb_not_validate_avance,list_avance})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }

    }

    //Récupération des listes des encaissements pour la caisse principale
    static async getListEncaissementMain(req,res){
        let filters = req.query
        


        // console.log(filters)

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?100:parseInt(filters.limit)

        try {
            let d = (new Date(filters.date)).toLocaleDateString('fr-CA')
            let d2 = (new Date(filters.date2)).toLocaleDateString('fr-CA')

            let list_dep = await D.exec('select * from departement where dep_show_caisse = 1')
            

            filters.dep_id = (filters.dep_id)?filters.dep_id:list_dep[0].dep_id

            let w = [
                d,d2
            ]

            if(filters.dep_id != -1){
                w.push(filters.dep_id)
            }
            if(filters.search){
                w.push(`%${filters.search}%`)
            }

            if(filters.validate != '-1'){
                w.push(parseInt(filters.validate))
            }

            //console.log(filters)

            let list_enc = await D.exec_params(`select * from encaissement
            left join patient on pat_id = enc_pat_id
            left join entreprise on ent_id = enc_ent_id
            left join tarif on tarif_id = enc_tarif_id
            left join departement on dep_id = enc_dep_id
            where enc_to_caisse = 1 and date(enc_date) between ? and ? 
            ${ (filters.dep_id != -1)?'and enc_dep_id = ?':'' }
            ${ (filters.search)?`and ${filters.search_by} like ?`:'' }
            ${ (filters.validate != '-1')?'and enc_validate = ?':'' }
            order by enc_date desc
            `,w)

            let total_montant = (await D.exec_params(`select sum(enc_montant) as total from encaissement
            where enc_to_caisse = 1 and date(enc_date) between ? and ? 
            ${ (filters.dep_id != -1)?'and enc_dep_id = ?':'' }
            ${ (filters.search)?`and ${filters.search_by} like ?`:'' }
            `,w))[0].total


            //avant calcul total encaissement il faut aussi 
            //récupéré la liste des encaissement d'avance
            let list_avance = await D.exec_params(`select *,encav_versement as enc_versement,encav_validate as enc_validate,
            encav_date_enreg as enc_date
            from enc_avance
            left join encaissement on enc_id = encav_enc_id
            left join patient on pat_id = enc_pat_id
            left join entreprise on ent_id = enc_ent_id
            left join tarif on tarif_id = enc_tarif_id
            left join departement on dep_id = enc_dep_id
            where date(encav_date_enreg) between ? and ? 
            ${ (filters.dep_id != -1)?'and enc_dep_id = ?':'' }
            ${ (filters.search)?`and ${filters.search_by} like ?`:'' }
            ${ (filters.validate != '-1')?'and encav_validate = ?':'' }
            order by encav_date_enreg desc
            `,w)

            total_montant = 0
            for (let i = 0; i < list_enc.length; i++) {
                const e = list_enc[i];
                total_montant += parseInt(e.enc_montant) - parseInt((e.enc_total_avance)?e.enc_total_avance:0)
            }

            //ajout des montans de l'avance encaissé
            for (let i = 0; i < list_avance.length; i++) {
                const e = list_avance[i];
                total_montant += parseInt(e.encav_montant)
            }

            list_enc = [...list_enc,...list_avance]

            return res.send({status:true,list_enc,list_dep,total_montant})
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
            let d = new Date(filters.date)
            let d2 = new Date(filters.date2)
            
            let sc = `%${filters.search}%`
            let pr = [sc,sc,sc]
            if(filters.state != -1){
                pr.push(filters.state)
            }
            if(filters.date_by != '-1'){
                pr.push(d)
                pr.push(d2)
            }
            
            let list_enc = await D.exec_params(`select *, (select sum(encav_montant) from enc_avance where encav_enc_id = enc_id) as enc_avance from encaissement
            left join patient on pat_id = enc_pat_id
            left join entreprise on ent_id = enc_ent_id
            left join tarif on tarif_id = enc_tarif_id
            left join departement on dep_id = enc_dep_id
            where  (pat_nom_et_prenom like ? or pat_numero like ? or enc_pat_externe like ?) and ${(filters.state != -1)?'enc_validate = ? and ':''} enc_is_hosp = 1 
            ${(filters.date_by == '-1')?'':` and date(${filters.date_by}) between date(?) and date(?) `}
            order by ${(filters.date_by == '-1')?'enc_date_enreg':filters.date_by} desc
            `,pr)

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

            let dep = await D.exec('select * from departement')

            return res.send({status:true,soc,tarif,last_mvmt,dep})
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
            let encprescri = null
            

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

                serv = await D.exec_params(`select * from enc_prescri
                left join service on service_id = encp_serv_id
                where encp_is_product = 0 and encp_enc_id = ?`,[enc_id])

                med = await D.exec_params(`select *,art_id as service_id,art_code as service_code, art_label as service_label from enc_prescri 
                left join article on art_id = encp_serv_id
                where encp_is_product = 1 and encp_enc_id = ?`,[enc_id])

                encprescri = [...serv,...med]


            }

            return res.send({status:true,soc,tarif,last_num_hosp,dep,enc,encav,encserv,encprescri})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async hospToCaisse(req,res){
        try {
            let { enc_id,enc_num_mvmt} = req.body

            // console.log(req.body)
            let enc_date = new Date()

            //Juste quelques modifications sur le numéros de l''encaissement
            let last_mvmt = await D.exec('select enc_num_mvmt from encaissement where enc_num_mvmt is not null order by enc_id desc limit 1')
            last_mvmt = (last_mvmt.length <= 0)?0:parseInt(last_mvmt[0].enc_num_mvmt)

            enc_num_mvmt = last_mvmt + 1

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
            let {enc,encserv,encav,encprescri,user_id} = req.body

            // console.error(encprescri)
            //Insertion des modifs pour l'encaissement tout court
            let up_enc = {
                enc_date_sortie:(enc.enc_date_sortie)?new Date(enc.enc_date_sortie):null,
                enc_date_entre:new Date(enc.enc_date_entre),
                enc_ent_id:enc.enc_ent_id,
                enc_tarif_id:enc.enc_tarif_id,
                enc_dep_id:enc.enc_dep_id,
                enc_is_pec:enc.enc_is_pec,
                enc_montant:enc.enc_montant,
                enc_montant_prescription:enc.enc_montant_prescription,
                enc_total_avance:enc.enc_total_avance,
                enc_paie_final:(enc.enc_paie_final)?new Date(enc.enc_paie_final):null,
                enc_reste_paie:enc.enc_reste_paie
            }

            //console.log(encserv)
            // console.log(up_enc)

            //Tonga de atao ny modification an'ilay encaissement
            await D.updateWhere('encaissement',up_enc,{enc_id:enc.enc_id})


            //Suppression ana service //suppression aloha
            if(encserv.del && encserv.del.length > 0){
                await D.exec_params('delete from enc_serv where encserv_enc_id = ? and encserv_id in (?)',[enc.enc_id,encserv.del])
            }

            let datas = [], sql = '', sql_modif = ''
            //Ajout ndray zao, ajout an'ireny service vaivao reny

            //Izay vao ajout
            if(encserv.add && encserv.add.length > 0){
                //Eto mbola misy ny insertion an'ireny encaissement service reny
                datas = []
                sql = `insert into enc_serv (encserv_serv_id,encserv_enc_id,encserv_is_product,encserv_qt,encserv_montant,encserv_prix_unit) values ?;` //sql pour le truc

                
                for (let i = 0; i < encserv.add.length; i++) {
                    const e = encserv.add[i];
                    if(!e) continue
                    if(!e.encserv_enc_id){
                        datas.push([e.encserv_serv_id,enc.enc_id,e.encserv_is_product,e.encserv_qt,e.encserv_montant,e.encserv_prix_unit])
                    }else{
                        sql_modif +=`update enc_serv set encserv_qt = ${e.encserv_qt}, encserv_montant = ${e.encserv_montant} 
                        where encserv_enc_id = ${enc.enc_id} and encserv_serv_id = ${e.encserv_serv_id} and encserv_is_product = ${e.encserv_is_product};`
                    }
                }
                if(datas.length > 0) await D.exec_params(sql,[datas])

                if(sql_modif) await D.exec(sql_modif)
            }

            //ETO NDRAY NY MANIPULATION NY DATAS AN'ILA PRESCRIPTION
            if(encprescri && encprescri.del && encprescri.del.length > 0){
                await D.exec_params('delete from enc_prescri where encp_enc_id = ? and encp_id in (?)',[enc.enc_id,encprescri.del])
            }


            datas = []
            sql = '' 
            sql_modif = ''

            //Ajout ndray zao, ajout an'ireny service vaovao reny
            if(encprescri && encprescri.add && encprescri.add.length > 0){
                //Eto mbola misy ny insertion an'ireny encaissement service reny
                datas = []
                sql = `insert into enc_prescri (encp_serv_id,encp_enc_id,encp_is_product,encp_qt,encp_montant,encp_prix_unit) values ?;` //sql pour le truc

                
                for (let i = 0; i < encprescri.add.length; i++) {
                    const e = encprescri.add[i];
                    if(!e) continue
                    if(!e.encp_enc_id){
                        datas.push([e.encp_serv_id,enc.enc_id,e.encp_is_product,e.encp_qt,e.encp_montant,e.encp_prix_unit])
                    }else{
                        sql_modif +=`update enc_prescri set encp_qt = ${e.encp_qt}, encp_montant = ${e.encp_montant} 
                        where encp_enc_id = ${enc.enc_id} and encp_serv_id = ${e.encp_serv_id} and encp_is_product = ${e.encp_is_product};`
                    }
                }
                if(datas.length > 0) await D.exec_params(sql,[datas])

                if(sql_modif) await D.exec(sql_modif)
            }

            //? mety mbola hisy modification

            //Insertion historique de l'utilisateur
            //Récupération de l'encaissement
            let fact = (await D.exec_params(`select * from encaissement
            left join patient on pat_id = enc_pat_id
            where enc_id = ?`,[enc.enc_id]))[0]

            let hist = {
                uh_user_id:user_id,
                uh_code:req.uh.modif_hosp.k,
                uh_description:req.uh.modif_hosp.l,
                uh_extras:JSON.stringify({
                    datas:{
                        enc:fact,
                    },
                    enc_id:fact.enc_id
                }),
                uh_module:'Facturation'
            }

            await D.set('user_historic',hist)

            // console.log(enc,encserv,encav)
            return res.send({status:true,message:"Modificatin bien effectuée"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }


    //GESTION AVANCE ENCAISSEMENT
    static async addAvance(req,res){
        try{
            let {enc,encav,user_id} = req.body

            /*console.log(encav)
            console.log(enc)*/

            let ec = {
                encav_montant:encav.encav_montant,
                encav_util_id:encav.encav_util_id,
                encav_date:new Date(encav.encav_date),
                encav_enc_id:enc.enc_id
            }


            let aa = await D.set('enc_avance',ec)


            //insertion historique
            let hist = {
                uh_user_id:user_id,
                uh_code:req.uh.add_avance.k,
                uh_description:req.uh.add_avance.l,
                uh_extras:JSON.stringify({
                    datats:{
                        enc_avance:(await D.exec_params(`
                            select * from enc_avance
                            left join encaissement on enc_id = encav_enc_id
                            left join patient on pat_id = enc_pat_id
                            where encav_id = ?
                        `,[aa.insertId]))[0]
                    }
                }),
                uh_module:'Facturation'
            }

            await D.set('user_historic',hist)


            return res.send({status:true})


        }catch(e){
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async delAvance(req,res){
        try{
            let {encav_id,user_id} = req.query

            //récupération de l'avance 
            let encav = (await D.exec_params(`select * from enc_avance
            left join encaissement on enc_id = encav_enc_id
            left join patient on pat_id = enc_pat_id where encav_id = ?`,[encav_id]))[0]

            if(encav.encav_validate) return res.send({status:false,message:`L'avance est déjà validée`})

            //historique de l'utilisateur
            let hist = {
                uh_user_id:user_id,
                uh_code:req.uh.del_avance.k,
                uh_description:req.uh.del_avance.l,
                uh_module:'Facturation',
                uh_extras:JSON.stringify({
                    datas:{
                        enc_avance:encav
                    }
                })
            }

            await D.set('user_historic',hist)
            //Fin historique

            await D.del('enc_avance',{encav_id})
            return res.send({status:true})
        }catch(e){
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getListAvance(req,res){
        try{
            let {enc_id} = req.query

            let encav = await D.exec_params(`select * from enc_avance
            left join utilisateur on util_id = encav_util_id
            where encav_enc_id = ?`,[enc_id])

            return res.send({status:true,encav})
        }catch(e){
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    //FIN GESTION AVANCE ENCAISSEMENT

    static async recupFactUnvalidate(req,res){
        try {
            //on va juste récupérer les 6 premiers cas
            let facts = await D.exec(`select * from encaissement
            left join patient on pat_id = enc_pat_id
            left join utilisateur on util_id = enc_util_id
            where enc_validate = 0 and enc_to_caisse = 1 limit 6`)

            let avance = await D.exec_params(`select * from enc_avance
                left join encaissement on enc_id = encav_enc_id
                left join patient on pat_id = enc_pat_id
                where encav_validate = 0 limit 6`)

            return res.send({status:true,facts,avance})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async delEncaissement(req,res){
        try {
            let {enc_id} = req.params
            let { util_id,uh_obs } = req.query
            

            let etmp = (await D.exec_params(`select * from encaissement 
            left join patient on pat_id = enc_pat_id
            where enc_id = ?`,[enc_id]))[0]

            // console.log(util_id)

            if(etmp.enc_validate && !etmp.enc_is_hosp){
                return res.send({status:false,message:`L'encaissement est déjà validé`,validate:true})
            }

            let hist = {
                uh_user_id:util_id,
                uh_code:(etmp.enc_is_hosp)?req.uh.del_hosp.k:req.uh.del_disp.k,
                uh_description:(etmp.enc_is_hosp)?req.uh.del_hosp.l:req.uh.del_disp.l,
                uh_extras:JSON.stringify({
                    datas:{
                        enc:etmp,
                    },
                }),
                uh_obs,
                uh_module:(etmp.enc_is_hosp)?'Facturation':'Dispensaire',
            }

            //insertion
            await D.set('user_historic',hist)

            await D.del('enc_serv',{encserv_enc_id:enc_id})
            await D.del('enc_prescri',{encp_enc_id:enc_id})
            await D.del('encaissement',{enc_id})
            await D.del('enc_avance',{encav_enc_id:enc_id})
            await D.del('encmvmt',{em_enc_id:enc_id})
            // await D.del('versement',{vt_enc_id:enc_id})

            

            return res.send({status:true})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async setPdfFact(req,res){
        try {
            let enc_id = req.params.enc_id
            let { util_id } = req.query


            //récupération de la facture
            let fact = (await D.exec_params(`select * from encaissement
            left join patient on pat_id = enc_pat_id
            left join departement on dep_id = enc_dep_id
            left join utilisateur on enc_util_validate_id = util_id
            where enc_id = ?`,[enc_id]))[0]

            //console.log(util_id)
            //si la variable encav_id existe dans le query
            //si la variable encav_id existe dans le queyr c'est que c'est probablement le paiement d'un avance
            //ok ok, 
            if(req.query.encav_id){

                let encav_id = req.query.encav_id
                let encav = (await D.exec_params(`select * from enc_avance where encav_id = ?`,[encav_id]))[0]

                //modif an'ilay enc_avance
                await D.updateWhere('enc_avance',{
                    encav_validate:1,
                    encav_date_validation:new Date(),
                    encav_util_validate:util_id,
                },{encav_id})

                //Modification an'ilay encaissement hampidirana an'ilay avance ao am calcul
                let enc_tmp = (await D.exec_params('select * from encaissement where enc_id = ?',[enc_id]))[0]
                let ttl_avance = encav.encav_montant + parseInt( (enc_tmp.enc_total_avance)?enc_tmp.enc_total_avance:0 )
                let reste_paie = parseInt(enc_tmp.enc_montant) - ttl_avance
                await D.exec_params(`update encaissement 
                    set enc_total_avance = ?,enc_reste_paie = ? where enc_id = ?`,[ttl_avance,reste_paie,enc_id])

                

                //Eto ny insertion historique anle encaissement avance
                //  INSERTION HISTORIQUE VALIDATION AVANCE
                let hist = {
                    uh_user_id:util_id,
                    uh_code:req.uh.validate_avance.k,
                    uh_description:req.uh.validate_avance.l,
                    uh_module:'Caisse Dispensaire',
                    uh_extras:JSON.stringify({
                        datas:{
                            encavance:(await D.exec_params('select * from enc_avance where encav_id = ?',[encav_id]))[0],
                            enc:(await D.exec_params(`select * from encaissement 
                            left join patient on pat_id = enc_pat_id
                            where enc_id = ?`,[enc_id]))[0],
                        },        
                        enc_id:fact.enc_id
                    })
                }
                await D.set('user_historic',hist)
            }

            //ici on va récupérer le dernier avance que le patient à payer
            let encav_last = (await D.exec_params('select * from enc_avance where encav_enc_id = ? and encav_validate = 1 order by encav_date_validation desc limit 1',[enc_id]))[0]

            //Récupération des listes des services parents
            let list_serv = await D.exec(`select * from service where service_parent_id is null order by service_rang asc`)

            //Modification de la facture pour modifier l'utilisateur qui sera rattaché à l'encaissement
            if(util_id){
                await D.updateWhere('encaissement',{enc_util_validate_id:util_id},{enc_id})
            }

            //Ici on va séparer les rang null et les autres
            // 🤣😂 Vraiment ridicule ce bout de code
            let lnull = [], nnull = []
            for (let i = 0; i < list_serv.length; i++) {
                const e = list_serv[i];
                if(!e.service_rang){
                    lnull.push(e)
                }else{
                    nnull.push(e)
                }
            }
            list_serv = [...nnull,...lnull]
            // ----------------------

            //ENREGISTREMENT DE LA VALIDATION DE L'ENCAISSEMENT
            //AVANT IMPRESSION
            //On enregistre le truc si c'est pas encore validée

            //grâce à ce bout de code, l'encaissement d'une avance est différent de l'encaissement 
            //dispensaire ou de hospitalisation
            if(!parseInt(fact.enc_validate) && req.query.mode){
                //Ici enregistrement des modifications
                let up = {
                    enc_validate:1,
                    enc_date_validation:new Date(),
                    enc_num_banque:(req.query.mode.code == 'chq')?req.query.mode.num_banque:null,
                    enc_mode_paiement:req.query.mode.code
                }            
                await D.updateWhere('encaissement',up,{enc_id})
                fact.enc_validate = 1

                //eto zany ny insértion ny encaissement dispensaire et facturation
                //  INSERTION HISTORIQUE VALIDATION ENCAISSEMENT
                let hist = {
                    uh_user_id:util_id,
                    uh_code:(fact.enc_is_hosp)?req.uh.validate_hosp.k:req.uh.validate_disp.k,
                    uh_description:(fact.enc_is_hosp)?req.uh.validate_hosp.l:req.uh.validate_disp.l,
                    uh_module:'Caisse Dispensaire',
                    uh_extras:JSON.stringify({
                        datas:{
                            enc:(await D.exec_params(`select * from encaissement 
                            left join patient on pat_id = enc_pat_id
                            where enc_id = ?`,[enc_id]))[0],
                        },        
                        enc_id:fact.enc_id
                    })
                }
                await D.set('user_historic',hist)
            }

            // console.log(list_serv);

            //Récupération de la liste des produits liés à la facture
            let fact_serv = await D.exec_params(`select * from enc_serv
            left join service on service_id = encserv_serv_id
            where encserv_enc_id = ? and encserv_is_product = 0`,[enc_id])

            let fact_med = await D.exec_params(`select * from enc_serv
            left join article on art_id = encserv_serv_id
            where encserv_enc_id = ? and encserv_is_product = 1`,[enc_id])

            //Récupération de la liste des produits liés à la facture //côté prescription
            let factp_serv = await D.exec_params(`select * from enc_prescri
            left join service on service_id = encp_serv_id
            where encp_enc_id = ? and encp_is_product = 0`,[enc_id])

            let factp_med = await D.exec_params(`select * from enc_prescri
            left join article on art_id = encp_serv_id
            where encp_enc_id = ? and encp_is_product = 1`,[enc_id])

            //Manipulations des données
            let index_med = -1
            // let indexp_med = -1
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

                //Pour la prescription
                for (let j = 0; j < factp_serv.length; j++) {
                    const es = factp_serv[j];
                    if(e.service_id == es.service_parent_id){
                        list_serv[i].montant_total += (es.encp_montant)?parseInt(es.encp_montant):0
                    }
                }
            }

            if(index_med == -1){
                list_serv.splice(2,0,{service_code:'MED',service_label:'MEDICAMENTS'})
                index_med = 2
            }

            list_serv[index_med].montant_total = 0
            //et juste pour les médicaments -- Insertion des montants total dans médicaments
            for (let i = 0; i < fact_med.length; i++) {
                const e = fact_med[i]
                list_serv[index_med].montant_total += (e.encserv_montant)?parseInt(e.encserv_montant):0
            }
            //Pour la prescription
            for (let i = 0; i < factp_med.length; i++) {
                const e = factp_med[i]
                list_serv[index_med].montant_total += (e.encp_montant)?parseInt(e.encp_montant):0
            }

            //conception anle PDF amzay eto an,
            // await createFactPDF(fact,list_serv,fact_serv)
            let mode = {}
            if(!fact.enc_mode_paiement){
                mode = (fact.enc_is_hosp)?null:req.query.mode
            }else{
                mode = {
                    label:(fact.enc_mode_paiement == 'esp')?'Espèce':'Chèque',
                    code:fact.enc_mode_paiement
                }
            }

            //récupération de l'encaissement après modification
            fact = (await D.exec_params(`select * from encaissement
            left join patient on pat_id = enc_pat_id
            left join departement on dep_id = enc_dep_id
            left join utilisateur on enc_util_validate_id = util_id
            where enc_id = ?`,[enc_id]))[0]


            //Eto création an'ilay Entité côté mouvement raha ohatra ka nisy médicaments ny zavatra novidian'ilay 
            // Patient
            if((!fact.enc_is_hosp && fact_med.length > 0) || (fact.enc_is_hosp && factp_med.length > 0)){
                //jerena alony raha efa misy ilay relation
                let rl = await D.exec_params('select * from encmvmt where em_enc_id = ?',[enc_id])
                //Enregistrement anle Raha
                if(rl.length <= 0){
                    await D.set('encmvmt',{
                        em_enc_id:enc_id,
                    })
                }
            }

            await createFactPDF(fact,list_serv,mode,encav_last)

            return res.send({status:true,message:"Encaissement effectuée"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getFactsCumulative(req,res){
        try {
            let { enc_ids } = req.query


            //récupération de la facture
            let fact = await D.exec_params(`select * from encaissement
            left join patient on pat_id = enc_pat_id
            left join departement on dep_id = enc_dep_id
            left join utilisateur on enc_util_validate_id = util_id
            where enc_id in (?) order by enc_date_validation`,[enc_ids])

            let date_1 = new Date(fact[0].enc_date_validation)
            let date_2 = new Date(fact[fact.length -1].enc_date_validation)
            //regroupement du truc
            let enc_f = {
                enc_validate:1,
                pat_nom_et_prenom:(fact[0].enc_is_externe)?fact[0].enc_pat_externe:fact[0].pat_nom_et_prenom,
                pat_adresse:(fact[0].enc_is_externe)?null:fact[0].pat_adresse,
                util_label:fact[0].util_label,
                dep_label:fact[0].dep_label,
                pat_numero:(fact[0].enc_is_externe)?null:fact[0].pat_numero,
                enc_num_mvmt:fact[0].enc_num_mvmt,
                enc_date_enreg:fact[0].enc_date_enreg,
                enc_to_caisse:1
            }

            for (let i = 0; i < fact.length; i++) {
                const f = fact[i];
                enc_f['enc_montant'] = (enc_f['enc_montant'])?enc_f['enc_montant']+parseInt(f.enc_montant):parseInt(f.enc_montant)
                enc_f['enc_reste_paie'] = (enc_f['enc_reste_paie'])?enc_f['enc_reste_paie']+parseInt(f.enc_reste_paie?f.enc_reste_paie:0):parseInt(f.enc_reste_paie?f.enc_reste_paie:0)
                enc_f['enc_is_hosp'] = (f.enc_is_hosp)?1:(enc_f['enc_is_hosp'])?enc_f['enc_is_hosp']:0
                enc_f['enc_total_avance'] = (enc_f['enc_total_avance'])?enc_f['enc_total_avance']+parseInt((f.enc_total_avance)?f.enc_total_avance:0):parseInt((f.enc_total_avance)?f.enc_total_avance:0)
            }

            //Récupération des listes des services parents
            let list_serv = await D.exec(`select * from service where service_parent_id is null order by service_rang asc`)

            //Ici on va séparer les rang null et les autres
            // 🤣😂 Vraiment ridicule ce bout de code
            let lnull = [], nnull = []
            for (let i = 0; i < list_serv.length; i++) {
                const e = list_serv[i];
                if(!e.service_rang){
                    lnull.push(e)
                }else{
                    nnull.push(e)
                }
            }
            list_serv = [...nnull,...lnull]
            // ----------------------

            // console.log(list_serv);

            //Récupération de la liste des produits liés à la facture
            let fact_serv = await D.exec_params(`select * from enc_serv
            left join service on service_id = encserv_serv_id
            where encserv_enc_id in (?) and encserv_is_product = 0`,[enc_ids])

            let fact_med = await D.exec_params(`select * from enc_serv
            left join article on art_id = encserv_serv_id
            where encserv_enc_id in (?) and encserv_is_product = 1`,[enc_ids])

            //Récupération de la liste des produits liés à la facture //côté prescription
            let factp_serv = await D.exec_params(`select * from enc_prescri
            left join service on service_id = encp_serv_id
            where encp_enc_id in (?) and encp_is_product = 0`,[enc_ids])

            let factp_med = await D.exec_params(`select * from enc_prescri
            left join article on art_id = encp_serv_id
            where encp_enc_id in (?) and encp_is_product = 1`,[enc_ids])

            //Manipulations des données
            let index_med = -1
            // let indexp_med = -1
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

                //Pour la prescription
                for (let j = 0; j < factp_serv.length; j++) {
                    const es = factp_serv[j];
                    if(e.service_id == es.service_parent_id){
                        list_serv[i].montant_total += (es.encp_montant)?parseInt(es.encp_montant):0
                    }
                }
            }

            if(index_med == -1){
                list_serv.splice(2,0,{service_code:'MED',service_label:'MEDICAMENTS'})
                index_med = 2
            }

            list_serv[index_med].montant_total = 0
            //et juste pour les médicaments -- Insertion des montants total dans médicaments
            for (let i = 0; i < fact_med.length; i++) {
                const e = fact_med[i]
                list_serv[index_med].montant_total += (e.encserv_montant)?parseInt(e.encserv_montant):0
            }
            //Pour la prescription
            for (let i = 0; i < factp_med.length; i++) {
                const e = factp_med[i]
                list_serv[index_med].montant_total += (e.encp_montant)?parseInt(e.encp_montant):0
            }

            //conception anle PDF amzay eto an,
            // await createFactPDF(fact,list_serv,fact_serv)
            let mode = {
                label:(fact[0].enc_mode_paiement == 'esp')?'Espèce':'Chèque',
                code:fact[0].enc_mode_paiement
            }

            await createFactPDF(enc_f,list_serv,mode,null,{
                date_1,
                date_2
            })

            return res.send({status:true,pdf_name:'fact-caisse',message:"Encaissement effectuée"})
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

    //Détails an'ilay encaissement eto
    static async getDetEncaissement(req,res){
        try {
            let enc_id = req.params.enc_id
            if(enc_id == 'cumul') enc_id = req.query.enc_ids

            //Récupération de la liste des produits liés à la facture
            let fact_serv = await D.exec_params(`select * from enc_serv
            left join service on service_id = encserv_serv_id
            where encserv_enc_id ${Array.isArray(enc_id)?'in (?)':' = ?'} and encserv_is_product = 0`,[enc_id])

            let fact_med = await D.exec_params(`select *,art_code as service_code,art_label as service_label from enc_serv
            left join article on art_id = encserv_serv_id
            where encserv_enc_id ${Array.isArray(enc_id)?'in (?)':' = ?'} and encserv_is_product = 1`,[enc_id])


            //resaka prescription
            let factp_serv = await D.exec_params(`select * from enc_prescri
            left join service on service_id = encp_serv_id
            where encp_enc_id ${Array.isArray(enc_id)?'in (?)':' = ?'} and encp_is_product = 0`,[enc_id])

            let factp_med = await D.exec_params(`select *,art_code as service_code,art_label as service_label from enc_prescri
            left join article on art_id = encp_serv_id
            where encp_enc_id ${Array.isArray(enc_id)?'in (?)':' = ?'} and encp_is_product = 1`,[enc_id])

            let list_serv = [...fact_serv,...fact_med,...factp_serv,...factp_med]

            return res.send({status:true,list_serv})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    //Création du PDF du détails encaissement eto
    static async setPDFDetEncaissement(req,res){
        try {
            /*
                Tena ho lava be ty 😂😂😂,
            */

            let {enc_id} = req.params
            if(enc_id == 'cumul') enc_id = req.query.enc_ids

            //On va d'abord récupérer la liste des services parents
            let serv_p = await D.exec_params(`select * from service where service_parent_id is null`)

            //ensuite la liste des services dans enc_service
            let enc_serv = await D.exec_params(`select * from enc_serv
            left join service on service_id = encserv_serv_id
            where encserv_enc_id ${Array.isArray(enc_id)?'in (?)':' = ?'} and encserv_is_product = 0`,[enc_id])

            //puis la liste des produits dans encser
            let enc_med = await D.exec_params(`select *,art_code as service_code,art_label as service_label from enc_serv
            left join article on art_id = encserv_serv_id
            where encserv_enc_id ${Array.isArray(enc_id)?'in (?)':' = ?'} and encserv_is_product = 1`,[enc_id])


            //resaka prescription
            let encp_serv = await D.exec_params(`select *,encp_montant as encserv_montant,encp_qt as encserv_qt from enc_prescri
            left join service on service_id = encp_serv_id
            where encp_enc_id ${Array.isArray(enc_id)?'in (?)':' = ?'} and encp_is_product = 0`,[enc_id])

            let encp_med = await D.exec_params(`select *,encp_montant as encserv_montant,encp_qt as encserv_qt,
            art_code as service_code,art_label as service_label from enc_prescri
            left join article on art_id = encp_serv_id
            where encp_enc_id ${Array.isArray(enc_id)?'in (?)':' = ?'} and encp_is_product = 1`,[enc_id])

            enc_serv = [...enc_serv,...encp_serv]
            enc_med = [...enc_med,...encp_med]

            //Regroupement des services dans le service parent //juste pour les services
            for (var i = 0; i < serv_p.length; i++) {
                const sp = serv_p[i]

                for (var j = 0; j < enc_serv.length; j++) {
                    const es = enc_serv[j]

                    if(sp.service_id == es.service_parent_id){

                        if(serv_p[i]['child']){
                            serv_p[i]['child'].push(es)
                        }else{
                            serv_p[i]['child'] = [es]
                        }

                    }
                }

            }

            //Regroupement pour les médicaments
            serv_p.push({service_id:123456,service_label:'MEDICAMENTS',service_code:'MED',child:(enc_med.length > 0)?enc_med:undefined})


            //Récupération an'ilay encaissement
            let enc = await D.exec_params(`select * from encaissement
            left join patient on pat_id = enc_pat_id
            where enc_id ${Array.isArray(enc_id)?'in (?)':' = ?'}`,[enc_id])
            //Eto amzay ny création an'ilay PDF            

            await createDetFactPDF(serv_p,'det-fact-caisse',enc)
            return res.send({status:true,link:'/api/encaissement/det/download/fact',message:"PDF bien générer"})

        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async downDetFact(req,res){
        try {
            let data = fs.readFileSync(`./files/det-fact-caisse.pdf`)
            res.contentType("application/pdf")
            // res.download(`./facture.pdf`)
            res.send(data);
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getVersement(req,res){
        try {
            let {date_verse} = req.query
            date_verse = new Date(date_verse)

            // console.log(date_verse,date_verse1)

            //Ici on va chercher les encaissements entre les 2 dates
            let enc_list = await D.exec_params(`select * from encaissement
            where enc_validate = 1 and date(enc_date_validation) = date(?)  `,[date_verse])

            //ici récupération des avances entre les 2 dates
            let encav_list = await D.exec_params(`select * from enc_avance
                where encav_validate = 1 and date(encav_date_validation) = date(?)`,[date_verse])

            let ids_enc = enc_list.map( x => parseInt(x.enc_id) )

            //On va faire d'abord la somme 
            let somme_total = 0, somme_chq = 0, somme_esp = 0
            for (let i = 0; i < enc_list.length; i++) {
                const e = enc_list[i];
                let av = parseInt((e.enc_total_avance)?e.enc_total_avance:0)

                if(e.enc_mode_paiement == 'chq'){
                    somme_chq += parseInt(e.enc_montant) - av
                }else if(e.enc_mode_paiement == 'esp'){
                    somme_esp += parseInt(e.enc_montant) - av
                }
                somme_total += parseInt(e.enc_montant) - av
            }

            let somme_avance = 0
            for (var i = 0; i < encav_list.length; i++) {
                const ea = encav_list[i]

                somme_avance += parseInt(ea.encav_montant)
            }

            let vt = await D.exec_params(`select * from versement where date(vt_date) = date(?)`,[date_verse])

            vt = (vt.length > 0)?vt[0]:false
            return res.send({status:true,vt,enc_list,somme_total,somme_chq,somme_esp,somme_avance,encav_list})


        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async postVersement(req,res){
        try {
            let {vt,date_verse,ids_enc,ids_encav,user_id} = req.body

            vt.vt_date = new Date(date_verse)

            let vr = {}

            if(vt.vt_id){
                delete vt.vt_date_enreg

                let old = (D.exec_params('select * from versement where vt_id = ?',[vt.vt_id]))[0]

                await D.updateWhere('versement',vt,{vt_id:vt.vt_id})

                await D.exec_params(`update encaissement set enc_versement = ? where enc_id in (?)`,[vt.vt_id,ids_enc])
                if( ids_encav.length > 0 ){
                    await D.exec_params(`update enc_avance set encav_versement = ? where encav_id in (?)`,[vt.vt_id,ids_encav])
                }

                //historique de l'utilisateur
                let hist = {
                    uh_user_id:user_id,
                    uh_code:req.uh.modif_vers.k,
                    uh_description:req.uh.modif_vers.l,
                    uh_module:'Caisse Dispensaire',
                    uh_extras:JSON.stringify({
                        datas:{
                            vt:old,
                            dep_n:vt,
                            nb_enc:ids_enc.length,
                            nb_encav:ids_encav.length
                        }
                    })
                }

                await D.set('user_historic',hist)

                // vr.insertId = vt.vt_id

            }else{
                vr = await D.set('versement',vt)
                let hist = {
                    uh_user_id:user_id,
                    uh_code:req.uh.validate_vers.k,
                    uh_description:req.uh.validate_vers.l,
                    uh_module:'Caisse Dispensaire',
                    uh_extras:JSON.stringify({
                        datas:{
                            vt:(await D.exec_params('select * from versement where vt_id = ?',[vt.insertId]))[0]
                        }
                    })
                }

                await D.set('user_historic',hist)
                //Modification des encaissements comme versé
                await D.exec_params(`update encaissement set enc_versement = ? where enc_id in (?)`,[vr.insertId,ids_enc])
                if( ids_encav.length > 0 ){
                    await D.exec_params(`update enc_avance set encav_versement = ? where encav_id in (?)`,[vr.insertId,ids_encav])
                }
            }
            return res.send({status:true})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async setRapportVt(req,res){
        try {
            let {vt_id} = req.query

            let vt = (await D.exec_params(`select * from versement
                where vt_id = ?`,[vt_id]))[0]

            //Récupération des encaissements dans le versememnt
            let enc = await D.exec_params(`select * from encaissement
                where enc_versement = ?`,[vt_id])


            //Récupération des avances dans le versement
            let list_avance = await D.exec_params(`select * from enc_avance
                left join encaissement on enc_id = encav_enc_id
                where encav_versement = ?`,[vt_id])



            //calcul des sommes espèces et chèques
            vt.recette_chq = 0
            vt.recette_esp = 0

            for (var i = 0; i < enc.length; i++) {
                const en = enc[i]
                let tt_mt = parseInt(en.enc_montant) - parseInt((en.enc_total_avance)?en.enc_total_avance:0)
                if(en.enc_mode_paiement == 'esp'){
                    vt.recette_esp = (vt.recette_esp)?vt.recette_esp + tt_mt:tt_mt
                }else{
                    vt.recette_chq = (vt.recette_chq)?vt.recette_chq + tt_mt:tt_mt
                }
            }

            vt.recette_avance = 0
            for (let i = 0; i < list_avance.length; i++) {
                const e = list_avance[i];
                vt.recette_avance += (e.encav_montant)?parseInt(e.encav_montant):0
            }

            vt.recette_esp += vt.recette_avance 

            vt.vt_remise = Math.abs(parseInt(vt.vt_total) - (vt.recette_esp))

            // console.log(`vt_remise : ${vt.vt_remise}`);
            // console.log(`recette_avance : ${vt.recette_avance}`);
            // console.log(`recette_esp : ${vt.recette_esp}`);
            // console.log(`vt_total : ${vt.vt_total}`);

            //Liste des département
            //Qlques Gestions
            let dep = await D.exec('select * from departement where dep_show_caisse = 1')
            //dep_code d'un département dispensaire est : C017
            let dep_code_autre = "C017"
            let dep_autre_in = false
            for (let i = 0; i < dep.length; i++) {
                const de = dep[i];
                if(de.dep_code == dep_code_autre){
                    dep_autre_in = true
                    break
                }
            }

            if(!dep_autre_in) dep.push({dep_label:"AUTRES",dep_code:dep_code_autre,dep_id:-1})

            let enc_ids = enc.map( x => parseInt(x.enc_id) )
            // Fin gestion département

            //Récupération de la liste des encserv
            let list_serv = await D.exec_params(`select * from enc_serv
            left join service on service_id = encserv_serv_id
            where encserv_enc_id in (?) and encserv_is_product = 0`,[enc_ids])

            let list_med = await D.exec_params(`select *,art_code as service_code,art_label as service_label from enc_serv
            left join article on art_id = encserv_serv_id
            where encserv_enc_id in (?) and encserv_is_product = 1`,[enc_ids])

            //Récupération de la liste des encprescri
            let list_servp = await D.exec_params(`select * from enc_prescri
            left join service on service_id = encp_serv_id
            where encp_enc_id in (?) and encp_is_product = 0`,[enc_ids])

            let list_medp = await D.exec_params(`select *,art_code as service_code,art_label as service_label from enc_prescri
            left join article on art_id = encp_serv_id
            where encp_enc_id in (?) and encp_is_product = 1`,[enc_ids])


            //Ici on va supposé que le index (ID) du service médicaments et de  [s500]
            let id_med = 's500'

            let serv_p = await D.exec_params('select * from service where service_parent_id is null order by service_rang')
            //Ici on va séparer les rang null et les autres
            // 🤣😂 Vraiment ridicule ce bout de code
            let lnull = [], nnull = []
            for (let i = 0; i < serv_p.length; i++) {
                const e = serv_p[i];
                if(!e.service_rang){
                    lnull.push(e)
                }else{
                    nnull.push(e)
                }
            }
            serv_p = [...nnull,...lnull]
            // ----------------------
            serv_p.splice(2,0,{service_id:id_med,service_label:'MEDICAMENTS',service_code:'MED',service_parent_id:null})

            //répartition des avances par département
            for (var k = 0; k < list_avance.length; k++) {
                const la = list_avance[k]
                let laav = (la.encav_montant)?parseInt(la.encav_montant):0
                
                for (let j = 0; j < dep.length; j++) {
                    const de = dep[j];
                    if((la.enc_dep_id == de.dep_id || (de.dep_code == dep_code_autre && !la.enc_dep_id))){

                        dep[j]['avance_plus'] = (dep[j]['avance_plus'])?dep[j]['avance_plus'] + laav:laav

                        dep[j]['total_net'] = dep[j]['avance_plus']


                        dep[j]['esp'] = dep[j]['avance_plus']
                        //dep[j]['chq'] = (dep[j]['chq'])?dep[j]['chq']+dep[j]['avance_plus']:dep[j]['avance_plus']

                    }
                }
            }


            // répartition des montants par département
            for (var i = 0; i < enc.length; i++) {
                const e = enc[i]

                //parcours département
                for(var j = 0; j < dep.length; j++){
                    const de = dep[j]

                    //parcours list_service
                    for(var k = 0; k < list_serv.length; k++){
                        const ls = list_serv[k]
                        if((e.enc_dep_id == de.dep_id || (de.dep_code == dep_code_autre && !e.enc_dep_id)) && ls.encserv_enc_id == e.enc_id){
                            dep[j][ls.service_parent_id] = (dep[j][ls.service_parent_id])?dep[j][ls.service_parent_id]+parseInt(ls.encserv_montant):parseInt(ls.encserv_montant)
                        }
                    }

                    //parcours des médicaments
                    for(var k = 0; k < list_med.length; k++){
                        const ls = list_med[k]
                        if((e.enc_dep_id == de.dep_id || (de.dep_code == dep_code_autre && !e.enc_dep_id)) && ls.encserv_enc_id == e.enc_id){
                            dep[j][id_med] = (dep[j][id_med])?dep[j][id_med]+parseInt(ls.encserv_montant):parseInt(ls.encserv_montant)
                        }
                    }

                    //parcours list_service dans la prescription
                    for(var k = 0; k < list_servp.length; k++){
                        const ls = list_servp[k]
                        if((e.enc_dep_id == de.dep_id || (de.dep_code == dep_code_autre && !e.enc_dep_id)) && ls.encp_enc_id == e.enc_id){
                            dep[j][ls.service_parent_id] = (dep[j][ls.service_parent_id])?dep[j][ls.service_parent_id]+parseInt(ls.encp_montant):parseInt(ls.encp_montant)
                        }
                    }

                    //parcours des médicaments dans la presciption
                    for(var k = 0; k < list_medp.length; k++){
                        const ls = list_medp[k]
                        if((e.enc_dep_id == de.dep_id || (de.dep_code == dep_code_autre && !e.enc_dep_id)) && ls.encp_enc_id == e.enc_id){
                            dep[j][id_med] = (dep[j][id_med])?dep[j][id_med]+parseInt(ls.encp_montant):parseInt(ls.encp_montant)
                        }
                    }

                    //Insertion avance,total_net et total espèce, total chèque
                    if(e.enc_dep_id == de.dep_id || (de.dep_code == dep_code_autre && !e.enc_dep_id)){
                        let ta = (e.enc_total_avance)?parseInt(e.enc_total_avance):0
                        dep[j]['avance'] = (dep[j]['avance'])?dep[j]['avance'] + ta:ta

                        const t_net = e.enc_montant - ta + ( (dep[j]['avance_plus'] && !dep[j]['total_net'])?dep[j]['avance_plus']:0 )

                        dep[j]['total_net'] = (dep[j]['total_net'])?dep[j]['total_net'] + t_net:t_net


                        dep[j]['esp'] = (e.enc_mode_paiement == 'esp')?((dep[j]['esp'])?dep[j]['esp']+t_net:t_net):(dep[j]['esp'])?dep[j]['esp']:0
                        dep[j]['chq'] = (e.enc_mode_paiement == 'chq')?((dep[j]['chq'])?dep[j]['chq']+t_net:t_net):(dep[j]['chq'])?dep[j]['chq']:0

                        // if(e.enc_mode_paiement == 'chq'){
                        //     console.log(`${de.dep_label}[chq] : ${(dep[j]['chq'])?dep[j]['chq']:0}`)
                        // }
                    }
                }
            }

            let dt = {enc,serv_p,dep,vt}
            await createRapportVt(dt)
            return res.send({status:true,vt,enc,list_serv,list_med})

        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async downRapportVt(req,res){
        try {
            let data = fs.readFileSync(`./files/rapport-vt.pdf`)
            res.contentType("application/pdf")
            // res.download(`./facture.pdf`)
            res.send(data);
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }


    /**
     * ICI GESTION DE LA CAISSE PRINCIPALE
     */

    //ICI RECUPERATION DES DONNEES UTILES POUR LES FILTRES 
    static async recupDataMainForFilters(req,res){
        try {

            let dep_list = await D.exec_params('select * from departement where dep_show_caisse = 1')
            let sp_list = await D.exec_params('select * from service where service_parent_id is null')

            return res.send({
                status:true,
                dep_list,
                sp_list
            })

        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getEncMainDisp(req,res){
        try {
            let {filters} = req.query

            // console.error(filters)

            let {pat_label,validate,dep_id,date_1,date_2,limit,page,date_by} = filters

            date_1 = new Date(date_1)
            date_2 = new Date(date_2)
            validate = parseInt(validate)

            //la valeur de date_by
            //sera ['insert','validate'] //pour date d'insertion et date de validation

            dep_id = parseInt(dep_id)
            limit = parseInt(limit)
            page = parseInt(page)
            pat_label = `%${pat_label}%`

            let offset = (page - 1) * limit

            //ici on va compter le nombre total de résultats
            let result = (await D.exec_params(`select count(*) as nb_result,sum(enc_montant) as somme_result from encaissement
            left join patient on pat_id = enc_pat_id
            left join entreprise on ent_id = enc_ent_id
            left join tarif on tarif_id = enc_tarif_id
            left join departement on dep_id = enc_dep_id
            where enc_to_caisse = 1 and enc_is_hosp is null
            and date(${date_by=='insert'?'enc_date_enreg':'enc_date_validation'}) between date(?) and date(?) 
            and (pat_nom_et_prenom like ? or enc_pat_externe like ?)
            and enc_validate ${(validate == -1)?'<>':'='} ?
            order by ${date_by=='insert'?'enc_date_enreg':'enc_date_validation'} desc
            `,[date_1,date_2,pat_label,pat_label,validate]))[0]


            if(req.query.down){
                let list_enc = await D.exec_params(`select * from encaissement
                left join patient on pat_id = enc_pat_id
                left join entreprise on ent_id = enc_ent_id
                left join tarif on tarif_id = enc_tarif_id
                left join departement on dep_id = enc_dep_id
                where enc_to_caisse = 1 and enc_is_hosp is null
                and date(${date_by=='insert'?'enc_date_enreg':'enc_date_validation'}) between date(?) and date(?) 
                and (pat_nom_et_prenom like ? or enc_pat_externe like ?)
                and enc_validate ${(validate == -1)?'<>':'='} ?
                order by ${date_by=='insert'?'enc_date_enreg':'enc_date_validation'} desc
                `,[date_1,date_2,pat_label,pat_label,validate])

                let dt = {
                    filters,list_enc,result,
                    pdf_name:'caisse-main-disp'
                }

                if(req.query.type == 'pdf'){
                    await createCaisseMainDispPDF(dt)
                    return res.send({status:true,pdf_name:dt.pdf_name})
                }else if(req.query.type == "excel"){
                    let dd = await createCaisseMainDispExcel(dt)

                    return res.send({status:true,data:dd})
                }

            }else{
                let list_enc = await D.exec_params(`select * from encaissement
                left join patient on pat_id = enc_pat_id
                left join entreprise on ent_id = enc_ent_id
                left join tarif on tarif_id = enc_tarif_id
                left join departement on dep_id = enc_dep_id
                where enc_to_caisse = 1 and enc_is_hosp is null
                and date(${date_by=='insert'?'enc_date_enreg':'enc_date_validation'}) between date(?) and date(?) 
                and (pat_nom_et_prenom like ? or enc_pat_externe like ?)
                and enc_validate ${(validate == -1)?'<>':'='} ?
                order by ${date_by=='insert'?'enc_date_enreg':'enc_date_validation'} desc limit ? offset ?
                `,[date_1,date_2,pat_label,pat_label,validate,limit,offset])

                let total_montant = 0
                for (let i = 0; i < list_enc.length; i++) {
                    const e = list_enc[i];
                    total_montant += parseInt(e.enc_montant) - parseInt((e.enc_total_avance)?e.enc_total_avance:0)
                }

                return res.send({status:true,list_enc,total_montant,result})
            }

            
        }catch(e){
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getEncMainHosp(req,res){
        try {
            let {filters} = req.query

            // console.error(filters)

            let {pat_label,validate,dep_id,date_1,date_2,limit,page,date_by} = filters

            date_1 = new Date(date_1)
            date_2 = new Date(date_2)
            validate = parseInt(validate)
            dep_id = parseInt(dep_id)
            limit = parseInt(limit)
            page = parseInt(page)
            pat_label = `%${pat_label}%`

            let offset = (page - 1) * limit

            

            //ici on va compter le nombre total de résultats
            let result = (await D.exec_params(`select count(*) as nb_result,sum(enc_montant) as somme_result, 
            sum(enc_total_avance) as avance_result from encaissement
            left join patient on pat_id = enc_pat_id
            left join entreprise on ent_id = enc_ent_id
            left join tarif on tarif_id = enc_tarif_id
            left join departement on dep_id = enc_dep_id
            where enc_to_caisse = 1 and enc_is_hosp = 1
            and date(${date_by=='insert'?'enc_date_enreg':'enc_date_validation'}) between date(?) and date(?) 
            and enc_dep_id ${dep_id == -1?'<>':'='} ?
            and (pat_nom_et_prenom like ? or enc_pat_externe like ?)
            and enc_validate ${(validate == -1)?'<>':'='} ?
            order by ${date_by=='insert'?'enc_date_enreg':'enc_date_validation'} desc
            `,[date_1,date_2,dep_id,pat_label,pat_label,validate]))[0]


            if(req.query.down){
                let list_enc = await D.exec_params(`select * from encaissement
                left join patient on pat_id = enc_pat_id
                left join entreprise on ent_id = enc_ent_id
                left join tarif on tarif_id = enc_tarif_id
                left join departement on dep_id = enc_dep_id
                where enc_to_caisse = 1 and enc_is_hosp = 1
                and date(${date_by=='insert'?'enc_date_enreg':'enc_date_validation'}) between date(?) and date(?) 
                and enc_dep_id ${dep_id == -1?'<>':'='} ?
                and (pat_nom_et_prenom like ? or enc_pat_externe like ?)
                and enc_validate ${(validate == -1)?'<>':'='} ?
                order by ${date_by=='insert'?'enc_date_enreg':'enc_date_validation'} desc
                `,[date_1,date_2,dep_id,pat_label,pat_label,validate])


                let dt = {
                    filters,result,list_enc,
                    pdf_name:'caisse-main-hosp'
                }

                if(req.query.type == 'pdf'){
                    await createCaisseMainHospPDF(dt)
                    return res.send({status:true,pdf_name:dt.pdf_name})
                }else if(req.query.type == 'excel'){
                    let dd = await createCaisseMainHospExcel(dt)

                    return res.send({status:true,data:dd})
                }

            }else{
                let list_enc = await D.exec_params(`select * from encaissement
                left join patient on pat_id = enc_pat_id
                left join entreprise on ent_id = enc_ent_id
                left join tarif on tarif_id = enc_tarif_id
                left join departement on dep_id = enc_dep_id
                where enc_to_caisse = 1 and enc_is_hosp = 1
                and date(${date_by=='insert'?'enc_date_enreg':'enc_date_validation'}) between date(?) and date(?) 
                and enc_dep_id ${dep_id == -1?'<>':'='} ?
                and (pat_nom_et_prenom like ? or enc_pat_externe like ?)
                and enc_validate ${(validate == -1)?'<>':'='} ?
                order by ${date_by=='insert'?'enc_date_enreg':'enc_date_validation'} desc limit ? offset ?
                `,[date_1,date_2,dep_id,pat_label,pat_label,validate,limit,offset])
                
                let total_montant = 0,total_avance = 0
                for (let i = 0; i < list_enc.length; i++) {
                    const e = list_enc[i];
                    total_montant += parseInt(e.enc_montant) - ((filters.validate == 0)?parseInt((e.enc_total_avance)?e.enc_total_avance:0):0)

                    total_avance += parseInt((e.enc_total_avance)?e.enc_total_avance:0)
                }

                return res.send({status:true,list_enc,total_montant,total_avance,result})
            }
        }catch(e){
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getEncservMain(req,res){
        try {
            
            let {date_1,date_2,dep_id,service_parent,service_label,pat_label,limit,page} = req.query.filters

            date_1 = new Date(date_1)
            date_2 = new Date(date_2)

            limit = parseInt(limit)
            page = parseInt(page)
            service_parent = parseInt(service_parent)
            dep_id = parseInt(dep_id)

            pat_label = `%${pat_label}%`
            service_label = `%${service_label}%`

            let offset = (page - 1) * limit

            let is_product = (service_parent == -42)?1:0

            let result = (await D.exec_params(`select count(*) as nb_result,sum(encserv_montant) as somme_encserv,coalesce(sum(encserv_qt),0) as somme_qt
            from encaissement
            left join enc_serv on enc_id = encserv_enc_id
            left join patient on pat_id = enc_pat_id
            left join departement on dep_id = enc_dep_id
            ${ (is_product)?'left join article on encserv_serv_id = art_id':'left join service on encserv_serv_id = service_id' }
            where date(enc_date_validation) between date(?) and date(?) 
            and (enc_dep_id ${dep_id == -1?' <> ? or enc_dep_id is null':' = ?'})
            and (pat_nom_et_prenom like ? or enc_pat_externe like ?)
            and encserv_is_product = ${is_product}
            and (${ (is_product)?'art_label like ?':`service_label like ? and service_parent_id ${(service_parent != -1)?' = '+service_parent:' is not null'}` })
            and enc_validate = 1
            order by enc_date_validation desc
            `,[date_1,date_2,dep_id,pat_label,pat_label,service_label]))[0]


            //count(*) as nb_result,sum(enc_montant) as somme_result

            

            if(req.query.down){

                let _encserv = await D.exec_params(`select *${(is_product)?', art_label as service_label,art_code as service_code':''}
                from encaissement
                left join enc_serv on enc_id = encserv_enc_id
                left join patient on pat_id = enc_pat_id
                left join departement on dep_id = enc_dep_id
                ${ (is_product)?'left join article on encserv_serv_id = art_id':'left join service on encserv_serv_id = service_id' }
                where date(enc_date_validation) between date(?) and date(?) 
                and (enc_dep_id ${dep_id == -1?' <> ? or enc_dep_id is null':' = ?'})
                and (pat_nom_et_prenom like ? or enc_pat_externe like ?)
                and encserv_is_product = ${is_product}
                and (${ (is_product)?'art_label like ?':`service_label like ? and service_parent_id ${(service_parent != -1)?' = '+service_parent:' is not null'}` })
                and enc_validate = 1
                order by enc_date_validation desc
                `,[date_1,date_2,dep_id,pat_label,pat_label,service_label])

                let dt = {
                    list_encserv:_encserv,
                    filters:req.query.filters,
                    result,
                    pdf_name:'caisse-main-suivi-med-serv'
                }

                if(req.query.type == 'pdf'){
                    await createCaisseMainSuiviPDF(dt)
                    return res.send({status:true,pdf_name:dt.pdf_name})
                }else if(req.query.type == 'excel'){
                    const ex = await createCaisseMainSuiviExcel(dt)
                    return res.send({status:true,data:ex})
                }else{
                    return res.send({status:true,message:'42'})
                }

                

            }else{
                let encserv = await D.exec_params(`select *${(is_product)?', art_label as service_label,art_code as service_code':''}
                from encaissement
                left join enc_serv on enc_id = encserv_enc_id
                left join patient on pat_id = enc_pat_id
                left join departement on dep_id = enc_dep_id
                ${ (is_product)?'left join article on encserv_serv_id = art_id':'left join service on encserv_serv_id = service_id' }
                where date(enc_date_validation) between date(?) and date(?) 
                and (enc_dep_id ${dep_id == -1?' <> ? or enc_dep_id is null':' = ?'})
                and (pat_nom_et_prenom like ? or enc_pat_externe like ?)
                and encserv_is_product = ${is_product}
                and (${ (is_product)?'art_label like ?':`service_label like ? and service_parent_id ${(service_parent != -1)?' = '+service_parent:' is not null'}` })
                and enc_validate = 1
                order by enc_date_validation desc
                limit ? offset ?
                `,[date_1,date_2,dep_id,pat_label,pat_label,service_label,limit,offset])


                return res.send({status:true,encserv,result,message:'42'})
            }

        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getEncMainAvance(req,res){
        try {
            let {filters} = req.query

            // console.error(filters)

            let {pat_label,validate,dep_id,date_1,date_2,limit,page,date_by} = filters

            date_1 = new Date(date_1)
            date_2 = new Date(date_2)
            validate = parseInt(validate)
            dep_id = parseInt(dep_id)
            limit = parseInt(limit)
            page = parseInt(page)
            pat_label = `%${pat_label}%`

            let offset = (page - 1) * limit

            

            //ici on va compter le nombre total de résultats
            let result = (await D.exec_params(`select count(*) as nb_result,sum(encav_montant) as somme_result from enc_avance
            left join encaissement on enc_id = encav_enc_id
            left join patient on pat_id = enc_pat_id
            left join entreprise on ent_id = enc_ent_id
            left join tarif on tarif_id = enc_tarif_id
            left join departement on dep_id = enc_dep_id
            where date(${date_by=='insert'?'encav_date_enreg':'encav_date_validation'}) between date(?) and date(?) 
            and enc_dep_id ${dep_id == -1?'<>':'='} ?
            and (pat_nom_et_prenom like ? or enc_pat_externe like ?)
            and encav_validate ${(validate == -1)?'<>':'='} ?
            order by ${date_by=='insert'?'encav_date_enreg':'encav_date_validation'} desc
            `,[date_1,date_2,dep_id,pat_label,pat_label,validate]))[0]

            if(req.query.down){
                let list_avance = await D.exec_params(`select * from enc_avance
                left join encaissement on enc_id = encav_enc_id
                left join patient on pat_id = enc_pat_id
                left join entreprise on ent_id = enc_ent_id
                left join tarif on tarif_id = enc_tarif_id
                left join departement on dep_id = enc_dep_id
                where date(${date_by=='insert'?'encav_date_enreg':'encav_date_validation'}) between date(?) and date(?) 
                and enc_dep_id ${dep_id == -1?'<>':'='} ?
                and (pat_nom_et_prenom like ? or enc_pat_externe like ?)
                and encav_validate ${(validate == -1)?'<>':'='} ?
                order by ${date_by=='insert'?'encav_date_enreg':'encav_date_validation'} desc
                `,[date_1,date_2,dep_id,pat_label,pat_label,validate])


                let dt = {
                    result,
                    list_avance,
                    pdf_name:'caisse-main-avance',
                    filters
                }

                if(req.query.type == 'pdf'){
                    await createCaisseMainAvancePDF(dt)
                    return res.send({status:true,pdf_name:dt.pdf_name})
                }else if(req.query.type == 'excel'){
                    let dd = await createCaisseMainAvanceExcel(dt)

                    return res.send({status:true,data:dd})                }
            }else{
                let list_avance = await D.exec_params(`select * from enc_avance
                left join encaissement on enc_id = encav_enc_id
                left join patient on pat_id = enc_pat_id
                left join entreprise on ent_id = enc_ent_id
                left join tarif on tarif_id = enc_tarif_id
                left join departement on dep_id = enc_dep_id
                where date(${date_by=='insert'?'encav_date_enreg':'encav_date_validation'}) between date(?) and date(?) 
                and enc_dep_id ${dep_id == -1?'<>':'='} ?
                and (pat_nom_et_prenom like ? or enc_pat_externe like ?)
                and encav_validate ${(validate == -1)?'<>':'='} ?
                order by ${date_by=='insert'?'encav_date_enreg':'encav_date_validation'} desc limit ? offset ?
                `,[date_1,date_2,dep_id,pat_label,pat_label,validate,limit,offset])

                let total_montant = 0,total_avance = 0
                for (let i = 0; i < list_avance.length; i++) {
                    const e = list_avance[i];
                    total_montant += parseInt(e.encav_montant)
                }

                return res.send({status:true,list_avance,total_montant,result})
            }
            

            
        }catch(e){
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    //récupération des données dans dashboard
    //ça va être chaud
    static async dashData(req,res){
        try {
            //récupération de la journée d'aujourd'hui
            let now = new Date()
            let count_now = 0, count_month = 0, count_week = 0
            let nw = U.getDateBeginEndWeek(new Date())
            let nm = U.getDateBeginEndMonth(new Date())

            //ici je vais essayé de regrouper les calculs
            let tmp = (await D.exec_params(`select
                 ( (select coalesce(sum(enc_montant),0) - coalesce(sum(enc_total_avance),0) from encaissement where enc_validate = 1 and date(enc_date_validation) = date(?)) + 
                 (select coalesce(sum(encav_montant),0) from enc_avance where encav_validate = 1 and date(encav_date_validation) = date(?) ) ) as count_now,

                 ( (select coalesce(sum(enc_montant),0) - coalesce(sum(enc_total_avance),0) from encaissement where enc_validate = 1 and 
                 date(enc_date_validation) between date(?) and date(?) ) + 
                 (select coalesce(sum(encav_montant),0) from enc_avance where encav_validate = 1 and 
                 date(encav_date_validation) between date(?) and date(?) ) ) as count_week,


                 ( (select coalesce(sum(enc_montant),0) - coalesce(sum(enc_total_avance),0) from encaissement where enc_validate = 1 and 
                 date(enc_date_validation) between date(?) and date(?) ) + 
                 (select coalesce(sum(encav_montant),0) from enc_avance where encav_validate = 1 and 
                 date(encav_date_validation) between date(?) and date(?) ) ) as count_month
            ;`,[
                now,now, //Pour aujourd'hui

                nw.begin,now, //Pour La semaine
                nw.begin,now,

                nm.begin,now, //Pour le mois
                nm.begin,now,
            ]))[0]

            //pour l'annuel
            let months_list = []
            let sql_m = '',sql_av = ''
            for (let i = 0; i < 12; i++) {
                const dd = new Date(now.getFullYear(),i,1)
                months_list.push(dd)
                months_list.push(dd)
                months_list.push(dd)
                months_list.push(dd)
                sql_m += `(select (coalesce(sum(enc_montant),0) - coalesce(sum(enc_total_avance),0) +
                (select coalesce(sum(encav_montant),0) from enc_avance where encav_validate = 1 and month(encav_date_validation) = month(?) and year(encav_date_validation) = year(?) )
                ) from encaissement where enc_validate = 1 and month(enc_date_validation) = month(?) and year(enc_date_validation) = year(?)) as ${'m'+i}${(i != 11 )?',':''}`
                //sql_m += `(select sum(encav_montant) from enca_avance where month(enc_date_validation) = month(?) and year(enc_date_validation) = year(?)) as ${'m'+i}${(i != 11 )?',':''}`
            }
            // console.log(months_list);
            let rapport_year = (await D.exec_params(`select ${sql_m};`,months_list))[0]


            //Rapport des 4 derniers jours
            let days_list_disp = [],days_list_hosp = []
            sql_m = '',sql_av = ''
            let all_days_list= []
            for (let i = 1; i < 5; i++) {
                const dd = new Date(now.getFullYear(),now.getMonth(),now.getDate() - i)

                all_days_list.push(dd)

                days_list_disp.push(dd)
                days_list_disp.push(dd)
                days_list_disp.push(dd)

                days_list_hosp.push(dd)
                days_list_hosp.push(dd)
                days_list_hosp.push(dd)
                days_list_hosp.push(dd)
                days_list_hosp.push(dd)
                //dispensaire
                sql_m +=`date(?) as date${i}, (select coalesce(sum(enc_montant),0) from encaissement 
                where enc_validate = 1 and enc_is_hosp is null and date(enc_date_validation) = date(?) and year(enc_date_validation) = year(?)) as ${'m'+i}${(i != 4 )?',':''}` 

                sql_av += `date(?) as date${i}, (select (coalesce(sum(enc_montant),0) - coalesce(sum(enc_total_avance),0) +
                (select coalesce(sum(encav_montant),0) from enc_avance where encav_validate = 1 and date(encav_date_validation) = date(?) and year(encav_date_validation) = year(?) )
                ) from encaissement where enc_validate = 1 and enc_is_hosp = 1 and date(enc_date_validation) = date(?) and year(enc_date_validation) = year(?)) as ${'m'+i}${(i != 4 )?',':''}`
            }


            let rapport_disp = (await D.exec_params(`select ${sql_m};`,days_list_disp))[0]
            let rapport_hosp = (await D.exec_params(`select ${sql_av};`,days_list_hosp))[0]


            return res.send({status:true,
                count_now:tmp.count_now || 0,
                count_week:tmp.count_week || 0,
                count_month:tmp.count_month || 0,

                rapport_year,rapport_disp,rapport_hosp
            })

        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }


    static async setMainRapportVt(req,res){
        try {
            
            let {date_1,date_2,type} = req.query.filters

            date_1 = new Date(date_1)
            date_2 = new Date(date_2)

            let vt = {
                vt_remise:0,
                vt_total:0,
                vt_det:{}
            }
            let vts = await D.exec_params(`select * from versement
                where date(vt_date) between date(?) and date(?)`,[date_1,date_2])

            let tmp_billetage = {},l_key = []
            //ici on fait la somme des vt

            for (let i = 0; i < vts.length; i++) {
                const e = vts[i]

                //les plus simples
                vt.vt_total += (e.vt_total)?parseInt(e.vt_total):0
                vt.vt_remise += (e.vt_remise)?parseInt(e.vt_remise):0


                //Gestion billetages
                tmp_billetage = JSON.parse(e.vt_det)
                for (const k in tmp_billetage) {
                    if (Object.hasOwnProperty.call(tmp_billetage, k)) {
                        const e = tmp_billetage[k];
                        vt.vt_det[k] = (vt.vt_det[k])?parseInt(e) + vt.vt_det[k]:parseInt(e)
                    }
                }

            }

            //on remet le billetage en format texte
            vt.vt_det = JSON.stringify(vt.vt_det)


            let vt_ids = vts.map(x => x.vt_id)

            //Récupération des encaissements dans le versememnt
            let enc = await D.exec_params(`select * from encaissement
                where enc_versement in (?)`,[vt_ids])

            //Récupération des avances dans le versement
            let list_avance = await D.exec_params(`select * from enc_avance
                left join encaissement on enc_id = encav_enc_id
                where encav_versement in (?)`,[vt_ids])



            //calcul des sommes espèces et chèques
            vt.recette_chq = 0
            vt.recette_esp = 0

            for (var i = 0; i < enc.length; i++) {
                const en = enc[i]
                let tt_mt = parseInt(en.enc_montant) - parseInt((en.enc_total_avance)?en.enc_total_avance:0)
                if(en.enc_mode_paiement == 'esp'){
                    vt.recette_esp = (vt.recette_esp)?vt.recette_esp + tt_mt:tt_mt
                }else{
                    vt.recette_chq = (vt.recette_chq)?vt.recette_chq + tt_mt:tt_mt
                }
            }

            vt.recette_avance = 0
            for (let i = 0; i < list_avance.length; i++) {
                const e = list_avance[i];
                vt.recette_avance += (e.encav_montant)?parseInt(e.encav_montant):0
            }

            vt.recette_esp += vt.recette_avance 

            vt.vt_remise = Math.abs(parseInt(vt.vt_total) - (vt.recette_chq + vt.recette_esp))

            // console.log(`vt_remise : ${vt.vt_remise}`);
            // console.log(`recette_avance : ${vt.recette_avance}`);
            // console.log(`recette_esp : ${vt.recette_esp}`);
            // console.log(`vt_total : ${vt.vt_total}`);

            //Liste des département
            //Qlques Gestions
            let dep = await D.exec('select * from departement where dep_show_caisse = 1')
            //dep_code d'un département dispensaire est : C017
            let dep_code_autre = "C017"
            let dep_autre_in = false
            for (let i = 0; i < dep.length; i++) {
                const de = dep[i];
                if(de.dep_code == dep_code_autre){
                    dep_autre_in = true
                    break
                }
            }

            if(!dep_autre_in) dep.push({dep_label:"AUTRES",dep_code:dep_code_autre,dep_id:-1})

            let enc_ids = enc.map( x => parseInt(x.enc_id) )
            // Fin gestion département

            //Récupération de la liste des encserv
            let list_serv = await D.exec_params(`select * from enc_serv
            left join service on service_id = encserv_serv_id
            where encserv_enc_id in (?) and encserv_is_product = 0`,[enc_ids])

            let list_med = await D.exec_params(`select *,art_code as service_code,art_label as service_label from enc_serv
            left join article on art_id = encserv_serv_id
            where encserv_enc_id in (?) and encserv_is_product = 1`,[enc_ids])

            //Récupération de la liste des encprescri
            let list_servp = await D.exec_params(`select * from enc_prescri
            left join service on service_id = encp_serv_id
            where encp_enc_id in (?) and encp_is_product = 0`,[enc_ids])

            let list_medp = await D.exec_params(`select *,art_code as service_code,art_label as service_label from enc_prescri
            left join article on art_id = encp_serv_id
            where encp_enc_id in (?) and encp_is_product = 1`,[enc_ids])


            //Ici on va supposé que le index (ID) du service médicaments et de  [s500]
            let id_med = 's500'

            let serv_p = await D.exec_params('select * from service where service_parent_id is null order by service_rang')
            //Ici on va séparer les rang null et les autres
            // 🤣😂 Vraiment ridicule ce bout de code
            let lnull = [], nnull = []
            for (let i = 0; i < serv_p.length; i++) {
                const e = serv_p[i];
                if(!e.service_rang){
                    lnull.push(e)
                }else{
                    nnull.push(e)
                }
            }
            serv_p = [...nnull,...lnull]
            // ----------------------
            serv_p.splice(2,0,{service_id:id_med,service_label:'MEDICAMENTS',service_code:'MED',service_parent_id:null})

            //répartition des avances par département
            for (var k = 0; k < list_avance.length; k++) {
                const la = list_avance[k]
                let laav = (la.encav_montant)?parseInt(la.encav_montant):0
                
                for (let j = 0; j < dep.length; j++) {
                    const de = dep[j];
                    if((la.enc_dep_id == de.dep_id || (de.dep_code == dep_code_autre && !la.enc_dep_id))){

                        dep[j]['avance_plus'] = (dep[j]['avance_plus'])?dep[j]['avance_plus'] + laav:laav

                        dep[j]['total_net'] = dep[j]['avance_plus']


                        dep[j]['esp'] = dep[j]['avance_plus']
                        //dep[j]['chq'] = (dep[j]['chq'])?dep[j]['chq']+dep[j]['avance_plus']:dep[j]['avance_plus']

                    }
                }
            }


            // répartition des montants par département
            for (var i = 0; i < enc.length; i++) {
                const e = enc[i]

                //parcours département
                for(var j = 0; j < dep.length; j++){
                    const de = dep[j]

                    //parcours list_service
                    for(var k = 0; k < list_serv.length; k++){
                        const ls = list_serv[k]
                        if((e.enc_dep_id == de.dep_id || (de.dep_code == dep_code_autre && !e.enc_dep_id)) && ls.encserv_enc_id == e.enc_id){
                            dep[j][ls.service_parent_id] = (dep[j][ls.service_parent_id])?dep[j][ls.service_parent_id]+parseInt(ls.encserv_montant):parseInt(ls.encserv_montant)
                        }
                    }

                    //parcours des médicaments
                    for(var k = 0; k < list_med.length; k++){
                        const ls = list_med[k]
                        if((e.enc_dep_id == de.dep_id || (de.dep_code == dep_code_autre && !e.enc_dep_id)) && ls.encserv_enc_id == e.enc_id){
                            dep[j][id_med] = (dep[j][id_med])?dep[j][id_med]+parseInt(ls.encserv_montant):parseInt(ls.encserv_montant)
                        }
                    }

                    //parcours list_service dans la prescription
                    for(var k = 0; k < list_servp.length; k++){
                        const ls = list_servp[k]
                        if((e.enc_dep_id == de.dep_id || (de.dep_code == dep_code_autre && !e.enc_dep_id)) && ls.encp_enc_id == e.enc_id){
                            dep[j][ls.service_parent_id] = (dep[j][ls.service_parent_id])?dep[j][ls.service_parent_id]+parseInt(ls.encp_montant):parseInt(ls.encp_montant)
                        }
                    }

                    //parcours des médicaments dans la presciption
                    for(var k = 0; k < list_medp.length; k++){
                        const ls = list_medp[k]
                        if((e.enc_dep_id == de.dep_id || (de.dep_code == dep_code_autre && !e.enc_dep_id)) && ls.encp_enc_id == e.enc_id){
                            dep[j][id_med] = (dep[j][id_med])?dep[j][id_med]+parseInt(ls.encp_montant):parseInt(ls.encp_montant)
                        }
                    }

                    //Insertion avance,total_net et total espèce, total chèque
                    if(e.enc_dep_id == de.dep_id || (de.dep_code == dep_code_autre && !e.enc_dep_id)){
                        let ta = (e.enc_total_avance)?parseInt(e.enc_total_avance):0
                        dep[j]['avance'] = (dep[j]['avance'])?dep[j]['avance'] + ta:ta

                        const t_net = e.enc_montant - ta + ( (dep[j]['avance_plus'] && !dep[j]['total_net'])?dep[j]['avance_plus']:0 )

                        dep[j]['total_net'] = (dep[j]['total_net'])?dep[j]['total_net'] + t_net:t_net


                        dep[j]['esp'] = (e.enc_mode_paiement == 'esp')?((dep[j]['esp'])?dep[j]['esp']+t_net:t_net):(dep[j]['esp'])?dep[j]['esp']:0
                        dep[j]['chq'] = (e.enc_mode_paiement == 'chq')?((dep[j]['chq'])?dep[j]['chq']+t_net:t_net):(dep[j]['chq'])?dep[j]['chq']:0

                        // if(e.enc_mode_paiement == 'chq'){
                        //     console.log(`${de.dep_label}[chq] : ${(dep[j]['chq'])?dep[j]['chq']:0}`)
                        // }
                    }
                }
            }

            vt.date_1 = date_1
            vt.date_2 = date_2

            let dt = {enc,serv_p,dep,vt}
            await createRapportVt(dt)
            return res.send({status:true})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getNbVersementMain(req,res){
        try {
            let {date_1,date_2} = req.query.filters
            let nb_versement = (await D.exec_params('select count(*) as nb from versement where date(vt_date) between date(?) and date(?)',[date_1,date_2]))[0].nb

            return res.send({status:true,nb_versement})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }



    //Création de endpoint pour le téléchargement des PDFs
    static async downAllPDF(req,res){
        try {
            let {pdf} = req.params

            let data = fs.readFileSync(`./files/${pdf}.pdf`)
            res.contentType("application/pdf")
            res.send(data);

        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}




//-------------------------------------------------------
//------------ ICI LES FONCTION DE CREATION DE PDF ------
//-------------------------------------------------------

async function createCaisseMainSuiviPDF(dt){

    let {filters,list_encserv,result} = dt
    let {date_1,date_2} = filters

    let {somme_encserv,somme_qt,nb_result} = result

    //Les débuts du PDF
    let year_cur = new Date().getFullYear()
    const separateNumber = (n)=>{
        return (n)?n.toLocaleString('fr-CA'):''
    }


    //Les options du PDF
    //Création de pdf amzay e 🤣😂, 
    let opt = {
        margin: 15, size: 'A4' ,
        layout:'landscape'
    }   
    let doc = new PDFDocument(opt)

    //les fonts
    doc.registerFont('fira', 'fonts/fira.ttf');
    doc.registerFont('fira_bold', 'fonts/fira-bold.ttf');
    doc.font("fira")

    //Ecriture du PDF
    doc.pipe(fs.createWriteStream(`./files/${dt.pdf_name}.pdf`))

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

    //Textes d'en haut du PDF
    let nom_hop = 'HOPITALY LOTERANA - ANDRANOMADIO'
    let title_pdf = 'suivi médicaments et services - caisse principale'.toUpperCase()
    let date_label = `Journée du : `
    let date_value = `${new Date(date_1).toLocaleDateString()} au ${new Date(date_2).toLocaleDateString()}`
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

    // DEBUT DES CALCULS
    doc.moveDown(5)
    doc.text('',opt.margin)

    let _head = []
    let _datas = []
    let table = {}


    //ICI création des tableaux des récapitulatifs
    _head = [
        { label:"Résultat Total", width:100, property: 'total',renderer: null ,headerAlign:"center",align:"right"},
        { label:"Quantité Total",width:100, property: 'qt_total',renderer: null ,headerAlign:"center",align:"right"},
        { label:"Montant Total",width:100, property: 'somme_total',renderer: null ,headerAlign:"center",align:"right"},
    ]

    _datas = [
        {total:separateNumber(nb_result),qt_total:separateNumber(somme_qt),somme_total:separateNumber(somme_encserv)}
    ]

    table = opt_tab(_head,_datas,doc)
    await doc.table(table, { /* options */ });

    //Réinitialisation Data
    _datas = []

    let l_h = 9
    let p_w = 150,d_w = 150

    let w_a = ( doc.page.width - (p_w + d_w) - opt.margin * 2) / 7
    _head = [
        { label:"Date", width:w_a,  property: 'date',renderer: null ,headerAlign:"center",align:"left"},
        { label:"N°Mvmt", width:w_a,  property: 'num_mvmt',renderer: null ,headerAlign:"center",align:"left"},
        { label:"Patient", width:p_w,  property: 'patient',renderer: null ,headerAlign:"center",align:"left"},
        { label:"Code", width:w_a,  property: 'code',renderer: null ,headerAlign:"center",align:"left"},
        { label:"Désignation", width:d_w,  property: 'desc',renderer: null ,headerAlign:"center",align:"left"},
        { label:"Quantité", width:w_a,  property: 'qt',renderer: null ,headerAlign:"center",align:"right"},
        { label:"Prix Unitaire",  width:w_a, property: 'prix_unit',renderer: null ,headerAlign:"center",align:"right"},
        { label:"Montant",  width:w_a, property: 'montant',renderer: null ,headerAlign:"center",align:"right"},
        { label:"Département", width:w_a,  property: 'dep',renderer: null ,headerAlign:"center",align:"left"},
    ]


    for (let i = 0; i < list_encserv.length; i++) {
        const e = list_encserv[i];
        _datas.push({
            date:new Date(e.enc_date_validation).toLocaleString(),
            num_mvmt:(e.enc_is_hosp)?e.enc_num_hosp:`${ (new Date(e.enc_date_enreg)).getFullYear().toString().substr(2)}/${e.enc_num_mvmt.toString().padStart(5,0)}`,
            code:e.service_code,
            patient:(e.pat_nom_et_prenom)?e.pat_nom_et_prenom:e.enc_pat_externe,
            desc:e.service_label,
            qt:e.encserv_qt,
            prix_unit:separateNumber(e.encserv_prix_unit),
            montant:separateNumber(e.encserv_montant),
            dep:(e.dep_label)?e.dep_label:'-'
        })
    }

    doc.moveDown(5)

    table = opt_tab(_head,_datas,doc)
    await doc.table(table, { /* options */ });

    doc.end()
}

//Fonction d'exportation en excel de suivi
async function createCaisseMainSuiviExcel(dt){
    let {filters,list_encserv,result} = dt
    let {date_1,date_2} = filters

    let {somme_encserv,somme_qt,nb_result} = result

    const separateNumber = (n)=>{
        return (n)?n.toLocaleString('fr-CA'):''
    }


    //initialisation de l'Excel
    const workbook = new ExcelJS.Workbook();

    //----------------------------------------
    workbook.creator = 'xd creator';
    workbook.lastModifiedBy = 'xd creator';
    workbook.lastPrinted = new Date(2016, 9, 27);
    workbook.properties.date1904 = true;
    workbook.calcProperties.fullCalcOnLoad = true;

    //-----------------------------------------
    workbook.views = [
        {
          x: 0, y: 0, width: 10000, height: 20000,
          firstSheet: 0, activeTab: 1, visibility: 'visible'
        }
      ]
    //________________________________________

    //Ajout du sheet
    const sheet = workbook.addWorksheet('Suivi Med_Services')

    //INSERTION DU HEADER
    let _head = []
    let _datas = []
    // --------

    _head = [
        { header:"Date".toUpperCase(), width:10, key: 'date'},
        { header:"N° mouvement", width:10, key: 'num_mvmt'},
        { header:"Patient", width:40, key: 'patient'},
        { header:"Code", width:12, key: 'code'},
        { header:"DESIGNATION", width:40, key: 'desc'},        
        { header:"quantité".toUpperCase(), width:10, key: 'qt'},
        { header:"montant".toUpperCase(), width:12, key: 'montant'},
        { header:"Prix unitaire".toUpperCase(), width:12, key: 'prix_unit'},
        { header:"département".toUpperCase(), width:12, key: 'dep'},
    ]

    sheet.columns = _head //😑😑

    _datas = []
    let tmp_d = {}

    for (var i = 0; i < list_encserv.length; i++) {
        const e = list_encserv[i]
        _datas.push({
            date:new Date(e.enc_date_validation).toLocaleString(),
            num_mvmt:(e.enc_is_hosp)?e.enc_num_hosp:`${ (new Date(e.enc_date_enreg)).getFullYear().toString().substr(2)}/${e.enc_num_mvmt.toString().padStart(5,0)}`,
            code:e.service_code,
            desc:e.service_label,
            patient:(e.pat_nom_et_prenom)?e.pat_nom_et_prenom:e.enc_pat_externe,
            qt:e.encserv_qt,
            prix_unit:separateNumber(e.encserv_prix_unit),
            montant:separateNumber(e.encserv_montant),
            dep:(e.dep_label)?e.dep_label:'-'
        })

    }


    sheet.addRows(_datas);
    let title_pdf = `suivi médicaments et services - caisse principale`.toUpperCase()
    title_pdf += `    Journée du : `
    title_pdf += `${new Date(date_1).toLocaleDateString()} au ${new Date(date_2).toLocaleDateString()}`


    sheet.insertRow(1, [title_pdf]);
    sheet.insertRow(2, ['']);

    // sheet.getRow(6).font = {bold:true,}
    sheet.getRow(3).font = {bold:true,size: 14,underline: true,}
    sheet.getRow(1).font = {bold:true,size: 16,underline: true,}


    const d = await workbook.xlsx.writeBuffer();
    return d
}


//ICI POUR L'EXPORTATION DES AVANCES
async function createCaisseMainAvancePDF(dt){

    let {filters,list_avance,result} = dt
    let {date_1,date_2} = filters

    let {somme_result,nb_result} = result

    //Les débuts du PDF
    let year_cur = new Date().getFullYear()
    const separateNumber = (n)=>{
        return (n)?n.toLocaleString('fr-CA'):''
    }


    //Les options du PDF
    //Création de pdf amzay e 🤣😂, 
    let opt = {
        margin: 15, size: 'A4' ,
        layout:'landscape'
    }   
    let doc = new PDFDocument(opt)

    //les fonts
    doc.registerFont('fira', 'fonts/fira.ttf');
    doc.registerFont('fira_bold', 'fonts/fira-bold.ttf');
    doc.font("fira")

    //Ecriture du PDF
    doc.pipe(fs.createWriteStream(`./files/${dt.pdf_name}.pdf`))

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

    //Textes d'en haut du PDF
    let nom_hop = 'HOPITALY LOTERANA - ANDRANOMADIO'
    let title_pdf = 'suivi avance - caisse principale'.toUpperCase()
    let date_label = `Journée du : `
    let date_value = `${new Date(date_1).toLocaleDateString()} au ${new Date(date_2).toLocaleDateString()}`
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

    // DEBUT DES CALCULS
    doc.moveDown(5)
    doc.text('',opt.margin)

    let _head = []
    let _datas = []
    let table = {}


    //ICI création des tableaux des récapitulatifs
    _head = [
        { label:"Résultat Total", width:100, property: 'total',renderer: null ,headerAlign:"center",align:"right"},
        { label:"Montant Total",width:100, property: 'somme_total',renderer: null ,headerAlign:"center",align:"right"},
    ]

    _datas = [
        {total:separateNumber(nb_result),somme_total:separateNumber(somme_result)}
    ]

    table = opt_tab(_head,_datas,doc)
    await doc.table(table, { /* options */ });

    //Réinitialisation Data
    _datas = []

    let l_h = 9
    let p_w = 200,d_w = 150

    let w_a = ( doc.page.width - (p_w) - opt.margin * 2) / 4
    _head = [
        { label:"Date", width:w_a,  property: 'date',renderer: null ,headerAlign:"center",align:"left"},
        { label:"N°Mvmt", width:w_a,  property: 'num_mvmt',renderer: null ,headerAlign:"center",align:"left"},
        { label:"Patient", width:p_w,  property: 'patient',renderer: null ,headerAlign:"center",align:"left"},
        { label:"Montant Total", width:w_a,  property: 'montant',renderer: null ,headerAlign:"center",align:"right"},
        { label:"Département", width:w_a,  property: 'dep',renderer: null ,headerAlign:"center",align:"left"},
    ]


    for (let i = 0; i < list_avance.length; i++) {
        const e = list_avance[i];
        _datas.push({
            date:new Date(e.enc_date_validation).toLocaleString(),
            num_mvmt:(e.enc_is_hosp)?e.enc_num_hosp:`${ (new Date(e.enc_date_enreg)).getFullYear().toString().substr(2)}/${e.enc_num_mvmt.toString().padStart(5,0)}`,
            patient:(e.pat_nom_et_prenom)?e.pat_nom_et_prenom:e.enc_pat_externe,
            montant:separateNumber(e.encav_montant),
            dep:(e.dep_label)?e.dep_label:'-'
        })
    }

    doc.moveDown(5)

    table = opt_tab(_head,_datas,doc)
    await doc.table(table, { /* options */ });

    doc.end()
}

//Fonction d'exportation en excel de suivi
async function createCaisseMainAvanceExcel(dt){
    let {filters,list_avance,result} = dt
    let {date_1,date_2} = filters

    let {nb_result} = result

    const separateNumber = (n)=>{
        return (n)?n.toLocaleString('fr-CA'):''
    }


    //initialisation de l'Excel
    const workbook = new ExcelJS.Workbook();

    //----------------------------------------
    workbook.creator = 'xd creator';
    workbook.lastModifiedBy = 'xd creator';
    workbook.lastPrinted = new Date(2016, 9, 27);
    workbook.properties.date1904 = true;
    workbook.calcProperties.fullCalcOnLoad = true;

    //-----------------------------------------
    workbook.views = [
        {
          x: 0, y: 0, width: 10000, height: 20000,
          firstSheet: 0, activeTab: 1, visibility: 'visible'
        }
      ]
    //________________________________________

    //Ajout du sheet
    const sheet = workbook.addWorksheet('Suivi Med_Services')

    //INSERTION DU HEADER
    let _head = []
    let _datas = []
    // --------

    _head = [
        { header:"Date".toUpperCase(), width:10, key: 'date'},
        { header:"N° mouvement", width:10, key: 'num_mvmt'},
        { header:"Patient", width:40, key: 'patient'},
        { header:"Montant total", width:40, key: 'montant'},
        { header:"département".toUpperCase(), width:12, key: 'dep'},
    ]

    sheet.columns = _head //😑😑

    _datas = []
    let tmp_d = {}

    for (var i = 0; i < list_avance.length; i++) {
        const e = list_avance[i]
        _datas.push({
            date:new Date(e.enc_date_validation).toLocaleString(),
            num_mvmt:(e.enc_is_hosp)?e.enc_num_hosp:`${ (new Date(e.enc_date_enreg)).getFullYear().toString().substr(2)}/${e.enc_num_mvmt.toString().padStart(5,0)}`,
            patient:(e.pat_nom_et_prenom)?e.pat_nom_et_prenom:e.enc_pat_externe,
            montant:separateNumber(e.encav_montant),
            dep:(e.dep_label)?e.dep_label:'-'
        })

    }


    sheet.addRows(_datas);
    let title_pdf = `suivi avance - caisse principale`.toUpperCase()
    title_pdf += `    Journée du : `
    title_pdf += `${new Date(date_1).toLocaleDateString()} au ${new Date(date_2).toLocaleDateString()}`


    sheet.insertRow(1, [title_pdf]);
    sheet.insertRow(2, ['']);

    // sheet.getRow(6).font = {bold:true,}
    sheet.getRow(3).font = {bold:true,size: 14,underline: true,}
    sheet.getRow(1).font = {bold:true,size: 16,underline: true,}


    const d = await workbook.xlsx.writeBuffer();
    return d
}


//ICI POUR L'EXPORTATION DES HOSPITALISATIONS
async function createCaisseMainHospPDF(dt){

    let {filters,list_enc,result} = dt
    let {date_1,date_2} = filters

    let {somme_result,nb_result} = result

    //Les débuts du PDF
    let year_cur = new Date().getFullYear()
    const separateNumber = (n)=>{
        return (n)?n.toLocaleString('fr-CA'):''
    }


    //Les options du PDF
    //Création de pdf amzay e 🤣😂, 
    let opt = {
        margin: 15, size: 'A4' ,
        layout:'landscape'
    }   
    let doc = new PDFDocument(opt)

    //les fonts
    doc.registerFont('fira', 'fonts/fira.ttf');
    doc.registerFont('fira_bold', 'fonts/fira-bold.ttf');
    doc.font("fira")

    //Ecriture du PDF
    doc.pipe(fs.createWriteStream(`./files/${dt.pdf_name}.pdf`))

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

    //Textes d'en haut du PDF
    let nom_hop = 'HOPITALY LOTERANA - ANDRANOMADIO'
    let title_pdf = 'suivi hospitalisation - caisse principale'.toUpperCase()
    let date_label = `Journée du : `
    let date_value = `${new Date(date_1).toLocaleDateString()} au ${new Date(date_2).toLocaleDateString()}`
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

    // DEBUT DES CALCULS
    doc.moveDown(5)
    doc.text('',opt.margin)

    let _head = []
    let _datas = []
    let table = {}


    //ICI création des tableaux des récapitulatifs
    _head = [
        { label:"Résultat Total", width:100, property: 'total',renderer: null ,headerAlign:"center",align:"right"},
        { label:"Montant Total",width:100, property: 'somme_total',renderer: null ,headerAlign:"center",align:"right"},
    ]

    _datas = [
        {total:separateNumber(nb_result),somme_total:separateNumber(somme_result)}
    ]

    table = opt_tab(_head,_datas,doc)
    await doc.table(table, { /* options */ });

    //Réinitialisation Data
    _datas = []

    let l_h = 9
    let p_w = 150,d_w = 150

    let w_a = ( doc.page.width - (p_w) - opt.margin * 2) / 7
    _head = [
        { label:"Date", width:w_a,  property: 'date',renderer: null ,headerAlign:"center",align:"left"},
        { label:"N°Mvmt", width:w_a,  property: 'num_mvmt',renderer: null ,headerAlign:"center",align:"left"},
        { label:"Patient", width:p_w,  property: 'patient',renderer: null ,headerAlign:"center",align:"left"},
        { label:"Prise en charge", width:w_a,  property: 'pec',renderer: null ,headerAlign:"center",align:"left"},
        { label:"Société", width:w_a,  property: 'soc',renderer: null ,headerAlign:"center",align:"left"},
        { label:"Montant ", width:w_a,  property: 'montant',renderer: null ,headerAlign:"center",align:"right"},
        { label:"Avance", width:w_a,  property: 'avance',renderer: null ,headerAlign:"center",align:"right"},
        { label:"Département", width:w_a,  property: 'dep',renderer: null ,headerAlign:"center",align:"left"},
    ]


    for (let i = 0; i < list_enc.length; i++) {
        const e = list_enc[i];
        _datas.push({
            date:new Date(e.enc_date_validation).toLocaleString(),
            num_mvmt:(e.enc_is_hosp)?e.enc_num_hosp:`${ (new Date(e.enc_date_enreg)).getFullYear().toString().substr(2)}/${e.enc_num_mvmt.toString().padStart(5,0)}`,
            patient:(e.pat_nom_et_prenom)?e.pat_nom_et_prenom:e.enc_pat_externe,
            montant:separateNumber(e.enc_montant),
            avance:(e.enc_total_avance)?separateNumber(e.enc_total_avance):'-',
            soc:(e.ent_label)?e.ent_label:'-',
            pec:(e.enc_is_pec)?'OUI':'NON',
            dep:(e.dep_label)?e.dep_label:'-'
        })
    }

    doc.moveDown(5)

    table = opt_tab(_head,_datas,doc)
    await doc.table(table, { /* options */ });

    doc.end()
}

//Fonction d'exportation en excel de suivi
async function createCaisseMainHospExcel(dt){
    let {filters,list_enc,result} = dt
    let {date_1,date_2} = filters

    let {nb_result} = result

    const separateNumber = (n)=>{
        return (n)?n.toLocaleString('fr-CA'):''
    }


    //initialisation de l'Excel
    const workbook = new ExcelJS.Workbook();

    //----------------------------------------
    workbook.creator = 'xd creator';
    workbook.lastModifiedBy = 'xd creator';
    workbook.lastPrinted = new Date(2016, 9, 27);
    workbook.properties.date1904 = true;
    workbook.calcProperties.fullCalcOnLoad = true;

    //-----------------------------------------
    workbook.views = [
        {
          x: 0, y: 0, width: 10000, height: 20000,
          firstSheet: 0, activeTab: 1, visibility: 'visible'
        }
      ]
    //________________________________________

    //Ajout du sheet
    const sheet = workbook.addWorksheet('Suivi Med_Services')

    //INSERTION DU HEADER
    let _head = []
    let _datas = []
    // --------

    _head = [
        { header:"Date".toUpperCase(), width:10, key: 'date'},
        { header:"N° mouvement", width:10, key: 'num_mvmt'},
        { header:"Patient", width:40, key: 'patient'},
        { header:"Prise en charge", width:14, key: 'pec'},
        { header:"Société", width:10, key: 'soc'},
        { header:"Avance", width:10, key: 'avance'},
        { header:"Montant total", width:10, key: 'montant'},
        { header:"département".toUpperCase(), width:12, key: 'dep'},
    ]

    sheet.columns = _head //😑😑

    _datas = []
    let tmp_d = {}

    for (var i = 0; i < list_enc.length; i++) {
        const e = list_enc[i]
        _datas.push({
            date:new Date(e.enc_date_validation).toLocaleString(),
            num_mvmt:(e.enc_is_hosp)?e.enc_num_hosp:`${ (new Date(e.enc_date_enreg)).getFullYear().toString().substr(2)}/${e.enc_num_mvmt.toString().padStart(5,0)}`,
            patient:(e.pat_nom_et_prenom)?e.pat_nom_et_prenom:e.enc_pat_externe,
            montant:separateNumber(e.enc_montant),
            avance:(e.enc_total_avance)?separateNumber(e.enc_total_avance):'-',
            soc:(e.ent_label)?e.ent_label:'-',
            pec:(e.enc_is_pec)?'OUI':'NON',
            dep:(e.dep_label)?e.dep_label:'-'
        })

    }


    sheet.addRows(_datas);
    let title_pdf = `suivi Hospitalisation - caisse principale`.toUpperCase()
    title_pdf += `    Journée du : `
    title_pdf += `${new Date(date_1).toLocaleDateString()} au ${new Date(date_2).toLocaleDateString()}`


    sheet.insertRow(1, [title_pdf]);
    sheet.insertRow(2, ['']);

    // sheet.getRow(6).font = {bold:true,}
    sheet.getRow(3).font = {bold:true,size: 14,underline: true,}
    sheet.getRow(1).font = {bold:true,size: 16,underline: true,}


    const d = await workbook.xlsx.writeBuffer();
    return d
}

//ICI POUR L'EXPORTATION DES AVANCES
async function createCaisseMainDispPDF(dt){

    let {filters,list_enc,result} = dt
    let {date_1,date_2} = filters

    let {somme_result,nb_result} = result

    //Les débuts du PDF
    let year_cur = new Date().getFullYear()
    const separateNumber = (n)=>{
        return (n)?n.toLocaleString('fr-CA'):''
    }


    //Les options du PDF
    //Création de pdf amzay e 🤣😂, 
    let opt = {
        margin: 15, size: 'A4' ,
        layout:'landscape'
    }   
    let doc = new PDFDocument(opt)

    //les fonts
    doc.registerFont('fira', 'fonts/fira.ttf');
    doc.registerFont('fira_bold', 'fonts/fira-bold.ttf');
    doc.font("fira")

    //Ecriture du PDF
    doc.pipe(fs.createWriteStream(`./files/${dt.pdf_name}.pdf`))

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

    //Textes d'en haut du PDF
    let nom_hop = 'HOPITALY LOTERANA - ANDRANOMADIO'
    let title_pdf = 'suivi dispensaire - caisse principale'.toUpperCase()
    let date_label = `Journée du : `
    let date_value = `${new Date(date_1).toLocaleDateString()} au ${new Date(date_2).toLocaleDateString()}`
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

    // DEBUT DES CALCULS
    doc.moveDown(5)
    doc.text('',opt.margin)

    let _head = []
    let _datas = []
    let table = {}


    //ICI création des tableaux des récapitulatifs
    _head = [
        { label:"Résultat Total", width:100, property: 'total',renderer: null ,headerAlign:"center",align:"right"},
        { label:"Montant Total",width:100, property: 'somme_total',renderer: null ,headerAlign:"center",align:"right"},
    ]

    _datas = [
        {total:separateNumber(nb_result),somme_total:separateNumber(somme_result)}
    ]

    table = opt_tab(_head,_datas,doc)
    await doc.table(table, { /* options */ });

    //Réinitialisation Data
    _datas = []

    let l_h = 9
    let p_w = 150,d_w = 150

    let w_a = ( doc.page.width - (p_w) - opt.margin * 2) / 7
    _head = [
        { label:"Date", width:w_a,  property: 'date',renderer: null ,headerAlign:"center",align:"left"},
        { label:"N°Mvmt", width:w_a,  property: 'num_mvmt',renderer: null ,headerAlign:"center",align:"left"},
        { label:"Patient", width:p_w,  property: 'patient',renderer: null ,headerAlign:"center",align:"left"},
        { label:"Prise en charge", width:w_a,  property: 'pec',renderer: null ,headerAlign:"center",align:"left"},
        { label:"Société", width:w_a,  property: 'soc',renderer: null ,headerAlign:"center",align:"left"},
        { label:"Montant ", width:w_a,  property: 'montant',renderer: null ,headerAlign:"center",align:"right"},
        { label:"Avance", width:w_a,  property: 'avance',renderer: null ,headerAlign:"center",align:"right"},
        { label:"Département", width:w_a,  property: 'dep',renderer: null ,headerAlign:"center",align:"left"},
    ]


    for (let i = 0; i < list_enc.length; i++) {
        const e = list_enc[i];
        _datas.push({
            date:new Date(e.enc_date_validation).toLocaleString(),
            num_mvmt:(e.enc_is_hosp)?e.enc_num_hosp:`${ (new Date(e.enc_date_enreg)).getFullYear().toString().substr(2)}/${e.enc_num_mvmt.toString().padStart(5,0)}`,
            patient:(e.pat_nom_et_prenom)?e.pat_nom_et_prenom:e.enc_pat_externe,
            montant:separateNumber(e.enc_montant),
            avance:(e.enc_total_avance)?separateNumber(e.enc_total_avance):'-',
            soc:(e.ent_label)?e.ent_label:'-',
            pec:(e.enc_is_pec)?'OUI':'NON',
            dep:(e.dep_label)?e.dep_label:'-'
        })
    }

    doc.moveDown(5)

    table = opt_tab(_head,_datas,doc)
    await doc.table(table, { /* options */ });

    doc.end()
}

//Fonction d'exportation en excel de suivi
async function createCaisseMainDispExcel(dt){
    let {filters,list_enc,result} = dt
    let {date_1,date_2} = filters

    let {nb_result} = result

    const separateNumber = (n)=>{
        return (n)?n.toLocaleString('fr-CA'):''
    }


    //initialisation de l'Excel
    const workbook = new ExcelJS.Workbook();

    //----------------------------------------
    workbook.creator = 'xd creator';
    workbook.lastModifiedBy = 'xd creator';
    workbook.lastPrinted = new Date(2016, 9, 27);
    workbook.properties.date1904 = true;
    workbook.calcProperties.fullCalcOnLoad = true;

    //-----------------------------------------
    workbook.views = [
        {
          x: 0, y: 0, width: 10000, height: 20000,
          firstSheet: 0, activeTab: 1, visibility: 'visible'
        }
      ]
    //________________________________________

    //Ajout du sheet
    const sheet = workbook.addWorksheet('Suivi Med_Services')

    //INSERTION DU HEADER
    let _head = []
    let _datas = []
    // --------

    _head = [
        { header:"Date".toUpperCase(), width:10, key: 'date'},
        { header:"N° mouvement", width:10, key: 'num_mvmt'},
        { header:"Patient", width:40, key: 'patient'},
        { header:"Prise en charge", width:14, key: 'pec'},
        { header:"Société", width:10, key: 'soc'},
        { header:"Avance", width:10, key: 'avance'},
        { header:"Montant total", width:10, key: 'montant'},
        { header:"département".toUpperCase(), width:12, key: 'dep'},
    ]

    sheet.columns = _head //😑😑

    _datas = []
    let tmp_d = {}

    for (var i = 0; i < list_enc.length; i++) {
        const e = list_enc[i]
        _datas.push({
            date:new Date(e.enc_date_validation).toLocaleString(),
            num_mvmt:(e.enc_is_hosp)?e.enc_num_hosp:`${ (new Date(e.enc_date_enreg)).getFullYear().toString().substr(2)}/${e.enc_num_mvmt.toString().padStart(5,0)}`,
            patient:(e.pat_nom_et_prenom)?e.pat_nom_et_prenom:e.enc_pat_externe,
            montant:separateNumber(e.enc_montant),
            avance:(e.enc_total_avance)?separateNumber(e.enc_total_avance):'-',
            soc:(e.ent_label)?e.ent_label:'-',
            pec:(e.enc_is_pec)?'OUI':'NON',
            dep:(e.dep_label)?e.dep_label:'-'
        })

    }


    sheet.addRows(_datas);
    let title_pdf = `suivi dispensaire - caisse principale`.toUpperCase()
    title_pdf += `    Journée du : `
    title_pdf += `${new Date(date_1).toLocaleDateString()} au ${new Date(date_2).toLocaleDateString()}`


    sheet.insertRow(1, [title_pdf]);
    sheet.insertRow(2, ['']);

    // sheet.getRow(6).font = {bold:true,}
    sheet.getRow(3).font = {bold:true,size: 14,underline: true,}
    sheet.getRow(1).font = {bold:true,size: 16,underline: true,}


    const d = await workbook.xlsx.writeBuffer();
    return d
}

async function createRapportVt(dt){
    let {enc,serv_p,dep,vt} = dt


    let year_cur = new Date().getFullYear()
    let year_enc = new Date(enc.enc_date_enreg).getFullYear()
    const separateNumber = (n)=>{
        return (n)?n.toLocaleString('fr-CA'):''
    }


    //Les options du PDF
    //Création de pdf amzay e 🤣😂, 
    let opt = {
        margin: 15, size: 'A4' ,
        layout:'landscape'
    }   
    let doc = new PDFDocument(opt)

    //les fonts
    doc.registerFont('fira', 'fonts/fira.ttf');
    doc.registerFont('fira_bold', 'fonts/fira-bold.ttf');
    doc.font("fira")

    //Ecriture du PDF
    doc.pipe(fs.createWriteStream(`./files/rapport-vt.pdf`))

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
    let title_pdf = 'RAPPPORT DE VERSEMENT JOURNALIER'
    let date_label = `Journée du : `
    let date_value = (vt.date_2)?`${new Date(vt.date_1).toLocaleDateString()} au ${new Date(vt.date_2).toLocaleDateString()}`:new Date(vt.vt_date).toLocaleDateString()

    let total_esp_l = 'TOTAL ESP'
    let fd_caisse = 'Fond de Caisse'
    let rec_esp = 'RECETTE ESPECE'
    let vers_chq = 'VERSEMENT CHQ'
    let total_vers = 'TOTAL VERSEMENT'

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

    let _head = []
    let _datas = []
    let table = {}

    // ------ DEBUT INSERTION DE TABLEAU DE BILLETAGE
    //
    let sz_nbr = 40,sz_billet = 50,sz_montant = 70
    _head = [
        { label:"Nbr", width:sz_nbr, property: 'nb',renderer: null ,headerAlign:"center",align:"right"},
        { label:"Billets", width:sz_billet, property: 'billet',renderer: null ,headerAlign:"center",align:"right"},
        { label:"Montant", width:sz_montant, property: 'montant',renderer: null ,headerAlign:"center",align:"right"},
    ]

    let billetage_w = 140

    let billetage = JSON.parse(vt.vt_det)
    let list_pc = Object.keys(billetage).reverse().map(x => parseInt(x) )

    for (let i = 0; i < list_pc.length; i++) {
        const p = list_pc[i];
        _datas.push({nb:billetage[p]?billetage[p].toLocaleString('fr-CA'):'',billet:p.toLocaleString('fr-CA'),
        montant:(parseInt(p) * parseInt(billetage[p]))?(parseInt(p) * parseInt(billetage[p])).toLocaleString('fr-CA'):''})
    }

    doc.moveDown(3)
    let y_infos = doc.y
    doc.text('',opt.margin)
    table = opt_tab(_head,_datas,doc)
    await doc.table(table, { /* options */ });

    // écriture esp
    y_ttl = doc.y
    doc.text(total_esp_l)
    let total_esp_v = vt.vt_total.toLocaleString('fr-CA')
    drawTextCadre(total_esp_v,(sz_nbr+sz_billet+sz_montant) + opt.margin - num_w - 5,y_ttl,doc)

    //écriture des infos au milieu
    let x_infos_mid1 = opt.margin + billetage_w + 40
    let x_infos_mid2 = x_infos_mid1 + doc.widthOfString(total_vers) + 10

    //Fond de caisse
    doc.text(fd_caisse,x_infos_mid1,y_infos)
    drawTextCadre(vt.vt_remise.toLocaleString('fr-CA'),x_infos_mid2,y_infos,doc)

    //Recette espèce
    doc.moveDown()
    y_infos = doc.y
    doc.text(rec_esp,x_infos_mid1,y_infos)
    drawTextCadre(vt.recette_esp.toLocaleString('fr-CA'),x_infos_mid2,y_infos,doc)

    //Recette chèque
    doc.moveDown()
    y_infos = doc.y
    doc.text(vers_chq,x_infos_mid1,y_infos)
    drawTextCadre((vt.recette_chq)?vt.recette_chq.toLocaleString('fr-CA'):' ',x_infos_mid2,y_infos,doc)
    
    //Total versement
    doc.moveDown()
    y_infos = doc.y
    doc.text(total_vers,x_infos_mid1,y_infos)
    drawTextCadre((vt.recette_chq)?(vt.recette_chq + vt.recette_esp).toLocaleString('fr-CA'):(vt.recette_esp).toLocaleString('fr-CA'),x_infos_mid2,y_infos,doc)

    //Montant versé ( en toute lettre )
    doc.moveDown(5)
    y_infos = doc.y
    doc.text('Montant versé (en toute lettre) :',x_infos_mid1,y_infos)
    doc.moveDown()
    doc.lineWidth(1)
    doc.lineJoin().rect(x_infos_mid1,doc.y,200,35).stroke()
    let vers_lettre = NumberToLetter((vt.recette_chq)?(vt.recette_chq + vt.recette_esp): (vt.recette_esp)).toUpperCase()
    doc.font('fira_bold')
    doc.text(vers_lettre,x_infos_mid1 + 5,doc.y+5,{width:190})

    //OBSERVATION
    //y_infos = doc.y
    doc.font('fira')
    doc.text('OBSERVATION',x_infos_mid1 + 210,y_infos)
    doc.moveDown()
    doc.lineWidth(1)
    doc.lineJoin().rect(doc.x,doc.y,150,35).stroke()
    
    // ------ DEBUT TABLEAU REPARTITION PAR DEPARTEMENT -------- 
    doc.text('',opt.margin,y_ttl)
    doc.moveDown(5)

    doc.font('fira')
    doc.fontSize(8)
    doc.text('Répartition par département',opt.margin)

    doc.moveDown()

    //Gestion de taille des colonnes
    let t_desc = 100
    let t_total = 60 //colonne de fin

    let t_dep = (doc.page.width - (opt.margin * 2) - (t_desc + t_total))/dep.length

    _head = [
        { label:"DESIGNATION", width:t_desc, property: 'desc',renderer: null ,headerAlign:"center"},
    ]

    for (var i = 0; i < dep.length; i++) {
        const de = dep[i]
        _head.push({ label:de.dep_label, width:t_dep, property: de.dep_id,renderer: null ,headerAlign:"center",align:"right"},)
    }
    //Un autre head aussi pour le total
    _head.push({ label:"TOTAL", width:t_total, property: 'total',renderer: null ,headerAlign:"center",align:"right"},)

    _datas = []
    let tmp_d = {}
    let ttl = 0
    for(var i= 0;i <serv_p.length;i++){
        const sp = serv_p[i]
        tmp_d = {}
        tmp_d['desc'] = sp.service_label
        tmp_d['total'] = 0
        for (var j = 0; j < dep.length; j++) {
            const de = dep[j]
            tmp_d[de.dep_id] = (de[sp.service_id])?de[sp.service_id].toLocaleString('fr-CA'):'-'
            tmp_d['total'] += (de[sp.service_id])?de[sp.service_id]:0
            dep[j]['total_brut'] = (dep[j]['total_brut'])?dep[j]['total_brut'] + (dep[j][sp.service_id] || 0 ):(dep[j][sp.service_id] || 0 )
        }
        tmp_d['total'] = (tmp_d['total'])?tmp_d['total'].toLocaleString('fr-CA'):'-'
        _datas.push(tmp_d)
    }
    //Les

    //Insertion pour la totale brut
    tmp_d = {}
    tmp_d['desc'] = 'TOTAL BRUT ...'
    tmp_d['total'] = 0
    for (let i = 0; i < dep.length; i++) {
        const de = dep[i];
        tmp_d[de.dep_id] =  (de['total_brut'])?de['total_brut'].toLocaleString('fr-CA'):'-'
        tmp_d['total'] += (de['total_brut'])?de['total_brut']:0
    }
    tmp_d['total'] = (tmp_d['total'])?tmp_d['total'].toLocaleString('fr-CA'):'-'
    _datas.push(tmp_d)
    //fin inserrtion total brut

    //Insertion avance
    tmp_d = {}
    tmp_d['desc'] = 'AVANCE (-)...'
    tmp_d['total'] = 0
    for (let i = 0; i < dep.length; i++) {
        const de = dep[i];
        tmp_d[de.dep_id] =  (de['avance'])?'-'+de['avance'].toLocaleString('fr-CA'):'-'
        tmp_d['total'] += (de['avance'])?de['avance']:0
    }
    tmp_d['total'] = (tmp_d['total'])?'-'+tmp_d['total'].toLocaleString('fr-CA'):'-'
    _datas.push(tmp_d)
    //fin insertion avance
    //Insertion avance
    tmp_d = {}
    tmp_d['desc'] = 'AVANCE (+)...'
    tmp_d['total'] = 0
    for (let i = 0; i < dep.length; i++) {
        const de = dep[i];
        tmp_d[de.dep_id] =  (de['avance_plus'])?'+'+de['avance_plus'].toLocaleString('fr-CA'):'-'
        tmp_d['total'] += (de['avance_plus'])?de['avance_plus']:0
    }
    tmp_d['total'] = (tmp_d['total'])?'+'+tmp_d['total'].toLocaleString('fr-CA'):'-'
    _datas.push(tmp_d)
    //fin insertion avance

    //Insertion total net
    tmp_d = {}
    tmp_d['desc'] = 'TOTAL NET ...'
    tmp_d['total'] = 0
    for (let i = 0; i < dep.length; i++) {
        const de = dep[i];
        tmp_d[de.dep_id] =  (de['total_net'])?de['total_net'].toLocaleString('fr-CA'):'-'
        tmp_d['total'] += (de['total_net'])?de['total_net']:0
    }
    tmp_d['total'] = (tmp_d['total'])?tmp_d['total'].toLocaleString('fr-CA'):'-'
    _datas.push(tmp_d)
    //fin insertion total net

    //Insertion espèce
    tmp_d = {}
    tmp_d['desc'] = 'Dont ESPECE ...'
    tmp_d['total'] = 0
    for (let i = 0; i < dep.length; i++) {
        const de = dep[i];
        tmp_d[de.dep_id] =  (de['esp'])?de['esp'].toLocaleString('fr-CA'):'-'
        tmp_d['total'] += (de['esp'])?de['esp']:0
    }
    tmp_d['total'] = (tmp_d['total'])?tmp_d['total'].toLocaleString('fr-CA'):'-'
    _datas.push(tmp_d)
    //fin insertion espèce

    //Insertion chèque
    tmp_d = {}
    tmp_d['desc'] = 'Dont CHEQUE ...'
    tmp_d['total'] = 0
    for (let i = 0; i < dep.length; i++) {
        const de = dep[i];
        tmp_d[de.dep_id] =  (de['chq'])?de['chq'].toLocaleString('fr-CA'):'-'
        tmp_d['total'] += (de['chq'])?de['chq']:0
    }
    tmp_d['total'] = (tmp_d['total'])?tmp_d['total'].toLocaleString('fr-CA'):'-'
    _datas.push(tmp_d)
    //fin insertion chèque


    table = opt_tab(_head,_datas,doc)

    await doc.table(table, { /* options */ });

    doc.end()
}

async function createDetFactPDF(list_serv,pdf_name,ee){


    let enc = ee[0]
    enc.enc_montant = ee.reduce((o,c)=> o + parseInt(c.enc_montant),0)

    let year_cur = new Date().getFullYear()
    let year_enc = new Date(enc.enc_date_enreg).getFullYear()
    const separateNumber = (n)=>{
        return (n)?n.toLocaleString('fr-CA'):''
    }




    //Les options du PDF
    //Création de pdf amzay e , 
    let opt = {
        margin: 15, size: 'A4' ,
    }   
    let doc = new PDFDocument(opt)

    //les fonts
    doc.registerFont('fira', 'fonts/fira.ttf');
    doc.registerFont('fira_bold', 'fonts/fira-bold.ttf');
    doc.font("fira")

    //Ecriture du PDF
    doc.pipe(fs.createWriteStream(`./files/${pdf_name}.pdf`))

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
    doc.fontSize(14)
    let y_line_title = doc.x
    doc.text('HOPITALY LOTERANA')
    doc.fontSize(10)
    doc.text('Andranomadio - Antsirabe',{underline:true})
    doc.moveDown()
    doc.text('Stat n ° 85113 12 200 60 00614')
    doc.text('NIF n ° 20000038126')


    //Insertion d'image ici
    let w_im = 70
    doc.image('statics/icon.png',doc.page.width - w_im - opt.margin,opt.margin + 50,{width:w_im})


    
    // doc.lineWidth(1)
    // doc.lineJoin('miter')
    //     .rect(50, 100, 50, 50)
    //     .stroke();


    //--------- Affichage du nom du patient
    doc.moveDown()

    let y_line_pat = doc.y
    doc.font('fira_bold')
    doc.text('Patient :',{underline:true})
    doc.font('fira')
    doc.text(((enc.enc_is_externe)?enc.enc_pat_externe:enc.pat_nom_et_prenom).toUpperCase())

    //Insertion du care u titre à droite
    let title_1 = 'ORDONNANCE ET FACTURE'
    let w_cadre_title = doc.page.width - 300 - 15
    let h_cadre_title = doc.heightOfString(title_1) +10
    doc.lineJoin('miter')
    .rect(300, y_line_title, w_cadre_title,h_cadre_title)
    .stroke();
    doc.text(title_1,300+(w_cadre_title/4),y_line_title+5)

    //Cadre numéro et date
    let num = (enc.enc_num_mvmt)?`N° ${year_enc.toString().substr(2)}/${enc.enc_num_mvmt.toString().padStart(5,0)}`:'-'
    let date = (new Date()).toLocaleDateString()
    doc.lineJoin('miter')
    .rect(300, y_line_title + h_cadre_title, w_cadre_title /2,doc.heightOfString(num) + 10)
    .stroke();
    doc.text(num,300+5,y_line_title + h_cadre_title+5)
    doc.lineJoin('miter')
    .rect(300+(w_cadre_title /2), y_line_title + h_cadre_title, w_cadre_title /2,doc.heightOfString(num) + 10)
    .stroke();
    doc.text(date,300+(w_cadre_title/2+5),y_line_title + h_cadre_title+5)

    //---------- Affichage de la société
    doc.font('fira_bold')
    doc.text('',300,y_line_pat,{underline:true})
    doc.font('fira')
    doc.text(``)


    doc.moveDown(2)
    let y_table = doc.y + 15
    doc.text('',15,y_table)

    //création des tableaux
    let _head = [
        { label:"DESIGNATION", width:435, property: 'desc',renderer: null ,headerAlign:"center"},
        { label:"QTE", property: 'qt',width:50, renderer: null ,align: "right",headerAlign:"center"},
        { label:"MONTANT", property: 'mnt',width:80,renderer: null,align: "right" ,headerAlign:"center" },
    ]

    //les datas
    let _datas = [],cur_d = {}

    //Boucle sur le facture
    for (let i = 0; i < list_serv.length; i++) {
        const ls = list_serv[i]

        if(!ls.child) continue

        _datas.push({desc:`----- ${ls.service_label} ----`,qt:'',mnt:''})
        for(let j = 0;j < ls.child.length;j++){
            const ch = ls.child[j]
            _datas.push({desc:`    ${ch.service_label}${(ch.encp_id)?' - (prescri)':''}`,qt:ch.encserv_qt,mnt:separateNumber(ch.encserv_montant)})
        }
    }

    _datas.push({desc:'TOTAL',qt:'',mnt:separateNumber(enc.enc_montant)})

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
                horizontal: { disabled: true, width: 0.5, opacity: 0 },
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

    doc.moveDown(2)
    doc.font('fira')

    let somme_t = 'Sois la somme de :'
    let y_pos_cur = doc.y
    doc.text(somme_t,{underline:true})
    let somme_label = NumberToLetter(parseInt(enc.enc_montant))
    doc.text(somme_label,doc.widthOfString(somme_t)+opt.margin+10,y_pos_cur)

    //Ajout des trucs pour la signature

    doc.font('fira_bold')

    doc.moveDown(2)
    let y_sign = doc.y
    // atao 70 % ny largeur totale ny largeur misy anle signature
    let w_sign = doc.page.width * 0.7

    let x_begin = doc.page.width /2 - w_sign/2

    let t = ['Le Medecin Chef,',`L'Employé,`,`La Société,`]

    doc.text(t[0],x_begin,y_sign,{underline:true})
    /*doc.text(t[1], doc.page.width /2 - doc.widthOfString(t[1])/2 ,y_sign,{underline:true})
    doc.text(t[2], (doc.page.width /2 + w_sign/2) - doc.widthOfString(t[1]) ,y_sign,{underline:true})*/

    doc.end();
}


//Fonction pour la génération de PDF
async function createFactPDF(fact,list_serv,mode,encav_last,ext){

    let year_cur = new Date().getFullYear()
    let year_enc = new Date(fact.enc_date_enreg).getFullYear()
    const separateNumber = (n)=>{
        return (n)?n.toLocaleString('fr-CA'):''
    }

    let is_validate = (parseInt(fact.enc_validate))?true:false

    let date_fact = (encav_last)?new Date(encav_last.encav_date_validation):new Date()
    date_fact = (is_validate)?new Date(fact.enc_date_validation):date_fact

    let f_date = (ext)?ext.date_1.toLocaleDateString():date_fact.toLocaleDateString()
    let f_time = (ext)?ext.date_2.toLocaleDateString():date_fact.toLocaleTimeString().substr(0,5)

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

    //-----------------------
    //Filigrane
    let im = {
        w:350,
        h:doc.page.width/4
    }
    if(fact.enc_is_hosp && !fact.enc_validate){
        doc.save()
        doc.rotate(-45,{origin:[0,0]})
        doc.image('statics/filigrane-avance.png',0,400,{width:im.w})
        doc.restore()

        doc.save()
        doc.rotate(-45,{origin:[0,300]})
        doc.image('statics/filigrane-avance.png',0,300,{width:im.w})
        doc.restore()
    }
    //--------------------

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
    let t_caisse =(ext)?'FACTURE CUMULATIVE':(fact.enc_is_hosp)?`FACTURE ${(fact.enc_validate)?'DEFINITIVE':'AVANCE'} - N° ${fact.enc_num_hosp}`:`FACTURE CAISSE - N° ${year_enc.toString().substr(2)}/${fact.enc_num_mvmt.toString().padStart(5,0)}`
        t_caisse = t_caisse.trim()
    let t_date = `${f_date} -- ${f_time}`
    let t_caissier = `CAISSIER : ${ (fact.util_label)?fact.util_label:'-' }`
    let t_pat_code = `Patient: ${(fact.pat_numero)?fact.pat_numero:(fact.enc_is_externe)?'EXTERNE':'-'}`
    let pat_name = (fact.pat_nom_et_prenom)?fact.pat_nom_et_prenom:(fact.enc_is_externe)?fact.enc_pat_externe:'-'
    let t_pat_adresse = (fact.pat_adresse)?fact.pat_adresse:'-'
    let t_somme = 'Soit la somme de:'
    let t_mode = 'Paiement:'
    let t_avance = 'Avance:'
    let t_paiement_final = (fact.enc_to_caisse)?'Paiement final:':'Reste à payer:'
    
    let t_somme_m = NumberToLetter(parseInt((fact.enc_is_hosp)?(fact.enc_validate?fact.enc_reste_paie:(encav_last)?encav_last.encav_montant:fact.enc_reste_paie):fact.enc_montant).toString()) 
    let t_avance_s = (fact.enc_total_avance)?parseInt(fact.enc_total_avance).toLocaleString('fr-CA'):''


    let t_paiement_final_s = (fact.enc_total_avance)?(parseInt(fact.enc_reste_paie)).toLocaleString('fr-CA'):''
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

    // console.log(`Taille Caisse 1 : ${doc.heightOfString(t_caisse)}`)

    let taille_caisse = doc.heightOfString(t_caisse)
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
    let t_dep = `DEP : ${(fact.dep_label)?fact.dep_label:'-'}`
    doc.text(t_dep,(w_cadre/2 - doc.widthOfString(t_dep)/2) + x_begin,y_cur+10)
    // doc.moveDown()
    doc.text(t_pat_code,(w_cadre/2 - doc.widthOfString(t_pat_code)/2) + x_begin)
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
        desc:'TOTAL ' + ((fact.enc_percent_tarif && fact.enc_percent_tarif != 100)?` : ${ separateNumber(fact.enc_percent_tarif * parseInt(fact.enc_montant) / 100) } (${fact.enc_percent_tarif})%`:''),
        montant:separateNumber(fact.enc_montant),
    })


    // Table du truc
    //xx5
    table = opt_tab(_head,_datas,doc)
    await doc.table(table, { /* options */ });

    //Bas de page avec le montant en lettre
    doc.moveDown()
    y_cur = doc.y

    //ici quelques modification de T-SOMME
    // t_somme = 
    doc.text(t_somme,{underline:true})
    doc.font("fira")
    doc.text(t_somme_m,doc.widthOfString(t_somme)+x_begin+5,y_cur,{width:w_cadre - doc.widthOfString(t_somme) -5 })

    if(!fact.enc_total_avance){
        doc.moveDown()
        y_cur = doc.y
        doc.font("fira_bold")
        doc.text(t_mode,x_begin,y_cur,{underline:true})
        doc.font("fira")
        doc.text((mode)?mode.label:'Espèce',doc.widthOfString(t_mode)+x_begin+5,y_cur,{width:w_cadre - doc.widthOfString(t_mode) -5 })
    }else{
        //Insertion avance


        doc.moveDown()

        t_avance = 'Avance Total'
        y_cur = doc.y

        let t_avance_ac = 'Avance'
        let t_avance_ac_s = separateNumber(encav_last?encav_last.encav_montant:0)

        hxx = 0

        if(fact.enc_validate){
            doc.font("fira_bold")
            doc.text(t_avance,x_begin,y_cur,{underline:true})
            doc.font("fira")
            doc.text(t_avance_s,hxx + doc.widthOfString(t_avance)+x_begin+5,y_cur,{width:w_cadre - doc.widthOfString(t_avance) -5 })

            hxx += doc.widthOfString(`${t_avance} ${t_avance_s}`)+x_begin+5
        }else{
            doc.font("fira_bold")
            doc.text(t_avance_ac,x_begin,y_cur,{underline:true})
            doc.font("fira")
            doc.text(t_avance_ac_s,doc.widthOfString(t_avance_ac)+x_begin+5,y_cur,{width:w_cadre - doc.widthOfString(t_avance_ac) -5 })

            hxx += doc.widthOfString(`${t_avance_ac} ${t_avance_ac_s}`)+x_begin+5
        }   
        
        
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
    h_cadre = taille_caisse+(margin_text_in_cadre * 2) 

    // console.log(`Taille Caisse 2 : ${doc.heightOfString(t_caisse)}`)
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
    doc.text(t_dep,(w_cadre/2 - doc.widthOfString(t_dep)/2) + x_begin,y_cur+10)
    // doc.moveDown()
    doc.text(t_pat_code,(w_cadre/2 - doc.widthOfString(t_pat_code)/2) + x_begin)
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

    if(!fact.enc_total_avance){
        doc.moveDown()
        y_cur = doc.y
        doc.font("fira_bold")
        doc.text(t_mode,x_begin,y_cur,{underline:true})
        doc.font("fira")
        doc.text((mode)?mode.label:'Espèce',doc.widthOfString(t_mode)+x_begin+5,y_cur,{width:w_cadre - doc.widthOfString(t_mode) -5 })
    }else{
        //Insertion avance
        doc.moveDown()

        t_avance = 'Avance Total'
        y_cur = doc.y

        let t_avance_ac = 'Avance'
        let t_avance_ac_s = separateNumber(encav_last?encav_last.encav_montant:0)

        hxx = 0

        if(fact.enc_validate){
            doc.font("fira_bold")
            doc.text(t_avance,x_begin,y_cur,{underline:true})
            doc.font("fira")
            doc.text(t_avance_s,hxx + doc.widthOfString(t_avance)+x_begin+5,y_cur,{width:w_cadre - doc.widthOfString(t_avance) -5 })

            hxx += doc.widthOfString(`${t_avance} ${t_avance_s}`)+x_begin+5
        }else{
            doc.font("fira_bold")
            doc.text(t_avance_ac,x_begin,y_cur,{underline:true})
            doc.font("fira")
            doc.text(t_avance_ac_s,doc.widthOfString(t_avance_ac)+x_begin+5,y_cur,{width:w_cadre - doc.widthOfString(t_avance_ac) -5 })

            hxx += doc.widthOfString(`${t_avance_ac} ${t_avance_ac_s}`)+x_begin+5
        }   
        
        
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
