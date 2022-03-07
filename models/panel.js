let connection = require('../config/db')

class Panneau{
    //New
    static all(){
        return new Promise((resolve,reject)=>{
            let sql = "select f.*,pan.*,lieu.*,cat_label,reg.*,ann.* from panneau as pan "
            sql+='left join lieu on pan.lieu_id = lieu.lieu_id '
            sql+='left join category on pan.cat_id = category.cat_id '
            sql+='left join regisseur as reg on reg.reg_id = pan.reg_id '
            sql+='left join annonceur as ann on ann.ann_id = pan.ann_id '
            sql+="left join file as f on f.file_id = pan.image_id "
            /*sql+="left join regisseur"*/
            connection.query(sql,(err,res) =>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    //Côté public
    //On récupère les panneaux avec seulement les limitations de pagination
    static getPanleByLimit(){
        return new Promise((resolve,reject)=>{
            let sql = `select f.name_min_file,f.name_file,l.*,p.pan_ref,p.pan_surface from panneau as p 
            left join file as f on f.file_id = p.image_id `
        })
    }

    static getAllLimit(limit,page){
        return new Promise((resolve,reject)=>{
            let sql = "select p.pan_id,p.pan_ref,l.lieu_ville,l.lieu_label, l.lieu_quartier,file.name_file,file.name_min_file from panneau as p "
            sql+="left join file on p.image_id = file.file_id "
            sql+="left join lieu as l on p.lieu_id = l.lieu_id "
            sql+="where pan_validation = 1 and pan_state in (1,2) "
            sql+="limit ? "

            connection.query(sql,limit,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getAllLimitLikeLieu(limit,page,s){
        return new Promise((resolve,reject)=>{
            let sql = "select p.pan_id,p.pan_ref,l.lieu_ville,l.lieu_label, l.lieu_quartier,file.name_file,file.name_min_file from panneau as p "
            sql+="left join file on p.image_id = file.file_id "
            sql+="left join lieu as l on p.lieu_id = l.lieu_id "
            sql+="where pan_validation = 1 and pan_state in (1,2) and (lieu_ville like ? or lieu_region like ? or lieu_quartier like ? or lieu_label like ? ) "
            sql+="limit ? "

            connection.query(sql,[s,s,s,s,limit],(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getStatsVillePerPanel(){
        return new Promise((resolve,reject)=>{
            let sql = `select distinct l.lieu_ville,
            (select count(*) from panneau as p join lieu on lieu.lieu_id = p.lieu_id where lieu.lieu_ville = l.lieu_ville and p.pan_state in (1,2) ) as nb_panel 
            from lieu as l`

            connection.query(sql,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getAllLimitLikeLieuAndCat(limit,page,s,cat_child){
        return new Promise((resolve,reject)=>{
            let sql = "select p.pan_id,p.pan_ref,l.lieu_ville,l.lieu_label, l.lieu_quartier,file.name_file,file.name_min_file from panneau as p "
            sql+="left join file on p.image_id = file.file_id "
            sql+="left join lieu as l on p.lieu_id = l.lieu_id "
            sql+="where pan_validation = 1 and pan_state in (1,2) and (lieu_ville like ? or lieu_region like ? or lieu_quartier like ? or lieu_label like ? ) "
            sql+="and p.cat_id = ? "
            sql+="limit ? "

            connection.query(sql,[s,s,s,s,cat_child,limit],(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getAllLimitLikeLieuAndParentCat(limit,page,s,cat_parent){
        return new Promise((resolve,reject)=>{
            let sql = "select p.pan_id,p.pan_ref,l.lieu_ville,l.lieu_label, l.lieu_quartier,file.name_file,file.name_min_file from panneau as p "
            sql+="left join file on p.image_id = file.file_id "
            sql+="left join lieu as l on p.lieu_id = l.lieu_id "
            sql+="left join category as c on p.cat_id = c.cat_id "
            sql+="where pan_validation = 1 and pan_state in (1,2) and (lieu_ville like ? or lieu_region like ? or lieu_quartier like ? or lieu_label like ? ) "
            sql+="and ( c.parent_cat_id = ? or p.cat_id = ? ) "
            sql+="limit ? "

            connection.query(sql,[s,s,s,s,cat_parent,cat_parent,limit],(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static add(p){
        return new Promise((resolve,reject)=>{
            connection.query('insert into panneau set ?',p,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getPanelNoListPhoto(){
        return new Promise((resolve,reject)=>{
            let sql = "select * from panneau as pan left JOIN file as f on f.file_id = pan.image_id WHERE pan.image_id is not NULL and pan.pan_list_photo is null"
            connection.query(sql,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })

    }

    static addLieu(l){
        return new Promise((resolve,reject)=>{
            connection.query('insert into lieu set ?',l,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static updateLieu(id,l){
        return new Promise((resolve,reject)=>{
            connection.query('update lieu set ? where lieu_id='+id,l,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }


    static count(cb){
        connection.query('select count(*) as nb from panneau ',(err,res)=>{
            cb(err,res)
        })
    }

    static update(id,pr,cb){
        return new Promise((resolve,reject)=>{
            connection.query('update panneau set ? where pan_id='+id,pr,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getById(id){
        return new Promise((resolve,reject)=>{
            let sql = "select panneau.*,lieu.*,category.*,reg.*,ann.*,file.name_file,reg.pr_id as reg_pr_id from panneau "
            sql+="left join lieu on panneau.lieu_id = lieu.lieu_id "
            sql+="left join category on panneau.cat_id = category.cat_id "
            sql+="left join regisseur as reg on panneau.reg_id = reg.reg_id "
            sql+="left join annonceur as ann on panneau.ann_id = ann.ann_id "
            sql+="left join file on panneau.image_id = file.file_id "
            sql+="where pan_id = ?"
            connection.query(sql,id,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getByIdP(id){
        return new Promise((resolve,reject)=>{
            let sql = "select p.pan_ref,p.image_id,cat.cat_label, p.pan_description,p.pan_verified_by_publoc, p.pan_surface,file.name_file, "
            sql+="(select cat_label from category as p_cat where p_cat.cat_id = cat.parent_cat_id limit 1 ) as parent_cat_label, "
            sql+="l.lieu_ville,l.lieu_region,l.lieu_quartier,l.lieu_pays,l.lieu_commune,l.lieu_lat,l.lieu_lng,l.lieu_label "
            sql+="from panneau as p "
            sql+="left join lieu as l on l.lieu_id = p.lieu_id "
            sql+="left join category as cat on p.cat_id = cat.cat_id "
            sql+="left join file on p.image_id = file.file_id "
            sql+="where p.pan_id = ?"

            connection.query(sql,id,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static delete(id){
        return new Promise((resolve,reject)=>{
            connection.query('delete from panneau where pan_id='+id,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static changeCatToNull(tab_id_cat){
        return new Promise((resolve,reject)=>{
            connection.query('update panneau set cat_id = null where cat_id in (?)',tab_id_cat,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }
    
    static countByVille(){

    }

    static getListPanToMap(){
        return new Promise((resolve,reject)=>{
            let sql = "select p.pan_id,p.pan_surface,p.pan_ref,p.pan_verified_by_publoc,p.pan_lumineux,p.pan_gold,l.*,f.name_file,f.name_min_file "
            sql+=" from panneau as p "
            sql+="left join lieu as l on l.lieu_id = p.lieu_id "
            sql+="left join file as f on f.file_id = p.image_id "
            sql+="where pan_validation = 1 and pan_state in (1,2) "
            connection.query(sql,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getListByReg(id_reg){
        return new Promise((resolve,reject)=>{
            let sql = "select panneau.*,l.*,f.name_file,f.name_min_file,pl.pan_loc_id,pl.pan_loc_date_debut, pl.pan_loc_month,pl.pan_loc_by_reg from panneau "
            sql+="left join lieu as l on l.lieu_id = panneau.lieu_id "
            sql+="left join file as f on f.file_id = panneau.image_id "
            sql+="left join pan_location as pl on pl.pan_id = panneau.pan_id "
            sql+="where panneau.reg_id = ?"
            connection.query(sql,id_reg,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getListByAnn(id_ann){
        return new Promise((resolve,reject)=>{
            let sql = "select panneau.*,l.*,f.name_file,f.name_min_file from panneau "
            sql+="left join lieu as l on l.lieu_id = panneau.lieu_id "
            sql+="left join file as f on f.file_id = panneau.image_id "
            sql+="where ann_id = ?"
            connection.query(sql,id_ann,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }


    static updateTo(tab){
        return new Promise((resolve,reject)=>{
            let sql = "update panneau set ? where ? "
            connection.query(sql,tab,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getWhere(w){
        return new Promise((resolve,reject)=>{
            let sql = "select * from panneau left join lieu as l on l.lieu_id = panneau.lieu_id where ? "
            connection.query(sql,w,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getServListIn(ids_serv){
        return new Promise((resolve,reject)=>{
            let sql = "select * from services where serv_id in (?) "
            connection.query(sql,[ids_serv],(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getTarifByPan(id_pan){
        return new Promise((resolve,reject)=>{
            let sql = "select * from tarif as t "
            sql+="left join panneau as p on p.cat_id = t.cat_id "
            sql+="where p.pan_id = ? order by t.tarif_min_month desc "
            connection.query(sql,id_pan,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getTarifByServ(id_serv){
        return new Promise((resolve,reject)=>{
            let sql = "select * from tarif where service_id = ? "
            connection.query(sql,id_serv,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getAllVillePanneau(){
        return new Promise((resolve,reject)=>{
            let sql = "select distinct l.lieu_ville from panneau as p "
            sql+="left join lieu as l on l.lieu_id = p.lieu_id"
            connection.query(sql,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getAllLocations(){
        return new Promise((resolve,reject)=>{
            let sql = `select pl.pan_loc_id,pan.pan_ref,pan.pan_id, ann.ann_label,pl.pan_loc_reservation_date,
            ann.ann_id, pl.pan_loc_validate,pl.pan_loc_archive,pl.pan_loc_reject `
            sql+="from pan_location as pl "
            sql+="left join panneau as pan on pan.pan_id = pl.pan_id "
            sql+="left join annonceur as ann on ann.ann_id = pl.ann_id "
            sql+="left join tarif as t on pl.pan_loc_tarif_id = t.tarif_id "
            sql+="left join services as srv on pl.pan_loc_service_id = srv.serv_id "
            sql+="order by pl.pan_loc_id desc"
            connection.query(sql,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }
    static getAllLocationsBy(v){
        return new Promise((resolve,reject)=>{
            let sql = `select pl.pan_loc_id,pan.pan_ref,pan.pan_id, ann.ann_label,pl.pan_loc_reservation_date,
            pl.pan_loc_validate,pl.pan_loc_archive,pl.pan_loc_reject `
            sql+="from pan_location as pl "
            sql+="left join panneau as pan on pan.pan_id = pl.pan_id "
            sql+="left join annonceur as ann on ann.ann_id = pl.ann_id "
            sql+="left join tarif as t on pl.pan_loc_tarif_id = t.tarif_id "
            sql+="left join services as srv on pl.pan_loc_service_id = srv.serv_id "
            sql+="where pl.pan_loc_validate = ? "
            connection.query(sql,v,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getLocationById(id){
        return new Promise((resolve,reject)=>{
            let sql = `select pl.pan_loc_id,pl.pan_loc_month,pan.pan_ref,pan.pan_id,srv.*,t.*,cat.*,reg.reg_label,
            ann.ann_id, reg.reg_id, pr_a.pr_id as ann_pr_id, pr_r.pr_id as reg_pr_id, 
            pl.pan_loc_validate, pl.pan_loc_date_debut, pl.pan_loc_date_fin,pl.pan_loc_reject, pl.pan_loc_date_validation, `
            sql+="(select c.cat_label from category as c where c.cat_id = cat.parent_cat_id ) as parent_cat_label "
            sql+="from pan_location as pl "
            sql+="left join panneau as pan on pan.pan_id = pl.pan_id "
            sql+="left join annonceur as ann on ann.ann_id = pl.ann_id "
            sql+="left join profil as pr_a on ann.pr_id = pr_a.pr_id "
            sql+="left join tarif as t on pl.pan_loc_tarif_id = t.tarif_id "
            sql+="left join file as f on pan.image_id = f.file_id ",
            sql+="left join regisseur as reg on reg.reg_id = pan.reg_id "
            sql+="left join profil as pr_r on reg.pr_id = pr_r.pr_id "
            sql+="left join category as cat on pan.cat_id = cat.cat_id "
            sql+="left join lieu as l on pan.lieu_id = l.lieu_id ",
            sql+="left join services as srv on pl.pan_loc_service_id = srv.serv_id "
            sql+="where pl.pan_loc_id = ? "
            connection.query(sql,id,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getPanelPWhere(where){
        return new Promise((resolve,reject)=>{
            let sql = `select p.pan_id,p.pan_ref,l.lieu_label from panneau as p 
            left join lieu as l on l.lieu_id = p.lieu_id 
            where ? `
            connection.query(sql,[where],(err,res)=>{
                if(err) return reject(err)
                resolve(res)

            })
        })
    }

    static getPanelPWhereInNotSousAnnLocation(where){
        return new Promise((resolve,reject)=>{
            let sql = `select p.pan_id,p.pan_ref,l.lieu_label from panneau as p 
            left join sous_ann_location as sal on sal.saloc_pan_id = p.pan_id 
            left join lieu as l on l.lieu_id = p.lieu_id 
            where ? and sal.saloc_pan_id is null  `
            connection.query(sql,[where],(err,res)=>{
                if(err) return reject(err)
                resolve(res)

            })
        })
    }

    static getPanLocationById(id_pan_loc){
        return new Promise((resolve,reject)=>{
            let sql = "select * from pan_location where pan_loc_id = ? "

            connection.query(sql,id_pan_loc,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }
}

module.exports = Panneau