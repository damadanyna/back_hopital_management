const { response } = require('express');
let D = require('../models/data')

class Consutlation{
    static async register(req,res){ 
        
        let _d = req.body; 
        
        let {user_id} = _d

        let consultation_data={
            cons_pat_id:{front_name:'cons_pat_id',fac:true},  
            cons_ent_id:{front_name:'cons_ent_id',fac:true},   
            cons_code:{front_name:'cons_code',fac:true},  
            cons_montant:{front_name:'cons_montant',fac:true},    
            cons_montant_calc:{front_name:'cons_montant_calc',fac:true},
            cons_medcin:{front_name:'cons_medcin',fac:true},
            cons_util_id:{front_name:'cons_util_id',fac:true},
            cons_num_dossier:{front_name:'cons_num_dossier',fac:true},
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

            //Insertion de util id
           /*  _data.cons_util_id = req.user.cons_util_id */

            let cc = await D.set('consultation',_data)

            //historique de l'utilisateur
            let hist = {
                uh_user_id:user_id,
                uh_code:req.uh.add_cons.k,
                uh_description:req.uh.add_cons.l,
                uh_module:'Prise en charge',
                uh_extras:JSON.stringify({
                    datas:{
                        cons:(await D.exec_params(`select * from consultation
                        left join patient on pat_id = cons_pat_id
                        where cons_id`,[cc.insertId]))[0]
                    }
                })
            }
            await D.set('user_historic',hist)
            //Fin historique

            //Ici tous les fonctions sur l'enregistrement d'un consultation
            return res.send({status:true,message:"consultation bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }


    }
 
    static async get_date_to(req,res){ 
        var response= new Date(req.params.date)
        return await res.send({response})
    }
    
    static async delete(req,res){
        try {   
            let {cons_id} = req.params
            let  {user_id} = req.query
            

            //historique de l'utilisateur
            let hist = {
                uh_user_id:user_id,
                uh_code:req.uh.del_cons.k,
                uh_description:req.uh.del_cons.l,
                uh_module:'Prise en charge',
                uh_extras:JSON.stringify({
                    datas:{
                        cons:(await D.exec_params(`select * from consultation
                        left join patient on pat_id = cons_pat_id
                        where cons_id`,[cons_id]))[0]
                    }
                })
            }
            await D.set('user_historic',hist)
            //Fin historique

            //Suppression de consultation
            await D.del('consultation',{cons_id})

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
            cons_date_enreg:'cons_date_enreg',
        } 
        let default_sort_by = 'cons_date_enreg'

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?100:parseInt(filters.limit)
        filters.sort_by = (!filters.sort_by)?_obj_pat[default_sort_by]:_obj_pat[filters.sort_by]

        try { 
            //A reserver recherche par nom_prenom
            let reponse = await D.exec_params(`select *,TIME(cons_date_enreg) as cons_time from consultation 
            left join patient on pat_id = cons_pat_id
            left join entreprise on ent_id = cons_ent_id
            where date(cons_date_enreg) = date(?)
            order by ${filters.sort_by} desc limit ? offset ?`,[
                new Date(filters.date),
                filters.limit,
                (filters.page-1)*filters.limit
            ])

            let nb_total_calc = 0,nb_total_esp = 0

            for (let i = 0; i < reponse.length; i++) {
                const e = reponse[i];
                if(e.cons_montant){
                    nb_total_esp += parseInt(e.cons_montant)
                }
                if(e.cons_montant_calc){
                    nb_total_calc += parseInt(e.cons_montant_calc)
                }
            }

            //Liste total des consultation
            let nb_total_consultation = (await D.exec('select count(*) as nb from consultation'))[0].nb

            return res.send({status:true,reponse,nb_total_consultation,nb_total_calc,nb_total_esp})
            
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

            // //historique de l'utilisateur
            // let hist = {
            //     uh_user_id:user_id,
            //     uh_code:req.uh.del_cons.k,
            //     uh_description:req.uh.del_cons.l,
            //     uh_module:'Prise en charge',
            //     uh_extras:JSON.stringify({
            //         datas:{
            //             cons:(await D.exec_params(`select * from consultation
            //             left join patient on pat_id = cons_pat_id
            //             where cons_id`,[cons_id]))[0]
            //         }
            //     })
            // }
            // await D.set('user_historic',hist)
            // //Fin historique

            //Ici tous les fonctions sur l'enregistrement d'un consultation
            return res.send({status:true,message:"Mise à jour, fait"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Consutlation;
