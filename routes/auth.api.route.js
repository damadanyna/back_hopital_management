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
router.get('/status',(req,res)=>{
    return res.send({status:true,pr:req.user})
})


module.exports = router