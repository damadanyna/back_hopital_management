let D = require('../models/data')

class Hospitalisation{
    static async register(req,res){ 
        
        let _d= req.body; 
        let hospitalisation_data={
            hosp_id:{front_name:'hosp_id',fac:true},
            util_id:{front_name:'util_id',fac:true ,format:(a)=>parseInt(a)},
            pat_id:{front_name:'pat_id',fac:true ,format:(a)=>parseInt(a)},
            dep_id:{front_name:'dep_id',fac:true ,format:(a)=>parseInt(a)},
            ent_id:{front_name:'ent_id',fac:true ,format:(a)=>parseInt(a)},
            tarif_id:{front_name:'tarif_id',fac:true ,format:(a)=>parseInt(a)},
            hops_total_payer:{front_name:'hops_total_payer',fac:false ,format:(a)=>parseInt(a)},
            hops_total_avancer:{front_name:'hops_total_avancer',fac:false ,format:(a)=>parseInt(a)},
            hops_rest_apayer:{front_name:'hops_rest_apayer',fac:false ,format:(a)=>parseInt(a)},
            hosp_date_entrer :{front_name:'hosp_date_entrer',fac:true,format:(a)=> new Date(a)},
            hosp_date_sorti :{front_name:'hosp_date_sorti',fac:true,format:(a)=> new Date(a)},
            hosp_date_enreg :{front_name:'hosp_date_enreg',fac:true,format:()=> new Date()},
            
        };

        //Vérification du hospitalisation
        const _pd_keys = Object.keys(hospitalisation_data)
        let _tmp = {}
        let _list_error = []
        
        try {
            _pd_keys.forEach((v,i)=>{
                _tmp = hospitalisation_data[v]
                if(!_tmp.fac && !_d[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })
            
            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
    
            //Si la vérification c'est bien passé, 
            // on passe à l'insertion du hospitalisation
            let _data = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = hospitalisation_data[v]
    
                _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                 
                _data[v] = _d[_tmp.front_name]
            })
            
            //l'objet hospitalisation est rempli maintenant
            // on l'insert dans la base de donnée

            await D.set('hospitalisation',_data)
            //Ici tous les fonctions sur l'enregistrement d'un hospitalisation
            return res.send({status:true,message:"hospitalisation bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }


    }

    static async delete(req,res){
        try {   
            await D.del('hospitalisation',req.body)
            //Ici tous les fonctions sur l'enregistrement d'un hospitalisation
            return res.send({status:true,message:"hospitalisation supprimé."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
 
    }  
    
    static async getList(req,res){ 
        let filters = req.query

        let _obj_pat = {
            hosp_id:'hosp_id',
            hosp_date_entrer:'hosp_date_entrer',
            hosp_date_enreg:'hosp_date_enreg',
        } 
        let default_sort_by = 'hosp_id'

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?100:parseInt(filters.limit)
        filters.sort_by = (!filters.sort_by)?_obj_pat[default_sort_by]:_obj_pat[filters.sort_by]

        try { 
            //A reserver recherche par nom_prenom
            let reponse = await D.exec_params(`select * from hospitalisation order by ${filters.sort_by} limit ? offset ?`,[
                filters.limit,
                (filters.page-1)*filters.limit
            ])

            //Liste total des hospitalisation
            let nb_total_hospitalisation = (await D.exec('select count(*) as nb from hospitalisation'))[0].nb

            return res.send({status:true,reponse,nb_total_hospitalisation})
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
                await D.updateWhere('hospitalisation',element,array[0]) 
            }
                //Ici tous les fonctions sur l'enregistrement d'un hospitalisation
                return res.send({status:true,message:"Mise à jour, fait"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Hospitalisation;
