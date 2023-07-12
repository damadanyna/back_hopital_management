let D = require('../models/data')

class Departement{
    static async register(req,res){ 
        
        let _d = req.body; 
        let {user_id} = _d
        let departement_data={
            dep_id:{front_name:'dep_id',fac:true},
            dep_label:{front_name:'dep_label',fac:false}, 
            dep_code:{front_name:'dep_code',fac:false}, 
            dep_date_enreg :{front_name:'dep_date_enreg',fac:true,format:()=> new Date()},
        };

        //Vérification du departement
        const _pd_keys = Object.keys(departement_data)
        let _tmp = {}
        let _list_error = []
        
        try {
            _pd_keys.forEach((v,i)=>{
                _tmp = departement_data[v]
                if(!_tmp.fac && !_d[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })
            
            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
    
            //Si la vérification c'est bien passé, 
            // on passe à l'insertion du departement
            let _data = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = departement_data[v]
    
                _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                 
                _data[v] = _d[_tmp.front_name]
            })


            _data['dep_code'] = _data.dep_code.toUpperCase()
            
            //l'objet departement est rempli maintenant
            // on l'insert dans la base de donnée

            let ddd = await D.set('departement',_data)

            //historique de l'utilisateur
            let hist = {
                uh_user_id:user_id,
                uh_code:req.uh.add_dep.k,
                uh_description:`${req.uh.add_dep.l} - ${_data.dep_label}`,
                uh_module:'Stock',
                uh_extras:JSON.stringify({
                    datas:{
                        dep:(await D.exec_params('select * from departement where dep_id = ? ',[ddd.insertId]))[0]
                    }
                })
            }

            await D.set('user_historic',hist)
            //Fin historique

            //Ici tous les fonctions sur l'enregistrement d'un departement
            return res.send({status:true,message:"departement bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }


    }

    static async delete(req,res){
        try {   
            let {dep_id} = req.params
            let {user_id} = req.query

            let old = (await D.exec_params('select * from departement where dep_id = ?',[dep_id]))[0]

            await D.del('departement',{dep_id})

            //historique de l'utilisateur
            let hist = {
                uh_user_id:user_id,
                uh_code:req.uh.del_dep.k,
                uh_description:`${req.uh.del_dep.l} - ${old.dep_label}`,
                uh_module:'Stock',
                uh_extras:JSON.stringify({
                    datas:{
                        dep:old
                    }
                })
            }

            await D.set('user_historic',hist)
            //Fin historique
            //Ici tous les fonctions sur l'enregistrement d'un departement
            return res.send({status:true,message:"departement supprimé."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
 
    }  
    
    static async getList(req,res){ 
        let filters = req.query

        let _obj_pat = {
            dep_id:'dep_id',
            dep_label:'dep_label',
            dep_date_enreg:'dep_date_enreg',
        } 
        let default_sort_by = 'dep_id'

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?100:parseInt(filters.limit)
        filters.sort_by = (!filters.sort_by)?_obj_pat[default_sort_by]:_obj_pat[filters.sort_by]

        try { 
            //A reserver recherche par nom_prenom
            let reponse = await D.exec_params(`select * from departement order by ${filters.sort_by} limit ? offset ?`,[
                filters.limit,
                (filters.page-1)*filters.limit
            ])

            //Liste total des departement
            let nb_total_departement = (await D.exec('select count(*) as nb from departement'))[0].nb

            return res.send({status:true,reponse,nb_total_departement})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async update(req,res){ 
        let data = req.body

        let {user_id} = data
        delete data.user_id
        delete data.dep_date_enreg

        
        let old = (await D.exec_params('select * from departement where dep_id = ?',[data.dep_id]))[0]
        
        try {  
            await D.updateWhere('departement',data,{dep_id:data.dep_id})
            
            //historique de l'utilisateur
            let hist = {
                uh_user_id:user_id,
                uh_code:req.uh.modif_dep.k,
                uh_description:req.uh.modif_dep.l,
                uh_module:'Stock',
                uh_extras:JSON.stringify({
                    datas:{
                        dep:old,
                        dep_n:data
                    }
                })
            }

            await D.set('user_historic',hist)
            //Fin historique
            //Ici tous les fonctions sur l'enregistrement d'un departement
            return res.send({status:true,message:"Mise à jour, fait"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Departement;
