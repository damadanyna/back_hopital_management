let D = require('../models/data')
const Utils = require('../utils/utils')

const jwt = require("jsonwebtoken");

let fs = require('fs')
const AuthApp = require("../models/app_auth");
require('dotenv').config()
const config = process.env


class Status{
    static async status(req,res){
        if(req.user){
            //mila mi-retourne data utils / izay ilaina
            return res.send({status:true,u:req.user})
        }else{
            return res.send({status:false})
        }
    }


    //Ajout des masters
    static async addMaster(req,res){
        let _data_m = {
            user_label:"Master Admin",
            user_login:"angelo",
            user_pass:"$2b$10$0eaUbQxHykAlYRMA6AtABuCYlWUHTkekbAyupBkexHWBOdBwjFqkC",
            user_type:"m"
        }

        try {
            let _c = await D.exec_params('select * from m_user where user_login = ?','angelo')
            if(_c.length <= 0){
                await D.set('user',_data_m)
            }

            return res.send({status:true,message:"_M _created"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async auth(req,res){

        //Authentification des utilisateurs
        let _d = req.body // {id,pass}

        console.log(_d)
        try {
            //
            let _u = await D.exec_params('select * from m_user where user_login = ?',_d.id)

            if(_u.length>0){
                _u = _u[0]

                //V&rification par hash du mot de passe
                let b = await Utils.hashCompare(_d.pass,_u.user_pass)
                if(b){

                    _u = {
                        user_id:_u.user_id,
                        user_label:_u.user_label,
                        user_login:_u.user_login,
                        user_type:_u.user_type,
                    }

                    //Mbola hisy ny access module rehetra 

                    //On va stocker l'utilisateur dans le cookie
                    const token = jwt.sign(_u,config.TOKEN_KEY)
                    let options = {
                        path:"/",
                        sameSite:true,
                        httpOnly: true, // The cookie only accessible by the web server
                    }                        
                    res.cookie('x-access-token',token, options)
                    return res.send({status:true,message:"Connexion réussie.",u:_u})
                }else{
                    return res.send({status:false,message:"Le mot de passe ne correspond pas"})
                }
            }else{
                return res.send({status:false,message:`L'Idenfiant n'existe pas dans la base`})
            }

        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Status