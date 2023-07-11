let D = require('../models/data')

class Entreprise{
    static async register(req,res){ 
        
        let _d = req.body; 
        let {user_id} = _d
        let entreprise_data={
            ent_num_compte:{front_name:'ent_num_compte',fac:true},
            ent_label:{front_name:'ent_label',fac:true}, 
            ent_code:{front_name:'ent_code',fac:true}, 
            ent_pat_percent:{front_name:'ent_pat_percent',fac:true}, 
            ent_soc_percent:{front_name:'ent_soc_percent',fac:true}, 
            ent_adresse:{front_name:'ent_adresse',fac:true}, 
            ent_date_enreg :{front_name:'ent_date_enreg',fac:true,format:()=> new Date()}, 
        };

        //Vérification du entreprise
        const _pd_keys = Object.keys(entreprise_data)
        let _tmp = {}
        let _list_error = []
        
        try {
            _pd_keys.forEach((v,i)=>{
                _tmp = entreprise_data[v]
                if(!_tmp.fac && !_d[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })
            
            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
    
            //Si la vérification c'est bien passé, 
            // on passe à l'insertion du entreprise
            let _data = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = entreprise_data[v]
    
                _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                _data[v] = _d[_tmp.front_name]
            })
            
            //l'objet entreprise est rempli maintenant
            // on l'insert dans la base de donnée
            _data.ent_group_label = _data.ent_label

            let ee = await D.set('entreprise',_data)

            //historique de l'utilisateur
            let hist = {
                uh_user_id:user_id,
                uh_code:req.uh.add_soc.k,
                uh_description:req.uh.add_soc.l,
                uh_module:'Prise en charge',
                uh_extras:JSON.stringify({
                    datas:{
                        soc:(await D.exec_params('select * from entreprise where ent_id = ?',[ee.insertId]))[0]
                    }
                })
            }
            await D.set('user_historic',hist)
            //Fin historique
            //Ici tous les fonctions sur l'enregistrement d'un entreprise
            return res.send({status:true,message:"entreprise bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }


    }

    static async delete(req,res){
        try {   
            let {ent_id} = req.params
            let {user_id} = req.query

            //historique de l'utilisateur
            let hist = {
                uh_user_id:user_id,
                uh_code:req.uh.add_soc.k,
                uh_description:req.uh.add_soc.l,
                uh_module:'Prise en charge',
                uh_extras:JSON.stringify({
                    datas:{
                        soc:(await D.exec_params('select * from entreprise where ent_id = ?',[ent_id]))[0]
                    }
                })
            }
            await D.set('user_historic',hist)
            //Fin historique

            await D.del('entreprise',{ent_id})
            //Ici tous les fonctions sur l'enregistrement d'un entreprise
            return res.send({status:true,message:"entreprise supprimé."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
 
    }  
    
    static async getList(req,res){ 
        let filters = req.query

        let _obj_pat = {
            ent_id:'ent_id',
            ent_label:'ent_label',
            ent_date_enreg:'ent_date_enreg',
        } 
        let default_sort_by = 'ent_id'

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?1000:parseInt(filters.limit)
        filters.sort_by = (!filters.sort_by)?_obj_pat[default_sort_by]:_obj_pat[filters.sort_by]

        try { 
            //A reserver recherche par nom_prenom
            let reponse = await D.exec_params(`select * from entreprise order by ${filters.sort_by} limit ? offset ?`,[
                filters.limit,
                (filters.page-1)*filters.limit
            ])

            //Liste total des entreprise
            let nb_total_entreprise = (await D.exec('select count(*) as nb from entreprise'))[0].nb

            return res.send({status:true,reponse,nb_total_entreprise})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async update(req,res){ 
        let e = req.body 
        
        let {user_id} = e


        if(!e.ent_label) return res.send({status:false,message:`Le nom ne peut pas être vide`})
        delete e.user_id
        delete e.ent_date_enreg

        if(!e.ent_group_label) e.ent_group_label = e.ent_label

        let old = (await D.exec_params('select * from entreprise where ent_id = ?',[e.ent_id]))[0]


        try {  
            await D.updateWhere('entreprise',e,{ent_id:e.ent_id})

            //historique de l'utilisateur
            let hist = {
                uh_user_id:user_id,
                uh_code:req.uh.modif_soc.k,
                uh_description:req.uh.modif_soc.l,
                uh_module:'Prise en charge',
                uh_extras:JSON.stringify({
                    datas:{
                        soc:old
                    }
                })
            }
            await D.set('user_historic',hist)
            //Fin historique

            //Ici tous les fonctions sur l'enregistrement d'un entreprise
            return res.send({status:true,message:"Mise à jour, fait"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async outSearch(req,res){
        try {
            let  {by,search} = req.query

            search = `%${search}%`
            
            let ents = await D.exec_params(`select * from entreprise where ${by} like ? or ent_label like ?`,[search,search])

            return res.send({status:true,ents})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async search(req,res){
        try {
            let {search,limit} = req.query
            search = `%${search}%`
            limit = parseInt(limit)
            let ents = await D.exec_params(`select * from entreprise where ent_label like ? or ent_code like ? limit ?`,[search,search,limit])
            return res.send({status:true,ents})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Entreprise;
