let connection = require('../config/db')

class Annonceur{
    static all(cb){
        let sql = 'select annonceur.*,soc_profil.soc_pr_email,soc_profil.soc_pr_adresse, (select count(*) from panneau where panneau.ann_id = annonceur.ann_id) as nb_panel '
        sql+='from annonceur '
        sql+="left join soc_profil on annonceur.soc_pr_id = soc_profil.soc_pr_id "
        connection.query(sql,(err,res)=>{
            cb(err,res)
        })
    }

    static count(cb){
        let sql = "select count(*) as nb from annonceur"
        connection.query(sql,(err,res)=>{
            cb(err,res)
        })
    }

    static add(ann){
        return new Promise((resolve,reject)=>{
            let sql = 'insert into annonceur set ?'

            connection.query(sql,ann,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static update(id,ann){
        return new Promise((resolve,reject)=>{
            let sql = 'update annonceur set ? where ann_id='+id

            connection.query(sql,ann,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getById(id){
        return new Promise((resolve,reject)=>{
            let sql = 'select *,(select count(*) from panneau as pan where pan.ann_id = ann.ann_id ) as nb_panel '
            sql+='from annonceur as ann '
            sql+="left join soc_profil as sp on sp.soc_pr_id = ann.soc_pr_id "
            sql+="left join profil as p on p.pr_id = ann.pr_id "
            sql+="where ann.ann_id = ?"

            connection.query(sql,id,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }
}


module.exports = Annonceur