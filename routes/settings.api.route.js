let router = require('express').Router()
const { resolveSoa } = require('dns');
let fs = require('fs')

const sharp = require("sharp")


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
router.get('/prises/panels',async (req,res)=>{
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
        const p = await Panel.getPanelPrisesToSettingsBy(s,t)
        return res.send({status:true,panels:p})

    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Récupération des panneaux qui ne sont pas encore dans la base gros plan
router.get('/gros-plan/panels',async (req,res)=>{
    let Panel = require('../models/panel')
    let d = ['a.ann_label','r.reg_label','p.pan_ref']
    let s = ''
    t = []

    for (let i = 0; i < d.length; i++) {
        s+= ((i == 0)?'':'or')+` ${d[i]} like ? `
        t.push(`%${req.query.search}%`)
    }

    if(req.query.search.trim() == ''){
        return res.send({status:true,panels:[]})
    }

    try {
        const p = await Panel.getPanelGrosPlanToSettingsBy(s,t)
        return res.send({status:true,panels:p})

    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }

})
//Réupération des gros plans
router.get('/gros-plan',async (req,res)=>{
    try {
        const gp = await require('../models/panel').getGrosPlanSettings()
        return res.send({status:true,gros_plan:gp})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Insertion des panneaux pour le gros plan
router.post('/gros-plan',async (req,res)=>{
    try {
        let gp = {
            gp_pan_id:parseInt(req.body.id),
            gp_rang:1
        }

        await require('../models/data').set('gros_plan',gp)
        return res.send({status:true})

    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})
//Suppression d'un gros plan
router.delete('/gros-plan/:id', async (req,res)=>{
    try {
        await require('../models/data').del('gros_plan',{gp_id:req.params.id})
        return res.send({status:true})
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


//Gestion Réference panneau
router.get('/ref/stats',async (req,res)=>{
    let Data = require('../models/data')
    try {
        const nbP = (await Data.exec('select count(*) as nbp from panneau'))[0].nbp
        const nbrefpubloc = (await Data.exec('select count(*) as nbp from panneau where pan_publoc_ref is not null '))[0].nbp
        return res.send({status:true,nb_panel:nbP,nb_publoc_ref:nbrefpubloc})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

router.put('/ref/to-publoc-ref',async (req,res)=>{
    let Data = require('../models/data')

    try {
        const panels = await Data.exec('select * from panneau order by created_at asc ')

        let sql = ''
        let tmp = {}, ref_tmp = ''
        for(let i = 0;i < panels.length;i++){
            tmp = panels[i]
            if(i+1 > 1000){
                ref_tmp = 'PBLC-'+(i+1)
            }else if(i+1> 100){
                ref_tmp = 'PBLC-0'+(i+1)
            }else if(i+1> 10){
                ref_tmp = 'PBLC-00'+(i+1)
            }else{
                ref_tmp = 'PBLC-000'+(i+1)
            }


            sql+=`update panneau set pan_publoc_ref = '${ref_tmp}' where pan_id = ${tmp.pan_id};`
        }


        const re = await Data.exec(sql)

        return res.send({status:true,data:re})

    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Récupération d'exemple de panneau
router.get('/ref/example-pan',async (req,res)=>{
    let Data = require('../models/data')

    try {
        const p = await Data.exec('select * from panneau as p left join lieu as l on l.lieu_id = p.lieu_id limit 5')
        return res.send({status:true,panels:p})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Gestion des médias .........................
router.get('/media/stats',async (req,res)=>{
    let Data = require('../models/data')
    try {
        const nb_im_no_dim = (await Data.exec('select count(*) as nb from file where dimension_file is null'))[0].nb
        const nb_im = (await Data.exec('select count(*) as nb from file'))[0].nb
        let stats = {
            nb_im_no_dim:nb_im_no_dim,
            nb_im:nb_im
        }

        return res.send({status:true,stats:stats})

    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

router.put('/media/set-info-dim',async (req,res)=>{
    let Data = require('../models/data')

    try {
        const ims = await Data.exec('select * from file where dimension_file is null')

        let path = '', info = {}

        let sql = '',dim = ''

        for(let i=0;i<ims.length;i++){
            path = ims[i].path_file+''+ims[i].name_file
            info = await sharp(path).metadata()
            dim = info.width+','+info.height
            sql += `update file set dimension_file = '${dim}' where file_id = ${ims[i].file_id};`
        }

        const t = await Data.exec(sql)

        return res.send({status:true,t})

    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée",e:e})
    }
})
module.exports = router
