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

    static getWhere(table,where){
        return new Promise((resolve,reject)=>{
            let sql = "select * from "+table+" where ? "
            connection.query(sql,[where],(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    //Gestion des services et location/réservation

    static getTarifByService(id_serv){
        return new Promise((resolve,reject)=>{
            let sql = "select * from tarif where service_id = ? "
            connection.query(sql,id_serv,(err,res)=>{
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
}

module.exports = Data