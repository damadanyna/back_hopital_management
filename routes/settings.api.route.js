let router = require('express').Router()
const { resolveSoa } = require('dns');
let fs = require('fs')


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});


// let p = result[0]
// let tj = p.temp_control_jour.split(':')
// let tn = p.temp_control_nuit.split(':')
// tj[0] = ((tj[0] = parseInt(tj[0])-3) >= 10)?tj[0]:'0'+tj[0]
// tn[0] = ((tn[0] = parseInt(tn[0])-3) >= 10)?tn[0]:'0'+tn[0]

// tj = tj.join(':')+":00"
// tn = tn.join(':')+":00"


// Gestion de slides
router.get('/slides',async (req,res)=>{
    try {
        const s = await require('../models/settings').getSlidesAdmin()
        return res.send({status:true,slides:s})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})
router.post('/slides',async (req,res)=>{
    let s = req.body
    try {
        if(s.ms_label == null || s.ms_label.trim() == ''){
            return res.send({status:false,message:"Le slide doit avoir un label pour l'identifier"})
        }

        await require('../models/settings').addSlide(s)
        if(s.ms_image_id != null){
            await require('../models/File').setUseFile(s.ms_image_id)
        }

        return res.send({status:true})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})
router.delete('/slides/:id',async (req,res)=>{
    let id = parseInt(req.params.id)

    try {
        const s = await require('../models/settings').getById(id)
        if(s.length > 0){
            let sl = s[0]
            if(sl.ms_image_id != null){
                await require('../controller/file').deleteFile(sl.ms_image_id)
            }

            await require('../models/settings').deleteById(id)
            return res.send({status:true})
        }else{
            return res.send({status:false,message:"Slide Introuvable."})
        }
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Gestion des pubprisés
router.get('/panels',async (req,res)=>{
    let Panel  = require('../models/panel')
    let d = ['a.ann_label','r.reg_label','p.pan_ref']
    let s = '',
    t = []

    for (let i = 0; i < d.length; i++) {
        s+= ((i == 0)?'':'or')+` ${d[i]} like ? `
        t.push(`%${req.query.search}%`)
    }

    if(req.query.search.trim() == ''){
        return res.send({status:true,panels:[]})
    }

    try {
        const p = await Panel.getPanelToSettingsBy(s,t)
        return res.send({status:true,panels:p})

    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//récupération des prises
router.get('/prises',async (req,res)=>{
    try {
        const p = await require('../models/panel').getPrisesSettings()
        return res.send({status:true,pan_prises:p})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

router.post('/prises',async (req,res)=>{
    try {
        const p = await require('../models/panel').getPrisesLastRange()

        let pp = {
            pan_pr_pan_id:req.body.id,
            pan_pr_rang:(p.length <= 0)?1:(parseInt(p[0].pan_pr_rang)+1)
        }

        await require('../models/data').set('pan_prises',pp)
        return res.send({status:true})

    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})
router.delete('/prises/:id',async (req,res)=>{
    try {
        await require('../models/data').del('pan_prises',{pan_pr:req.params.id})

        return res.send({status:true})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})
module.exports = router
