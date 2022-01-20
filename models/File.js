let connection = require('../config/db')


class File{
    static post(p,cb){
        connection.query('insert into file set ?',p,(err,result)=>{
            cb(err,result)
        })
    }

    static get(){
        return new Promise((resolve,reject)=>{
            connection.query('select * from file',(err,res)=>{
                if(err)return reject(err)
                resolve(res)
            })
        })
    }

    static get_by_id(id,cb){
        connection.query('select * from file where file_id=?',id,(err,result)=>{
            cb(err,result)
        })
    }

    static get_by_name(name,cb){
        connection.query('select * from file where name_file=?',name,(err,result)=>{
            cb(err,result)
        })
    }
    static delete_by_id(id,cb){
        connection.query('delete from file where file_id=?',id,(err,result)=>{
            if(cb != undefined){
                cb(err,result)
            }
        })
    }
}

module.exports = File