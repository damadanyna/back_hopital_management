let D = require('../models/data')

let _hosp_data = {
    hosp_ref:{front_name:'ref',fac:false,message:''},
    hosp_patient_num:{front_name:'num_patient',fac:false},
    hosp_patient_name_and_lastname:{front_name:'nom_prenom_patient',fac:false,},
    hosp_entree:{front_name:'entree',fac:false,format:(a)=> new Date(a)},
    hosp_paye:{front_name:'paye',fac:false},
    hosp_montant:{front_name:'montant',fac:false},
    hosp_restant:{front_name:'restant',fac:false},
    hosp_sortie:{front_name:'sortie',fac:false,format:(a)=> new Date(a)},
    hosp_departement:{front_name:'departement',fac:true,format:(a) => parseInt(a)},
}

class Hosp{
    //Insertion d'hospitalisation
    static async create(req,res){
        //Vérification du patient
        const _hosp_keys = Object.keys(_hosp_data)
        let _tmp = {}
        let _list_error = []

        //les données envoyés depuis le front
        let _d = req.body

        try {

            //Vérification des erreurs sur les données entr
            _hosp_keys.forEach((v,i)=>{
                _tmp =         [v]
    
                if(!_tmp.fac && !_d[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })

            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }

            //Si la vérification c'est bien passé, 
            // on passe à l'insertion du de l'hospitalisation

            let _hosp = {}
            _hosp_keys.forEach((v,i)=>{
                _tmp = _hosp_data[v]
    
                _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                
                _hosp[v] = _d[_tmp.front_name]
            })


            await D.set('hospitalisation',_hosp)
            //Ici tous les fonctions sur l'enregistrement d'un patient
            return res.send({status:true,message:"Hospitalisation bien créer."})
            
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    //Récupération de la liste des hospitalisation
    static async getListHosp(req,res){
        let filters = req.query

        let _obj_pat = {
            num_patient:'hosp_patient_num',
            ref:'hosp_ref',
            patient_nom_prenom:'hosp_patient_name_and_lastname',
            date_entree:'hosp_entree',
        }

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?100:parseInt(filters.limit)
        
        try {
            let hosp = await D.exec_params(`select * from hospitalisation limit ? offset ?`,[
                filters.limit,
                (filters.page-1)*filters.limit
            ])

            //Liste total des patients
            let nb_total_hosp = (await D.exec('select count(*) as nb from hospitalisation'))[0].nb

            return res.send({status:true,hosp,nb_total_hosp})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async deleteHosp(req,res){
        let ref = req.params.ref
        
        

        try {
             await D.del('hospitalisation',{hosp_ref:ref})
             return res.send({status:true,message:"Ligne Hospitalisation bien supprimer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async updateHosp(){
        
    }
}

module.exports = Hops