let router = require('express').Router()
const bcrypt = require('bcrypt')


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});

router.get('/count',(req,res)=> {
    let Regisseur = require('../models/regisseur')

    Regisseur.count((err,result)=>{
        if(err){
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }else{
            return res.send({status:true,nb:result[0].nb})
        }
    })
})

router.get('/:id',async (req,res)=>{
    let Regisseur = require('../models/regisseur')

    let id = parseInt(req.params.id)

    if(id.toString() == 'NaN'){
        return res.send({status:false,message:"Erreur de donnée en Entrée"})
    }

    const result = await Regisseur.getById(id).catch(e =>{
        console.log(e)
        return res.send({status:false,message:"Erreur de la base de donnée."})
    }).then(r =>{
        return res.send({status:true,regisseur:r[0]})
    } )

    
})


router.get('/',(req,res)=> {
    let Regisseur = require('../models/regisseur')

    Regisseur.all((err,result)=>{
        if(err){
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }else{
            return res.send({status:true,regisseurs:result})
        }
    })
})

router.post('/',async (req,res)=>{
    let Regisseur = require('../models/regisseur')
    let ar = req.body

    let data_r = ['society','adresse','email_soc','nif','stat','login','pass','c_pass']
    let data_e = ['society','adresse','login','pass']


    data_r.forEach( function(e, index) {
        if(ar[e] == undefined){
            return res.send({status:false,message:"Erreur de donnée en Entrée"})
        }
    });

    data_e.forEach((e,i)=>{
        if(ar[e] == ''){
            return res.send({status:false,message:"Champs obligatoire vide"})
        }
    })

    if(ar.c_pass != '' && ar.pass != ''){
        if(ar.c_pass != ar.pass){
            return res.send({status:false,message:"Les 2 mots de passes sont différents"})
        }
    }

    let soc_pr = {
        soc_pr_label:ar.society,
        soc_pr_adresse:ar.adresse,
        soc_pr_nif: ( ar.nif.trim() == '' )?null:ar.nif.trim(),
        soc_pr_stat:( ar.stat.trim() == '' )?null:ar.stat.trim(),
        soc_pr_email:( ar.email_soc.trim() == '' )?null:ar.email_soc.trim(),
    }


    let Profil = require('../models/profil')
    //Insertion du profil de la société
    const soc_res = await Profil.addSocProfil(soc_pr).catch(e =>{
        return res.send({status:false,message:"Erreur dans la base de donnée [Insertion profil société]"})
    })

    //Insertion profil utilisateur de la société
    const pass = await new Promise((resolve,reject)=>{
        bcrypt.hash(ar.pass, 10, function(err, hash) {
            if (err) reject(err)
            resolve(hash)
        });
    })


    let pr = {
        pr_pass:pass,
        pr_login:ar.login,
        pr_type:'reg',
        pr_change_pass:1
    }


    const pr_res = await Profil.addUserProfil(pr).catch(e =>{
        return res.send({status:false,message:"Erreur dans la base de donnée [Insertion profil Utilisateur]"})
    })

    let reg = {
        reg_label:ar.society,
        soc_pr_id:soc_res.insertId,
        pr_id:pr_res.insertId
    }



    const reg_res = await Regisseur.add(reg).catch(e =>{
        return res.send({status:false,message:"Erreur dans la base de donnée [Insertion Regisseur]"})
    })

    return res.send({status:true,id:reg_res.insertId})

})

//Modification annonceur
router.put('/:id',async (req,res)=>{
    let Regisseur = require('../models/regisseur')
    let ar_brut = req.body

    let ar = {}
    let p = {}

    let list_soc_pr = ['soc_pr_label','soc_pr_adresse','soc_pr_nif','soc_pr_stat','soc_pr_email']
    let list_pr = ['pr_login','pr_pass']

    //return res.send({status:false,id:ar_brut})

    list_soc_pr.forEach(e => {
        ar[e] = ar_brut[e]
    })

    list_pr.forEach(e => {
        p[e] = ar_brut[e]
    })

    //return res.send({status:false,p:p,ar:ar})

    if(p.pr_login == ''){
        return res.send({status:false,message:"Informations de connexion vide !"})
    }

    let soc_pr = {
        soc_pr_label:ar.soc_pr_label,
        soc_pr_adresse:ar.soc_pr_adresse,
        soc_pr_nif: ( ar.soc_pr_nif == null || ar.soc_pr_nif.trim() == '' )?null:ar.soc_pr_nif.trim(),
        soc_pr_stat:( ar.soc_pr_stat == null || ar.soc_pr_stat.trim() == '' )?null:ar.soc_pr_stat.trim(),
        soc_pr_email:( ar.soc_pr_email == null || ar.soc_pr_email.trim() == '' )?null:ar.soc_pr_email.trim(),
    }

    let Profil = require('../models/profil')
    //Insertion du profil de la société
    const soc_res = await Profil.updateSocProfil(ar_brut.soc_pr_id,soc_pr).catch(e =>{
        return res.send({status:false,message:"Erreur dans la base de donnée [Mise à our profil société]"})
    })


    //Mise à jour profil
    //Insertion profil utilisateur de la société
    const pass = await new Promise((resolve,reject)=>{
        bcrypt.hash(p.pr_pass, 10, function(err, hash) {
            if (err) reject(err)
            resolve(hash)
        });
    })

    let pr = {
        pr_login:p.pr_login,
        pr_change_pass:1
    }

    if(p.pr_pass != ''){
        pr.pr_pass = pass
    }


    const pr_res = await Profil.updateUserProfil(ar_brut.pr_id,pr).catch(e =>{
        return res.send({status:false,message:"Erreur dans la base de donnée [Insertion profil Utilisateur]"})
    })

    let reg = {
        reg_label:ar.soc_pr_label
    }

    const a = await Regisseur.update(ar_brut.reg_id,reg).catch(e =>{
        return res.send({status:false,message:"Erreur dans la base de donnée [Modif Annonceur]"})
    }).then(e =>{
        return res.send({status:true})
    })

})


module.exports = router