let connection = require('../config/db')


class File{
    static post(p){
        return new Promise((resolve,reject)=>{
            connection.query('insert into file set ?',p,(err,result)=>{
                if(err) return reject(err)
                resolve(result)
            })
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

    static getById(id){
        return new Promise((resolve,reject)=>{
            connection.query('select * from file where file_id=?',id,(err,result)=>{
                if(err) return reject(err)
                resolve(result)
            })
        })
    }

    static getIn(ids){
        return new Promise((resolve,reject)=>{
            connection.query('select * from file where file_id in (?)',[ids],(err,result)=>{
                if(err) return reject(err)
                resolve(result)
            })
        })
    }

    static getInP(ids){
        return new Promise((resolve,reject)=>{
            connection.query('select dimension_file,dimension_min_file,name_file,name_min_file from file where file_id in (?)',[ids],(err,result)=>{
                if(err) return reject(err)
                resolve(result)
            })
        })
    }

    static get_by_name(name,cb){
        connection.query('select * from file where name_file = ? ',name,(err,result)=>{
            cb(err,result)
        })
    }

    static getByNameOrMin(name){
        return new Promise((resolve,reject)=>{
            connection.query('select * from file where name_file = ? OR name_min_file = ? ',[name,name],(err,result)=>{
                if(err) return reject(err)
                resolve(result)
            })
        })
    }
    static deleteById(id){
        return new Promise((resolve,reject)=>{
            connection.query('delete from file where file_id=?',id,(err,result)=>{
                if(err) return reject(err)
                resolve(result)
            })
        })
    }

    static setUseFile(ids){
        return new Promise((resolve,reject)=>{
            connection.query('update file set type_file="use" where file_id in (?)',[ids],(err,result)=>{
                if(err) return reject(err)
                resolve(result)
            })
        })
    }

    //Récupération de liste d'image 
    static getFileByIds(ids){
        return new Promise((resolve,reject)=>{
            let sql = `select name_file,name_min_file,dimension_file,file_id from file as f where file_id in (?) `
            connection.query(sql,[ids],(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }
}

module.exports = File