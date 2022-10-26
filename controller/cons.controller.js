let D = require('../models/data')

class Consutlation{
    static async register(req,res){ 
        
        let _d= req.body; 
        let consultation_data={
            pat_id:{front_name:'pat_id',fac:true},  
            ent_id:{front_name:'ent_id',fac:true},  
            cons_num_dos:{front_name:'cons_num_dos',fac:true},  
            cons_code:{front_name:'cons_code',fac:true},  
            cons_montant:{front_name:'cons_montant',fac:true},    
            cons_montant_calc:{front_name:'cons_montant_calc',fac:false},
            cons_med:{front_name:'cons_med',fac:false},
        };

        //Vérification du consultation
        const _pd_keys = Object.keys(consultation_data)
        let _tmp = {}
        let _list_error = []
        
        try {
            _pd_keys.forEach((v,i)=>{
                _tmp = consultation_data[v]
                if(!_tmp.fac && !_d[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })
            
            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
    
            //Si la vérification c'est bien passé, 
            // on passe à l'insertion du consultation
            let _data = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = consultation_data[v]
    
                _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                 
                _data[v] = _d[_tmp.front_name]
            })
            
            //l'objet consultation est rempli maintenant
            // on l'insert dans la base de donnée

            await D.set('consultation',_data)
            //Ici tous les fonctions sur l'enregistrement d'un consultation
            return res.send({status:true,message:"consultation bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }


    }

    static async delete(req,res){
        try {   
            await D.del('consultation',req.body)
            //Ici tous les fonctions sur l'enregistrement d'un consultation
            return res.send({status:true,message:"consultation supprimé."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
 
    }  
    
    static async getList(req,res){ 
        let filters = req.query

        let _obj_pat = {
            pat_id:'pat_id',
            consultation_stock_init:'consultation_stock_init',
            cons_date_enreg:'cons_date_enreg',
        } 
        let default_sort_by = 'pat_id'

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?100:parseInt(filters.limit)
        filters.sort_by = (!filters.sort_by)?_obj_pat[default_sort_by]:_obj_pat[filters.sort_by]

        try { 
            //A reserver recherche par nom_prenom
            let reponse = await D.exec_params(`select * from consultation order by ${filters.sort_by} limit ? offset ?`,[
                filters.limit,
                (filters.page-1)*filters.limit
            ])

            //Liste total des consultation
            let nb_total_consultation = (await D.exec('select count(*) as nb from consultation'))[0].nb

            return res.send({status:true,reponse,nb_total_consultation})
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
                await D.updateWhere('consultation',element,array[0]) 
            }
                //Ici tous les fonctions sur l'enregistrement d'un consultation
                return res.send({status:true,message:"Mise à jour, fait"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Consutlation;
