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

module.exports = router