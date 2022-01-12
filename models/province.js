let connection = require('../config/db')

class Province{
    static all(cb){
        connection.query('select * from province',(err,res)=>{
            cb(err,res)
        })
    }
}

module.exports = Province