let connection = require('../config/db')
const util = require('util')

class User{

    static async post(p){
        const r = await connection.query("insert into soc set ?",p)
        console.log(r)
    }

    static check_profil(p,cb){
        const t = connection.query("select * from profil where ?",p,(err,res)=>{
            cb(err,res)
        })
    }
}

module.exports = User