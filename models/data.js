let connection = require('../config/db')
let fs = require('fs')


class Data{
    static execute(f){
        return new Promise((resolve,reject)=>{
            fs.readFile(f+'.sql','utf8',(err,data)=>{
                connection.query(data,(err,result) =>{
                    if(err) return reject(err)
                    resolve(result)
                })
            })
        })
    }
    static check_init(){
        return new Promise((resolve,reject)=>{
            connection.query("select * from profil",(err,result) =>{
                if(err) return reject(err)
                resolve(result)
            })
        })
    }

    static updateWhere(table,up,where){
        return new Promise((resolve,reject)=>{
            let sql = "update "+table+" set ? where ? "
            connection.query(sql,[up,where],(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }
}

module.exports = Data