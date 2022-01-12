let connection = require('../config/db')

class Profil{
    static addSocProfil(pr){
        return new Promise((resolve,reject)=>{
            let sql = 'insert into soc_profil set ?'
            connection.query(sql,pr,(err,res)=>{
                if(err){
                    return reject(err)
                }

                resolve(res)
            })  
        })
    }

    static updateSocProfil(id,pr){
        return new Promise((resolve,reject)=>{
            let sql = 'update soc_profil set ? where soc_pr_id='+id
            connection.query(sql,pr,(err,res)=>{
                if(err){
                    return reject(err)
                }

                resolve(res)
            })  
        })
    }

    static addUserProfil(pr){
        return new Promise((resolve,reject)=>{
            let sql = 'insert into profil set ?'
            connection.query(sql,pr,(err,res)=>{
                if(err){
                    return reject(err)
                }
                resolve(res)
            })  
        })
    }

    static updateUserProfil(id,pr){
        return new Promise((resolve,reject)=>{
            let sql = 'update profil set ? where pr_id='+id
            connection.query(sql,pr,(err,res)=>{
                if(err){
                    return reject(err)
                }
                resolve(res)
            })  
        })
    }

    static all(){
        return new Promise((resolve,reject)=>{
            let sql = 'select * from profil'
            connection.query(sql,(err,res)=>{
                if(err){
                    return reject(err)
                }
                resolve(res)
            })  
        })
    }
}


module.exports = Profil