let D = require('../models/data')

class Depot{
    static async register(req,res){ 
        
        let _d= req.body; 
        let depot_data={
            depot_id:{front_name:'depot_id',fac:true},  
            depot_date_enreg :{front_name:'depot_date_enreg',fac:false,format:()=> new Date()},
            id_parent_article:{front_name:'id_parent_article',fac:false ,format:(a)=>parseInt(a)},
            depot_stock_init:{front_name:'depot_stock_init',fac:false ,format:(a)=>parseInt(a)},
            depot_stock_final:{front_name:'depot_stock_final',fac:false ,format:(a)=>parseInt(a)},
        };

        //Vérification du depot
        const _pd_keys = Object.keys(depot_data)
        let _tmp = {}
        let _list_error = []
        
        try {
            _pd_keys.forEach((v,i)=>{
                _tmp = depot_data[v]
                if(!_tmp.fac && !_d[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })
            
            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
    
            //Si la vérification c'est bien passé, 
            // on passe à l'insertion du depot
            let _data = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = depot_data[v]
    
                _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                 
                _data[v] = _d[_tmp.front_name]
            })
            
            //l'objet depot est rempli maintenant
            // on l'insert dans la base de donnée

            await D.set('depot',_data)
            //Ici tous les fonctions sur l'enregistrement d'un depot
            return res.send({status:true,message:"depot bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }


    }

    static async delete(req,res){
        try {   
            await D.del('depot',req.body)
            //Ici tous les fonctions sur l'enregistrement d'un depot
            return res.send({status:true,message:"depot supprimé."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
 
    }  
    
    static async getList(req,res){ 
        let filters = req.query

        let _obj_pat = {
            depot_id:'depot_id',
            depot_stock_init:'depot_stock_init',
            depot_date_enreg:'depot_date_enreg',
        } 
        let default_sort_by = 'depot_id'

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?100:parseInt(filters.limit)
        filters.sort_by = (!filters.sort_by)?_obj_pat[default_sort_by]:_obj_pat[filters.sort_by]

        try { 
            //A reserver recherche par nom_prenom
            let reponse = await D.exec_params(`select * from depot order by ${filters.sort_by} limit ? offset ?`,[
                filters.limit,
                (filters.page-1)*filters.limit
            ])

            //Liste total des depot
            let nb_total_depot = (await D.exec('select count(*) as nb from depot'))[0].nb

            return res.send({status:true,reponse,nb_total_depot})
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
                await D.updateWhere('depot',element,array[0]) 
            }
                //Ici tous les fonctions sur l'enregistrement d'un depot
                return res.send({status:true,message:"Mise à jour, fait"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Depot;
