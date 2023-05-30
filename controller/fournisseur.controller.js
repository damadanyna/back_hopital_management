let D = require('../models/data')

class Fournisseur{
    static async register(req,res){ 
        
        let _d = req.body; 
        let {user_id} = _d
        let fournisseur_data={
            fourn_id:{front_name:'fourn_id',fac:true},
            fourn_label:{front_name:'fourn_label',fac:false}, 
            fourn_date_enreg :{front_name:'fourn_date_enreg',fac:true,format:()=> new Date()},
            fourn_adresse:{front_name:'fourn_adresse',fac:true },
            fourn_code:{front_name:'fourn_code',fac:true },
            fourn_nif:{front_name:'fourn_nif',fac:true },
            fourn_stat:{front_name:'fourn_stat',fac:true },
            fourn_info:{front_name:'fourn_info',fac:true },
            fourn_tva:{front_name:'fourn_tva',fac:true },
        };

        //Vérification du fournisseur
        const _pd_keys = Object.keys(fournisseur_data)
        let _tmp = {}
        let _list_error = []
        
        try {
            _pd_keys.forEach((v,i)=>{
                _tmp = fournisseur_data[v]
                if(!_tmp.fac && !_d[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })
            
            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
    
            //Si la vérification c'est bien passé, 
            // on passe à l'insertion du Fournisseur
            let _data = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = fournisseur_data[v]
    
                _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                 
                _data[v] = _d[_tmp.front_name]
            })
            
            //l'objet Fournisseur est rempli maintenant
            // on l'insert dans la base de donnée

            let ff = await D.set('fournisseur',_data)
            //historique de l'utilisateur
            let hist = {
                uh_user_id:user_id,
                uh_code:req.uh.add_fourn.k,
                uh_description:req.uh.add_fourn.l,
                uh_module:'Stock',
                uh_extras:JSON.stringify({
                    datas:{
                        fourn:(await D.exec_params('select * from fournisseur where fourn_id = ?',[ff.insertId]))[0]
                    }
                })
            }

            await D.set('user_historic',hist)
            //Ici tous les fonctions sur l'enregistrement d'un fournisseur
            return res.send({status:true,message:"fournisseur bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }


    }

    static async delete(req,res){
        try {   

            let {fourn_id} = req.params
            let {user_id} = req.query


            let old = (await D.exec_params('select * from fournisseur where fourn_id = ?',[fourn_id]))[0]

            // console.log(req.params);
            await D.del('fournisseur',{fourn_id})

            //historique de l'utilisateur
            let hist = {
                uh_user_id:user_id,
                uh_code:req.uh.modif_dep.k,
                uh_description:req.uh.modif_dep.l,
                uh_module:'Stock',
                uh_extras:JSON.stringify({
                    datas:{
                        fourn:old,
                    }
                })
            }

            await D.set('user_historic',hist)
            //Ici tous les fonctions sur l'enregistrement d'un fournisseur
            return res.send({status:true,message:"fournisseur supprimé."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
 
    }  
    
    static async getList(req,res){ 
        let filters = req.query

        let _obj_pat = {
            fourn_id:'fourn_id',
            fourn_label:'fourn_label',
            fourn_date_enreg:'fourn_date_enreg',
        } 
        let default_sort_by = 'fourn_id'

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?100:parseInt(filters.limit)
        filters.sort_by = (!filters.sort_by)?_obj_pat[default_sort_by]:_obj_pat[filters.sort_by]

        try { 
            //A reserver recherche par nom_prenom
            let reponse = await D.exec_params(`select * from fournisseur order by ${filters.sort_by} limit ? offset ?`,[
                filters.limit,
                (filters.page-1)*filters.limit
            ])

            //Liste total des fournisseur
            let nb_total_fournisseur = (await D.exec('select count(*) as nb from fournisseur'))[0].nb

            return res.send({status:true,reponse,nb_total_fournisseur})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async update(req,res){ 
        let data = req.body 
        let {user_id} = data

        delete data.user_id
        delete data.fourn_date_enreg

        let old = (await D.exec_params('select * from fournisseur where fourn_id = ?',[data.fourn_id]))[0]

        try {  
            await D.updateWhere('fournisseur',data,{fourn_id:data.fourn_id})

            //historique de l'utilisateur
            let hist = {
                uh_user_id:user_id,
                uh_code:req.uh.modif_fourn.k,
                uh_description:req.uh.modif_fourn.l,
                uh_module:'Stock',
                uh_extras:JSON.stringify({
                    datas:{
                        fourn:old,
                        fourn_n:data
                    }
                })
            }

            await D.set('user_historic',hist)
            //fin historique


            return res.send({status:true,message:"Mise à jour, fait"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Fournisseur;
