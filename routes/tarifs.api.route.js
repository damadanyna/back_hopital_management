let router = require('express').Router()
let moment = require('moment')
let fs = require('fs');


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});


//Récupération des données côté admin pour l'insertion de tarification
router.get('/ad/data-utils',async (req,res)=>{
    let D = require('../models/data')

    try {
        //récupération de la liste des régisseurs
        let regs = await D.exec('select * from regisseur')

        //Récupérations des catéories parents
        let cats = await D.exec('select * from category where parent_cat_id is null')

        //récupération des formats
        let formats = await D.exec('select * from category where parent_cat_id is not null')

        //Récupérations de services
        let services = await D.exec('select * from t_services')


        return res.send({status:true,regs,cats,formats,services})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Post d'un tarif, reg,cats, formats 
router.post('/tarif',async (req,res)=>{
    let D = require('../models/data')
    let d = req.body
    try {

        //On va rechercher dans la base s'il n'y pas de tarif enregistrer dans la base
        let sql = `select * from tarifs where tr_cat_id = ? and tr_reg_id = ? and tr_format_id = ? `
        let r = await D.exec_params(sql,[d.cat_id,d.reg_id,d.format_id])

        //On va ajouter le truc s'il n'est pas encore dans la base
        let tr = {
            tr_cat_id:d.cat_id,
            tr_reg_id:d.reg_id,
            tr_format_id:d.format_id,
            tr_pr_id:req.user.pr_id
        }

        if(!r.length){
            let res_tr = await D.set('tarifs',tr)
            return res.send({status:true,t:(r.length)?true:false,tr_id:res_tr.insertId})
        }

        return res.send({status:true,t:(r.length)?true:false,tr_id:r[0].tr_id})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Récupération d'un tarif avec ces services
router.get('/view/:id',async (req,res)=>{
    let D = require('../models/data')
    let tr_id = req.params.id

    try {
        //Récupération du tarif
        let sql = `select tr.*,r.*,cat.*,format.cat_id as format_id,format.cat_label as format_label  from tarifs tr
        left join regisseur r on r.reg_id = tr.tr_reg_id 
        left join category cat on cat.cat_id = tr.tr_cat_id
        left join category format on format.cat_id = tr.tr_format_id
        where tr_id = ? `

        let tr = (await D.exec_params(sql,tr_id))[0]

        //Récupération des services par mois (taxe communale et location)
        sql = `select * from tarif_per_month tpm where tpm_tr_id = ?`
        let tpm = await D.exec_params(sql,tr_id)

        //Récupération des tarifs par services
        sql = `select * from tarif_per_service tps 
        left join t_services ts on ts.t_serv_id = tps_service_id
        where tps_tr_id = ?`
        let tps = await D.exec_params(sql,tr_id)

        //Récupération des services
        let services = await D.exec(`select * from t_services`)


        return res.send({status:true,tr,tpm,tps,services})

    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})


//Tarif par mois
router.post('/tpm',async (req,res)=>{
    let D = require('../models/data')

    let tpm = req.body.tpm
    let tr_id = req.body.tr_id

    try {

        //Detection de nullité des inputs
        if( !tpm.tpm_taxe_communale ||  !tpm.tpm_location || !tpm.tpm_month)
        {
            return res.send({status:false,message:"Tous les champs sont obligatoire"})
        }

        //On va detecter d'abord s'il existe déja un service par mois avec le meme 
        //mois

        let test_tpm = await D.exec_params(`select * from tarif_per_month where tpm_month = ? and tpm_tr_id = ?`,[tpm.tpm_month,tr_id])

        if( test_tpm.length > 0 ){
            return res.send({status:false,message:"Le nombre de mois existe déjà."})
        }

        //Insertion de TPM
        let tpm_insert = {
            tpm_taxe_communale:tpm.tpm_taxe_communale.trim(),
            tpm_location:tpm.tpm_location.trim(),
            tpm_month:tpm.tpm_month,
            tpm_tr_id:tr_id
        }

        

        await D.set('tarif_per_month',tpm_insert)
        return res.send({status:true})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

router.get('/tpm/:tr_id',async (req,res)=>{
    let D = require('../models/data')
    let tr_id = req.params.tr_id
    try {
        //Récupération des services par mois (taxe communale et location)
        let sql = `select * from tarif_per_month tpm where tpm_tr_id = ? order by tpm_month asc`
        let tpm = await D.exec_params(sql,tr_id)
        return res.send({status:true,tpm})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

// -------------- Suppression d'un tarif par mois
router.delete('/tpm/:tpm_id',async (req,res)=>{
    let D = require('../models/data')
    let tpm_id = req.params.tpm_id
    try {
        //Suppression
        await D.del('tarif_per_month',{tpm_id})
        return res.send({status:true})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

// ---- GESTION DES TARIFS PAR SERVICES (impression, pose et tout ça)
//Récupération de TPS et SERVICES
router.get('/tps', async (req,res)=>{
    let D = require('../models/data')

    try {
        //récupération des tps
        let tps = await D.exec(`select * from tarif_per_service as tps 
        left join t_services ts on ts.t_serv_id = tps.tps_service_id `)

        //Récupération de la liste des services
        let services  = await D.exec(`select * from t_services`)

        return res.send({status:true,tps,services})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Post de tps et services
router.post('/tps',async (req,res)=>{
    let D = require('../models/data')
    let tps_model = req.body.tps
    let tr_id = req.body.tr_id

    try {
        
        //Insertion de service si besoin
        if(tps_model.service_label){
            //On va detecter si le service existe déjà
            let serv_l_tmp = await D.exec_params('select * from t_services where t_serv_label = ? ',tps_model.service_label)

            if(serv_l_tmp.length > 0){
                tps_model.service_id = serv_l_tmp[0].t_serv_id
            }else{
                let serv_res = await D.set('t_services',{t_serv_label:tps_model.service_label})
                tps_model.service_id = serv_res.insertId
            }
            
        }

        //On regarder si le service et le type n'est pas encore rentré
        let sql = ''
        if(tps_model.service_id){
            sql = `select * from tarif_per_service where tps_service_id = ? and tps_type = ?`
            let test_tps = await D.exec_params(sql,[tps_model.service_id,tps_model.type])

            if(test_tps.length > 0){
                return res.send({status:false,message:" Ce service associ avec le type est déjà insérer."})
            }
        }

        //Insertion du tarif
        let trf = {
            /**
             *  tps_service_id varchar(255) null,
                tps_type varchar(255) null,
                tps_tr_id int null,
                tps_prix int null,
                PRIMARY KEY (tps_id)
             */

                tps_service_id:tps_model.service_id,
                tps_type:tps_model.type,
                tps_tr_id:tr_id,
                tps_prix:tps_model.prix
        }

        await D.set('tarif_per_service',trf)

        return res.send({status:true})

    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Suppression d'un service
router.delete('/tps/:tps_id',async (req,res)=>{
    let D = require('../models/data')
    let tps_id = req.params.tps_id

    try {
        //On va d'abord récupérer ce tarif
        let tps = (await D.exec_params('select * from tarif_per_service where tps_id = ?',tps_id))[0]

        let serv_id = tps.tps_service_id
        //On va checker si c'est le seul service restant
        let test_serv_alone = await D.exec_params('select * from tarif_per_service where tps_id <> ? and tps_service_id = ?',[tps_id,serv_id])

        if(test_serv_alone.length <= 0){
            await D.del('t_services',{t_serv_id:serv_id})
        }

        //Supppresion du tarif
        await D.del('tarif_per_service',{tps_id})

        return res.send({status:true})

    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

module.exports = router