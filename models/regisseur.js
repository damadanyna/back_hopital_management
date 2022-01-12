let connection = require('../config/db')

class Regisseur{
    static all(cb){
        let sql = 'select regisseur.*,soc_profil.soc_pr_email,soc_profil.soc_pr_adresse, (select count(*) from panneau where panneau.reg_id = regisseur.reg_id) as nb_panel '
        sql+='from regisseur '
        sql+="left join soc_profil on regisseur.soc_pr_id = soc_profil.soc_pr_id "
        connection.query(sql,(err,res)=>{
            cb(err,res)
        })
    }

    static count(cb){
        let sql = "select count(*) as nb from regisseur"
        connection.query(sql,(err,res)=>{
            cb(err,res)
        })
    }

    static add(reg){
        return new Promise((resolve,reject)=>{
            let sql = 'insert into regisseur set ?'

            connection.query(sql,reg,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }
    static update(id,reg){
        return new Promise((resolve,reject)=>{
            let sql = 'update regisseur set ? where reg_id='+id

            connection.query(sql,reg,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getById(id){
        return new Promise((resolve,reject)=>{
            let sql = 'select *,(select count(*) from panneau as pan where pan.reg_id = reg.reg_id ) as nb_panel, '
            sql+="(select count(*) from panneau as pan where pan.reg_id = reg.reg_id and pan.ann_id <> NULL group by pan.ann_id ) as nb_ann, "
            sql+="(select count(*) from panneau as pan where pan.reg_id = reg.reg_id and pan.pan_state = 1) as nb_dispo "
            sql+='from regisseur as reg '
            sql+="left join soc_profil as sp on sp.soc_pr_id = reg.soc_pr_id "
            sql+="left join profil as p on p.pr_id = reg.pr_id "
            sql+="where reg.reg_id = ?"

            connection.query(sql,id,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

}

module.exports = Regisseur