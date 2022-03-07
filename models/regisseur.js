let connection = require('../config/db')

class Regisseur{
    static all(cb){
        let sql = 'select regisseur.*,soc_profil.soc_pr_email,soc_profil.soc_pr_adresse,soc_profil.soc_sub, '
        sql+='(select count(*) from panneau where panneau.reg_id = regisseur.reg_id) as nb_panel '
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
            let sql = 'select *,reg.pr_id as reg_pr_id,(select count(*) from panneau as pan where pan.reg_id = reg.reg_id ) as nb_panel, '
            sql+="(select count(*) from panneau as pan where pan.reg_id = reg.reg_id and pan.ann_id <> NULL group by pan.ann_id ) as nb_ann, "
            sql+="(select count(*) from panneau as pan where pan.reg_id = reg.reg_id and pan.pan_state = 1) as nb_dispo "
            sql+='from regisseur as reg '
            sql+="left join soc_profil as sp on sp.soc_pr_id = reg.soc_pr_id "
            sql+="left join profil as p on p.pr_id = reg.pr_id "
            sql+="left join pan_location as pl on pl.reg_id = reg.reg_id "
            sql+="where reg.reg_id = ?"

            connection.query(sql,id,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getIn(t){
        return new Promise((resolve,reject)=>{
            let sql = 'select *,reg.pr_id as reg_pr_id,(select count(*) from panneau as pan where pan.reg_id = reg.reg_id ) as nb_panel, '
            sql+="(select count(*) from panneau as pan where pan.reg_id = reg.reg_id and pan.ann_id <> NULL group by pan.ann_id ) as nb_ann, "
            sql+="(select count(*) from panneau as pan where pan.reg_id = reg.reg_id and pan.pan_state = 1) as nb_dispo "
            sql+='from regisseur as reg '
            sql+="left join soc_profil as sp on sp.soc_pr_id = reg.soc_pr_id "
            sql+="left join profil as p on p.pr_id = reg.pr_id "
            sql+="left join pan_location as pl on pl.reg_id = reg.reg_id "
            sql+="where reg.reg_id in (?) "

            connection.query(sql,[t],(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static deleteMultiple(t){
        return new Promise((resolve,reject)=>{
            let sql = 'delete from regisseur where reg_id in (?)'
            connection.query(sql,[t],(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static deleteById(id){
        return new Promise((resolve,reject)=>{
            let sql = 'delete from regisseur where reg_id = ?'
            connection.query(sql,id,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getByIdProfil(id){
        return new Promise((resolve,reject)=>{
            let sql = "select reg.*,sp.*,p.*,f.name_file,f.name_min_file,(select count(*) from panneau as pan where pan.reg_id = reg.reg_id ) as nb_panel,'' as pr_pass "
            sql+='from regisseur as reg '
            sql+="left join soc_profil as sp on sp.soc_pr_id = reg.soc_pr_id "
            sql+="left join profil as p on p.pr_id = reg.pr_id "
            sql+="left join file as f on f.file_id = file_profil "
            sql+="where p.pr_id = ?"

            connection.query(sql,id,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getProfilByPan(id_pan){
        return new Promise((resolve,reject)=>{
            let sql = "select pr.pr_id,reg.reg_id from panneau as pan "
            sql+="left join regisseur as reg on reg.reg_id = pan.reg_id "
            sql+="left join profil as pr on pr.pr_id = reg.pr_id "
            sql+="where pan.pan_id = ? "

            connection.query(sql,id_pan,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getListAnn(pr_id){
        return new Promise((resolve,reject)=>{
            let sql = "select * from reg_ann as ra "
            sql+="left join annonceur as ann on ann.ann_id = ra.ann_id "
            sql+="left join soc_profil as sp on sp.soc_pr_id = ann.soc_pr_id "
            sql+="left join regisseur as reg on reg.reg_id = ra.reg_id "
            sql+="where reg.pr_id = ? "

            connection.query(sql,pr_id,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    //GESTION DE TARIF

    static insertServ(s){
        return new Promise((resolve,reject)=>{
            let sql = "insert into services set ? "
            connection.query(sql,[s],(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    //On recupère tous les regisseurs abonnés
    static getAbonneReg(){
        return new Promise((resolve,reject)=>{
            let sql = `select * from regisseur as reg 
            left join soc_profil as sp on sp.soc_pr_id = reg.soc_pr_id 
            where soc_sub = 1`

            connection.query(sql,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static insertTarif(t){
        return new Promise((resolve,reject)=>{
            let sql = "insert into tarif set ? "
            connection.query(sql,t,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getNbPanelTarif(w){
        return new Promise((resolve,reject)=>{
            let sql = "select count(*) as nb from panneau as pan "
            sql+="left join regisseur as reg on reg.reg_id = pan.reg_id "
            sql+="where pan_surface = ? and pan.cat_id = ? and reg.pr_id = ? "
            connection.query(sql,w,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getTarifListByProfil(id_pr){
        return new Promise((resolve,reject)=>{
            let sql = "select *, "
                sql+="(select count(*) from panneau as pan left join regisseur as reg on reg.reg_id = pan.reg_id "
                sql+="where pan.cat_id = t.cat_id and reg.pr_id = t.tarif_pr_id ) as nbPanel, "

                sql+="(select c.cat_label from category as c where c.cat_id = cat.parent_cat_id ) as parent_cat_label "

            sql+="from tarif as t "
            sql+="left join category as cat on cat.cat_id = t.cat_id "
            sql+="where t.tarif_pr_id = ?"

            connection.query(sql,id_pr,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getListServIn(ids){
        return new Promise((resolve,reject)=>{
            let sql = "select * from services where serv_id in (?) "
            connection.query(sql,[ids],(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    //Réservation
    static getReservationList(tab){
        return new Promise((resolve,reject)=>{
            let sql = "select * from pan_location as pl "
            sql+="left join panneau as p on p.pan_id = pl.pan_id "
            sql+="left join regisseur as reg on reg.reg_id = pl.reg_id "
            sql+="where reg.pr_id = ? and p.pan_gold = 1 and pl.pan_loc_archive = ? and pl.pan_loc_validate = ? "
            
            connection.query(sql,tab,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

}

module.exports = Regisseur