let D = require('../models/data')

class Detail{
    static async register(req,res){ 
        
        let _d= req.body; 
        let detail_data={
            detail_id:{front_name:'detail_id',fac:true},
            service_id:{front_name:'service_id',fac:true ,format:(a)=>parseInt(a)},
            pat_id:{front_name:'pat_id',fac:true ,format:(a)=>parseInt(a)},
            cais_id:{front_name:'cais_id',fac:true ,format:(a)=>parseInt(a)},
            detail_label:{front_name:'detail_label',fac:false}, 
            is_save:{front_name:'is_save',fac:false}, 
            detail_nombre:{front_name:'detail_nombre',fac:false ,format:(a)=>parseInt(a)},
            detail_p_u:{front_name:'detail_p_u',fac:false ,format:(a)=>parseInt(a)},
            detail_date_enreg :{front_name:'detail_date_enreg',fac:true,format:()=> new Date()},
            
        };

        //Vérification du detail
        const _pd_keys = Object.keys(detail_data)
        let _tmp = {}
        let _list_error = []
        
        try {
            _pd_keys.forEach((v,i)=>{
                _tmp = detail_data[v]
                if(!_tmp.fac && !_d[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })
            
            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
    
            //Si la vérification c'est bien passé, 
            // on passe à l'insertion du detail
            let _data = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = detail_data[v]
    
                _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                 
                _data[v] = _d[_tmp.front_name]
            })
            
            //l'objet detail est rempli maintenant
            // on l'insert dans la base de donnée

            await D.set('detail',_data)
            //Ici tous les fonctions sur l'enregistrement d'un detail
            return res.send({status:true,message:"detail bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }


    }

    static async delete(req,res){
        try {   
            await D.del('detail',req.body)
            //Ici tous les fonctions sur l'enregistrement d'un detail
            return res.send({status:true,message:"detail supprimé."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
 
    }  
    
    static async getList(req,res){ 
        let filters = req.query

        let _obj_pat = {
            detail_id:'detail_id',
            detail_label:'detail_label',
            detail_date_enreg:'detail_date_enreg',
        } 
        let default_sort_by = 'detail_id'

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?100:parseInt(filters.limit)
        filters.sort_by = (!filters.sort_by)?_obj_pat[default_sort_by]:_obj_pat[filters.sort_by]

        try { 
            //A reserver recherche par nom_prenom
            let reponse = await D.exec_params(`select * from detail order by ${filters.sort_by} limit ? offset ?`,[
                filters.limit,
                (filters.page-1)*filters.limit
            ])

            //Liste total des detail
            let nb_total_detail = (await D.exec('select count(*) as nb from detail'))[0].nb

            return res.send({status:true,reponse,nb_total_detail})
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
                await D.updateWhere('detail',element,array[0]) 
            }
                //Ici tous les fonctions sur l'enregistrement d'un detail
                return res.send({status:true,message:"Mise à jour, fait"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Detail;
