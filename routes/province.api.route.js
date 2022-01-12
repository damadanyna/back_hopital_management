let router = require('express').Router()
const bcrypt = require('bcrypt')


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});


router.get('/',(req,res)=> {
    let Province = require('../models/province')

    Province.all((err,result)=>{
        if(!err){
            return res.send({status:true,provinces:result})
        }else{
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    })
})



module.exports = router