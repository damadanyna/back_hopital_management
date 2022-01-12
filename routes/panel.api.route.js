let router = require('express').Router()
let moment = require('moment')
let fs = require('fs');


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});

//Get normal
router.get('/',(req,res)=>{
    let Panel = require('./../models/panel')

    Panel.all((err,result)=>{
        if(err){
            console.log(err)
            res.send({status:false,message:'Erreur de la base de donnée'})
        }else{
            res.send({status:true,panels:result})
        }
    })
})


//Insertion d'un panneau
router.post('/',(req,res)=>{
    let Panel = require('./../models/panel')
    let p = req.body

    let t_parse_int = ['ann_id','reg_id','cat_id','province_id','image_id']

    t_parse_int.forEach(e =>{
        p[e] = (p[e] == '')?null:p[e]
    })

    if(p['pan_lat'] == '' || p['pan_long'] == ''){
        return res.send({status:false,message:"La latitude et la longitude sont obligatoire."})
    }

    if(p['pan_label'] == ''){
        return res.send({status:false,message:"Le libellé est obligatoire pour pouvoir identifier le panneau"})
    }

    Panel.add(p,(err,result)=>{
        if(err){
            return res.send({status:false,message:"Erreur de la base de donnée."})
        }else{
            return res.send({status:true,panel:p})
        }
    })

    
})

//Modification d'un panneau
router.put('/:id',(req,res)=>{
    let Panel = require('./../models/panel')
    let p_brut = req.body
    let id = req.params.id

    let p = {}

    let data_to_up = ['pan_lat','pan_long','pan_dimension','pan_lieu','pan_label','province_id',
                    'ann_id','reg_id','cat_id','image_id']
    

    data_to_up.forEach(e => {
        p[e] = p_brut[e]  
    })

    let t_parse_int = ['ann_id','reg_id','cat_id','province_id','image_id']

    t_parse_int.forEach(e =>{
        p[e] = (p[e] == '')?null:p[e]
    })

    if(p['pan_lat'] == '' || p['pan_long'] == ''){
        return res.send({status:false,message:"La latitude et la longitude sont obligatoire."})
    }

    if(p['pan_label'] == ''){
        return res.send({status:false,message:"Le libellé est obligatoire pour pouvoir identifier le panneau"})
    }


    Panel.update(id,p,(err,result)=>{
        if(err){
            console.log(err)
            return res.send({status:false,message:"Erreur de la base de donnée."})
        }else{
            return res.send({status:true})
        }
    })


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
router.get('/:id',(req,res)=>{
    let Panel = require('./../models/panel')
    let id = parseInt(req.params.id)
    if(id.toString() == 'NaN'){
        return res.send({status:false,message:'Erreur de donnée en Entrée.'})
    }

    Panel.get_by_id(id,(err,result)=>{
        if(err){
            return res.send({status:false,message:'Erreur de la base de donnée'})
        }else{
            if(result.length == 0){
                return res.send({status:false,message:''})
            }
            return res.send({status:true,panel:result[0]})
        }
    })
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




module.exports = router