let D = require('../models/data')

class Fact_service{
    static async register(req,res){ 
        
        let _d= req.body; 

        // console.log(_d)
        let fact_service_data={
            fserv_qt:{front_name:'fserv_qt',fac:true},
            fserve_fac_id:{front_name:'fserve_fac_id',fac:true},
            fserve_serv_id:{front_name:'fserve_serv_id',fac:true},
            fserve_prix_unitaire:{front_name:'fserve_prix_unitaire',fac:true},
            fserve_montant:{front_name:'fserve_montant',fac:true},
            fserve_prix_patient:{front_name:'fserve_prix_patient',fac:true},
            fserve_prix_societe:{front_name:'fserve_prix_societe',fac:true},
        };

        //Vérification du fact_service
        const _pd_keys = Object.keys(fact_service_data)
        let _tmp = {}
        let _list_error = []
        
        try {
            _pd_keys.forEach((v,i)=>{
                _tmp = fact_service_data[v]
                if(!_tmp.fac && !_d[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })
            
            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
    
            //Si la vérification c'est bien passé, 
            // on passe à l'insertion du fact_service
            let _data = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = fact_service_data[v]
    
                _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                 
                _data[v] = _d[_tmp.front_name]
            })
            
            //l'objet fact_service est rempli maintenant
            // on l'insert dans la base de donnée

            await D.set('fact_service',_data)
            //Ici tous les fonctions sur l'enregistrement d'un fact_service
            return res.send({status:true,message:"fact_service bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }


    }

    static async delete(req,res){
        try {   
            await D.del('fact_service',req.params)
            //Ici tous les fonctions sur l'enregistrement d'un fact_service
            return res.send({status:true,message:"fact_service supprimé."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
 
    }  
    
    static async getList(req,res){ 
        let filters = req.query

        let _obj_pat = {
            fserv_id:'fserv_id',
            fserve_serv_id:'fserve_serv_id',
            fserve_montant:'fserve_montant',
        } 
        let default_sort_by = 'fserv_id'

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?10000:parseInt(filters.limit)
        filters.sort_by = (!filters.sort_by)?_obj_pat[default_sort_by]:_obj_pat[filters.sort_by]
        filters.search = (!filters.search)?'%':`%${filters.search}%`

        try { 
            //A reserver recherche par nom_prenom
            // let reponse = await D.exec_params(`select * from fact_service order by ${filters.sort_by} limit ? offset ?`,[
            //     filters.limit,
            //     (filters.page-1)*filters.limit
            // ])

            let reponse = await D.exec_params(`select * from fact_service where pat_nom_et_prenom like ? order by ${filters.sort_by} limit ?`,[filters.search,filters.limit])

            //Liste total des fact_service
            let nb_total_fact_service = (await D.exec('select count(*) as nb from fact_service'))[0].nb

            return res.send({status:true,reponse,nb_total_fact_service})
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
                await D.updateWhere('fact_service',element,array[0]) 
            }
                //Ici tous les fonctions sur l'enregistrement d'un fact_service
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
            let fact_services = await D.exec_params(`select * from fact_service where ${by} like ?`,search)

            return res.send({status:true,fact_services})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Fact_service;
