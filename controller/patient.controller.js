let D = require('../models/data')

class Patient{
    static async register(req,res){ 
        
        let _d= req.body; 

        // console.log(_d)
        let patient_data={
            pat_id:{front_name:'pat_id',fac:true},
            pat_nom_et_prenom:{front_name:'pat_nom_et_prenom',fac:false}, 
            pat_date_naiss :{front_name:'pat_date_naiss',fac:true,format:(a)=> new Date(a)},
            pat_adresse:{front_name:'pat_adresse',fac:true}, 
            pat_profession:{front_name:'pat_profession',fac:false}, 
            pat_sexe:{front_name:'pat_sexe',fac:false}, 
            pat_numero:{front_name:'pat_numero',fac:false}, 
        };

        //Vérification du patient
        const _pd_keys = Object.keys(patient_data)
        let _tmp = {}
        let _list_error = []
        
        try {
            _pd_keys.forEach((v,i)=>{
                _tmp = patient_data[v]
                if(!_tmp.fac && !_d[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })
            
            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
    
            //Si la vérification c'est bien passé, 
            // on passe à l'insertion du patient
            let _data = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = patient_data[v]
    
                _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                 
                _data[v] = _d[_tmp.front_name]
            })
            
            //l'objet patient est rempli maintenant
            // on l'insert dans la base de donnée

            await D.set('patient',_data)
            //Ici tous les fonctions sur l'enregistrement d'un patient
            return res.send({status:true,message:"patient bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }


    }

    static async delete(req,res){
        try {   
            let pat_id = req.params.pat_id

            //suppresion de l'insertion de l'utilisateur dans caisse
            //Récupération de la caisse alony
            let c = (await D.exec_params('select * from encaissement where enc_pat_id = ?',[pat_id]))[0]
            if(c != undefined){
                //Suppresison relation caisse en encserv
                await D.del('enc_serv',{encserv_enc_id:c.enc_id})
                //suppresison de la ligne caisse
                await D.del('encaissement',{enc_id:c.enc_id})
            }

            //atao tahaka an'io ko ny prise en charge
            let pec = (await D.exec_params('select * from encharge where encharge_pat_id = ?',[pat_id]))[0]
            if(pec != undefined){
                //Suppresison relation caisse en encserv
                await D.del('encharge',{encharge_id:pec.encharge_id})
                //Récupération facture
                let f = (await D.exec_params('select * from facture where fact_encharge_id = ?',[pec.encharge_id]))[0]
                await D.del('fact_service',{fserv_fact_id:f.fact_id})
                //Suppression facture
                await D.del('facture',{fact_id:f.fact_id})
            }

            //Mbola misy consulaltion
            let cons = (await D.exec_params('select * from consultation where cons_pat_id = ?',[pat_id]))[0]
            if(cons != undefined){
                await D.del('consultation',{cons_id:cons.cons_id})
            }
            //zay vao vita ny suppresion ana Patient

            //Suppression du patient dans la grande liste
            await D.del('patient',{pat_id})
            //Ici tous les fonctions sur l'enregistrement d'un patient
            return res.send({status:true,message:"patient supprimé."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée. Il est possible que le patient n'existe plus"})
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
        // filters.search = (!filters.search)?'%':`%${filters.search}%`

        //test d'utilisation de regexp
        let msearch = filters.search.trim().split(' ').map(x => (x)?`${x}.*`:'')
        msearch = (msearch)?`${msearch.join('')}|${msearch.reverse().join('')}`:''
        msearch = (msearch)?msearch:'.*'

        console.log(msearch)
        if(msearch == '|') msearch = '%%'

        try { 
            //A reserver recherche par nom_prenom
            // let reponse = await D.exec_params(`select * from patient order by ${filters.sort_by} limit ? offset ?`,[
            //     filters.limit,
            //     (filters.page-1)*filters.limit
            // ])

            let reponse = await D.exec_params(`select * from patient where pat_nom_et_prenom ${ (msearch == '%%')?'like ?':'REGEXP (?)' } order by ${filters.sort_by} limit ?`,
            [msearch,filters.limit])

            //Liste total des patient
            let nb_total_patient = (await D.exec('select count(*) as nb from patient'))[0].nb

            return res.send({status:true,reponse,nb_total_patient})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async update(req,res){ 
        let p = req.body  

        delete p.pat_date_enreg
        p.pat_date_naiss = (p.pat_date_naiss)?new Date(p.pat_date_naiss):null
        try {
            await D.updateWhere('patient',p,{pat_id:p.pat_id})
                //Ici tous les fonctions sur l'enregistrement d'un patient
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
            let patients = await D.exec_params(`select * from patient where ${by} like ? or pat_nom_et_prenom like ? limit 50`,[search,search])

            return res.send({status:true,patients})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Patient;
