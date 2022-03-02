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
module.exports = router
