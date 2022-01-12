let router = require('express').Router()
let moment = require('moment')
let fs = require('fs');


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});



//Récupération panneau avec limit
router.get('/limit/:nb/:page',async (req,res)=>{
    let Panel = require('../models/panel')

    let limit = parseInt(req.params.nb)
    let page = parseInt(req.params.page)

    if(limit.toString() == 'NaN' || page.toString() == 'NaN'){
        return res.send({status:false,message:"Erreur de donnée en entrée"})
    }

    const r = await Panel.getAllLimit(limit,page).catch(e =>{
        return res.send({status:false,message:"Erreur de la base de donnée"})
    }).then(e =>{
        return res.send({status:true,panels:e})
    })
})



module.exports = router