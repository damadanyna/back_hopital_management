let D = require('../models/data')

class RDV{
    static async getDataUtilsAdd(req,res){
        try {
            //récupération de la liste des interventions RDV 
            //et la liste des médecins

            let med_list = await D.exec('select * from med_dt')
            let intervention_list = await D.exec('select * from inter_rdv_dt')

            return res.send({status:true,med_list,intervention_list})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getList(req,res){
        try {

            let filters = req.query.filters
            let rdv = await D.exec_params(`select * from rdv_dt
            left join med_dt on med_id = rdv_med_id
            left join inter_rdv_dt on interdv_id = rdv_intervention 
            left join patient_dt on pat_id = rdv_pat_id
            where rdv_date = ?`,new Date(filters.date))

            return res.send({status:true,rdv})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async addRdv(req,res){
        try {
            let rdv = req.body

            rdv.rdv_date = new Date(rdv.rdv_date)

            await D.set('rdv_dt',rdv)

            return res.send({status:true})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async updateRdv(req,res){
        try {
            let rdv = req.body
            rdv.rdv_date = new Date(rdv.rdv_date)

            let rdv_up = {
                rdv_pat_id:rdv.rdv_pat_id,
                rdv_heure:rdv.rdv_heure,
                rdv_med_id:rdv.rdv_med_id,
                rdv_intervention:rdv.rdv_intervention,
                rdv_arrived:rdv.rdv_arrived
            }

            await D.updateWhere('rdv_dt',rdv_up,{rdv_id:rdv.rdv_id})
            return res.send({status:true})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async delRdv(req,res){
        try {
            let rdv_id = req.params.rdv_id

            await D.del('rdv_dt',{rdv_id})

            return res.send({status:true})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = RDV