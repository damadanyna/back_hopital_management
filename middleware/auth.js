const jwt = require("jsonwebtoken");
const AuthApp = require("../models/app_auth");
require('dotenv').config()
const config = process.env;

const verifyToken = (req, res, next) => {
    let token = req.cookies['x-access-token']
    if (!token) {
        return res.send({status:false})
    }else{
        try {
            const decoded = jwt.verify(token, config.TOKEN_KEY)
            req.user = decoded
            return next()
        } catch (err) {
            return res.send({status:false})
        }
    }
    
};

module.exports = verifyToken