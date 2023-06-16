let D = require('../models/data')

class Facture{
    static async register(req,res){ 
        
        let _d= req.body; 

        // console.log(_d)
        let facture_data={
            fact_dep_id:{front_name:'fact_dep_id',fac:true},
            fact_type:{front_name:'fact_type',fac:true},
            fact_resume_intervation:{front_name:'fact_resume_intervation',fac:true},
            fact_encharge_id:{front_name:'fact_encharge_id',fac:true},
        };

        //Vérification du facture
        const _pd_keys = Object.keys(facture_data)
        let _tmp = {}
        let _list_error = []
        
        try {
            _pd_keys.forEach((v,i)=>{
                _tmp = facture_data[v]
                if(!_tmp.fac && !_d[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })
            
            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
    
            //Si la vérification c'est bien passé, 
            // on passe à l'insertion du facture
            let _data = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = facture_data[v]
    
                _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                 
                _data[v] = _d[_tmp.front_name]
            })
            
            //l'objet facture est rempli maintenant
            // on l'insert dans la base de donnée

            await D.set('facture',_data)
            //Ici tous les fonctions sur l'enregistrement d'un facture
            return res.send({status:true,message:"facture bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }


    }

    static async delete(req,res){
        try {   
            await D.del('facture',req.params)
            return res.send({status:true,message:"facture supprimé."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
 
    }  
    
    static async getList(req,res){ 
        let filters = req.query

        let _obj_pat = {
            pat_numero:'pat_numero',
            pat_nom_et_prenom:'pat_nom_et_prenom',
            pat_profession:'pat_profession',
        } 
        let default_sort_by = 'pat_numero'

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?10000:parseInt(filters.limit)
        filters.sort_by = (!filters.sort_by)?_obj_pat[default_sort_by]:_obj_pat[filters.sort_by]
        filters.search = (!filters.search)?'%':`%${filters.search}%`

        try { 
            //A reserver recherche par nom_prenom
            // let reponse = await D.exec_params(`select * from facture order by ${filters.sort_by} limit ? offset ?`,[
            //     filters.limit,
            //     (filters.page-1)*filters.limit
            // ])

            let reponse = await D.exec_params(`select * from facture where pat_nom_et_prenom like ? order by ${filters.sort_by} limit ?`,[filters.search,filters.limit])

            //Liste total des facture
            let nb_total_facture = (await D.exec('select count(*) as nb from facture'))[0].nb

            return res.send({status:true,reponse,nb_total_facture})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getAddUtils(req,res){
        try {
            //Liste de département
            let {encharge_id} = req.query
            let list_dep = await D.exec('select * from departement')
            let fact = await D.exec_params('select * from facture where fact_encharge_id = ?',[encharge_id])

            fact = (fact.length > 0)?fact[0]:{}

            fact.fact_serv = []

            fact.fact_serv = await D.exec_params(`select * from fact_service 
            left join service on fserv_serv_id = service_id
            where fserv_fact_id = ? and fserv_is_product = 0`,[fact.fact_id])

            let r = await D.exec_params(`select *,art_code as service_code,art_label as service_label from fact_service 
            left join article on fserv_serv_id = art_id
            where fserv_fact_id = ? and fserv_is_product = 1`,[fact.fact_id])

            
            fact.fact_serv = [...fact.fact_serv,...r]

            return res.send({status:true,list_dep,fact,r})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async update(req,res){  
        try {  
            
            let {f,fact_serv,user_id,pec} = req.body

            //console.log(del,add)
            
            delete f.fact_date_enreg
            delete f.fact_serv
            f.fact_date = null

            //Mise à jour prise en charge
            pec.encharge_date_sortie = (pec.encharge_date_sortie)?new Date(pec.encharge_date_sortie):null

            delete pec.ent_label
            delete pec.ent_label_payeur

            await D.updateWhere('encharge',pec,{encharge_id:pec.encharge_id})
            // --------------------------

            //Modification de la facture
            await D.updateWhere('facture',f,{fact_id:f.fact_id})


            let {del,add} = fact_serv
            let datas = [], sql = '', sql_modif = ''
            //Suppression des éléments fact_service
            if(del && del.length > 0){
                await D.exec_params('delete from fact_service where fserv_id in (?)',[del])
            }

            //Ajout et modification
            if(add && add.length > 0){

                datas = []
                sql = `insert into fact_service 
                (fserv_serv_id,fserv_fact_id,fserv_is_product,fserv_qt,fserv_montant,fserv_prix_unitaire,fserv_prix_patient,fserv_prix_societe) values ?;`


                for (let i = 0; i < add.length; i++) {
                    const e = add[i];
                    if(!e) continue

                    if(!e.fserv_fact_id){
                        datas.push([e.fserv_serv_id,f.fact_id,e.fserv_is_product,e.fserv_qt,e.fserv_montant,e.fserv_prix_unitaire,
                            e.fserv_prix_patient,e.fserv_prix_societe])
                    }else{
                        sql_modif +=`update fact_service set fserv_qt = ${e.fserv_qt}, fserv_montant = ${e.fserv_montant}, 
                        fserv_prix_patient = ${e.fserv_prix_patient}, fserv_prix_societe = ${e.fserv_prix_societe} 
                        where fserv_fact_id = ${f.fact_id} and fserv_serv_id = ${e.fserv_serv_id} and fserv_is_product = ${e.fserv_is_product};`
                    }
                }

                if(datas.length > 0) await D.exec_params(sql,[datas])
                if(sql_modif) await D.exec(sql_modif)
            }


            //AJOUT AN'ILAY CONSULTATION RAHA OHATRA KA DISPENSAIRE ILAY f.fact_dep_id
            //Eto zany no tokony hisy an'ilay vérification an'ilay 
            if(f.fact_dep_id){
                //Ato ny création an'ilay consultation
                //vérification hoe efa mi-existe ao am consultation ve ito prise en charge ito
                //Satria unique daholo izy ireo de tokony tsy hiverimberina

                let pec = (await D.exec_params('select * from encharge where encharge_id = ?',[f.fact_encharge_id]))[0]

                let cons = await D.exec_params('select * from consultation where cons_pec_id = ?',[pec.encharge_id])

                //Mila atao eto ny total rehetra
                //Récupération fact_service
                let fserv = await D.exec_params('select * from fact_service where fserv_fact_id = ?',[f.fact_id])

                let montant = 0
                for (var i = 0; i < fserv.length; i++) {
                    const fs = fserv[i]

                    montant += parseInt(fs.fserv_montant)
                }

                if(cons.length > 0){
                    //Efa misy ao izany ilay izy de tsy mila créer-na tsony, mety hoe modification sisa
                    await D.updateWhere('consultation',{cons_montant:montant},{cons_pec_id:pec.encharge_id})

                }else{


                    //mbola jerena alo hoe dispensaire ve sa tsia ilay département voasafidy
                    let dp = (await D.exec_params('select * from departement where dep_id = ?',[f.fact_dep_id]))[0]

                    let dep_code_dispensaire = 'C017'

                    if(dp.dep_code == dep_code_dispensaire){
                         //fa eto an Mila manao création an'ilay izy
                        let cns = {
                            cons_pat_id:pec.encharge_pat_id,
                            cons_ent_id:pec.encharge_ent_id,
                            cons_entpayeur_id:pec.encharge_ent_payeur,
                            cons_montant:montant,
                            cons_is_pec:1,
                            cons_pec_id:pec.encharge_id
                        }

                        await D.set('consultation',cns)
                    }
                   
                }
            }
            
            //vita daholo izay ny modification

            //Insertion historique utilisateur
            let hist = {
                uh_user_id:user_id,
                uh_code:req.uh.modif_fact_pec.k,
                uh_description:req.uh.modif_fact_pec.l,
                uh_module:'Prise en charge',
            }
            await D.set('user_historic',hist)

            //Ici tous les fonctions sur l'enregistrement d'une facture
            return res.send({status:true,message:"Mise à jour, fait"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async outSearch(req,res){
        try {
            let  {by,search} = req.query

            search = `%${search}%`
            let factures = await D.exec_params(`select * from facture where ${by} like ?`,search)

            return res.send({status:true,factures})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async setMedicamentsTarif(req,res){
        try {
            //On va récuperer la liste totales des articles d'abord
            let art = await D.exec('select * from article')
            let tarif = await D.exec('select * from tarif')

            //Création du tableau d'insertion de tarif

            let datas = []
            let sql = `insert into tarif_service (tserv_tarif_id,tserv_service_id,tserv_prix,tserv_is_product) values ?;`

            for (let i = 0; i < art.length; i++) {
                const a = art[i];

                for (let j = 0; j < tarif.length; j++) {
                    const t = tarif[j];
                    
                    //Remplissage du tableau
                    datas.push([t.tarif_id,a.art_id,0,1])
                }
                
            }

            await D.exec_params(sql,[datas])
            return res.send({status:true,message:`Tous c'est bien passé`})

        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Facture;
