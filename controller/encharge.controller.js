let D = require('../models/data')

class Encharge{
    static async register(req,res){ 
        let _d= req.body; 
        let encharge_data={ 
            pat_id:{front_name:'pat_id',fac:false}, 
            tarif_id:{front_name:'tarf_id',fac:true}, 
            encharge_date_entre :{front_name:'encharge_date_entre',fac:true,format:()=> new Date()},
            encharge_date_sortie :{front_name:'encharge_date_sortie',fac:true,format:()=> new Date()},
            encharge_date_enreg :{front_name:'encharge_date_enreg',fac:false,format:()=> new Date()},
            encharge_soc:{front_name:'encharge_soc',fac:true }, 
            enchatge_num_compte:{front_name:'enchatge_num_compte',fac:true },  
            enchatge_soc_payeur:{front_name:'enchatge_soc_payeur',fac:true },  
        };

        //Vérification du encharge
        const _pd_keys = Object.keys(encharge_data)
        let _tmp = {}
        let _list_error = []
        
        try {
            _pd_keys.forEach((v,i)=>{
                _tmp = encharge_data[v]
                if(!_tmp.fac && !_d[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })
            
            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
    
            //Si la vérification c'est bien passé, 
            // on passe à l'insertion du encharge
            let _data = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = encharge_data[v]
    
                _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                 
                _data[v] = _d[_tmp.front_name]
            })
            
            //l'objet encharge est rempli maintenant
            // on l'insert dans la base de donnée

            await D.set('encharge',_data)
            //Ici tous les fonctions sur l'enregistrement d'un encharge
            return res.send({status:true,message:"encharge bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }


    }

    static async delete(req,res){
        try {   
            await D.del('encharge',req.body)
            //Ici tous les fonctions sur l'enregistrement d'un encharge
            return res.send({status:true,message:"encharge supprimé."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
 
    }  6
    
    static async getList(req,res){ 
        let filters = req.query

        let _obj_pat = {
            pat_id:'pat_id',
            tarf_id:'tarf_id',
            art_date_enreg:'art_date_enreg',
        } 
        let default_sort_by = 'pat_id'

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?100:parseInt(filters.limit)
        filters.sort_by = (!filters.sort_by)?_obj_pat[default_sort_by]:_obj_pat[filters.sort_by]

        try { 
            //A reserver recherche par nom_prenom
            let reponse = await D.exec_params(`select * from encharge order by ${filters.sort_by} limit ? offset ?`,[
                filters.limit,
                (filters.page-1)*filters.limit
            ])

            //Liste total des encharge
            let nb_total_encharge = (await D.exec('select count(*) as nb from encharge'))[0].nb

            return res.send({status:true,reponse,nb_total_encharge})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
    static async getOne(req,res){ 
        let filters = req.params 
        try { 
            let reponse = await D.exec_params(`select * from encharge where ?`,filters) 
            return res.send({status:true,reponse})
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
                await D.updateWhere('encharge',element,array[0]) 
            }
                //Ici tous les fonctions sur l'enregistrement d'un encharge
                return res.send({status:true,message:"Mise à jour, fait"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async utilsAdd(req,res){
        try {
            let tarifs = await D.exec('select * from tarif')
            let soc = await D.exec('select * from entreprise')

            return res.send({status:true,tarifs,soc})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Encharge;
