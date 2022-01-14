let router = require('express').Router()
let moment = require('moment')
let fs = require('fs');


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});

//Get normal
router.get('/',async (req,res)=>{
    let Panel = require('./../models/panel')

    try {
        const p_res = await Panel.all()
        return res.send({status:true,panels:p_res})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:'Erreur dans la base de donnée.'})
    }
})


//Insertion d'un panneau
router.post('/',async (req,res)=>{
    let Panel = require('./../models/panel')
    let d = req.body
    let pan = ['reg_id','cat_id','image_id','pan_surface','pan_ref','pan_num_quittance','pan_description']
    let lieu = ['lieu_pays','lieu_ville','lieu_quartier','lieu_commune','lieu_region','lieu_label','lieu_lat','lieu_lng']

    let p = {}
    //Insertion panneau
    for(let i = 0;i<pan.length;i++){
        if(d[pan[i]] == undefined){
            return res.send({status:false,message:"Erreur des données entrées",data:pan[i]})
        }
        p[pan[i]] = (d[pan[i]] == '')?null:d[pan[i]] 
    }

    let l = {}
    //Inertion Lieu
    for(let i = 0;i<lieu.length;i++){
        if(d[lieu[i]] === undefined){
            return res.send({status:false,message:"Erreur des données entrées",data:lieu[i]})
        }
        l[lieu[i]] = (d[lieu[i]] == '')?null:d[lieu[i]] 
    }

    //Insertion dans la base avec un try catch
    try {
        const lieu_res = await Panel.addLieu(l)

        p.pan_validation = (req.user.pr_type == 'a')?1:0
        p.pan_state = 1
        p.lieu_id = lieu_res.insertId

        //Insertion du Panneau
        const pan_res = await Panel.add(p)

        return res.send({status:true,id:pan_res.insertId})

    } catch (e) {
        console.log(e)
        return res.send({status:false,message:'Erreur dans la base de donnée.'})
    }

})

//Modification d'un panneau
router.put('/:id',async (req,res)=>{
    let Panel = require('./../models/panel')
    let d = req.body
    let pan = ['reg_id','cat_id','image_id','pan_surface','pan_ref','pan_num_quittance','pan_description']
    let lieu = ['lieu_pays','lieu_ville','lieu_quartier','lieu_commune','lieu_region','lieu_label','lieu_lat','lieu_lng']

    let p = {}
    //Insertion panneau
    for(let i = 0;i<pan.length;i++){
        if(d[pan[i]] === undefined){
            return res.send({status:false,message:"Erreur des données entrées",data:pan[i]})
        }
        p[pan[i]] = (d[pan[i]] == '')?null:d[pan[i]] 
    }

    let l = {}
    //Inertion Lieu
    for(let i = 0;i<lieu.length;i++){
        if(d[lieu[i]] === undefined){
            return res.send({status:false,message:"Erreur des données entrées",data:lieu[i]})
        }
        l[lieu[i]] = (d[lieu[i]] == '')?null:d[lieu[i]] 
    }

    try {
        const l_res = await Panel.updateLieu(d.lieu_id,l)
        const p_res = await Panel.update(d.pan_id,p) 

        console.log(l_res,p_res)
        return res.send({status:true})

    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée ..."})
    }

})

//Compter les panneaux
router.get('/count',(req,res)=>{
    let Panel = require('./../models/panel')
    Panel.count((err,result)=>{
        if(err){
            return res.send({status:false,message:'Erreur de la base de donnée'})
        }else{
            return res.send({status:true,nb:result[0].nb})
        }
    })
})

//Récupération d'un panneau pour la viewPanel
router.get('/:id',async (req,res)=>{
    let Panel = require('./../models/panel')
    let id = parseInt(req.params.id)
    if(id.toString() == 'NaN'){
        return res.send({status:false,message:'Erreur de donnée en Entrée.'})
    }

    try {
        const p_res = await Panel.getById(id)
        return res.send({status:true,panel:p_res[0]})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:'Erreur dans la base de donnée'})
    }

})

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

//Suppression d'un panneau
router.delete('/:id',async (req,res) =>{
    let Panel = require('../models/panel')

    

    try {
        const p_res = await Panel.delete(id)
        return res.send({status:true})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})




module.exports = router