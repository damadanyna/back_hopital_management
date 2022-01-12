let connection = require('../config/db')
const util = require('util')

class Category{

    static all(cb){
        connection.query('select *, (select count(*) from panneau where panneau.cat_id=category.cat_id) as nb_panel from category',(err,res)=>{
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

    static get_by_id(id,cb){
        let sql = "select *,(select count(*) from panneau where panneau.cat_id=category.cat_id) as nb_panel from category "
        sql+="where cat_id = ?"
        connection.query(sql,id,(err,res)=>{
            cb(err,res)
        })
    }
}

module.exports = Category