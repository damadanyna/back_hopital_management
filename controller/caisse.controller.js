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
    enc_paie_final:{front_name:'enc_paie_final',fac:true,},
    enc_date_sortie:{front_name:'enc_date_sortie',fac:true},
    enc_result_final:{front_name:'enc_result_final',fac:true},
    enc_reste_paie:{front_name:'enc_reste_paie',fac:true},
    enc_to_caisse:{front_name:'enc_to_caisse',fac:true},
    enc_percent_tarif:{front_name:'enc_percent_tarif',fac:true},
    enc_is_externe:{front_name:'enc_is_externe',fac:true},
    enc_pat_externe:{front_name:'enc_pat_externe',fac:true}
    
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
                header: { disabled: false, width: 1, opacity: 0.5 },
                horizontal: { disabled: false, width: 0.5, opacity: 0 },
                vertical: { disabled: false, width: 0.5, opacity: 0.5 },
            },
            prepareHeader: () => {
                doc.font("fira_bold").fontSize(5)
                doc.fillAndStroke('#575a61')
            },
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                doc.font("fira").fontSize(7)
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

            //Eto koa mbola misy ny insertion an'ireny avance izay miditra ao ireny,
            /*if(encav && encav.length > 0){
                datas = []
                sql = `insert into enc_avance (encav_util_id,encav_enc_id,encav_montant,encav_date) values ?;`

                for (let i = 0; i < encav.length; i++) {
                    const e = encav[i];
                    datas.push([e.encav_util_id,_e.insertId,e.encav_montant,new Date(e.encav_date)])
                }
                await D.exec_params(sql,[datas])
            }*/

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

            let list_dep = await D.exec('select * from departement')
            

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
            let {enc,encserv,encav,user_id} = req.body
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

            if(etmp.enc_validate){
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
            await D.del('encaissement',{enc_id})
            await D.del('enc_avance',{encav_enc_id:enc_id})
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

            //console.log(util_id)
            //si la variable encav_id existe dans le query
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

            //récupération de la facture
            let fact = (await D.exec_params(`select * from encaissement
            left join patient on pat_id = enc_pat_id
            left join departement on dep_id = enc_dep_id
            left join utilisateur on enc_util_validate_id = util_id
            where enc_id = ?`,[enc_id]))[0]

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
            await createFactPDF(fact,list_serv,mode)


            //Eto création an'ilay Entité côté mouvement raha ohatra ka nisy médicaments ny zavatra novidian'ilay 
            // Patient
            if(fact_med.length > 0){
                //jerena alony raha efa misy ilay relation
                let rl = await D.exec_params('select * from encmvmt where em_enc_id = ?',[enc_id])
                //Enregistrement anle Raha
                if(rl.length <= 0){
                    await D.set('encmvmt',{
                        em_enc_id:enc_id,
                    })
                }
            }

            return res.send({status:true,message:"Encaissement effectuée"})
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

    //Création du PDF du détails encaissement eto
    static async setPDFDetEncaissement(req,res){
        try {
            /*
                Tena ho lava be ty 😂😂😂,
            */

            let {enc_id} = req.params

            //On va d'abord récupérer la liste des services parents
            let serv_p = await D.exec_params(`select * from service where service_parent_id is null`)

            //ensuite la liste des services dans enc_service
            let enc_serv = await D.exec_params(`select * from enc_serv
            left join service on service_id = encserv_serv_id
            where encserv_enc_id = ? and encserv_is_product = 0`,[enc_id])

            //puis la liste des produits dans encser
            let enc_med = await D.exec_params(`select *,art_code as service_code,art_label as service_label from enc_serv
            left join article on art_id = encserv_serv_id
            where encserv_enc_id = ? and encserv_is_product = 1`,[enc_id])

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
            let enc = (await D.exec_params(`select * from encaissement
            left join patient on pat_id = enc_pat_id
            where enc_id = ?`,[enc_id]))[0]
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

            vt.vt_remise = Math.abs(parseInt(vt.vt_total) - (vt.recette_chq + vt.recette_esp))

            // console.log(`vt_remise : ${vt.vt_remise}`);
            // console.log(`recette_avance : ${vt.recette_avance}`);
            // console.log(`recette_esp : ${vt.recette_esp}`);
            // console.log(`vt_total : ${vt.vt_total}`);

            //Liste des département
            //Qlques Gestions
            let dep = await D.exec('select * from departement')
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
    let date_value = new Date(vt.vt_date).toLocaleDateString()

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

async function createDetFactPDF(list_serv,pdf_name,enc){
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
    doc.text(enc.pat_nom_et_prenom.toUpperCase())

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
            _datas.push({desc:`    ${ch.service_label}`,qt:ch.encserv_qt,mnt:separateNumber(ch.encserv_montant)})
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
async function createFactPDF(fact,list_serv,mode){

    let year_cur = new Date().getFullYear()
    let year_enc = new Date(fact.enc_date_enreg).getFullYear()
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

    //-----------------------
    //Filigrane
    let im = {
        w:700,
        h:400
    }
    if(fact.enc_is_hosp && !fact.enc_validate){
        doc.image('statics/filigrane-fact.png',0,doc.page.height/2 - im.h/2,{width:doc.page.width})
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
    let t_caisse = (fact.enc_is_hosp)?`FACTURE ${(fact.enc_validate)?'DEFINITIVE':'PROVISOIRE'} - N° ${fact.enc_num_hosp}`:`FACTURE CAISSE - N° ${year_enc.toString().substr(2)}/${fact.enc_num_mvmt.toString().padStart(5,0)}`
    let t_date = `${f_date} -- ${f_time}`
    let t_caissier = `CAISSIER : ${ (fact.util_label)?fact.util_label:'-' }`
    let t_pat_code = `Patient: ${(fact.pat_numero)?fact.pat_numero:(fact.enc_is_externe)?'EXTERNE':'-'}`
    let pat_name = (fact.pat_nom_et_prenom)?fact.pat_nom_et_prenom:(fact.enc_is_externe)?fact.enc_pat_externe:'-'
    let t_pat_adresse = (fact.pat_adresse)?fact.pat_adresse:'-'
    let t_somme = 'Soit la somme de:'
    let t_mode = 'Paiement:'
    let t_avance = 'Avance:'
    let t_paiement_final = (fact.enc_to_caisse)?'Paiement final:':'Reste à payer:'
    let t_somme_m = NumberToLetter((fact.enc_percent_tarif)?(fact.enc_percent_tarif * parseInt(fact.enc_montant) / 100):parseInt(fact.enc_montant).toString()) 
    let t_avance_s = (fact.enc_total_avance)?parseInt(fact.enc_total_avance).toLocaleString('fr-CA'):''
    let t_paiement_final_s = (fact.enc_total_avance)?(parseInt(fact.enc_reste_paie)).toLocaleString('fr-CA'):''
    t_somme_m = t_somme_m.charAt(0).toUpperCase() + t_somme_m.slice(1) + ' Ariary' + ((fact.enc_percent_tarif && fact.enc_percent_tarif != 100)?`  (${fact.enc_percent_tarif})%`:'')

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
    let t_dep = `DEP : ${(fact.dep_label)?fact.dep_label:'-'}`
    doc.text(t_dep,(w_cadre/2 - doc.widthOfString(t_dep)/2) + x_begin,y_cur+10)
    doc.moveDown()
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

    if(!fact.enc_total_avance){
        doc.moveDown()
        y_cur = doc.y
        doc.font("fira_bold")
        doc.text(t_mode,x_begin,y_cur,{underline:true})
        doc.font("fira")
        doc.text((mode)?mode.label:'Provisoire',doc.widthOfString(t_mode)+x_begin+5,y_cur,{width:w_cadre - doc.widthOfString(t_mode) -5 })
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
    doc.text(t_dep,(w_cadre/2 - doc.widthOfString(t_dep)/2) + x_begin,y_cur+10)
    doc.moveDown()
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
        doc.text((mode)?mode.label:'Provisoire',doc.widthOfString(t_mode)+x_begin+5,y_cur,{width:w_cadre - doc.widthOfString(t_mode) -5 })
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
