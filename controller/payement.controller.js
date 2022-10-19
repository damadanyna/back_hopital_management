let D = require('../models/data')

class Payement{
    static async register(req,res){ 
        
        let _d= req.body; 
        let payement_data={
            pai_id:{front_name:'pai_id',fac:true},
            pai_label:{front_name:'pai_label',fac:false}, 
            pai_date_enreg :{front_name:'pai_date_enreg',fac:true,format:()=> new Date()},
            
        };

        //Vérification du payement
        const _pd_keys = Object.keys(payement_data)
        let _tmp = {}
        let _list_error = []
        
        try {
            _pd_keys.forEach((v,i)=>{
                _tmp = payement_data[v]
                if(!_tmp.fac && !_d[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })
            
            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
    
            //Si la vérification c'est bien passé, 
            // on passe à l'insertion du payement
            let _data = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = payement_data[v]
    
                _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                 
                _data[v] = _d[_tmp.front_name]
            })
            
            //l'objet payement est rempli maintenant
            // on l'insert dans la base de donnée

            await D.set('payement',_data)
            //Ici tous les fonctions sur l'enregistrement d'un payement
            return res.send({status:true,message:"payement bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }


    }

    static async delete(req,res){
        try {   
            await D.del('payement',req.body)
            //Ici tous les fonctions sur l'enregistrement d'un payement
            return res.send({status:true,message:"payement supprimé."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
 
    }  
    
    static async getList(req,res){ 
        let filters = req.query

        let _obj_pat = {
            pai_id:'pai_id',
            pai_label:'pai_label',
            pai_date_enreg:'pai_date_enreg',
        } 
        let default_sort_by = 'pai_id'

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?100:parseInt(filters.limit)
        filters.sort_by = (!filters.sort_by)?_obj_pat[default_sort_by]:_obj_pat[filters.sort_by]

        try { 
            //A reserver recherche par nom_prenom
            let reponse = await D.exec_params(`select * from payement order by ${filters.sort_by} limit ? offset ?`,[
                filters.limit,
                (filters.page-1)*filters.limit
            ])

            //Liste total des payement
            let nb_total_payement = (await D.exec('select count(*) as nb from payement'))[0].nb

            return res.send({status:true,reponse,nb_total_payement})
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
                await D.updateWhere('payement',element,array[0]) 
            }
                //Ici tous les fonctions sur l'enregistrement d'un payement
                return res.send({status:true,message:"Mise à jour, fait"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Payement;
