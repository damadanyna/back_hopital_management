let D = require('../models/data')
let PDFDocument = require("pdfkit-table");
let fs = require('fs')

class Encharge{
    static async register(req,res){ 
        let _d= req.body; 
        let encharge_data={ 
            encharge_pat_id:{front_name:'encharge_pat_id',fac:true}, 
            encharge_tarif_id:{front_name:'encharge_tarif_id',fac:true}, 
            encharge_seq:{front_name:'encharge_seq',fac:true}, 
            encharge_date_entre :{front_name:'encharge_date_entre',fac:true,format:(a)=> new Date(a)},
            encharge_date_sortie :{front_name:'encharge_date_sortie',fac:true,format:(a)=> new Date(a)},
            encharge_ent_id:{front_name:'encharge_ent_id',fac:true }, 
            encharge_util_id:{front_name:'encharge_util_id',fac:true },
            encharge_ent_payeur:{front_name:'encharge_ent_payeur',fac:true },  
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

            //Création de la facture après la création de la prise en charge
            await D.set('facture',{
                fact_encharge_id:_pec.insertId
            })
            //Ici tous les fonctions sur l'enregistrement d'un encharge
            return res.send({status:true,message:"encharge bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }


    }

    static async delete(req,res){

        try {   

            //On va recupérer d'abord l'id de la facture lié au prise en charge
            let f = await D.exec_params('select * from facture where fact_encharge_id = ?',[req.params.encharge_id])

            if(f.length > 0){
                f = f[0]
                await D.exec_params('delete from fact_service where fserv_fact_id = ?',[f.fact_id])
            }

            //Zzay vao suppression anle facture
            await D.exec_params('delete from facture where fact_encharge_id = ?',[req.params.encharge_id])

            //Suppression an'ilay encharge
            await D.del('encharge',req.params)

            //----------
            return res.send({status:true,message:"encharge supprimé."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
 
    }  6
    
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

        try { 
            //A reserver recherche par nom_prenom
            let reponse = await D.exec_params(`select encharge.*,tarif.*,patient.*,
            e2.ent_label as ent_label_payeur,e2.ent_num_compte as ent_num_compte_payeur,e1.ent_label,e2.ent_pat_percent,e2.ent_soc_percent
            from encharge 
            left join tarif on tarif_id = encharge_tarif_id
            left join patient on pat_id = encharge_pat_id
            left join entreprise e1 on e1.ent_id = encharge_ent_id
            left join entreprise e2 on e2.ent_id = encharge_ent_payeur
            where year(encharge_date_enreg) = ? and ${filters.search_by} like ?
            ${(parseInt(filters.month))?'and month(encharge_date_enreg) = ?':''}
            order by ${filters.sort_by} desc`,[filters.year,`%${filters.search}%`,filters.month])

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
            e2.ent_label as ent_label_payeur,e2.ent_num_compte as ent_num_compte_payeur,e1.ent_label,e2.ent_pat_percent,e2.ent_soc_percent
            from encharge 
            left join tarif on tarif_id = encharge_tarif_id
            left join patient on pat_id = encharge_pat_id
            left join entreprise e1 on e1.ent_id = encharge_ent_id
            left join entreprise e2 on e2.ent_id = encharge_ent_payeur
            where encharge_id = ? `,[d.encharge_id]))[0]

            //Ici on va récupérer la facture qui contient l'id du prise en charge
            let fact = (await D.exec_params('select * from facture where fact_encharge_id = ?',[d.encharge_id]))[0]

            //Ici on récupère les fact_service
            let fact_serv = await D.exec_params(`select * from fact_service 
            left join service on fserv_serv_id = service_id
            where fserv_fact_id = ? and fserv_is_product = 0`,[fact.fact_id])

            let r = await D.exec_params(`select *,art_code as service_code,art_label as service_label from fact_service 
            left join article on fserv_serv_id = art_id
            where fserv_fact_id = ? and fserv_is_product = 1`,[fact.fact_id])

            
            fact_serv = [...fact_serv,...r]

            //On modifie la ligne encharge_printed
            if(!pec.encharge_printed){
                await D.updateWhere('encharge',{encharge_printed:1},{encharge_id:pec.encharge_id})
            }

            if(fact_serv.length == 0){
                return res.send({status:false,message:"Facture pas complet"})
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
            doc.text(pec.pat_nom_et_prenom.toUpperCase())

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
            let date = (new Date(pec.encharge_date_enreg)).toLocaleDateString()
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
            doc.text(`${pec.ent_label_payeur.toUpperCase()} `)
            doc.text(`${pec.ent_num_compte_payeur}`,doc.page.width - doc.widthOfString(pec.ent_num_compte_payeur)-15,y_num_compte)

            doc.moveDown(2)
            let y_table = doc.y
            doc.text('',15,y_table)

            //Eto ny tableau compliqué be io

            //Header du tableau
            //création de header du tableau -- C'est ça le header
            // let _head = [
            //     { label:"Description des interventions", width:200,property: 'desc',renderer: null },
            //     { label:"Qté", property: 'qt', renderer: null },
            //     { label:"Unité", property: 'unit',renderer: null },
            //     { label:"P-U", property: 'pu',renderer: null },
            //     { label:"Montant", property: 'montant',renderer: null },
            //     { label:"Part Employé", property: 'part_pat',renderer: null },
            //     { label:"Part Société", property: 'part_soc',renderer: null },
            // ]


            let _head = [
                { label:"Description des interventions", width:255, property: 'desc',renderer: null },
                { label:"Qté", property: 'qt',width:30, renderer: null },
                { label:"Unité", property: 'unit',width:40,renderer: null },
                { label:"P-U", property: 'pu',width:50,renderer: null,align: "right",headerAlign:"center" },
                { label:"Montant", property: 'montant',width:50,renderer: null,align: "right",headerAlign:"center" },
                { label:"Part Employé", property: 'part_pat',width:70,renderer: null,align: "right",headerAlign:"center" },
                { label:"Part Société", property: 'part_soc',width:70,renderer: null,align: "right" ,headerAlign:"center"},
            ]

            //les datas
            let _datas = [],cur_d = {}

            _datas.push({desc:fact.fact_resume_intervention})

            //Boucle sur le facture
            for (let i = 0; i < fact_serv.length; i++) {
                const e = fact_serv[i];
                _datas.push({
                    desc:e.service_label,
                    qt:e.fserv_qt,
                    unit:(e.art_unite_stk)?e.art_unite_stk :'',
                    pu:separateNumber(e.fserv_prix_unitaire),
                    montant:separateNumber(e.fserv_montant),
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
}

module.exports = Encharge;
