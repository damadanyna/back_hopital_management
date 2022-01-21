let connection = require('../config/db')

class Notif{
    static set(notif){
        return new Promise((resolve,reject)=>{
            let sql = "insert into notification set ? "
            connection.query(sql,notif,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    // static allAdmin(){
    //     return new Promise((resolve,reject)=>{
    //         let sql = "select n.*,pl.* "
    //         sql+="from notification as n "

    //         sql+="left join pan_location as pl on pl.pan_loc_id = n.notif_id_object "
    //         sql+="left join panneau as p on p.pan_id = pl.pan_id "
    //         sql+=""
    //         sql+="where notif_type = 'a' "


    //         connection.query(sql,(err,res)=>{
    //             if(err) return reject(err)
    //             resolve(res)
    //         })
    //     })
    // }

    static getAllReservation(){
        return new Promise((resolve,reject)=>{
            let sql = "select n.*,pl.*,p.*,a.* ,n.created_at as date_notif "
            sql+="from notification as n "
            sql+="left join pan_location as pl on pl.pan_loc_id = n.notif_id_object "
            sql+="left join panneau as p on p.pan_id = pl.pan_id "
            sql+="left join profil as pr on pr.pr_id = pl.pr_id "
            sql+="left join annonceur as a on a.pr_id = pr.pr_id "
            sql+="where notif_type = 'a' and notif_motif = 'reservation' order by n.created_at desc "

            connection.query(sql,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getAll(params){
        return new Promise((resolve,reject)=>{
            let sql = "select n.*,n.created_at as date_notif "
            sql+="from notification as n "
            sql+="where notif_type = 'a' order by n.created_at desc "

            connection.query(sql,params,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getNotifByDestId(id){
        return new Promise((resolve,reject)=>{
            let sql = "select n.*,n.created_at as date_notif "
            sql+="from notification as n "
            sql+="where notif_dest_pr_id = ? order by n.created_at desc "

            connection.query(sql,id,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static countAdmin(){
        return new Promise((resolve,reject)=>{
            let sql = "select (select count(*) from notification where notif_type = 'a') as nbTotal, "
            sql+="(select count(*) from notification where notif_type = 'a' and notif_vu = 0) as nbNonVu "
            sql+="from notification where notif_type = 'a' limit 1 "
            connection.query(sql,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static countAll(p){
        return new Promise((resolve,reject)=>{
            let sql = "select count(*) as nb from notification where notif_type = 'a' and notif_motif = ? "
            connection.query(sql,p,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static deleteByProfilAndId(tab){
        return new Promise((resolve,reject)=>{
            let sql = "delete from notification where notif_dest_pr_id = ? and notif_id = ?"
            connection.query(sql,tab,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }
}

module.exports = Notif