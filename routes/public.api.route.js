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

//Création de route pour la connexion avec la base

//Les routes des applications
/*router.post('/auth',(req,res)=>{
    let {login,pass} = req.body
    if(login && pass){
        let User = require('./../models/user')
        User.get_by_login(login,(result)=>{
            
            if(result.length <= 0){
                res.send({status:false,message:"Identifiant non reconnu ..."})
            }else{
                let u = result[0]

                //Utilisation de bcrypt hash
                let true_pass = false
                bcrypt.compare(pass, u.pass, function(err, result) {
                    if(result){
                        //création de token pour l'utilisateur
                        const token = jwt.sign({
                            login:u.login,
                            type:u.type
                        },config.TOKEN_KEY)
                        let options = {
                            path:"/",
                            sameSite:true,
                            httpOnly: true, // The cookie only accessible by the web server
                        }
                        
                        if(req.body.create_token){
                            //on va hasher le login le typr et l'id
                            bcrypt.hash(u.login+""+u.type+""+u.id, 10, function(err, hash) {
                                let AuthApp = require('./../models/app_auth')
                                AuthApp.check_token_by_user_id(u.id,(err,result)=>{
                                    if(!err){
                                        if(result.length == 0){
                                            AuthApp.add_token({user_id:u.id,token:hash},(err,result)=>{
                                                if(!err){
                                                    u.tk_app = hash
                                                    res.cookie('x-access-token',token, options)
                                                    res.send({status:true,message:"Connexion réussie ...",user:u})
                                                }
                                            })
                                        }else{
                                            u.tk_app = result[0].token
                                            res.cookie('x-access-token',token, options)
                                            res.send({status:true,message:"Connexion réussie ...",user:u})
                                        }
                                    }
                                })
                            });
                        }else{
                            res.cookie('x-access-token',token, options)
                            res.send({status:true,message:"Connexion réussie ...",user:u})
                        }
                    }else{
                        res.send({status:false,message:"Mot de passe Incorrect"})
                    }
                })
                
            }
        })

        //res.send({status:false,message:"Données incorrectes ... ",data:d})
    }else{
        res.send({status:false,message:"Erreur de données, Champs obligatoire vide ..."})
    }
})
*/


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
                            pr_change_pass:u.pr_change_pass
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
router.get('/media/:file',(req,res)=>{
    let File = require('../models/File')

    File.get_by_name(req.params.file,(err,result)=>{
        if(err){
            res.sendStatus(404)
        }else{
            if(result.length > 0){
                let f = result[0]
                let ext = f.extension_file.toLowerCase();
                let path = f.name_file+"."+f.extension_file
                
                // fs.readFile(, function(err, data) {
                //     let base64data = new Buffer.from(data).toString('base64')

                    
                //     // res.contentType('image/'+ext)
                //     return res.end("data:image/"+ext+";base64,"+base64data,'binary')
                //  });
                // res.sendFile(path,{root:'./uploads'})
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
        }
    })
})


//les routes public pour le panneau


router.use('/panel',require('./p.panel.api.route'))


module.exports = router