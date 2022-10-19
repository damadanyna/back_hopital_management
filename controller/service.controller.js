let D = require('../models/data')

class Service{
    static async register(req,res){ 
        
        let _d= req.body; 
        let service_data={
            service_id:{front_name:'service_id',fac:true},
            service_label:{front_name:'service_label',fac:false}, 
            service_date_enreg :{front_name:'service_date_enreg',fac:true,format:()=> new Date()},
            
        };

        //Vérification du service
        const _pd_keys = Object.keys(service_data)
        let _tmp = {}
        let _list_error = []
        
        try {
            _pd_keys.forEach((v,i)=>{
                _tmp = service_data[v]
                if(!_tmp.fac && !_d[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })
            
            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
    
            //Si la vérification c'est bien passé, 
            // on passe à l'insertion du service
            let _data = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = service_data[v]
    
                _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                 
                _data[v] = _d[_tmp.front_name]
            })
            
            //l'objet service est rempli maintenant
            // on l'insert dans la base de donnée

            await D.set('service',_data)
            //Ici tous les fonctions sur l'enregistrement d'un service
            return res.send({status:true,message:"service bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }


    }

    static async delete(req,res){
        try {   
            await D.del('service',req.body)
            //Ici tous les fonctions sur l'enregistrement d'un service
            return res.send({status:true,message:"service supprimé."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
 
    }  
    
    static async getList(req,res){ 
        let filters = req.query

        let _obj_pat = {
            service_id:'service_id',
            service_label:'service_label',
            service_date_enreg:'service_date_enreg',
        } 
        let default_sort_by = 'service_id'

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?100:parseInt(filters.limit)
        filters.sort_by = (!filters.sort_by)?_obj_pat[default_sort_by]:_obj_pat[filters.sort_by]

        try { 
            //A reserver recherche par nom_prenom
            let reponse = await D.exec_params(`select * from service order by ${filters.sort_by} limit ? offset ?`,[
                filters.limit,
                (filters.page-1)*filters.limit
            ])

            //Liste total des service
            let nb_total_service = (await D.exec('select count(*) as nb from service'))[0].nb

            return res.send({status:true,reponse,nb_total_service})
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
                await D.updateWhere('service',element,array[0]) 
            }
                //Ici tous les fonctions sur l'enregistrement d'un service
                return res.send({status:true,message:"Mise à jour, fait"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Service;
