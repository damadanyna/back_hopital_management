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

    try {
        const r = await Panel.getAllLimit(limit,page)
        return res.send({status:true,panels:r})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Récu^ération des panneaux pour la map
router.get('/map',async (req,res)=>{
    let Panel = require('../models/panel')

    try{
        const l = await Panel.getListPanToMap()
        return res.send({status:true,panels:l})
    }catch(e){
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Récupération pour un visionnage public d'un panneau
router.get('/:id',async (req,res)=>{
    let Panel = require('../models/panel')
    let id = parseInt(req.params.id)

    if(id.toString() == 'NaN'){
        return res.send({status:false,message:"Erreur de donnée en Entrée"})
    }

    try {
        const p_res = await Panel.getByIdP(id)
        if(p_res.length == 0){
            return res.send({status:false,message:"Donnée pas trouvée"})
        }
        return res.send({status:true,panel:p_res[0]})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur de base de donnée"})
    }
})



module.exports = router