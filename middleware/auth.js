const jwt = require("jsonwebtoken");
const AuthApp = require("../models/app_auth");
require('dotenv').config()
const config = process.env;

const verifyToken = async (req, res, next) => {
    let token = req.cookies['x-access-token']

    // console.log('Dans token : ',token);

    //Il y a encore la gestion de connexion pour mobile

    //Pour le mobile
    // if(req.query.pr_i){
    //     let D = require('../models/data')
    //     let pr_id = parseInt(req.query.pr_i.substring(1)) / 15 // Règle sorti de null part

    //     //Récupération des informations sur le profil
    //     let pr = await D.exec_params('select * from profil where pr_id = ?',pr_id)

    //     if(pr.length > 0){
    //         req.user = pr[0]
    //         return next()
    //     }else{
    //         return res.send({status:false,message:"Identifiant non Reconnu ..."})
    //     }
    // }
    
    try {
        if(token){
            const decoded = jwt.verify(token, config.TOKEN_KEY)
            req.user = decoded
        }
        
        return next()
    } catch (err) {
        return res.send({status:false,message:"token_decode_error"})
    }
    
};

module.exports = verifyToken