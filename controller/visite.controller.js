let D = require('../models/data')

class Visite{
    static async register(req,res){ 
        
        let _d= req.body; 
        let visite_data={
            visite_id:{front_name:'visite_id',fac:true},
            pat_id:{front_name:'pat_id',fac:false}, 
            visite_date :{front_name:'visite_date',fac:false,format:(a)=> new Date(a)},
            viste_date_enreg :{front_name:'viste_date_enreg',fac:true,format:()=> new Date()},
        };

        //Vérification du visite
        const _pd_keys = Object.keys(visite_data)
        let _tmp = {}
        let _list_error = []
        
        try {
            _pd_keys.forEach((v,i)=>{
                _tmp = visite_data[v]
                if(!_tmp.fac && !_d[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })
            
            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
    
            //Si la vérification c'est bien passé, 
            // on passe à l'insertion du visite
            let _data = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = visite_data[v]
    
                _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                 
                _data[v] = _d[_tmp.front_name]
            })
            
            //l'objet visite est rempli maintenant
            // on l'insert dans la base de donnée

            await D.set('visite',_data)
            //Ici tous les fonctions sur l'enregistrement d'un visite
            return res.send({status:true,message:"visite bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }


    }

    static async delete(req,res){
        try {   
            await D.del('visite',req.body)
            //Ici tous les fonctions sur l'enregistrement d'un visite
            return res.send({status:true,message:"visite supprimé."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
 
    }  
    
    static async getList(req,res){ 
        let filters = req.query

        let _obj_pat = {
            visite_id:'visite_id',
            visite_date:'visite_date',
        } 
        let default_sort_by = 'visite_id'

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?100:parseInt(filters.limit)
        filters.sort_by = (!filters.sort_by)?_obj_pat[default_sort_by]:_obj_pat[filters.sort_by]

        try { 
            //A reserver recherche par nom_prenom
            let reponse = await D.exec_params(`select * from visite order by ${filters.sort_by} limit ? offset ?`,[
                filters.limit,
                (filters.page-1)*filters.limit
            ])

            //Liste total des visite
            let nb_total_visite = (await D.exec('select count(*) as nb from visite'))[0].nb

            return res.send({status:true,reponse,nb_total_visite})
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
                await D.updateWhere('visite',element,array[0]) 
            }
                //Ici tous les fonctions sur l'enregistrement d'un visite
                return res.send({status:true,message:"Mise à jour, fait"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Visite