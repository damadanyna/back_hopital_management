let connection = require('../config/db')

class Annonceur{
    static all(cb){
        let sql = 'select pl.*,annonceur.*,soc_profil.soc_pr_email,soc_profil.soc_pr_adresse, (select count(*) from panneau where panneau.ann_id = annonceur.ann_id) as nb_panel '
        sql+='from annonceur '
        sql+="left join soc_profil on annonceur.soc_pr_id = soc_profil.soc_pr_id "
        sql+="left join pan_location as pl on pl.ann_id = annonceur.ann_id "
        connection.query(sql,(err,res)=>{
            cb(err,res)
        })
    }

    static getAll(){
        return new Promise((resolve,reject)=>{
            let sql = 'select distinct annonceur.*,pl.*,soc_profil.soc_pr_email,soc_profil.soc_pr_adresse, (select count(*) from panneau where panneau.ann_id = annonceur.ann_id) as nb_panel '
            sql+='from annonceur '
            sql+="left join soc_profil on annonceur.soc_pr_id = soc_profil.soc_pr_id "
            sql+="left join pan_location as pl on pl.ann_id = annonceur.ann_id "
            connection.query(sql,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getIn(t){
        return new Promise((resolve,reject)=>{
            let sql = 'select pl.*,annonceur.*,soc_profil.soc_pr_email,soc_profil.soc_pr_adresse, (select count(*) from panneau where panneau.ann_id = annonceur.ann_id) as nb_panel '
            sql+='from annonceur '
            sql+="left join soc_profil on annonceur.soc_pr_id = soc_profil.soc_pr_id "
            sql+="left join pan_location as pl on pl.ann_id = annonceur.ann_id "
            sql+="where annonceur.ann_id in (?) "
            connection.query(sql,[t],(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
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

    static deleteById(id){
        return new Promise((resolve,reject)=>{
            let sql = 'delete from annonceur where ann_id = ?'
            connection.query(sql,id,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static deleteMultiple(tab){
        return new Promise((resolve,reject)=>{
            let sql = 'delete from annonceur where ann_id in (?) '
            connection.query(sql,[tab],(err,res)=>{
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
            let sql = 'select *,ann.pr_id as ann_pr_id,(select count(*) from panneau as pan where pan.ann_id = ann.ann_id ) as nb_panel '
            sql+='from annonceur as ann '
            sql+="left join soc_profil as sp on sp.soc_pr_id = ann.soc_pr_id "
            sql+="left join profil as p on p.pr_id = ann.pr_id "
            sql+="left join pan_location on pan_location.ann_id = ann.ann_id "
            sql+="where ann.ann_id = ?"

            connection.query(sql,id,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getByIdProfil(id){
        return new Promise((resolve,reject)=>{
            let sql = "select *,f.name_file,f.name_min_file,(select count(*) from panneau as pan where pan.ann_id = ann.ann_id ) as nb_panel,'' as pr_pass "
            sql+='from annonceur as ann '
            sql+="left join soc_profil as sp on sp.soc_pr_id = ann.soc_pr_id "
            sql+="left join profil as p on p.pr_id = ann.pr_id "
            sql+="left join file as f on f.file_id = file_profil "
            sql+="where p.pr_id = ?"

            connection.query(sql,id,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }


    static getListReservation(ann_id){
        return new Promise((resolve,reject)=>{
            let sql = "select ploc.*, l.*,pan.pan_description,pan.pan_ref,file.name_file "
            sql+="from pan_location as ploc "
            sql+="left join panneau as pan on pan.pan_id = ploc.pan_id "
            sql+="left join lieu as l on l.lieu_id = pan.lieu_id "
            sql+="left join file on file.file_id = pan.image_id "
            sql+="where ploc.pr_id = ? and ploc.pan_loc_validate = 0 "
            connection.query(sql,ann_id,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getListPanel(pr_id){
        return new Promise((resolve,reject)=>{
            let sql = "select ploc.*, l.*,pan.pan_description,pan.pan_ref "
            sql+="from pan_location as ploc "
            sql+="left join panneau as pan on pan.pan_id = ploc.pan_id "
            sql+="left join regisseur as reg on pan.reg_id = reg.reg_id "
            sql+="left join lieu as l on l.lieu_id = pan.lieu_id ",
            sql+="where ploc.pr_id = ? and ploc.pan_loc_validate = 1 "
            connection.query(sql,pr_id,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getPanel(id){
        return new Promise((resolve,reject)=>{
            let sql = "select pan.pan_ref,pan.pan_surface,pan.pan_state,pan.pan_verified_by_publoc,l.*,cat.*,file.name_file from panneau as pan "
            sql+="left join lieu as l on pan.lieu_id = l.lieu_id "
            sql+="left join category as cat on pan.cat_id = cat.cat_id "
            sql+="left join file on pan.image_id = file.file_id "
            sql+="where pan_id = ?"
            connection.query(sql,id,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static insertPanLocation(p){
        return new Promise((resolve,reject)=>{
            let sql = "insert into pan_location set ? "
            connection.query(sql,p,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static setPanLocated(id_pan){
        return new Promise((resolve,reject)=>{
            let sql = "update panneau set pan_state = 2 where pan_id = ? "
            connection.query(sql,id_pan,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }
}




module.exports = Annonceur