let connection = require('../config/db')

class Location{
    static checkPanInLocation(pan_id){
        return new Promise((resolve,reject)=>{
            let sql = `select * from pan_location where pan_id = ? `
            connection.query(sql,pan_id,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getPanLocationById(pan_loc_id){
        return new Promise((resolve,reject)=>{
            let sql = `select * from pan_location where pan_loc_id = ? `
            connection.query(sql,pan_loc_id,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }
    //Suppression d'une location by ...
    static deleteLocationBy(obj_where){
        return new Promise((resolve,reject)=>{
            let sql = `delete from pan_location where ? `
            connection.query(sql,obj_where,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }
}

module.exports = Location