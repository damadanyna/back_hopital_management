let D = require('../models/data')

class Patient{

    static async register(req,res){

        //les données envoyés depuis le front
        let _d = req.body

        console.log(_d)

        //liste des éléements utiles à la création du patient
        let _patient_data = {
            patient_num:{front_name:'num',fac:false,message:''},
            patient_name_and_lastname:{front_name:'nom_prenom',fac:false},
            patient_date_naiss:{front_name:'date_naissance',fac:false,format:(a)=> new Date(a)},
            patient_casier:{front_name:'casier',fac:false},
            patient_age:{front_name:'age',fac:false,format:(a)=> parseInt(a)},
            patient_sexe:{front_name:'sexe',fac:false},
            patient_profession:{front_name:'profession',fac:false},
            patient_adresse:{front_name:'adresse',fac:false},
            patient_note:{front_name:'note',fac:true},
        }

        

        //Vérification du patient
        const _pd_keys = Object.keys(_patient_data)
        let _tmp = {}
        let _list_error = []
        
        try {
            _pd_keys.forEach((v,i)=>{
                _tmp = _patient_data[v]
    
                if(!_tmp.fac && !_d[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })
    
            

            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
    
            //Si la vérification c'est bien passé, 
            // on passe à l'insertion du patient
            let _patient = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = _patient_data[v]
    
                _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                
                _patient[v] = _d[_tmp.front_name]
            })


            //l'objet patient est rempli maintenant
            // on l'insert dans la base de donnée

            await D.set('patient',_patient)
            //Ici tous les fonctions sur l'enregistrement d'un patient
            return res.send({status:true,message:"Patient bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }

    }



    //Récupération des listes de patients
    static async getList(req,res){



        let filters = req.query

        let _obj_pat = {
            num:'patient_num',
            nom_prenom:'patient_name_and_lastname',
            age:'patient_age',
        }

        //Tri par defaut des patients
        let default_sort_by = 'num'

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?100:parseInt(filters.limit)
        filters.sort_by = (!filters.sort_by)?_obj_pat[default_sort_by]:_obj_pat[filters.sort_by]

        try {
            //A reserver recherche par nom_prenom
            let patients = await D.exec_params(`select * from patient order by ${filters.sort_by} limit ? offset ?`,[
                filters.limit,
                (filters.page-1)*filters.limit
            ])

            //Liste total des patients
            let nb_total_patient = (await D.exec('select count(*) as nb from patient'))[0].nb

            return res.send({status:true,patients,nb_total_patient})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Patient