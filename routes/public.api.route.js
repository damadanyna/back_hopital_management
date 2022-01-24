let router = require('express').Router()
require('dotenv').config()
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt')

let fs = require('fs')

const config = process.env

router.get('/test',(req,res)=>{
    res.send({message:"API Fonctionnel"})
})

//index api
//Message de Vérification
router.get('/',(req,res)=>{
    return res.send({message:"API Public 1.0 Fonctionnel"})
})

router.post('/auth',(req,res)=>{
    let User = require('../models/user')

    if(req.body.id == undefined){
        return res.send({status:false,message:"Mauvaise donnée envoyée",data:req.body})
    }
    //---------------
    let p = {
        pr_login:req.body.id
    }

    //----------
    User.check_profil(p,(err,result)=>{
        if(err){
            return res.send({status:false,message:"Erreur de la base de donnée"})
        }else{
            if(result.length == 0){
                return res.send({status:false,message:"Cet identifiant n'existe pas."})
            }else{
                let u = result[0]

                //Utilisation de bcrypt hash
                let true_pass = false
                bcrypt.compare(req.body.pass, u.pr_pass, function(err, result) {
                    if(result){
                        //-----------
                        //création de token pour l'utilisateur
                        let u_save = {
                            pr_id:u.pr_id,
                            pr_login:u.pr_login,
                            pr_type:u.pr_type,
                            pr_change_pass:u.pr_change_pass,
                            pr_active:u.pr_active,
                            pr_validate:u.pr_validate
                        }
                        const token = jwt.sign(u_save,config.TOKEN_KEY)
                        let options = {
                            path:"/",
                            sameSite:true,
                            httpOnly: true, // The cookie only accessible by the web server
                        }
                        
                        res.cookie('x-access-token',token, options)
                        return res.send({status:true,message:"Connexion réussie.",u:u_save})
                    }else {
                        return res.send({status:false,message:"Le mot de passe ne correspond pas."})
                    }
                })
            }
            
        }
    })
    
    
})

//Endpoint pour la génération d'image
router.get('/media/:file',async (req,res)=>{
    let File = require('../models/File')

    try {
        const t = await File.getByNameOrMin(req.params.file)
        if(t.length > 0){
            let f = t[0]
            let ext = f.extension_file.toLowerCase();
            let path = (req.params.file == f.name_file)?f.name_file+"."+f.extension_file:f.name_min_file+"."+f.extension_file

            fs.readFile('./uploads/' + path, function(err, content) {
                if (err) {
                res.writeHead(400, {
                    'Content-type': 'text/html'
                })
                console.log(err);
                res.end("Aucune image disponible");
                } else {
                //specify the content type in the response will be an image
                res.writeHead(200, {
                    'Content-type': 'image/jpg'
                });
                res.end(content);
                }
            });
        }else{
            res.end("Aucune image disponible");
        }
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }

    // File.get_by_name(req.params.file,(err,result)=>{
    //     if(err){
    //         res.sendStatus(404)
    //     }else{
    //         if(result.length > 0){
    //             let f = result[0]
    //             let ext = f.extension_file.toLowerCase();
    //             let path = f.name_file+"."+f.extension_file

    //             fs.readFile('./uploads/' + path, function(err, content) {
    //                 if (err) {
    //                 res.writeHead(400, {
    //                     'Content-type': 'text/html'
    //                 })
    //                 console.log(err);
    //                 res.end("Aucune image disponible");
    //                 } else {
    //                 //specify the content type in the response will be an image
    //                 res.writeHead(200, {
    //                     'Content-type': 'image/jpg'
    //                 });
    //                 res.end(content);
    //                 }
    //             });
    //         }else{
    //             res.end("Aucune image disponible");
    //         }
    //     }
    // })
})

router.get('/testIm',async (req,res)=>{
    let File = require('../models/File')

    try {
        const t = await File.getByNameOrMin("test")

        return res.send({status:true,d:t})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})


//les routes public pour le panneau
router.use('/panel',require('./p.panel.api.route'))

//Les routes public d'inscription
router.post('/inscription',async (req,res)=>{
    let Annonceur = require('../models/annonceur')
    let Regisseur = require('../models/regisseur')

    let ar = req.body

    let data_r = ['society','adresse','email_soc','nif','stat','login','pass','c_pass','soc_type']
    let data_e = ['society','adresse','login','pass']


    data_r.forEach( function(e, index) {
        if(ar[e] === undefined){
            return res.send({status:false,message:"Erreur de donnée en Entrée 1"})
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

    if(ar.soc_type != 'ann' &&  ar.soc_type != 'reg'){
        return res.send({status:false,message:"Erreur de donnée en Entrée 1"}) 
    }


    let state = 'debut'
    try {
        let Profil = require('../models/profil')
        state = 'insertion-profil-soc'
        //Insertion du profil de la société
        const soc_res = await Profil.addSocProfil(soc_pr)

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
            pr_type:ar.soc_type,
            pr_change_pass:0,
            pr_active:1,
            pr_validate:0
        }

        state = 'insertion-profil-user'
        const pr_res = await Profil.addUserProfil(pr)

        let ann = {
            ann_label:ar.society,
            soc_pr_id:soc_res.insertId,
            pr_id:pr_res.insertId
        }
        let reg = {
            reg_label:ar.society,
            soc_pr_id:soc_res.insertId,
            pr_id:pr_res.insertId
        }

        //Création des tokens pour le profil
        state = 'insertion-profil'
        pr.pr_id = pr_res.insertId
        const token = jwt.sign(pr,config.TOKEN_KEY)
        let options = {
            path:"/",
            sameSite:true,
            httpOnly: true, // The cookie only accessible by the web server
        }
        
        res.cookie('x-access-token',token, options)
        state = 'insertion-soc'
        if(ar.soc_type == 'ann'){
            const ann_res = await Annonceur.add(ann)
            insertNotificationIns(ar.society,pr_res.insertId,ann_res.insertId,'ann')
            req.io.emit('new-notif-ad',{t:"Inscription d'un Annonceur",c:"Une société vient de s'inscrire en tant qu'Annonceur",e:false})
            return res.send({status:true,id:ann_res.insertId,pr:pr})
        }else{
            const reg_res = await Regisseur.add(reg)
            insertNotificationIns(ar.society,pr_res.insertId,reg_res.insertId,'reg')
            req.io.emit('new-notif-ad',{t:"Inscription d'un Régisseur",c:"Une société vient de s'inscrire en tant que Régisseur",e:false})
            return res.send({status:true,id:reg_res.insertId,pr:pr})
        }

        
        
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur de la base de donnée"}) 
    }
})

async function insertNotificationIns(label_soc,id_pr,id_object,type){
    let Notif = require('../models/notif')
    let n = {
        notif_exp_pr_id:id_pr,
        notif_id_object:id_object,
        notif_title:(type == 'ann')?"Inscription d'un annonceur":"Inscription d'un régisseur",
        notif_motif:"inscription",
        notif_type:'a',
        notif_data:(type == 'ann')?'annonceur':'regisseur',
        notif_desc:"<div>Une société nommée <nuxt-link class='bt text-sm mx-1' "+
        "to='/admin/"+((type == 'ann')?'annonceur':'regisseur')+"/"+id_object+"'> <span v-html='\""+label_soc+"\"'></span> </nuxt-link> vient de s'inscrire en tant que  "
        +((type == 'ann')?'Annonceur':'Régisseur')+".</div>"
    }
    await Notif.set(n)
}

module.exports = router