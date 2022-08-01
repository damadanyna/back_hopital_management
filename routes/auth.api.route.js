let router = require('express').Router()
let auth = require('./../middleware/auth')


//midlware spécifique pour la route
router.use(auth);

//Test de connexion
router.get('/check_connect',(req,res)=>{
    if(!req.user){
        res.send({status:false,message:"Pas encore connecté"})
    }else{
        res.send({status:true,message:"Données de connexion existantes",user:req.user})
    }
})

//Message de Vérification
router.get('/',(req,res)=>{
    res.send({status:true,message:"Connected"})
})

//Users
router.use('/users',require('./user.api.route'))

//Emplacement
router.use('/panel',require('./panel.api.route'))

//Les regisseurs
router.use('/regisseur',require('./regisseur.api.route'))

//Les annonceurs
router.use('/annonceur',require('./annonceur.api.route'))

//Les provinces
router.use('/province',require('./province.api.route'))

//Les provinces
router.use('/category',require('./category.api.route'))

//Uplods image
router.use('/uploads',require('./uploads.api.route'))

//Settings
router.use('/settings',require('./settings.api.route'))

//Profils
router.use('/profil',require('./profil.api.route'))

//Notifications
router.use('/notif',require('./notif.api.route'))

//Pour tous les requêtes Admin
router.use('/ad',require('./ad.api.route'))

//Commentaire
router.use('/com',require('./com.api.route'))

//Gestion des administratifs
router.use('/cu',require('./cu.api.route'))

//Pour la gestion de devis
router.use('/devis',require('./devis.api.route'))

//Pour solarpro
router.use('/solarpro',require('./solarpro.api.route'))

//Pour la gestion de pub
router.use('/pub',require('./pub.api.route'))

//Pour le traitement des images
router.use('/image',require('./image.api.route'))

//Route pour la gestion de tarification
router.use('/tr',require('./tarifs.api.route'))

//Route pour la gestion de tarification
router.use('/pdf',require('./pdf.api.route'))

//Route pour les props'
router.use('/props',require('./props.api.route'))

//Route pour les mobiles'
router.use('/mobile',require('./mobile.api.route'))
//Deconnexion
router.get('/deconnect',(req,res)=>{
    let options = {
        path:"/",
        sameSite:true,
        httpOnly: true, // The cookie only accessible by the web server
    }
    res.cookie('x-access-token','sdfqsdfqsdfqs', options)
    res.send({status:true,message:"Suppression des donées de session !!"})
})



//Détection de connexion
router.get('/status',async (req,res)=>{
    let Notif = require('../models/notif')
    let D = require('../models/data')


    try {
        const id_pr = await require('../models/profil').getById(req.user.pr_id)
        let u = id_pr[0]
        let pr = {
            pr_id:u.pr_id,
            pr_login:u.pr_login,
            pr_type:u.pr_type,
            pr_change_pass:u.pr_change_pass,
            pr_active:u.pr_active,
            pr_validate:u.pr_validate
        }
        if(req.user.pr_type == 'a'){
            const t = await Notif.countNotifByAdmin()

            //On va rechercher les devis non répondu par l'admin
            const nbDevis = (await D.exec('select count(*) as nbDevis from devis_request where d_devis_response is null') )[0].nbDevis
            return res.send({status:true,pr:pr,nbNotif:t[0].nb,nbDevis})
        }else{
            const t = await Notif.countNotifByDestProfil(req.user.pr_id)

            if(req.user.pr_type == 'ann'){
                //ici on va récupérer toutes les données de l'annonceur
                const ann = (await require('../models/annonceur').getByIdProfil(u.pr_id) )[0]

                let soc_pr = {
                    soc_pr_nif:ann.soc_pr_nif,
                    soc_pr_stat:ann.soc_pr_stat,
                    soc_sub:ann.soc_sub
                }

                //Pour l'agence de communication
                pr.ann_is_agence_com = ann.ann_is_agence_com

                return res.send({status:true,pr,nbNotif:t[0].nb,soc_pr})
            }else if(req.user.pr_type == 'reg'){ 
                //ici on va récupérer toutes les données du régisseur
                const reg = (await require('../models/regisseur').getByIdProfil(u.pr_id) )[0]

                let soc_pr = {
                    soc_pr_nif:reg.soc_pr_nif,
                    soc_pr_stat:reg.soc_pr_stat,
                    soc_sub:reg.soc_sub
                }

                return res.send({status:true,pr,nbNotif:t[0].nb,soc_pr})
            }else if(req.user.pr_type == 'cu'){
                const cu = (await require('../models/data').exec(`select * from commune_urbaine where pr_id = ${u.pr_id} `))[0]

                return res.send({status:true,pr,soc_pr:cu})
            }else if(req.user.pr_type == 'spro'){
                const sp = (await require('../models/data').exec(`select * from solarpro where sp_pr_id = ${u.pr_id} `))[0]
                return res.send({status:true,pr,soc_pr:sp})
            }
        }
    } catch (e) {
        console.error(e)
        return res.send({status:false})
    }
})


module.exports = router