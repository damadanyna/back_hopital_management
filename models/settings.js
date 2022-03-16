let connection = require('../config/db')

class Settings{
    static getSlidesAdmin(){
        return new Promise((resolve,reject)=>{
            let sql = `select * from menu_slides as ms
            left join file as f on f.file_id = ms.ms_image_id 
            order by ms.ms_rang `
            
            connection.query(sql,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getSlides(){
        return new Promise((resolve,reject)=>{
            let sql = `select ms.*,f.file_id,f.name_file,f.dimension_file from menu_slides as ms
            left join file as f on f.file_id = ms.ms_image_id 
            order by ms.ms_rang `
            
            connection.query(sql,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getGrosPlanPublic(){
        return new Promise((resolve,reject)=>{
            let sql = `select gp.*,l.*,p.pan_ref,p.pan_id,p.image_id,f.name_file,f.name_min_file from gros_plan as gp
            left join panneau as p on p.pan_id = gp.gp_pan_id
            left join lieu as l on l.lieu_id = p.lieu_id 
            left join file as f on f.file_id = p.image_id `

            connection.query(sql,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getById(id){
        return new Promise((resolve,reject)=>{
            let sql = `select * from menu_slides as ms
            left join file as f on f.file_id = ms.ms_image_id 
            where ms_id = ? `
            
            connection.query(sql,id,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static deleteById(id){
        return new Promise((resolve,reject)=>{
            let sql = `delete from menu_slides where ms_id = ? `
            
            connection.query(sql,id,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static addSlide(s){
        return new Promise((resolve,reject)=>{
            let sql = `insert into menu_slides set ?`
            connection.query(sql,s,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }
}

module.exports = Settings