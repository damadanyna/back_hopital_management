let router = require('express').Router()


//Pour la gestion d'authentification 
let auth = require('./../middleware/auth')
router.use(auth)

//les requires utils



//Message de Vérification
router.get('/',(req,res)=>{
    res.send({message:"API 1.0 Fonctionnel"})
})


// router.use('/a',require('./auth.api.route'))
// router.use('/p',require('./public.api.route'))

//API pour l'admin
router.use('/admin',require('./ad.api.route'))


//Gestion de patient
router.post('/patient',require('../controller/patient.controller').register) //enregistrement d'un patient


//------
module.exports = router