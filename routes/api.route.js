let router = require('express').Router()


//Pour la gestion d'authentification 
let auth = require('./../middleware/auth')
router.use(auth)

//les requires utils



//Message de Vérification
router.get('/',(req,res)=>{
    res.send({message:"API 1.0 Fonctionnel"})
})



//Gestion de patient
router.post('/patient',require('../controller/patient.controller').register) //enregistrement d'un patient

router.get('/patients',require('../controller/patient.controller').getList)//Récupération de la liste des patiens
//Récupération des liste de patients
router.get('/patients',)


//------
module.exports = router