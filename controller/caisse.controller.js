let D = require('../models/data')

let _prep_enc_data = {
    p_enc_date_mvt:{front_name:'date_mvt',fac:false,message:''},
    p_enc_heure:{front_name:'heure_mvt',fac:false,format:(a)=> new Date(a)},
    p_enc_departement:{front_name:'departement',fac:false,format:(a)=> new Date(a)},
    p_enc_patient_name_and_lastname:{front_name:'patient_nom_prenom',fac:false},
    p_enc_type_paiment:{front_name:'type_paiment',fac:false},
    p_enc_designation:{front_name:'designation',fac:false},
    p_enc_montant:{front_name:'montant',fac:false},
    p_enc_total:{front_name:'total',fac:false,},
}

let _prep_key = Object.keys(_prep_enc_data)

class Caisse{
    static async encaissement(){
        //Ici on ajoute l'encaissement de puis le front-end

        

    }
}

module.exports = Caisse