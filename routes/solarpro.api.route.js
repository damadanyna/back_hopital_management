let router = require('express').Router()
let fs = require('fs')
let multer = require('multer')
const sharp = require("sharp")
const bcrypt = require('bcrypt')


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});

//Récupération des login solarpro
router.get('/list',async (req,res)=>{
    let D = require('../models/data')
    try {
        let list = []
        list = await D.exec('select * from solarpro sp left join profil p on sp.sp_pr_id = p.pr_id ')
        return res.send({status:true,list})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée ..."})
    }
    
})

//Aout d'un identifiant solarpro
router.post('/',async (req,res)=>{
    let D = require('../models/data')

    try {
        let d = req.body
        
        if(!d.login || !d.pass){
            return res.send({status:false,message:"Tous les champs sont obligatoire"})
        }

        //On regarde s'il n'y pas de login pareil dans la base
        let lg_test = await D.exec_params(`select pr_id from profil where pr_login = ?`,d.login)
        if(lg_test.length>0){
            return res.send({status:false,message:"Le login existe déjà, Veuillez utiliser un autre login."})
        }

        //Encryption du mot de passe 
        let pass = await new Promise((resolve,reject)=>{
            bcrypt.hash(d.pass, 10, function(err, hash) {
                if (err) reject(err)
                resolve(hash)
            });
        })

        let pr = {
            pr_login:d.login,
            pr_pass:pass,
            pr_type:'spro'
        }

        let id_pr = (await D.set('profil',pr)).insertId
        
        let sp = {
            sp_pr_id:id_pr
        }

        await D.set('solarpro',sp)

        return res.send({status:true})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée ..."})
    }
})

//Mise à jour d'un login solarpro
router.put('/',async (req,res)=>{
    let D = require('../models/data')

    try {
        let d = req.body

        //On regarde s'il n'y pas de login pareil dans la base
        let lg_test = await D.exec_params(`select pr_id from profil where pr_login = ?`,d.pr.login)
        if(lg_test.length>0){
            return res.send({status:false,message:"Le login existe déjà, Veuillez utiliser un autre login."})
        }

        //On regrde le mot de passe
        let pr = {
            pr_login:d.pr.login
        }
        if(d.pr.pass){
            let pass = await new Promise((resolve,reject)=>{
                bcrypt.hash(d.pass, 10, function(err, hash) {
                    if (err) reject(err)
                    resolve(hash)
                });
            })

            pr.pr_pass = pass
        }

        //Mise à jour du truc
        await D.updateWhere('profil',pr,{pr_id:d.old_pr.pr_id})

        return res.send({status:true})

    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée ..."})
    }
})

//Suppression d'un login solarpro
router.delete('/:id',async (req,res)=>{
    let D = require('../models/data')

    try {
        //On récupère les infos solarpro
        let sp = (await D.exec(`select * from solarpro sp left join profil p on sp.sp_pr_id = p.pr_id where sp.sp_id = ${req.params.id} `))[0]

        //Suppression du profil
        await D.del('profil',{pr_id:sp.pr_id})

        //Suppression de solarpro
        await D.del('solarpro',{sp_id:req.params.id})

        return res.send({status:true})

    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée .... Il est possible que le profil n'existe plus"})
    }
})

//Donner accès à solarpro
router.put('/access-panel',async (req,res)=>{
    let D =require('../models/data')

    try {
        await D.updateWhere('panneau',{pan_solarpro_access:(req.body.b)?1:0},{pan_id:req.body.id_p})
        return res.send({status:true})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée ..."})
    }
})

//récupération des panneaux qui ont accès solarpro
router.get('/panel',async (req,res)=>{
    let D =require('../models/data')

    try {
        //Récupération des panneau qui ont accès à solarpro
        let sql = `select p.pan_ref,p.pan_publoc_ref,p.pan_lumineux,p.pan_list_photo,p.pan_list_photo_solarpro,l.*,f.name_file,f.name_min_file,r.reg_label
        from panneau p
        left join file f on f.file_id = p.image_id
        left join lieu l on l.lieu_id = p.lieu_id
        left join regisseur r on r.reg_id = p.reg_id
        where p.pan_solarpro_access = 1`
        let panels = await D.exec(sql)
        return res.send({status:true,panels})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée ..."})
    }
})

module.exports = router