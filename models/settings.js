let connection = require('../config/db')

class Settings{
    static getall(cb){
        connection.query('select * from settings',(err,result)=>{
            cb(err,result)
        })
    }

    static update(p,cb){
        connection.query('update settings set ? where id=1',p,(err,result)=>{
            cb(err,result)
        })
    }

    static creatdefault(cb){
        let p = {
            temp_control_jour:'08:00:00',
            temp_control_nuit:'17:00:00'
        }
        connection.query('insert into settings set ? ',p,(err,result)=>{
            cb(err,result)
        })
    }
}

module.exports = Settings