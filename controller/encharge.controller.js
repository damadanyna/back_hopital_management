let D = require('../models/data')
let U = require('../utils/utils')
let PDFDocument = require("pdfkit-table");
let fs = require('fs')
const { NumberToLetter } = require("convertir-nombre-lettre");

class Encharge{
    static async register(req,res){ 
        let _d = req.body; 
        let {user_id} = _d

        let encharge_data={ 
            encharge_pat_id:{front_name:'encharge_pat_id',fac:true}, 
            encharge_tarif_id:{front_name:'encharge_tarif_id',fac:true}, 
            encharge_seq:{front_name:'encharge_seq',fac:true}, 
            encharge_date_entre :{front_name:'encharge_date_entre',fac:true,format:(a)=> new Date(a)},
            encharge_date_sortie :{front_name:'encharge_date_sortie',fac:true,format:(a)=> new Date(a)},
            encharge_ent_id:{front_name:'encharge_ent_id',fac:true }, 
            encharge_util_id:{front_name:'encharge_util_id',fac:true },
            encharge_ent_payeur:{front_name:'encharge_ent_payeur',fac:true },  
            encharge_is_stomato:{front_name:'encharge_is_stomato',fac:true },  
            encharge_stomato_pat:{front_name:'encharge_stomato_pat',fac:true },  
            //encharge_stomato_pat_num
            encharge_stomato_pat_num:{front_name:'encharge_stomato_pat_num',fac:true },  
        };

        //Vérification du encharge
        const _pd_keys = Object.keys(encharge_data)
        let _tmp = {}
        let _list_error = []
        
        try {
            _pd_keys.forEach((v,i)=>{
                _tmp = encharge_data[v]
                if(!_tmp.fac && !_d[_tmp.front_name]){
                    _list_error.push({code:_tmp.front_name})
                }
            })
            
            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
    
            //Si la vérification c'est bien passé, 
            // on passe à l'insertion du encharge
            let _data = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = encharge_data[v]
    
                _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                _data[v] = _d[_tmp.front_name]
            })
            
            //l'objet encharge est rempli maintenant
            // on l'insert dans la base de donnée
            

            //Insertion de util iD
            //On va faire l'insertion depuis le frontend
            // _data.encharge_util_id = req.user.util_id

            let _pec = await D.set('encharge',_data)

            //Ici récupération de fact_code_patient si y en a pour le patient
            let last_pec = await D.exec_params(`select * from encharge 
            left join facture on encharge_id = fact_encharge_id
            where encharge_pat_id = ? and encharge_id <> ? order by encharge_id desc limit 1`,[_data.encharge_pat_id,_pec.insertId])
            last_pec = (last_pec.length > 0)?last_pec[0]:null
            let fact_code_patient = (last_pec)?last_pec.fact_code_patient:null

            //Création de la facture après la création de la prise en charge
            await D.set('facture',{
                fact_encharge_id:_pec.insertId,
                fact_code_patient
            })

