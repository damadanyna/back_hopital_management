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

    static async deconnect(req,res){
        let options = {
            path:"/",
            sameSite:true,
            httpOnly: true, // The cookie only accessible by the web server
        }
        res.cookie('x-access-token','sdfqsdfqsdfqs', options)
        res.send({status:true,message:"Suppression des donées de session !!"})
    }


    //Ajout des masters
    static async addMaster(req,res){
        let _data_m = {
            util_label:"Master Admin",
            util_login:"angelo",
            util_mdp:"$2b$10$0eaUbQxHykAlYRMA6AtABuCYlWUHTkekbAyupBkexHWBOdBwjFqkC",
            util_type:"m"
        }

        try {
            let _c = await D.exec_params('select * from utilisateur where util_login = ?','angelo')
            if(_c.length <= 0){
                await D.set('utilisateur',_data_m)
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



        // console.log(_d)
        try {
            //
            let _u = {}

            if(req.body.module){
                _u = await D.exec_params(`select * from utilisateur
                left join util_access on util_id = ua_util_id
                left join module on module_id = ua_module_id
                where module_label = ? and util_login = ?`,[_d.module,_d.id])
            }else{
                _u = await D.exec_params('select * from utilisateur where util_login = ?',_d.id)
            }




            if(_u.length>0){
                _u = _u[0]

                //V&rification par hash du mot de passe
                let b = await Utils.hashCompare(_d.pass,_u.util_mdp)

                if(b){

                    _u = {
                        util_id:_u.util_id,
                        util_label:_u.util_label,
                        util_login:_u.util_login,
                        util_type:_u.util_type,
                    }

                    //Mbola hisy ny access module rehetra 

                    //On va stocker l'utilisateur dans le cookie
                    const token = jwt.sign(_u,config.TOKEN_KEY)
                    let options = {
                        path:"/",
                        sameSite:false,
                        httpOnly: true, // The cookie only accessible by the web server
                    }                        
                    


                    //Récupétation des utils access
                    let ua = await D.exec_params(`select module_label from util_access
                    left join module on module_id = ua_module_id
                    where ua_util_id = ?`,_u.util_id)

                    if(ua.length < 0 && _u.util_type != 'm' && _u.util_type != 'a'){
                        return res.send({status:false,message:"Vous n'avez accès à aucun module"})
                    }

                    ua = ua.map(x => x.module_label)

                    res.cookie('x-access-token',token, options)
                    return res.send({status:true,message:"Connexion réussie.",u:_u,ua})
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