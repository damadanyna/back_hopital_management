let connection = require('../config/db')

class Notif{
    static set(notif){
        return new Promise((resolve,reject)=>{
            let sql = "insert into notification set ? "
            connection.query(sql,notif,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })

    }
}

module.exports = Notif