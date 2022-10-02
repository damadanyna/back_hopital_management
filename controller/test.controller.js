const bcrypt = require('bcrypt')


let utils = require('../utils/utils') 

class Test{
    static index(req,res){
        return res.send({status:true,message:"Tu vois ça marche"})
    }

    static async testBcrypt(req,res){
        let hash = "none";
        
        if(req.query.hash){
            hash = await utils.hash(req.query.hash)
        }
        return res.send({hash})
    }
}


module.exports = Test