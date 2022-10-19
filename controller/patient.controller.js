let D = require('../models/data')

class Patient{
    static async register(req,res){ 
        
        let _d= req.body; 
        let patient_data={
            pat_id:{front_name:'pat_id',fac:true},
            pat_nom_et_prenom:{front_name:'pat_nom_et_prenom',fac:false}, 
            pat_date_naiss :{front_name:'pat_date_naiss',fac:false,format:(a)=> new Date(a)},
            pat_date_enreg :{front_name:'pat_date_enreg',fac:true,format:()=> new Date()},
            pat_adresse:{front_name:'pat_adresse',fac:false}, 
            pat_profession:{front_name:'pat_profession',fac:false}, 
            pat_numero:{front_name:'pat_numero',fac:false}, 
        };

        //Vérification du patient
        const _pd_keys = Object.keys(patient_data)
        let _tmp = {}
        let _list_error = []
        
        try {
            _pd_keys.forEach((v,i)=>{
                _tmp = patient_data[v]
                if(!_tmp.fac && !_d[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })
            
            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
    
            //Si la vérification c'est bien passé, 
            // on passe à l'insertion du patient
            let _data = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = patient_data[v]
    
                _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                 
                _data[v] = _d[_tmp.front_name]
            })
            
            //l'objet patient est rempli maintenant
            // on l'insert dans la base de donnée

            await D.set('patient',_data)
            //Ici tous les fonctions sur l'enregistrement d'un patient
            return res.send({status:true,message:"patient bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }


    }

    static async delete(req,res){
        try {   
            await D.del('patient',req.body)
            //Ici tous les fonctions sur l'enregistrement d'un patient
            return res.send({status:true,message:"patient supprimé."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
 
    }  
    
    static async getList(req,res){ 
        let filters = req.query

        let _obj_pat = {
            pat_numero:'pat_numero',
            pat_nom_et_prenom:'pat_nom_et_prenom',
            pat_profession:'pat_profession',
        } 
        let default_sort_by = 'pat_numero'

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?100:parseInt(filters.limit)
        filters.sort_by = (!filters.sort_by)?_obj_pat[default_sort_by]:_obj_pat[filters.sort_by]

        try { 
            //A reserver recherche par nom_prenom
            let reponse = await D.exec_params(`select * from patient order by ${filters.sort_by} limit ? offset ?`,[
                filters.limit,
                (filters.page-1)*filters.limit
            ])

            //Liste total des patient
            let nb_total_patient = (await D.exec('select count(*) as nb from patient'))[0].nb

            return res.send({status:true,reponse,nb_total_patient})
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
                await D.updateWhere('patient',element,array[0]) 
            }
                //Ici tous les fonctions sur l'enregistrement d'un patient
                return res.send({status:true,message:"Mise à jour, fait"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Patient;
