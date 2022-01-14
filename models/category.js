let connection = require('../config/db')
const util = require('util')

class Category{

    static all(cb){
        let sql = "select *, (select count(*) from panneau where panneau.cat_id=category.cat_id) as nb_panel, "
        sql+="(select cat_label from category as p_cat where p_cat.cat_id = category.parent_cat_id limit 1 ) as parent_cat_label "
        sql+="from category "
        connection.query(sql,(err,res)=>{
            cb(err,res)
        })
    }

    static count(cb){
        connection.query('select count(*) as nb from category',(err,res)=>{
            cb(err,res)
        })
    }

    static post(c,cb){
        connection.query('insert into category set ?',c,(err,res)=>{
            cb(err,res)
        })
    }

    static getById(id,cb){
        let sql = "select *,(select count(*) from panneau where panneau.cat_id=category.cat_id) as nb_panel, "
        sql+="(select count(*) from category where parent_cat_id = "+id+") as nb_sous_cat "
        sql+="from category "
        sql+="where cat_id = ?"
        connection.query(sql,id,(err,res)=>{
            cb(err,res)
        })
    }

    static getParentCat(){
        return new Promise((resolve,reject)=>{
            let sql = "select * from category where parent_cat_id is null "
            connection.query(sql,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }
}

module.exports = Category