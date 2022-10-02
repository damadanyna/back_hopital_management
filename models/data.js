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

    static set(table,s){
        return new Promise((resolve,reject)=>{
            let sql = `insert into ${table} set ? `
            connection.query(sql,s,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }
    static del(table,w){
        return new Promise((resolve,reject)=>{
            let sql = `delete from ${table} where ? `
            connection.query(sql,w,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
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

    static insert(table,data){
        return new Promise((resolve,reject)=>{
            let sql = "insert into "+table+" set ? "
            connection.query(sql,data,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static exec(sql){
        return new Promise((resolve,reject)=>{
            connection.query(sql,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static exec_params(sql,p){
        return new Promise((resolve,reject)=>{
            connection.query(sql,p,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }
}

module.exports = Data