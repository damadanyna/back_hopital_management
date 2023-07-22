const jwt = require("jsonwebtoken");
const AuthApp = require("../models/app_auth");
require('dotenv').config()
const config = process.env;

const verifyToken = async (req, res, next) => {
    let token = req.cookies['x-access-token']
    try {
        if(token){
            const decoded = jwt.verify(token, config.TOKEN_KEY)
            req.user = decoded
            //console.log(req.user)
        }
        return next()
        //return res.send({status:false,message:"Erreur dans la base de donnée,"})
    } catch (err) {
        return res.send({status:false,message:"token_decode_error"})
    }
    
};

module.exports = verifyToken