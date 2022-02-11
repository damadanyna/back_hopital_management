let connection = require('../config/db')

class Comment{
    static set(c){
        return new Promise((resolve,reject)=>{
            let sql = "insert into comments set ? "
            connection.query(sql,c,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static get(id_obj){
        return new Promise((resolve,reject)=>{
            let sql = "select * from comments where com_obj_id = ? "
            connection.query(sql,id_obj,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static countCommentNonLuByType(d){
        return new Promise((resolve,reject)=>{
            let sql = "select count(*) as nb from comments where com_obj_id = ? and com_pr_type = ? and com_vu = 0 "
            connection.query(sql,d,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static setVuAllByProfilTypeAndObject(d){
        return new Promise((resolve,reject)=>{
            let sql = "update comments set com_vu = 1 where com_obj_id = ? and com_pr_type = ? "
            connection.query(sql,d,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static delById(id_com){
        return new Promise((resolve,reject)=>{
            let sql = "delete from comments where com_id = ? "
            connection.query(sql,id_com,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }
}
module.exports = Comment