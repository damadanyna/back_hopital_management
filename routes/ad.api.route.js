let router = require('express').Router()
const bcrypt = require('bcrypt')


//midlware spécifique pour la route
router.use((req, res, next) => {
    if(req.user.pr_type  != 'a'){
        return res.send({status:false,mesasge:"Autorisation non suffisante"})
    }
    next();
});

router.get('/locations',async (req,res)=>{
    let Panel = require('../models/panel')
    let type = req.query.type

    try {
        if(type == 'all'){
            const l = await Panel.getAllLocations()
            return res.send({status:true,locations:l})
        }else{
            const l = await Panel.getAllLocationsBy(parseInt(type))
            return res.send({status:true,locations:l})
        }
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})
router.get('/location/:id',async (req,res)=>{
    let Panel = require('../models/panel')
    let id = req.params.id

    try {
        const l = await Panel.getLocationById(id)
        if(l.length == 0){
            return res.send({status:false,message:"Il est possible que l'objet n'existe plus."})
        }
        return res.send({status:true,location:l[0]})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

router.delete('/notif/:id',async (req,res)=>{
    let Notif = require('../models/notif')
    try {
        const n = await Notif.deleteById(req.params.id)
        req.io.emit('del-notif-ad')
        return res.send({status:true})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

router.delete('/panel/:id',async (req,res)=>{
    let Panel = require('../models/panel')
    if(parseInt(req.params.id).toString() == 'NaN'){
        return res.send({status:false,message:"Erreur de donnée en entrée"})
    }

    try {
        //Récupération des informations du panneau
        const p = await Panel.getById(req.params.id)

        if(p.length  == 0){
            return res.send({status:false,message:"Le panneau n'existe plus. "})
        }

        let pan = p[0]

        if(pan.pan_state == 3){
            return res.send({status:false,message:"Le panneau est en location, impossible de supprimer."})
        }

        //Suppression des photos
        if(pan.pan_list_photo != null){
            let t_ids = pan.pan_list_photo.split(',').map(x => parseInt(x))
            require('../controller/file').deleteMultipleFile(t_ids)           
        }
        //Envoies de notification au regisseur
        if(pan.reg_id != null){
            let Notif = require('../models/notif')
            //Envoies de notif au régisseur que son panneau a été supprimer
            let n = {
                notif_dest_pr_id:pan.reg_pr_id,
                notif_motif:'del-panel',
                notif_title:"Suppression de panneau par l'Admin",
                notif_desc:"<div> L'administrateur a supprimer votre panneau qui a eu la référence <span v-html=\"'"+pan.pan_ref+"'\" ></span> </div>"
            }

            req.io.emit('new-notif-'+pan.reg_pr_id,{
                t:"Suppresion de panneau",
                c:"L'administrateur a supprimé un de vos panneaux",
                e:true
            })

            await Notif.set(n)
            req.io.emit('del-panel-'+pan.reg_pr_id,"L'administrateur a supprimé un de vos pannenaux")
        }
        const n = await Panel.delete(req.params.id)
        req.io.emit('del-panel-ad')
        return res.send({status:true})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

router.delete('/annonceur/m',async (req,res)=>{
    let Annonceur = require('../models/annonceur')

    try {
        const t_ann = await Annonceur.getIn(req.body)
        let size = t_ann.length
        for(let i=0;i<size;i++){
            let ann = t_ann[i]
            if(ann.pr_id != null){
                const r_pr =  await require('../models/profil').getById(ann.pr_id)
                //Suppression du profil
                await require('../models/profil').deleteMultiple([ann.pr_id])
                //Suppression de profi de société
                await require('../models/profil').deleteSocProfil(ann.soc_pr_id)
                if(r_pr.length == 1){
                    //Suppression du photo de profil
                    let pr = r_pr[0]
                    if(pr.file_profil != null){
                        require('../controller/file').deleteFile(pr.file_profil)
                    }
                }
            }
            //Modification du panneau dans la partie ann_id
            await require('../models/panel').updateTo([{ann_id:null},{ann_id:ann.ann_id}])
        }
        
        await Annonceur.deleteMultiple(req.body)
        return res.send({status:true})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée "+ new Date()})
    }
})

router.delete('/annonceur/:id',async (req,res)=>{
    let Annonceur = require('../models/annonceur')
    if(parseInt(req.params.id).toString() == 'NaN'){
        return res.send({status:false,message:"Erreur de donnée en entrée"})
    }
    try {
        //On va récupérer les infos sur l'annonceur
        const r = await Annonceur.getById(req.params.id)
        if(r.length  == 0){
            return res.send({status:false,message:"Il est possible que l'Annonceur n'existe plus"})
        }

        let ann = r[0]
        if(ann.pr_id != null){
            const r_pr =  await require('../models/profil').getById(ann.pr_id)
            //Suppression du profil
            await require('../models/profil').deleteMultiple([ann.pr_id])
            await require('../models/profil').deleteSocProfil(ann.soc_pr_id)
            if(r_pr.length == 1){
                //Suppression du photo de profil
                let pr = r_pr[0]
                if(pr.file_profil != null){
                    require('../controller/file').deleteFile(pr.file_profil)
                }
            }
        }

        //Modification du panneau dans la partie ann_id
        await require('../models/panel').updateTo([{ann_id:null},{ann_id:ann.ann_id}])
        await Annonceur.deleteById(req.params.id)
        return res.send({status:true})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

router.delete('/regisseur/m',async (req,res)=>{
    let Regisseur = require('../models/regisseur')

    try {
        const t_reg = await Regisseur.getIn(req.body)
        let size = t_reg.length
        for(let i=0;i<size;i++){
            let reg = t_reg[i]

            console.log(reg)
            if(reg.reg_pr_id != null){
                const r_pr =  await require('../models/profil').getById(reg.reg_pr_id)
                //Suppression du profil
                await require('../models/profil').deleteMultiple([reg.reg_pr_id])
                //Suppression de profi de société
                await require('../models/profil').deleteSocProfil(reg.soc_pr_id)
                if(r_pr.length == 1){
                    //Suppression du photo de profil
                    let pr = r_pr[0]
                    if(pr.file_profil != null){
                        require('../controller/file').deleteFile(pr.file_profil)
                    }
                }
            }
            //Modification du panneau dans la partie ann_id
            await require('../models/panel').updateTo([{reg_id:null},{reg_id:reg.reg_id}])
        }
        
        await Regisseur.deleteMultiple(req.body)
        return res.send({status:true})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée "+ new Date()})
    }
})

router.delete('/regisseur/:id',async (req,res)=>{
    let Regisseur = require('../models/regisseur')
    if(parseInt(req.params.id).toString() == 'NaN'){
        return res.send({status:false,message:"Erreur de donnée en entrée"})
    }
    try {
        //On va récupérer les infos sur l'annonceur
        const r = await Regisseur.getById(req.params.id)
        if(r.length  == 0){
            return res.send({status:false,message:"Il est possible que l'Annonceur n'existe plus"})
        }
        let ann = r[0]
        if(reg.pr_id != null){
            const r_pr =  await require('../models/profil').getById(reg.pr_id)
            //Suppression du profil
            await require('../models/profil').deleteMultiple([reg.pr_id])
            await require('../models/profil').deleteSocProfil(reg.soc_pr_id)
            if(r_pr.length == 1){
                //Suppression du photo de profil
                let pr = r_pr[0]
                if(pr.file_profil != null){
                    require('../controller/file').deleteFile(pr.file_profil)
                }
            }
        }

        //Modification du panneau dans la partie ann_id
        await require('../models/panel').updateTo([{reg_id:null},{reg_id:reg.reg_id}])
        await Regisseur.deleteById(req.params.id)
        return res.send({status:true})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

router.put('/panel/valid/:id',async (req,res)=>{
    let Panel = require('../models/panel')

    try{
        let s = {
            pan_validation:1,
            pan_date_validation:new Date()
        }
        

        const pan = await Panel.getById(req.params.id)

        console.log(pan)

        let p = {}
        if(pan.length > 0){
            p = pan[0]
            await Panel.updateTo([s,{pan_id:req.params.id}])

            let n = {
                notif_motif:"validation-panel",
                notif_desc:"<div> Votre panneau <nuxt-link class='text-indigo-600' to='/r/panneau/"+p.pan_id+"'><span v-html=\"'"+p.pan_ref+"'\"></span></nuxt-link> a été valider par l'Administrateur </div>",
                notif_title:"Validation de panneau",
                notif_dest_pr_id:p.reg_pr_id
            }
            await require('../models/notif').set(n)
            req.io.emit('new-notif-'+p.reg_pr_id,{
                t:"Validation de panneau",
                c:"Votre panneau a été validé par l'Admin",
                e:false
            })

            return res.send({status:true})
        }else{
            return res.send({status:false,message:"Il est possible que le panneau n'existe plus"})
        }
        
    }catch(e){
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})



module.exports = router