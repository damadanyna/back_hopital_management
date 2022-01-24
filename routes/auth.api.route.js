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
    try {
        if(req.user.pr_type == 'a'){
            const t = await Notif.countNotifByAdmin()
            return res.send({status:true,pr:req.user,nbNotif:t[0].nb})
        }else{
            const t = await Notif.countNotifByDestProfil(req.user.pr_id)
            return res.send({status:true,pr:req.user,nbNotif:t[0].nb})
        }
    } catch (e) {
        console.log(e)
        return res.send({status:false})
    }
    
    
})


module.exports = router