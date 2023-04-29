let D = require('../models/data')

class Versement{
    static async register(req,res){ 
        
        let _d= req.body; 
        let versement_data={
            versmnt_id:{front_name:'versmnt_id',fac:true},
            dep_id:{front_name:'dep_id',fac:true ,format:(a)=>parseInt(a)},
            versmnt_date_versement:{front_name:'versmnt_date_versement',fac:false ,format:(a)=>parseInt(a)}, 
            versmnt_font_caisse:{front_name:'versmnt_font_caisse',fac:true ,format:(a)=>parseInt(a)}, 
            versmnt_recette_esp:{front_name:'versmnt_recette_esp',fac:true ,format:(a)=>parseInt(a)},
            versmnt_recette_total:{front_name:'versmnt_recette_total',fac:true ,format:(a)=>parseInt(a)},
            versmnt_total_cheque:{front_name:'versmnt_total_cheque',fac:true ,format:(a)=>parseInt(a)},
            versmnt_total_versement:{front_name:'versmnt_total_versement',fac:true ,format:(a)=>parseInt(a)},
            versmnt_remborser:{front_name:'versmnt_remborser',fac:true ,format:(a)=>parseInt(a)},
         
        };

        //Vérification du versement
        const _pd_keys = Object.keys(versement_data)
        let _tmp = {}
        let _list_error = []
        
        try {
            _pd_keys.forEach((v,i)=>{
                _tmp = versement_data[v]
                if(!_tmp.fac && !_d[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })
            
            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
    
            //Si la vérification c'est bien passé, 
            // on passe à l'insertion du versement
            let _data = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = versement_data[v]
    
                _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                 
                _data[v] = _d[_tmp.front_name]
            })
            
            //l'objet versement est rempli maintenant
            // on l'insert dans la base de donnée

            await D.set('versement',_data)
            //Ici tous les fonctions sur l'enregistrement d'un versement
            return res.send({status:true,message:"versement bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }


    }

    static async delete(req,res){
        try {   
            await D.del('versement',req.body)
            //Ici tous les fonctions sur l'enregistrement d'un versement
            return res.send({status:true,message:"versement supprimé."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
 
    }  
    
    static async getList(req,res){ 
        let filters = req.query

        let _obj_pat = {
            versmnt_id:'versmnt_id',
            dep_id:'dep_id',
            versmnt_date_versement:'versmnt_date_versement',
        } 
        let default_sort_by = 'versmnt_id'

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?100:parseInt(filters.limit)
        filters.sort_by = (!filters.sort_by)?_obj_pat[default_sort_by]:_obj_pat[filters.sort_by]

        try { 
            //A reserver recherche par nom_prenom
            let reponse = await D.exec_params(`select * from versement order by ${filters.sort_by} limit ? offset ?`,[
                filters.limit,
                (filters.page-1)*filters.limit
            ])

            //Liste total des versement
            let nb_total_versement = (await D.exec('select count(*) as nb from versement'))[0].nb

            return res.send({status:true,reponse,nb_total_versement})
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
                await D.updateWhere('versement',element,array[0]) 
            }
                //Ici tous les fonctions sur l'enregistrement d'un versement
                return res.send({status:true,message:"Mise à jour, fait"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Versement;
