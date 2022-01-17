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
                if(err)return reject(err)
                resolve(res)
            })  
        })
    }

    static getById(id){
        return new Promise((resolve,reject)=> {
            let sql = "select *,'' as pr_pass from profil where pr_id = ?"
            connection.query(sql,id,(err,res)=>{
                if(err)return reject(err)
                resolve(res)
            })  
        })
    }

    static checkProfilByLogin(login){
        return new Promise((resolve,reject)=> {
            let sql = "select * from profil where pr_login = ?"
            connection.query(sql,login,(err,res)=>{
                if(err)return reject(err)
                resolve(res)
            })  
        })
    }

    static checkSameProfil(d){
        return new Promise((resolve,reject)=> {
            let sql = "select * from profil where pr_login = ? and pr_id <> ?"
            connection.query(sql,d,(err,res)=>{
                if(err)return reject(err)
                resolve(res)
            })  
        })
    }

    static deleteMultiple(d){
        return new Promise((resolve,reject)=>{
            let sql = "delete from profil where pr_id in (?) "
            connection.query(sql,d,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static desactiveMultiple(d){
        return new Promise((resolve,reject)=>{
            let sql = "update profil set pr_active = 0 where pr_id in (?) "
            connection.query(sql,d,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }
    static activeMultiple(d){
        return new Promise((resolve,reject)=>{
            let sql = "update profil set pr_active = 1 where pr_id in (?) "
            connection.query(sql,d,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }
}


module.exports = Profil