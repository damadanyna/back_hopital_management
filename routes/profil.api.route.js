let router = require('express').Router()
let moment = require('moment')
let fs = require('fs')
const bcrypt = require('bcrypt')


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});


//Get list
router.get('/',async (req,res)=>{
    let Profil = require('../models/profil')
    const d = await Profil.all()

    return res.send({status:true,profils:d})
})
//Get list
router.get('/:id',async (req,res)=>{
    let Profil = require('../models/profil')
    let id = parseInt(req.params.id)

    if(id.toString() == 'NaN'){
        return res.send({status:false,message:"Erreur de donnée en Entrée"})
    }

    try {
        const r = await Profil.getById(id)
        return res.send({status:true,profil:r[0]})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }

    return res.send({status:true,profils:d})
})


//Post de profil
router.post('/',async (req,res)=>{
    let Profil = require('../models/profil')
    let p = req.body

    if(p.pr_login == undefined ||  p.pr_pass == undefined){
        return res.send({status:false,message:'Erreur de donnée Entrée'})
    }

    if((p.pr_login = p.pr_login.trim()) == '' ||  (p.pr_pass = p.pr_pass.trim()) == ''){
        return res.send({status:false,message:'Tous les champs sont obligatoire.'})
    }
	
	//J'ai failli oublier de hacher le mot de pass
	const pass = await new Promise((resolve,reject)=>{
        bcrypt.hash(p.pr_pass, 10, function(err, hash) {
            if (err) reject(err)
            resolve(hash)
        })
    })
	
	p.pr_pass = pass

    const d = await Profil.addUserProfil(p).catch(e =>{
        return res.send({status:false,message:'Erreur de la base de donnée'})
    })

    if(d){
        return res.send({status:true})
    }

})
router.put('/desactive',async (req,res)=>{
    let Profil = require('../models/profil')
    let p = req.body
    console.log(p)
    try {
        const r = await Profil.desactiveMultiple(p)
        return res.send({status:true})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:'Erreur de la base de donnée'})
    }
})
router.put('/active',async (req,res)=>{
    let Profil = require('../models/profil')
    let p = req.body
    console.log(p)
    try {
        const r = await Profil.activeMultiple(p)
        return res.send({status:true})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:'Erreur de la base de donnée'})
    }
})

//Validation d'un profil
router.put('/validate/:id',async (req,res)=>{
    if(req.user.pr_type != 'a'){
        return res.send({status:false,message:"Autorisation non suffisante"})
    }
    let Profil = require('../models/profil')
    let Notif = require('../models/notif')

    let id = parseInt(req.params.id)
    let d = parseInt(req.body.pr_validate)

    if(id.toString() == 'NaN' || d.toString() == 'NaN'){
        return res.send({status:false,message:"Erreur de donnée en entrée"})
    }

    try {
        const id_pr = await Profil.getById(id)
        if(id_pr.length > 0){

        }
        const p_res = await Profil.updateUserProfil(id,{pr_validate:d,pr_date_ins_validate:new Date()})

        let notif = {
            notif_exp_pr_id:req.user.pr_id,
            notif_motif:'validation-profil',
            notif_id_object:id,
            notif_title:"Validation de profil",
            notif_type:id_pr.pr_type
        }
        let ds = "<div class='flex flex-col'>"
        ds+="<span>Votre profil a été validé par l'Administrateur, Vous pouvez maintenant reserver et louer des panneaux.</span>"
        ds+="<span>Rechercher et parcourir la liste <nuxt-link to='/panneau' class='text-indigo-600'>ici</nuxt-link> </span>"
        ds+="</div>"

        let ds_reg = "<div class='flex flex-col'>"
        ds_reg+="<span>Votre profil a été validé par l'Administrateur, Vous pouvez maintenant recevoir les demandes de réservation et voir/ajouter/modifier vos panneaux.</span>"
        ds_reg+="</div>"

        notif.notif_desc = (id_pr.pr_type == 'ann')?ds:ds_reg

        notif.notif_dest_pr_id = id
        await Notif.set(notif)
        
        return res.send({status:true,message:"Validation de profil avec succès. Le profil en question recevra une notification"}) 
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur de la base de donnée"})
    }

})

//Modification de profil
router.put('/:id',async (req,res)=>{
    let Profil = require('../models/profil')
    let p = req.body
    console.log(p)

    let pr = {}
    if(p.pr_pass != '' && p.pr_pass != undefined){
        const pass = await new Promise((resolve,reject)=>{
            bcrypt.hash(p.pr_pass, 10, function(err, hash) {
                if (err) reject(err)
                resolve(hash)
            })
        })

        pr.pr_pass = pass
    }
	
    if(p.pr_login !=undefined && p.pr_login == ''){
        return res.send({status:false,message:"Champ Login Obligatoire ..."})
    }

    try {
        if(p.pr_login != undefined){
            console.log(p.pr_login)
            const cp = await Profil.checkSameProfil([req.params.id,p.pr_login])
            if(cp.length > 0){
                return res.send({status:false,message:"Login déjà existant ..."})
            }
        }
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }

    

    let tr = ['pr_login','pr_change_pass','pr_active']

    for(let i=0;i<tr.length;i++){
        if(p[tr[i]] != undefined){
            pr[tr[i]] = p[tr[i]]
        }
    }

    try {
        const p_res = await Profil.updateUserProfil(req.params.id,pr)
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Login déjà existant ..."})
    }

    return res.send({status:true})
   
})

router.delete('/',async (req,res)=>{
    let Profil = require('../models/profil')
    let p = req.body

    try {
        const r = await Profil.deleteMultiple(p)
        return res.send({status:true})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
    
})



module.exports = router