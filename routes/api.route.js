let router = require('express').Router()



//Message de Vérification
router.get('/',(req,res)=>{
    res.send({message:"API 1.0 Fonctionnel"})
})


router.use('/a',require('./auth.api.route'))
router.use('/p',require('./public.api.route'))


//------
module.exports = router