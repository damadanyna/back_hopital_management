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

    static getAllToAdmin(){
        return new Promise((resolve,reject)=>{
            let sql = `select *,
            (select count(*) from category as ca where ca.parent_cat_id = c.cat_id) as nb_sous_cat,
            (select count(*) from panneau as p left join category as cp on cp.cat_id = p.cat_id where cp.cat_id = p.cat_id or cp.cat_id = c.cat_id) as nb_panel 
            from category as c where c.parent_cat_id is null `
            connection.query(sql,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }
    static getListSousCat(id_cat){
        return new Promise((resolve,reject)=>{
            let sql = `select *,(select count(*) from panneau where cat_id = c.cat_id) as nb_panel from category as c where parent_cat_id = ? `
            connection.query(sql,id_cat,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }
    

    static getAllParents(){
        return new Promise((resolve,reject)=>{
            let sql = `select *, 
            (select count(*) from category where category.parent_cat_id = c.cat_id ) as nb_child 
            from category as c where parent_cat_id is null `

            connection.query(sql,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }
    static getAllChilds(id){
        return new Promise((resolve,reject)=>{
            let sql = `select * from category as c where parent_cat_id = ? `
            connection.query(sql,id,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getAllChilds(){
        return new Promise((resolve,reject)=>{
            let sql = `select * from category as c where parent_cat_id is not null `
            connection.query(sql,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    //Récupération des stats
    static getStatsPerPanel(){
        return new Promise((resolve,reject)=>{
            let sql = `select c.cat_id,c.cat_label,
            (select count(*) from panneau as p where c.cat_id = p.cat_id and p.pan_state in (1,2)) as nb_panel_parent ,
            (select count(*) from panneau as p left join category as cat on cat.cat_id = p.cat_id where cat.parent_cat_id = c.cat_id and p.pan_state in (1,2)  ) as nb_panel_child
            from category c
            where c.parent_cat_id is null 
            `

            connection.query(sql,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })

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
        sql+="(select count(*) from category where parent_cat_id = "+id+") as nb_sous_cat, "
        sql+="(select c.cat_label from category as c where c.cat_id = category.parent_cat_id ) as parent_cat_label "
        sql+="from category "
        sql+="where cat_id = ?"
        connection.query(sql,id,(err,res)=>{
            console.log(err)
            cb(err,res)
        })
    }

    static getRegByIdProfil(id_pr){
        return new Promise((resolve,reject)=>{
            let sql = " select distinct cat.cat_id, cat.cat_label, "
            sql+="(select c.cat_label from category as c where c.cat_id = cat.parent_cat_id ) as parent_cat_label "
            sql+="from category as cat "
            sql+="left join panneau as pan on pan.cat_id = cat.cat_id "
            sql+="left join regisseur as reg on reg.reg_id = pan.reg_id "
            sql+="where reg.pr_id = ? "
            connection.query(sql,id_pr,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
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

    static delete(id){
        return new Promise((resolve,reject)=>{
            let sql = "delete from category where cat_id = ? "
            connection.query(sql,id,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static update(id,c){
        return new Promise((resolve,reject)=>{
            let sql = "update category set ? where cat_id = "+id
            connection.query(sql,c,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static deleteMultiple(tab_id){
        return new Promise((resolve,reject)=>{
            let sql = "delete from category where cat_id in (?) "
            connection.query(sql,tab_id,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static deleteAllSousCat(tab_id_p){
        return new Promise((resolve,reject)=>{
            let sql = "delete from category where parent_cat_id in (?) "
            connection.query(sql,tab_id_p,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }
}

module.exports = Category