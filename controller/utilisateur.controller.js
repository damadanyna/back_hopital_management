let utils = require('../utils/utils')
let D = require('../models/data')

class Utilisateur{
    static async register(req,res){ 
        
        let _d= req.body;
        
        let utilisateur_data={
            util_id:{front_name:'util_id',fac:true},
            util_label:{front_name:'util_label',fac:false},
            util_login :{front_name:'util_login',fac:false},
            util_mdp :{front_name:'util_mdp',fac:false,},
            util_type :{front_name:'util_type',fac:false},
            util_date_enreg :{front_name:'util_date_enreg',fac:true,format:(a) => new Date()},
        };

        //Vérification du utilisateur
        const _pd_keys = Object.keys(utilisateur_data)
        let _tmp = {}
        let _list_error = []
        
        try {
            _pd_keys.forEach((v,i)=>{
                _tmp = utilisateur_data[v]
                if(!_tmp.fac && !_d[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })
    
             

            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
    
            //Si la vérification c'est bien passé, 
            // on passe à l'insertion du utilisateur
            let _data = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = utilisateur_data[v]

                if(_tmp.format != undefined){
                    _d[_tmp.front_name] = _tmp.format(_d[_tmp.front_name])
                }
            
                _data[v] = _d[_tmp.front_name]
            })

            //Hashage de mot de passe
            _data['util_mdp'] = await utils.hash(_data['util_mdp'])
            
            //l'objet utilisateur est rempli maintenant
            // on l'insert dans la base de donnée

            await D.set('utilisateur',_data)
            //Ici tous les fonctions sur l'enregistrement d'un utilisateur
            return res.send({status:true,message:"user bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }


    }

    static async deleteUser(req,res){
        try { 

            let util_id = req.params.util_id
            let user_id = req.query.user_id


            await D.del('utilisateur',{util_id})

            return res.send({status:true,message:"Utilisateur bien supprimé"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
 
    }  

    //Récupération des détails des utilisateurs
    static async getDetailsUser(req,res){
        try {

            let {id} = req.params

            //Récupération d'un simple utilisateur
            let user = (await D.exec_params('select * from utilisateur where util_id = ?',id))[0]

            //Récupération accès modules
            let user_access = await D.exec_params(`select * from module
            left join util_access on module_id = ua_module_id
            where ua_util_id = ? or ua_module_id is null`,[id])



            //On récupère d'abord la liste des modules
            let module_list = await D.exec('select * from module')
            let _tmp = {}

            //puis on recherche dans util_access la combinaison util_id et module_id
            for (let i = 0; i < module_list.length; i++) {
                const e = module_list[i];
                _tmp = await D.exec_params('select * from util_access where ua_module_id = ? and ua_util_id = ?',[e.module_id,id])
                module_list[i]['in_user'] = (_tmp.length > 0)?1:0
            }

            // console.log(user);

            return res.send({status:true,user,user_access,module_list})

        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async setAccess(req,res){
        try {
            let id_module = req.body.id_module
            let util_id = req.params.util_id

            let _f = await D.exec_params(`select * from util_access where ua_module_id = ? and ua_util_id = ?`,[id_module,util_id])
            
            if(_f.length > 0){
                await D.exec_params(`delete from util_access where ua_util_id = ? and ua_module_id = ?`,[util_id,id_module])
            }else{
                await D.set('util_access',{
                    ua_module_id:id_module,
                    ua_util_id:util_id
                })
                
            }

            return res.send({status:true})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
    
    static async getList(req,res){


        let filters = req.query
        let _obj_pat = {
            util_id:'util_id',
            util_label:'util_label',
        } 
        let default_sort_by = 'util_id'

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?100:parseInt(filters.limit)
        filters.sort_by = (!filters.sort_by)?_obj_pat[default_sort_by]:_obj_pat[filters.sort_by]

        try { 
            //A reserver recherche par nom_prenom
            let reponse = await D.exec_params(`select * from utilisateur where util_type <> 'm'  order by ${filters.sort_by} limit ? offset ? `,[
                filters.limit,
                (filters.page-1)*filters.limit
            ])

            //Liste total des utilisateur
            let nb_total_utilisateur = (await D.exec('select count(*) as nb from utilisateur'))[0].nb

            return res.send({status:true,reponse,nb_total_utilisateur})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
    static async update(req,res){ 
        let {user,mng_pass} = req.body 
        delete user.util_date_enreg

        try { 
            if(mng_pass.change){
                user.util_mdp = await utils.hash(mng_pass.pass)
            }else{
                delete user.util_mdp
            }

            if(!user.util_login || !user.util_label){
                return res.send({status:false,message:"Certains champs sont vide"})
            }
            
            await D.updateWhere('utilisateur',user,{util_id:user.util_id})
            //Ici tous les fonctions sur l'enregistrement d'un utilisateur
            return res.send({status:true,message:"Mise à jour, fait"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Utilisateur