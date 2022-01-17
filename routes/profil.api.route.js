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
	
    if(p.pr_login == ''){
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