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
    //on compte le nombre de panneau avec la limite
    static countPanelByLimitAndParams(s,data){
        return new Promise((resolve,reject)=>{
            let sql = `select count(*) as nb from panneau as p 
            left join file as f on f.file_id = p.image_id 
            left join lieu as l on l.lieu_id = p.lieu_id 
            left join category as s_cat on s_cat.cat_id = p.cat_id 
            left join category as p_cat on s_cat.parent_cat_id = p_cat.cat_id 
            left join regisseur as reg on reg.reg_id = p.reg_id 
            where p.pan_state in (1,2) and ( ${s} ) `

            connection.query(sql,data,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })

        })
    }
    //On récupère les panneaux avec seulement les limitations de pagination
    static getPanelByLimitAndParams(s,data,l){
        return new Promise((resolve,reject)=>{
            let sql = `select f.name_min_file,f.name_file,l.*,p.pan_ref,p.pan_publoc_ref,p.pan_surface,p.pan_id from panneau as p 
            left join file as f on f.file_id = p.image_id 
            left join lieu as l on l.lieu_id = p.lieu_id 
            left join category as s_cat on s_cat.cat_id = p.cat_id 
            left join category as p_cat on s_cat.parent_cat_id = p_cat.cat_id 
            left join regisseur as reg on reg.reg_id = p.reg_id 
            where p.pan_state in (1,2) and ( ${s} ) limit ${l.limit} offset ${l.offset} `

            connection.query(sql,data,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })

        })
    }
    //on compte le nombre de panneau avec la limite
    static countPanelByLimit(s,data){
        return new Promise((resolve,reject)=>{
            let sql = `select count(*) as nb from panneau as p 
            left join file as f on f.file_id = p.image_id 
            left join lieu as l on l.lieu_id = p.lieu_id 
            left join category as s_cat on s_cat.cat_id = p.cat_id 
            left join category as p_cat on s_cat.parent_cat_id = p_cat.cat_id 
            left join regisseur as reg on reg.reg_id = p.reg_id 
            where p.pan_state in (1,2) `

            connection.query(sql,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })

        })
    }
    //On récupère les panneaux sans limite et sans paramètres
    static getPanelByLimit(l){
        return new Promise((resolve,reject)=>{
            let sql = `select f.name_min_file,f.name_file,l.*,p.pan_ref,p.pan_publoc_ref,p.pan_surface,p.pan_id from panneau as p 
            left join file as f on f.file_id = p.image_id 
            left join lieu as l on l.lieu_id = p.lieu_id 
            left join category as s_cat on s_cat.cat_id = p.cat_id 
            left join category as p_cat on s_cat.parent_cat_id = p_cat.cat_id 
            left join regisseur as reg on reg.reg_id = p.reg_id 
            where p.pan_state in (1,2) 
            limit ${l.limit} offset ${l.offset} `

            connection.query(sql,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })

        })
    }

    //Récupération des panneaux qui ne sont pas encore dans les gros plans
    static getPanelPrisesToSettingsBy(s,t){
        return new Promise((resolve,reject)=>{
            let sql = `select * from panneau as p 
            left join pan_prises as pp on pp.pan_pr_pan_id = p.pan_id 
            left join file as f on f.file_id = p.image_id 
            left join regisseur as r on r.reg_id = p.reg_id 
            left join annonceur as a on a.ann_id = p.ann_id 
            left join lieu as l on l.lieu_id = p.lieu_id
            where pp.pan_pr_pan_id is null and p.pan_state in (1,2) and ( ${s} ) `

            connection.query(sql,t,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    //Récupération des panneaux pour les gros plans
    static getPanelGrosPlanToSettingsBy(s,t){
        return new Promise((resolve,reject)=>{
            let sql = `select * from panneau as p 
            left join gros_plan as gp on gp.gp_pan_id = p.pan_id 
            left join file as f on f.file_id = p.image_id 
            left join regisseur as r on r.reg_id = p.reg_id 
            left join annonceur as a on a.ann_id = p.ann_id 
            left join lieu as l on l.lieu_id = p.lieu_id
            where gp.gp_pan_id is null and p.pan_state in (1,2) and ( ${s} ) `

            connection.query(sql,t,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    //Récu^ération des gros plans
    static getGrosPlanSettings(){
        return new Promise((resolve,reject)=>{
            let sql = `select * from gros_plan as gp
            left join panneau as p on p.pan_id = gp.gp_pan_id 
            left join lieu as l on l.lieu_id = p.lieu_id 
            left join file as f on f.file_id = p.image_id `

            connection.query(sql,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getPrisesSettings(){
        return new Promise((resolve,reject)=>{
            let sql = `select * from pan_prises as pp 
            left join panneau as p on p.pan_id = pp.pan_pr_pan_id 
            left join file as f on f.file_id = p.image_id 
            left join lieu as l on l.lieu_id = p.lieu_id 
            order by pp.pan_pr_rang `

            connection.query(sql,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getPrisesPublic(){
        return new Promise((resolve,reject)=>{
            let sql = `select pp.*,p.pan_ref,p.pan_publoc_ref,l.*,p.pan_id,f.file_id,f.name_min_file from pan_prises as pp 
            left join panneau as p on p.pan_id = pp.pan_pr_pan_id 
            left join file as f on f.file_id = p.image_id 
            left join lieu as l on l.lieu_id = p.lieu_id 
            order by pp.pan_pr_rang `

            connection.query(sql,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getPrisesLastRange(){
        return new Promise((resolve,reject)=>{
            let sql = `select * from pan_prises order by pan_pr_rang desc limit 1`
            connection.query(sql,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    //Les quartiers
    static getQuartierByVilleList(v_list){
        return new Promise((resolve,reject)=>{
            let sql = `select distinct l.lieu_quartier from panneau as p 
            left join lieu as l on l.lieu_id = p.lieu_id where l.lieu_ville in (?)`

            connection.query(sql,[v_list],(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
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
            let sql = `select panneau.*,lieu.*,category.*,reg.*,ann.*,file.name_file,reg.pr_id as reg_pr_id,
            (select cat_label from category c where c.cat_id = category.parent_cat_id ) as parent_cat_label from panneau `
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
            let sql = "select p.pan_ref,p.pan_publoc_ref,p.image_id,cat.cat_label, p.pan_description,p.pan_verified_by_publoc,p.pan_list_photo, p.pan_surface,file.name_file, "
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
            connection.query('update panneau set cat_id = null where cat_id in (?)',[tab_id_cat],(err,res)=>{
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

    static getListByReg(id_reg,w){
        return new Promise((resolve,reject)=>{
            let sql = `select a.ann_label,p.*,l.*,f.name_file,f.name_min_file,pl.pan_loc_id,pl.pan_loc_date_debut, 
            pl.pan_loc_month,pl.pan_loc_by_reg,pl.pan_loc_ann_label from panneau as p `
            sql+="left join lieu as l on l.lieu_id = p.lieu_id "
            sql+="left join file as f on f.file_id = p.image_id "
            sql+="left join annonceur as a on a.ann_id = p.ann_id "
            sql+="left join pan_location as pl on pl.pan_id = p.pan_id "
            sql+="where p.reg_id = ? "
            sql+=(w)?`and p.pan_state = ${w.pan_state} `:''
            connection.query(sql,id_reg,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    static getListByAnn(id_ann){
        return new Promise((resolve,reject)=>{
            let sql = `select p.pan_id, p.pan_publoc_ref, p.sous_ann_id,p.ann_id as panel_ann_id,
            pl.pan_loc_validate,pl.pan_loc_id,pl.pan_loc_date_debut, pl.pan_loc_month,pl.pan_loc_date_fin,
            sal.*
            ,l.*,f.name_file,f.name_min_file from panneau  p `
            sql+="left join pan_location as pl on pl.pan_id = p.pan_id "
            sql+="left join lieu as l on l.lieu_id = p.lieu_id "
            sql+="left join file as f on f.file_id = p.image_id "
            sql+="left join sous_ann_location as sal on p.pan_id = sal.saloc_pan_id "
            sql+="where p.ann_id = ? or p.sous_ann_id = ? "
            connection.query(sql,[id_ann,id_ann],(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }

    //Récupération  d'un seul panneau par sous-catégorie
    static getOneBySubCat(id_sub_act){
        return new Promise((resolve,reject)=>{
            let sql = `select * from panneau as p 
            where p.cat_id = ? limit 1`

            connection.query(sql,id_sub_act,(err,res)=>{
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
            sql+="where pl.pan_loc_validate = 0 "
            sql+="order by pl.pan_loc_id desc"
            connection.query(sql,(err,res)=>{
                if(err) return reject(err)
                resolve(res)
            })
        })
    }
    //Récupération des locations validées
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

    //Récupération de sous-ann_location by id
    static getSousAnnLocById(id_saloc){
        return new Promise((resolve,reject)=>{
            let sql = `select * from sous_ann_location where saloc_id = ? `
            connection.query(sql,id_saloc,(err,res)=>{
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
            let sql = `select p.pan_id,p.pan_publoc_ref,l.lieu_label from panneau as p 
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