            //Insertion historique utilisateur
            let hist = {
                uh_user_id:user_id,
                uh_code:req.uh.add_pec.k,
                uh_description:req.uh.add_pec.l,
                uh_module:'Prise en charge',
                uh_extras:JSON.stringify({
                    datas:{
                        pec:(await D.exec_params(`select * from encharge
                        left join patient on pat_id = encharge_pat_id
                        where encharge_id = ?`,[_pec.insertId]))[0]
                    }
                })
            }
            await D.set('user_historic',hist)
            //Ici tous les fonctions sur l'enregistrement d'un encharge
            return res.send({status:true,message:"encharge bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }


    }

    static async delete(req,res){

        try {   
            let {encharge_id} = req.params
            let {user_id} = req.query

            //Insertion historique utilisateur
            let hist = {
                uh_user_id:user_id,
                uh_code:req.uh.del_pec.k,
                uh_description:req.uh.del_pec.l,
                uh_module:'Prise en charge',
                uh_extras:JSON.stringify({
                    datas:{
                        pec:(await D.exec_params(`select * from encharge
                        left join patient on pat_id = encharge_pat_id
                        where encharge_id = ?`,[encharge_id]))[0]
                    }
                })
            }
            await D.set('user_historic',hist)

            //On va recupérer d'abord l'id de la facture lié au prise en charge
            let f = await D.exec_params('select * from facture where fact_encharge_id = ?',[req.params.encharge_id])

            if(f.length > 0){
                f = f[0]
                await D.exec_params('delete from fact_service where fserv_fact_id = ?',[f.fact_id])
            }

            //Zzay vao suppression anle facture
            await D.exec_params('delete from facture where fact_encharge_id = ?',[req.params.encharge_id])

            //suppression an'ilay consultation relié amle encharge
            await D.del('consultation',{cons_pec_id:encharge_id})

            //Suppression an'ilay encharge
            await D.del('encharge',{encharge_id})

            //----------
            return res.send({status:true,message:"encharge supprimé."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
 
    }
    
    static async getList(req,res){ 
        let filters = req.query

        let _obj_pat = {
            encharge_id:'encharge_id',
        } 
        let default_sort_by = 'encharge_id'

        // console.log(filters);

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?100:parseInt(filters.limit)
        filters.sort_by = (!filters.sort_by)?_obj_pat[default_sort_by]:_obj_pat[filters.sort_by]

        let search = `%${filters.search}%`

        let search_pat_tab = [search]
        if(filters.search_by == 'pat_nom_et_prenom') search_pat_tab.push(search)

        try { 
            //A reserver recherche par nom_prenom
            let reponse = await D.exec_params(`select encharge.*,tarif.*,patient.*,
            e2.ent_label as ent_label_payeur,e2.ent_num_compte as ent_num_compte_payeur,e1.ent_label,e2.ent_pat_percent,e2.ent_soc_percent,
            e2.ent_code as code_payeur, e1.ent_code as code_soc
            from encharge 
            left join tarif on tarif_id = encharge_tarif_id
            left join patient on pat_id = encharge_pat_id
            left join entreprise e1 on e1.ent_id = encharge_ent_id
            left join entreprise e2 on e2.ent_id = encharge_ent_payeur
            where year(encharge_date_enreg) = ? 
            and ${ (filters.search_by == 'pat_nom_et_prenom')?`(${filters.search_by} like ? or encharge_stomato_pat like ?)`:`${filters.search_by} like ?` }
            ${(parseInt(filters.month))?'and month(encharge_date_enreg) = ?':''}
            order by ${filters.sort_by} desc`,[filters.year,...search_pat_tab,filters.month])

            //Liste total des encharge
            let nb_total_encharge = (await D.exec('select count(*) as nb from encharge'))[0].nb

            return res.send({status:true,reponse,nb_total_encharge})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
    static async getOne(req,res){ 
        let filters = req.params 
        try { 
            let reponse = await D.exec_params(`select * from encharge where ?`,filters) 
            return res.send({status:true,reponse})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async update(req,res){ 
        let data = req.body 
        var array=[]
        for (const key in data) { 
            array.push({[key]:data[key]})
        }  
        try {  
            for (let i = 1; i < array.length; i++) {
                const element = array[i]; 
                await D.updateWhere('encharge',element,array[0]) 
            }
                //Ici tous les fonctions sur l'enregistrement d'un encharge
                return res.send({status:true,message:"Mise à jour, fait"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async utilsAdd(req,res){
        try {
            let tarifs = await D.exec('select * from tarif')
            let soc = await D.exec('select * from entreprise')

            //Récupération de la dérnière séquence
            let last_seq = await D.exec('select encharge_seq from encharge order by encharge_id desc limit 1 ')

            last_seq = (last_seq.length > 0)?last_seq[0].encharge_seq:0

            return res.send({status:true,tarifs,soc,last_seq})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async printToPDF(req,res){

        let d = req.query
        let year_cur = new Date().getFullYear()

        const separateNumber = (n)=>{
            return n.toLocaleString('fr-CA')
        }



        try {
            //on va récupérer d'abord les données du prise en charge
            let pec = (await D.exec_params(`select encharge.*,tarif.*,patient.*,
            e2.ent_label as ent_label_payeur,e2.ent_num_compte as ent_num_compte_payeur,e1.ent_label,e2.ent_pat_percent,e2.ent_soc_percent,
            e2.ent_group_label as sp_group_label
            from encharge 
            left join tarif on tarif_id = encharge_tarif_id
            left join patient on pat_id = encharge_pat_id
            left join entreprise e1 on e1.ent_id = encharge_ent_id
            left join entreprise e2 on e2.ent_id = encharge_ent_payeur
            where encharge_id = ? `,[d.encharge_id]))[0]

            //Ici on va récupérer la facture qui contient l'id du prise en charge
            let fact = (await D.exec_params('select * from facture where fact_encharge_id = ?',[d.encharge_id]))[0]

            let fact_date = (fact.fact_date)?fact.fact_date:new Date()

            await D.updateWhere('facture',{fact_date:new Date()},{fact_id:fact.fact_id})

            //Ici on récupère les fact_service
            let fact_serv = await D.exec_params(`select * from fact_service 
            left join service on fserv_serv_id = service_id
            where fserv_fact_id = ? and fserv_is_product = 0`,[fact.fact_id])

            let r = await D.exec_params(`select *,art_code as service_code,art_label as service_label from fact_service 
            left join article on fserv_serv_id = art_id
            where fserv_fact_id = ? and fserv_is_product = 1`,[fact.fact_id])

            
            fact_serv = [...fact_serv,...r]

            if(fact.fact_ajust_montant){
                fact_serv.push({service_code:'AJUS',service_label:'AJUSTEMENTS',
                fserv_prix_patient:fact.fact_ajust_montant,fserv_prix_societe:-fact.fact_ajust_montant})
            }

            //On modifie la ligne encharge_printed
            if(!pec.encharge_printed){
                await D.updateWhere('encharge',{encharge_printed:1},{encharge_id:pec.encharge_id})
            }

            if(fact_serv.length == 0 || !fact.fact_resume_intervention || (!fact.fact_dep_id && !pec.encharge_is_stomato)){
                return res.send({status:false,message:"Facture pas complète"})
            }


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
            
            doc.pipe(fs.createWriteStream(`./files/facture.pdf`))

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

            //------------- Ajout des titres en haut
            doc.fontSize(14)
            let y_line_title = doc.x
            doc.text('HOPITALY LOTERANA')
            doc.fontSize(10)
            doc.text('Andranomadio - Antsirabe',{underline:true})
            doc.moveDown()
            doc.text('Stat n ° 85113 12 200 60 00614')
            doc.text('NIF n ° 20000038126')


            
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
            doc.text((pec.pat_nom_et_prenom?pec.pat_nom_et_prenom:pec.encharge_stomato_pat).toUpperCase())

            //Insertion du care u titre à droite
            let title_1 = 'ORDONNANCE ET FACTURE', title_2 = '-- PRISE EN CHARGE --'
            let w_cadre_title = doc.page.width - 300 - 15
            let h_cadre_title = doc.heightOfString(title_1) + doc.heightOfString(title_2)+10
            doc.lineJoin('miter')
            .rect(300, y_line_title, w_cadre_title,h_cadre_title)
            .stroke();
            doc.text(title_1,300+(w_cadre_title/4),y_line_title+5)
            doc.text(title_2)

            //Cadre numéro et date
            let num = `N° ${(pec.encharge_seq)?pec.encharge_seq:' - '}`
            let date = (new Date(fact_date)).toLocaleDateString()
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
            doc.text('Société :',300,y_line_pat,{underline:true})
            doc.font('fira')
            let y_num_compte = doc.y
            doc.text(`${pec.sp_group_label.toUpperCase()} `)
            //doc.text(`${pec.ent_num_compte_payeur}`,doc.page.width - doc.widthOfString(pec.ent_num_compte_payeur)-15,y_num_compte)


            //Resaka code patient io
            let cpat = (fact.fact_code_patient)?fact.fact_code_patient:'-'
            let w_code_pat = (doc.widthOfString('Code Patient :') > doc.widthOfString(cpat))?doc.widthOfString('Code Patient :'):doc.widthOfString(cpat)
            let x_code_pat = doc.page.width - (opt.margin*2) - w_code_pat

            doc.font('fira_bold')
            doc.text('Code Patient :',x_code_pat,y_line_pat,{underline:true})
            doc.font('fira')
            doc.text(cpat.toUpperCase(),x_code_pat,y_num_compte)

            doc.moveDown(2)

            let y_table = doc.y
            doc.text('',15,y_table)
            
            // doc.text('',15,y_table)

            let _head = [
                { label:"Description des interventions", width:235, property: 'desc',renderer: null },
                { label:"Qté", property: 'qt',width:30, renderer: null },
                { label:"Unité", property: 'unit',width:40,renderer: null },
                { label:"P-U", property: 'pu',width:50,renderer: null,align: "right",headerAlign:"center" },
                { label:"Montant", property: 'montant',width:70,renderer: null,align: "right",headerAlign:"center" },
                { label:"Part Employé", property: 'part_pat',width:70,renderer: null,align: "right",headerAlign:"center" },
                { label:"Part Société", property: 'part_soc',width:70,renderer: null,align: "right" ,headerAlign:"center"},
            ]

            //les datas
            let _datas = [],cur_d = {}

            _datas.push({desc:(fact.fact_resume_intervention)?fact.fact_resume_intervention:' -- '})

            //Boucle sur le facture
            for (let i = 0; i < fact_serv.length; i++) {
                const e = fact_serv[i];
                _datas.push({
                    desc:(e.fserv_alt_serv)?e.fserv_alt_serv:e.service_label,
                    qt:e.fserv_qt,
                    unit:(e.art_unite_stk)?e.art_unite_stk :'',
                    pu:(e.fserv_prix_unitaire)?separateNumber(e.fserv_prix_unitaire):'',
                    montant:(e.fserv_montant)?separateNumber(e.fserv_montant):'',
                    part_pat:separateNumber(e.fserv_prix_patient),
                    part_soc:separateNumber(e.fserv_prix_societe)
                })
                
            }

            _datas.push({
                desc:'',
                qt:'',
                unit:'',
                pu:'TOTAL ',
                montant:separateNumber(fact_serv.reduce((p,c) => p + (parseInt(c.fserv_montant) | 0),0)),
                part_pat:separateNumber(fact_serv.reduce((p,c) => p + (parseInt(c.fserv_prix_patient) | 0),0)),
                part_soc:separateNumber(fact_serv.reduce((p,c) => p + (parseInt(c.fserv_prix_societe) | 0),0)),
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
                        horizontal: { disabled: true, width: 0.5, opacity: 0 },
                        vertical: { disabled: false, width: 0.5, opacity: 0.5 },
                    },
                    prepareHeader: () => {
                        doc.font("fira_bold").fontSize(8)
                        doc.fillAndStroke('#575a61')
                    },
                    prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                        doc.font("fira").fontSize(10)
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


            //Ajout des trucs pour la signature

            doc.font('fira_bold')

            doc.moveDown(4)
            let y_sign = doc.y
            // atao 70 % ny largeur totale ny largeur misy anle signature
            let w_sign = doc.page.width * 0.7

            let x_begin = doc.page.width /2 - w_sign/2

            let t = ['Le Medecin Chef,',`L'Employé,`,`La Société,`]

            doc.text(t[0],x_begin,y_sign,{underline:true})
            doc.text(t[1], doc.page.width /2 - doc.widthOfString(t[1])/2 ,y_sign,{underline:true})
            doc.text(t[2], (doc.page.width /2 + w_sign/2) - doc.widthOfString(t[1]) ,y_sign,{underline:true})

            doc.end();

            return res.send({status:true,message:"PDF bien générer"})

        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
    static async downFacture(req,res){
        try {
            let data = fs.readFileSync(`./files/facture.pdf`)
            res.contentType("application/pdf")
            // res.download(`./facture.pdf`)
            res.send(data);
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    //Recapitulatif de facture
    static async getRecapFact(req,res){
        try {
            let encharge_id = req.params.encharge_id

            //Récupération de la facture reliée à la prise en charge
            let fact = (await D.exec_params('select * from facture where fact_encharge_id = ?',[encharge_id]))[0]

            //Récupération de services patients
            let serv = await D.exec('select * from service where service_parent_id is null')

            //Récupération fact_serv
            let fact_serv = await D.exec_params(`select * from fact_service
            left join service on service_id = fserv_serv_id
            where fserv_is_product = 0 and fserv_fact_id = ?`,[fact.fact_id])

            //Récupération des service médicaments
            let fact_med = await D.exec_params(`select * from fact_service
            left join article on art_id = fserv_serv_id
            where fserv_is_product = 1 and fserv_fact_id = ?`,[fact.fact_id]) 

            //Manipulation des données amzay
            let montant_total_pat = 0, montant_total_soc = 0
            let index_med = -1
            for (let i = 0; i < serv.length; i++) {
                serv[i].montant_pat = 0
                serv[i].montant_soc = 0

                index_med = (serv[i].service_code == 'MED')?i:index_med

                for (let j = 0; j < fact_serv.length; j++) {
                    const fs = fact_serv[j];
                    if(serv[i].service_id == fs.service_parent_id){
                        serv[i].montant_pat += parseInt(fs.fserv_prix_patient)
                        serv[i].montant_soc += parseInt(fs.fserv_prix_societe)
                    }
                }

                montant_total_pat += serv[i].montant_pat
                montant_total_soc += serv[i].montant_soc
            }

            if(index_med == -1){
                serv.push({service_code:'MED',service_label:'MEDICAMENTS',montant_pat:0,montant_soc:0})
                index_med = serv.length - 1
            }

            console.log(index_med);

            //Eto ny momba ny médicament
            for (let i = 0; i < fact_med.length; i++) {
                const fs = fact_med[i]; 
                serv[index_med].montant_pat += parseInt(fs.fserv_prix_patient);
                serv[index_med].montant_soc += parseInt(fs.fserv_prix_societe)
            }
            montant_total_pat += serv[index_med].montant_pat
            montant_total_soc += serv[index_med].montant_soc

            let ajust_code = 'AJUS'
            serv.push({service_code:ajust_code,service_label:'AJUSTEMENTS',montant_pat:fact.fact_ajust_montant,montant_soc:-fact.fact_ajust_montant})

            montant_total_pat += parseInt(fact.fact_ajust_montant)
            montant_total_soc -= parseInt(fact.fact_ajust_montant)



            res.send({status:true,list_serv:serv,montant_total_pat,montant_total_soc})

        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async setStateFact(req,res){
        try {
            let k = req.body.key
            let encharge_id = req.body.encharge_id
            let up = {}
            up[k] = 1

            await D.updateWhere('encharge',up,{encharge_id})
            return res.send({status:true})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }


    //gestion etats mensuels
    

    //Récupération des listes des patients regroupés par société payeur / employeur
    static async getListPerEnt(req,res){
        try {
            
            let { ent_type,month,year} = req.query.filters

            //ent_type ==> SE (société employeur) || SP (société payeur)
            
            //on va selectionner la listes des sociétés payeurs ou employeurs
            let ids_se = (await D.exec_params(`select distinct encharge_ent_id from encharge`)).map(x => parseInt(x.encharge_ent_id))
            let ids_sp = (await D.exec_params(`select distinct encharge_ent_payeur from encharge`)).map(x => parseInt(x.encharge_ent_payeur))

            let dt = []

            //On va devoir récupérer la liste les infos sur ces entreprises
            let list_ent = await D.exec_params('select * from entreprise where ent_id in (?)',[ids_sp])
            let sp_grp = {}

            for (let i = 0; i < list_ent.length; i++) {
                const e = list_ent[i];
                if(sp_grp[e.ent_group_label]){
                    sp_grp[e.ent_group_label].push(e.ent_id)
                }else{
                    sp_grp[e.ent_group_label] = [e.ent_id]
                }
            }
            // console.log(sp_grp)
            // for (let i = 0; i < ids_sp.length; i++) {
            //     const id = ids_sp[i];                    
                
            // }

            for (const k in sp_grp) {
                if (Object.hasOwnProperty.call(sp_grp, k)) {
                    const e = sp_grp[k];
                    const tmp = await D.exec_params(`select *,
                    sp.ent_id as sp_id,sp.ent_label as sp_label,sp.ent_code as sp_code, sp.ent_num_compte as sp_num_compte, sp.ent_pat_percent as sp_pat_percent,
                    sp.ent_soc_percent as sp_soc_percent,sp.ent_group_label as sp_group_label,
                    se.ent_id as se_id,se.ent_label as se_label,se.ent_code as se_code
                    from encharge 
                    left join patient on encharge_pat_id = pat_id
                    left join tarif on tarif_id = encharge_tarif_id
                    left join facture on fact_encharge_id = encharge_id
                    left join entreprise sp on encharge_ent_payeur = sp.ent_id
                    left join entreprise se on encharge_ent_id = se.ent_id
                    left join departement on fact_dep_id = dep_id
                    left join factpec on encharge_fpc_id = fpc_id 
                    where encharge_ent_payeur in (?) and month(encharge_date_sortie) = ? and year(encharge_date_sortie) = ? order by se.ent_id`,[e,month,year])
                    dt.push({grp_name:k,list:tmp})

                }
            }
            return res.send({status:true,datas:dt})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    //Récupération des données sur l'édition de facture dans etats mensuel
    static async getDatasEditFact(req,res){
        try {
            let {filters,st} = req.query
            let {month,year} = filters

            let sp_ids = (await D.exec_params(`select ent_id from entreprise where ent_group_label = ?`,[st.sp_group_label])).map(x => parseInt(x.ent_id))

            console.log(st)

            //Eto alo récupéraion de la liste des patients avec l'id du PEC
            let list_pec = await D.exec_params(`select * from encharge
            left join patient on pat_id = encharge_pat_id
            left join facture on fact_encharge_id = encharge_id
            left join departement on dep_id = fact_dep_id
            where year(encharge_date_sortie) = ? and month(encharge_date_sortie) = ? and encharge_ent_id = ? and encharge_ent_payeur in (?)`,
            [year,month,st.se_id,sp_ids])


            //list p_serv
            let pserv = await D.exec_params(`select * from service where service_parent_id is null`)


            //récupération des factserv
            let fact_ids = await D.exec_params(`select fact_id from facture where fact_encharge_id in (?)`,[list_pec.map(x => x.encharge_id)])
            fact_ids = fact_ids.map(x => x.fact_id)

            let fact_serv = await D.exec_params(`select * from fact_service
            left join service on service_id = fserv_serv_id
            where fserv_is_product = 0 and fserv_fact_id in (?)`,[fact_ids])

            let fact_med = await D.exec_params(`select * from fact_service
            left join article on art_id = fserv_serv_id
            where fserv_is_product = 1 and fserv_fact_id in (?)`,[fact_ids])


            //regroipement des valeurs
            for (let i = 0; i < pserv.length; i++) {
                const e = pserv[i];    
                for (let j = 0; j < fact_serv.length; j++) {
                    const fs = fact_serv[j];
                    if(fs.service_parent_id == e.service_id){
                        pserv[i]['montant'] = (pserv[i]['montant'])?pserv[i]['montant'] + parseInt(fs.fserv_prix_societe):parseInt(fs.fserv_prix_societe)
                        pserv[i]['fact_id'] = fs.fserv_fact_id
                    }
                }
                
            }

            let med_serv = {service_code:'MED',service_label:'MEDICAMENTS',service_id:2342354} 
            for (let i = 0; i < fact_med.length; i++) {
                const fs = fact_med[i];
                med_serv['montant'] = (med_serv['montant'])?med_serv['montant'] + parseInt(fs.fserv_prix_societe):parseInt(fs.fserv_prix_societe)
                med_serv['fact_id'] = fs.fserv_fact_id
            }
            //ajout du médicament dans la liste
            pserv.push(med_serv)

            //Ajout de ajustement dans la liste
            let ajust_code = 'AJUS'
            let total_ajust = list_pec.reduce( (acc,val)=> acc + parseInt(val.fact_ajust_montant || 0),0)
            if(total_ajust){
                pserv.push ({service_code:ajust_code,service_label:"AJUSTEMENT",service_id:-4,montant:-total_ajust})
            }


            //ici on va gérér le tableau détaillé
            for (let i = 0; i < list_pec.length; i++) {
                const lp = list_pec[i];
                for (let j = 0; j < pserv.length; j++) {
                    const p = pserv[j];
                    for (let k = 0; k < fact_serv.length; k++) {
                        const fs = fact_serv[k];
                        if(fs.service_parent_id == p.service_id && lp.fact_id == fs.fserv_fact_id){
                            list_pec[i][p.service_code] = (lp[p.service_code])?lp[p.service_code] + parseInt(fs.fserv_prix_societe):parseInt(fs.fserv_prix_societe)
                        }
                    }
                }

                for (let j = 0; j < fact_med.length; j++) {
                    const fm = fact_med[j];
                    if(lp.fact_id == fm.fserv_fact_id){
                        list_pec[i]['MED'] = (lp['MED'])?lp['MED'] + parseInt(fm.fserv_prix_societe):parseInt(fm.fserv_prix_societe)
                    }
                }
                list_pec[i][ajust_code] = 0
                list_pec[i][ajust_code] -= parseInt(lp.fact_ajust_montant)

                list_pec[i].fact_montant_soc = parseInt(lp.fact_montant_soc) - parseInt(lp.fact_ajust_montant)
            }

            //Récupération de la facture
            //ici on va chercher surtout la facture par
            //mois, année, sp_id,se_id

            let fpc = await D.exec_params(`select * from factpec
            where fpc_sp_group = ? and fpc_se_id = ? and fpc_month = ? and fpc_year = ?`,[
                st.sp_group_label,st.se_id,month,year
            ])
            fpc = (fpc.length > 0)?fpc[0]:{}


            //ICI on va récupérer le dernier numéro de facture
            let fpc_last = await D.exec_params('select fpc_num from factpec order by fpc_id desc limit 1')
            fpc_last = (fpc_last.length>0)?fpc_last[0].fpc_num:false
            
            return res.send({status:true,pserv,list_pec,fpc,fpc_last})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }


    //Récupération des détails d'un encharge
    static async getDetailPec(req,res){
        try {
            let {st} = req.query

            //list p_serv
            let pserv = await D.exec_params(`select * from service where service_parent_id is null`)


            let fact_serv = await D.exec_params(`select * from fact_service
            left join service on service_id = fserv_serv_id
            where fserv_is_product = 0 and fserv_fact_id = ?`,[st.fact_id])

            let fact_med = await D.exec_params(`select * from fact_service
            left join article on art_id = fserv_serv_id
            where fserv_is_product = 1 and fserv_fact_id = ?`,[st.fact_id])


            //regroipement des valeurs
            for (let i = 0; i < pserv.length; i++) {
                const e = pserv[i];    
                for (let j = 0; j < fact_serv.length; j++) {
                    const fs = fact_serv[j];
                    if(fs.service_parent_id == e.service_id){
                        pserv[i]['montant'] = (pserv[i]['montant'])?pserv[i]['montant'] + parseInt(fs.fserv_montant):parseInt(fs.fserv_montant)
                        pserv[i]['montant_soc'] = (pserv[i]['montant_soc'])?pserv[i]['montant_soc'] + parseInt(fs.fserv_prix_societe):parseInt(fs.fserv_prix_societe)
                        pserv[i]['montant_pat'] = (pserv[i]['montant_pat'])?pserv[i]['montant_pat'] + parseInt(fs.fserv_prix_patient):parseInt(fs.fserv_prix_patient)
                    }
                }
                
            }
            let med_serv = {service_code:'MED',service_label:'MEDICAMENTS',service_id:2342354} 
            for (let i = 0; i < fact_med.length; i++) {
                const fs = fact_med[i];
                med_serv['montant'] = (med_serv['montant'])?med_serv['montant'] + parseInt(fs.fserv_prix_societe):parseInt(fs.fserv_prix_societe)

                med_serv['montant'] = (med_serv['montant'])?med_serv['montant'] + parseInt(fs.fserv_montant):parseInt(fs.fserv_montant)
                med_serv['montant_soc'] = (med_serv['montant_soc'])?med_serv['montant_soc'] + parseInt(fs.fserv_prix_societe):parseInt(fs.fserv_prix_societe)
                med_serv['montant_pat'] = (med_serv['montant_pat'])?med_serv['montant_pat'] + parseInt(fs.fserv_prix_patient):parseInt(fs.fserv_prix_patient)
            }
            //ajout du médicament dans la liste
            pserv.push(med_serv)

            return res.send({status:true,pserv})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    //Validation d'une facture FPC
    static async validateFPC(req,res){
        try {
            
            let {filters,st,encharge_ids,fact} = req.body
            //Modif de validateion
            fact.fpc_validate = 1
            fact.fpc_date = new Date(fact.fpc_date)


            // console.log(fact)

            if(fact.fpc_id){
                //ici suppression de quelques datas pas utiles dans la modif
                delete fact.fpc_date_enreg
                delete fact.fpc_num
                delete fact.fpc_date
                //on est dans modif
                await D.updateWhere('factpec',fact,{fpc_id:fact.fpc_id})
                //On modifie aussi les encharges
                await D.exec_params(`update encharge set encharge_fpc_id = ? where encharge_id in (?)`,[
                    fact.fpc_id,
                    encharge_ids
                ])
            }else{
                let fpc_last = await D.exec_params('select fpc_num from factpec order by fpc_id desc limit 1')
                fpc_last = (fpc_last.length>0)?fpc_last[0].fpc_num:false
                fact.fpc_num = (fpc_last)?(parseInt(fpc_last.split('/')[2])+1).toString().padStart(3,0):'1'.padStart(3,0)
                fact.fpc_num = `HLA/FPC/${fact.fpc_num}`

                let fpc_insert = await D.set('factpec',fact)
                

                //Modifica des encharges
                await D.exec_params(`update encharge set encharge_fpc_id = ? where encharge_id in (?)`,[
                    fpc_insert.insertId,
                    encharge_ids
                ])

            }

            return res.send({status:true})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    //Impression de la facture
    static async printFPC(req,res){
        try {
            
            let {pserv_list,fact,st} = req.query

            let dt = {
                pserv_list,fact,st,pdf_name:`fpc_${st.sp_id}_${st.se_id}_${fact.fpc_month}_${fact.fpc_year}`
            }
            await createFPCPdf(dt)

            res.send({status:true,pdf_name:dt.pdf_name})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"}) 
        }
    }


    //Génération d'inmpression de détail dans pec etats-mensuel
    static async printDetailFpc(req,res){
        try {
            
            let {st,pserv_list,list_detail,total_list_detail,fact} = req.body

            let dt = {
                st,pserv_list,list_detail,total_list_detail,fact,pdf_name:'detail-fpc'
            }

            await createFPCDetailPdf(dt)

            return res.send({status:true,pdf_name:dt.pdf_name})

        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"}) 
        }
    }
}

//Options pour les tableaux
function opt_tab (head,datas,doc,w){
    w = (w)?w:{}
    w.col = w.col || 7
    w.head = w.head || 6

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
                doc.font("fira_bold").fontSize(w.head)
                doc.fillAndStroke('black')
            },
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                doc.font("fira_bold").fontSize(w.col)
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
//fonction qui écrit du texte dans un cadre
function drawTextCadre(text,x,y,w,or,doc){
    let m = 5
    w = (!w)?50:w 
    // x +=m

    or = (!or)?'center':or

    let w_text = doc.widthOfString(text)

    doc.font('fira_bold')
    if(or == 'center'){
        doc.text(text,x + (w - w_text)/2,y)
    }else if(or == 'left'){
        doc.text(text,x + m,y)
    }else if(or == 'right'){
        doc.text(text,x+(w - doc.widthOfString(text)) - m,y)
    }

    y -= m/2

    doc.lineWidth(1)
    doc.lineJoin('miter')
        .rect(x, y,
        w , doc.heightOfString(text) + m)
        .stroke();

    doc.font('fira')
}

//CREATION D'UNE FONCTION QUI VA FAIRE L'EXPORTATION EN PDF DU DETAIL
async function createFPCDetailPdf(dt){
    let {pserv_list,st,list_detail,total_list_detail,fact} = dt

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
    let font_size = 8
    doc.fontSize(font_size)

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
    let fact_ttl_label = `FACTURE N° ${fact.fpc_num}`
    let sp_ttl_label = st.sp_group_label.toUpperCase()
    let date_ttl = `${U.getMonth(parseInt(fact.fpc_month))} ${fact.fpc_year}`

    let ttl_bas = 'TABLEAU ANNEXE - DETAIL PAR PATIENT'

    let date_fact = `Antsirabe le, ${U.dateToText(fact.fpc_date)}`
    let gest_titre = `Le Gestionnaire,`
    let gest_nom = `Mme RASOLOARISOA Jeannine`

    let w_ttl_cadre = 250
    let w_date_cadre = doc.page.width - (w_ttl_cadre * 2) - (opt.margin * 2)
    let w_full_cadre = doc.page.width - (opt.margin * 2)

    doc.fontSize(12)
    let x_cadre = opt.margin
    let y_cadre = opt.margin
    
    drawTextCadre(fact_ttl_label,x_cadre,opt.margin,w_ttl_cadre,'center',doc)
    x_cadre += w_ttl_cadre
    drawTextCadre(sp_ttl_label,x_cadre,opt.margin,w_ttl_cadre,'center',doc)
    x_cadre += w_ttl_cadre
    drawTextCadre(date_ttl,x_cadre,opt.margin,w_date_cadre,'right',doc)

    y_cadre += doc.heightOfString(date_ttl) + 10
    x_cadre = opt.margin
    doc.fontSize(14)
    drawTextCadre(ttl_bas,x_cadre,y_cadre,w_full_cadre,'center',doc)

    doc.moveDown(2)

    let head = []
    let datas = []

    doc.text('',opt.margin,doc.y)

    //Création des datas
    //On va créer un tableau par département
    // let taille_min = 48

    let taille_pat = 125
    let taille_dossier = 55 

    let taille_min = (doc.page.width - ((opt.margin *2) + taille_dossier + taille_pat) ) / (pserv_list.length + 2)


    //head
    head = [
        { label:"Code P".toUpperCase(), width:taille_min, property: 'pat_numero',renderer: null ,headerAlign:"center"},
        { label:"Nom Patient".toUpperCase(), width:taille_pat, property: 'pat_name',renderer: null ,headerAlign:"center"},
        { label:"N° Dossier".toUpperCase(), width:taille_dossier, property: 'encharge_seq',renderer: null ,headerAlign:"center"},
    ]

    for (let i = 0; i < pserv_list.length; i++) {
        const e = pserv_list[i];
        head.push(
            { label:`${e.service_label.substr(0,5)}`.toUpperCase(), width:taille_min, property: `${e.service_code}`,renderer: null ,headerAlign:"center",align:"right"},
        )
    }
    head.push({ label:"total".toUpperCase(), width:taille_min, property: 'total',renderer: null ,headerAlign:"center",align:"right"},)

    //Ajout des données pour chaque département
    let dep = {}
    let stomato_code = 'STO'

    for (let i = 0; i < list_detail.length; i++) {
        const ld = list_detail[i];
        if(!ld.dep_id && !ld.encharge_is_stomato) continue

        if(ld.encharge_is_stomato){
            if(!dep[stomato_code]) dep[stomato_code] = {list:[],label:'STOMATOLOGIE'}
            dep[stomato_code].list.push(ld)
        }else{
            if(!dep[ld.dep_code]) dep[ld.dep_code] = {list:[],label:ld.dep_label}
            dep[ld.dep_code].list.push(ld)
        }
    }

    doc.fontSize(font_size)
    doc.font('fira_bold')

    //boucle d'impression ???
    for(const dp in dep){
        const tt = dep[dp]
        datas = []
        doc.text(`Département ${tt.label}`)
        doc.moveDown()

        //création datas
        for (let i = 0; i < tt.list.length; i++) {
            const l = tt.list[i];
            let tmp = {}
            let total = 0
            tmp['pat_numero'] = l.pat_numero || l.encharge_stomato_pat_num
            tmp['pat_name'] = l.pat_nom_et_prenom || l.encharge_stomato_pat
            tmp['encharge_seq'] = l.encharge_seq

            for (let j = 0; j < pserv_list.length; j++) {
                const pl = pserv_list[j];
                tmp[pl.service_code] = (l[pl.service_code])?separateNumber(l[pl.service_code]):''
                total += (l[pl.service_code])?parseInt(l[pl.service_code]):0

                pserv_list[j]['total'] = pserv_list[j]['total']?pl['total'] + parseInt(l[pl.service_code] || 0) :parseInt(l[pl.service_code] || 0)
                
            }

            tmp['total'] = separateNumber(total)
            datas.push(tmp)
        }

        tmp = {
            pat_numero:'',
            pat_name:`S/T (${tt.label})`,
            encharge_seq:''
        }
        total = 0

        for (let j = 0; j < pserv_list.length; j++) {
            const pl = pserv_list[j];
            tmp[pl.service_code] = (pl['total'])?separateNumber(pl['total']):''
            total += pl['total']
            pserv_list[j]['total'] = 0
        }
        tmp['total'] = separateNumber(total)
        datas.push(tmp)
        await doc.table(opt_tab(head,datas,doc,{col:8,head:7}), { /* options */ });
        // doc.moveDown()
    }

    //Pour le Totak général
    let y_tmp = doc.y
    let nb_ligne_ttl = `Nombre de lignes : ${list_detail.length}`
    doc.text(nb_ligne_ttl)

    //cadre total général
    x_cadre = opt.margin + doc.widthOfString(nb_ligne_ttl) + 10
    let w_cadre = (taille_dossier + taille_min + taille_pat + opt.margin) - x_cadre
    drawTextCadre('TOTAL GENERAL',x_cadre,y_tmp,w_cadre,'center',doc)

    for (let i = 0; i < pserv_list.length; i++) {
        x_cadre += w_cadre
        w_cadre = taille_min
        const pl = pserv_list[i];
        drawTextCadre((pl.montant)?separateNumber(pl.montant):' ',x_cadre,y_tmp,w_cadre,'right',doc)
    }

    x_cadre += w_cadre
    let somme_total = separateNumber(pserv_list.reduce((acc,val) => acc + parseInt(val.montant || 0),0))
    drawTextCadre(somme_total,x_cadre,y_tmp,w_cadre,'right',doc)


    //les signatures
    doc.font('fira_bold')
    doc.fontSize(10)
    doc.moveDown(2)
    y_tmp = doc.y
    let x_date = doc.page.width/2 - doc.widthOfString(date_fact)/2
    doc.text(date_fact,x_date,y_tmp)

    doc.moveDown()
    y_tmp = doc.y
    doc.text('Médecin',x_date - (doc.widthOfString('Médecin')/2),y_tmp)
    let w_g = doc.widthOfString(gest_titre)
    doc.text(gest_titre, (x_date + doc.widthOfString(date_fact) - (w_g /2)) ,y_tmp)


    //Fin
    doc.end()
}

//CREATION DE FONCTION DE CREATION DE PDF POUR LA PRISE EN CHARGE
async function createFPCPdf(dt){
    let {pserv_list,st,fact} = dt

    fact.fpc_soins_generaux = (fact.fpc_soins_generaux == 'true')?true:false

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
    let font_size = 8
    doc.fontSize(font_size)

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

    let nom_hop = 'HOPITALY LOTERANA - ANDRANOMADIO'
    let lot_hop = `B.P. 249 - Tél: 020 44 481 08 - 110 ANTSIRABE`
    let nif = `N° Stat: 86100 12 2006 0 00614`
    let stat = `N° NIF: 2000038126 - CF 0103298`
    let bni_num = `BNI Antsirabe 00005 00015 323365 7 020 079`
    let fact_label = 'FACTURE N°'
    let fact_num = fact.fpc_num
    let sp_label = `Doit : ${st.sp_group_label}`
    let se_label = (st.sp_id == st.se_id)?'':`Affilié à ${st.se_label}`
    let sp_adresse = 'Antsirabe'
    let arrt_texte = 'Arretée à la somme de : '
    let somme_text = `${NumberToLetter(parseInt(fact.fpc_montant))} Ariary`.toUpperCase()
    let total_cadre = parseInt(fact.fpc_montant).toLocaleString('fr-CA')
    let soins_gen_cadre = parseInt(fact.fpc_soins_montant || 0).toLocaleString('fr-CA')

    let date_fact = `Antsirabe le, ${U.dateToText(fact.fpc_date)}`
    let gest_titre = `Le Gestionnaire,`
    let gest_nom = `Mme RASOLOARISOA Jeannine`

    let acte_tab_label = `Les actes médicaux de ${U.getMonth(parseInt(fact.fpc_month))} ${fact.fpc_year} désignés ci-après : `

    //Les dimensions
    let x_begin = parseInt(opt.margin)
    let w_table = (doc.page.width - (opt.margin * 4))/2


    //Ecriture
    //1ère colonne
    doc.font('fira_bold')
    doc.text(nom_hop,{underline:true})
    doc.moveDown()
    doc.font('fira')
    doc.text(lot_hop)
    doc.text(nif)
    doc.text(stat)
    doc.text(bni_num)

    let y_after_cadre = doc.y

    //ici on va créer le cadre
    let cadre_begin = doc.widthOfString(lot_hop) + opt.margin + 30
    let w_cadre = (w_table +opt.margin) - cadre_begin
    let marg_cadre = 5
    let y_tmp = 0
    doc.font('fira_bold')
    doc.text(fact_label,cadre_begin+marg_cadre,opt.margin + marg_cadre)
    doc.font('fira')
    doc.text(fact_num)
    doc.moveDown()
    doc.font('fira_bold')
    doc.text(sp_label,{width:w_cadre - 5})
    if(st.sp_id != st.se_id){
        doc.text(se_label,{width:w_cadre - 5})
    }
    doc.font('fira')
    y_tmp = doc.y
    doc.text(sp_adresse)
    doc.rect(cadre_begin,opt.margin,w_cadre,y_tmp+5).stroke()


    doc.text('',opt.margin,y_after_cadre)
    doc.moveDown(4)
    doc.text(acte_tab_label)
    doc.moveDown(2)

    let _head = []
    let _datas = []

    //tableau amzay
    let s_desc = w_table * 0.7
    _head = [
        { label:"Désignation".toUpperCase(), width:s_desc, property: 'desc',renderer: null ,headerAlign:"center"},
        { label:"Montant".toUpperCase(),width:w_table-s_desc, property: 'mnt',renderer: null ,headerAlign:"center",align:"right"},
    ]

    for (let i = 0; i < pserv_list.length; i++) {
        const e = pserv_list[i];
        _datas.push({
            desc:e.service_label,
            mnt:(e.montant)?parseInt(e.montant).toLocaleString('fr-CA'):''
        })
    }

    await doc.table(opt_tab(_head,_datas,doc,{col:10,head:10}), { /* options */ });

    
    let t_cadre = w_table - s_desc
    let t_begin = opt.margin + w_table - (t_cadre * 2)

    doc.font('fira_bold')
    
    y_tmp = doc.y
    if(fact.fpc_soins_generaux){
        drawTextCadre('Soins generaux'.toUpperCase(),t_begin,y_tmp,t_cadre,'center',doc)
        drawTextCadre(soins_gen_cadre,t_begin+t_cadre,y_tmp,t_cadre,'right',doc)
        doc.moveDown()
    }else{
        doc.moveDown()
    }

    doc.fillAndStroke('black')
    y_tmp = doc.y
    drawTextCadre('TOTAL',t_begin,y_tmp,t_cadre,'center',doc)
    drawTextCadre(total_cadre,t_begin+t_cadre,y_tmp,t_cadre,'right',doc)
    doc.moveDown(2)

    doc.text('',opt.margin,doc.y)
    y_tmp = doc.y
    doc.text(arrt_texte)
    let somme_text_begin = doc.widthOfString(arrt_texte) + opt.margin + 5
    doc.text(somme_text,somme_text_begin,y_tmp,{underline:true,width:(w_table + opt.margin) - somme_text_begin})
    doc.moveDown(2)
    //Signature
    doc.fontSize(9)
    let sign_size = (t_cadre * 2)

    
    doc.text(date_fact, (x_begin + w_table) - (doc.widthOfString(date_fact) + (sign_size - doc.widthOfString(date_fact))/2 ),doc.y )
    doc.moveDown()
    y_tmp = doc.y
    doc.text('Médecin',x_begin + 15,doc.y)
    doc.text(gest_titre, (x_begin + w_table) - (doc.widthOfString(gest_titre) + (sign_size - doc.widthOfString(gest_titre))/2 ),y_tmp )
    // doc.moveDown(2)
    // doc.text(gest_nom, (x_begin + w_table) - (doc.widthOfString(gest_nom) + (sign_size - doc.widthOfString(gest_nom))/2 ),doc.y )


    //2ème COLONNE ------- ://///// ::: 
    x_begin = w_table + (opt.margin * 3)
    doc.fontSize(font_size)

    doc.lineWidth(1)

    doc.font('fira_bold')
    doc.text(nom_hop,x_begin,opt.margin,{underline:true})
    doc.moveDown()
    doc.font('fira')
    doc.text(lot_hop)
    doc.text(nif)
    doc.text(stat)
    doc.text(bni_num)

    //ici on va créer le cadre
    cadre_begin =  (w_table ) + doc.widthOfString(lot_hop) + (opt.margin*3) + 30
    doc.font('fira_bold')
    doc.text(fact_label,cadre_begin+marg_cadre,opt.margin + marg_cadre)
    doc.font('fira')
    doc.text(fact_num)
    doc.moveDown()
    doc.font('fira_bold')
    doc.text(sp_label,{width:w_cadre - 5})
    if(st.sp_id != st.se_id){
        doc.text(se_label,{width:w_cadre - 5})
    }
    doc.font('fira_bold')
    y_tmp = doc.y
    doc.text(sp_adresse)
    doc.rect(cadre_begin,opt.margin,w_cadre,y_tmp+5).stroke()

    
    doc.text('',x_begin,y_after_cadre)
    doc.moveDown(4)

    doc.text(acte_tab_label)

    doc.moveDown(2)

    //tableau amzay
    await doc.table(opt_tab(_head,_datas,doc,{col:10,head:10}), { /* options */ });

    // doc.moveDown()

    t_begin = (opt.margin*3) + (w_table*2) - (t_cadre * 2)

    doc.fillAndStroke('black')
    
    y_tmp = doc.y
    if(fact.fpc_soins_generaux){
        drawTextCadre('Soins generaux'.toUpperCase(),t_begin,y_tmp,t_cadre,'center',doc)
        drawTextCadre(soins_gen_cadre,t_begin+t_cadre,y_tmp,t_cadre,'right',doc)
        doc.moveDown()
    }else{
        doc.moveDown()
    }
    y_tmp = doc.y
    drawTextCadre('TOTAL',t_begin,y_tmp,t_cadre,'center',doc)
    drawTextCadre(total_cadre,t_begin+t_cadre,y_tmp,t_cadre,'right',doc)
    doc.moveDown(2)

    doc.text('',x_begin,doc.y)
    y_tmp = doc.y
    doc.text(arrt_texte)
    somme_text_begin = doc.widthOfString(arrt_texte) + x_begin + 5

    doc.text(somme_text,somme_text_begin,y_tmp,{underline:true,width:(w_table + x_begin) - somme_text_begin})
    doc.moveDown(2)
    //Signature
    doc.fontSize(9)
    
    doc.text(date_fact, (x_begin + w_table) - (doc.widthOfString(date_fact) + (sign_size - doc.widthOfString(date_fact))/2 ),doc.y )
    doc.moveDown()
    y_tmp = doc.y
    doc.text('Médecin',x_begin + 15,doc.y)
    doc.text(gest_titre, (x_begin + w_table) - (doc.widthOfString(gest_titre) + (sign_size - doc.widthOfString(gest_titre))/2 ),y_tmp )
    // doc.moveDown(2)
    // doc.text(gest_nom, (x_begin + w_table) - (doc.widthOfString(gest_nom) + (sign_size - doc.widthOfString(gest_nom))/2 ),doc.y )

    //Fin
    doc.end()
}

module.exports = Encharge;
