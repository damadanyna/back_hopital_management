let D = require('../models/data')

let _prep_enc_data = {
    p_enc_date_mvt:{front_name:'date_mvt',fac:false,format:(a) => new Date(a)},
    p_enc_heure:{front_name:'heure_mvt',fac:false,format:(a) => new Date(a)},
    p_enc_departement:{front_name:'departement',fac:false,},
    p_enc_patient_name_and_lastname:{front_name:'patient_nom_prenom',fac:false},
    p_enc_type_paiment:{front_name:'type_paiment',fac:false},
    p_enc_designation:{front_name:'designation',fac:false},
    p_enc_montant:{front_name:'montant',fac:false},
    p_enc_total:{front_name:'total',fac:false,},
}

let _prep_key = Object.keys(_prep_enc_data)


class Caisse{
    static async encaissement(req,res){
        //Ici on ajoute l'encaissement de puis le front-end

        let _d = req.body

        //Objet pour le post
        let _p_e = {},_tmp = {}

        _prep_key.forEach( (v,i)=>{
            _tmp = _prep_enc_data[v]

            _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                
            _p_e[v] = _d[_tmp.front_name]
        })

        //ajout de prep_encaissemnet dans la base
        try {
            await D.set('prep_encaissement',_p_e)
            return res.send({status:true,message:"Prep. Encaissement bien inséré"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    //Récupértion de la liste de prep_encaissement
    static async getListEncaissement(){
        let filters = req.query.filters

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?100:parseInt(filters.limit)

        try {
            let prep_enc = await D.exec_params(`select * from prep_encaissement limit ? offset ?`,[
                filters.limit,
                (filters.page-1)*filters.limit
            ])

            //Liste total des patients
            let nb_total_prep_enc = (await D.exec('select count(*) as nb from prep_encaissement'))[0].nb

            return res.send({status:true,prep_enc,nb_total_prep_enc})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }

    }
}

module.exports = Caisse