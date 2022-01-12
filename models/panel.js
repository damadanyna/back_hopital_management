let connection = require('../config/db')

class Place{
    //New
    static all(cb){
        let sql = "select panneau.*,province_label,cat_label from panneau "
        sql+='left join province on panneau.province_id = province.province_id '
        sql+='left join category on panneau.cat_id = category.cat_id '
        /*sql+="left join regisseur"*/
        connection.query(sql,(err,result) =>{
            cb(err,result)
        })
    }

    static getAllLimit(limit,page){
        return new Promise((resolve,reject)=>{
            let sql = "select panneau.*,province.province_label,file.name_file from panneau "
            sql+="left join province on panneau.province_id = province.province_id "
            sql+="left join file on panneau.image_id = file.file_id "
            sql+="limit ? "

            connection.query(sql,limit,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static add(p,cb){
        connection.query('insert into panneau set ?',p,(err,res)=>{
            cb(err,res)
        })
    }
    static count(cb){
        connection.query('select count(*) as nb from panneau ',(err,res)=>{
            cb(err,res)
        })
    }

    static update(id,pr,cb){
        connection.query('update panneau set ? where pan_id='+id,pr,(err,res)=>{
            cb(err,res)
        })
    }

    static get_by_id(id,cb){
        let sql = "select panneau.*,province.*,category.*,reg.*,ann.*,file.name_file from panneau "
        sql+="left join province on panneau.province_id = province.province_id "
        sql+="left join category on panneau.cat_id = category.cat_id "
        sql+="left join regisseur as reg on panneau.reg_id = reg.reg_id "
        sql+="left join annonceur as ann on panneau.ann_id = ann.ann_id "
        sql+="left join file on panneau.image_id = file.file_id "
        sql+="where pan_id = ?"
        connection.query(sql,id,(err,res)=>{
            cb(err,res)
        })
    }
}

module.exports = Place