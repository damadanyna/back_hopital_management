let router = require('express').Router()
let fs = require('fs')
let multer = require('multer')
const sharp = require("sharp")
const bcrypt = require('bcrypt')


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});

//Récupération des login solarpro
router.get('/list',async (req,res)=>{
    let D = require('../models/data')
    try {
        let list = []
        list = await D.exec('select * from solarpro sp left join profil p on sp.sp_pr_id = p.pr_id ')
        return res.send({status:true,list})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée ..."})
    }
    
})

//Aout d'un identifiant solarpro
router.post('/',async (req,res)=>{
    let D = require('../models/data')

    try {
        let d = req.body
        
        if(!d.login || !d.pass){
            return res.send({status:false,message:"Tous les champs sont obligatoire"})
        }

        //On regarde s'il n'y pas de login pareil dans la base
        let lg_test = await D.exec_params(`select pr_id from profil where pr_login = ?`,d.login)
        if(lg_test.length>0){
            return res.send({status:false,message:"Le login existe déjà, Veuillez utiliser un autre login."})
        }

        //Encryption du mot de passe 
        let pass = await new Promise((resolve,reject)=>{
            bcrypt.hash(d.pass, 10, function(err, hash) {
                if (err) reject(err)
                resolve(hash)
            });
        })

        let pr = {
            pr_login:d.login,
            pr_pass:pass,
            pr_type:'spro'
        }

        let id_pr = (await D.set('profil',pr)).insertId
        
        let sp = {
            sp_pr_id:id_pr
        }

        await D.set('solarpro',sp)

        return res.send({status:true})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée ..."})
    }
})

//Mise à jour d'un login solarpro
router.put('/',async (req,res)=>{
    let D = require('../models/data')

    try {
        let d = req.body

        //On regarde s'il n'y pas de login pareil dans la base
        let lg_test = await D.exec_params(`select pr_id from profil where pr_login = ?`,d.pr.login)
        if(lg_test.length>0){
            return res.send({status:false,message:"Le login existe déjà, Veuillez utiliser un autre login."})
        }

        //On regrde le mot de passe
        let pr = {
            pr_login:d.pr.login
        }
        if(d.pr.pass){
            let pass = await new Promise((resolve,reject)=>{
                bcrypt.hash(d.pass, 10, function(err, hash) {
                    if (err) reject(err)
                    resolve(hash)
                });
            })

            pr.pr_pass = pass
        }

        //Mise à jour du truc
        await D.updateWhere('profil',pr,{pr_id:d.old_pr.pr_id})

        return res.send({status:true})

    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée ..."})
    }
})

//Suppression d'un login solarpro
router.delete('/:id',async (req,res)=>{
    let D = require('../models/data')

    try {
        //On récupère les infos solarpro
        let sp = (await D.exec(`select * from solarpro sp left join profil p on sp.sp_pr_id = p.pr_id where sp.sp_id = ${req.params.id} `))[0]

        //Suppression du profil
        await D.del('profil',{pr_id:sp.pr_id})

        //Suppression de solarpro
        await D.del('solarpro',{sp_id:req.params.id})

        return res.send({status:true})

    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée .... Il est possible que le profil n'existe plus"})
    }
})

//Donner accès à solarpro
router.put('/access-panel',async (req,res)=>{
    let D =require('../models/data')

    try {
        await D.updateWhere('panneau',{pan_solarpro_access:(req.body.b)?1:0},{pan_id:req.body.id_p})
        return res.send({status:true})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée ..."})
    }
})

//récupération des panneaux qui ont accès solarpro
router.get('/panel',async (req,res)=>{
    let D =require('../models/data')

    try {
        //Récupération des panneau qui ont accès à solarpro
        let w = {
            s:'',
            t:''
        }
        let d = req.query

        if(d.by == 'pan_ref'){
            w.s+=' and p.pan_ref like  ? '
            w.t = `%${d.search}%`
        }else if(d.by == 'reg_label'){
            w.s+=' and r.reg_label like ? '
            w.t = `%${d.search}%`
        }else if (d.by == 'ann_label'){
            w.s+=' and a.ann_label like ? '
            w.t = `%${d.search}%`
        }

        let sql = `select spp.*,p.pan_id,p.pan_ref,p.pan_publoc_ref,p.pan_lumineux,p.pan_list_photo,
        p.pan_list_photo_solarpro,l.*,f.name_file,f.name_min_file,r.reg_label,a.ann_label,c.cat_label, 
        (select cat_label from category where cat_id = c.parent_cat_id  ) as parent_cat_label
        from panneau p
        left join file f on f.file_id = p.image_id
        left join lieu l on l.lieu_id = p.lieu_id
        left join regisseur r on r.reg_id = p.reg_id
        left join annonceur a on a.ann_id = p.ann_id
        left join category c on c.cat_id = p.cat_id
        left join solarpro_pan spp on p.pan_id = spp.spp_pan_id
        where p.pan_solarpro_access = 1 ${w.s}`

        let panels = await D.exec_params(sql,w.t)

        //Compter le nombre de lumière
        sql = `select sum(spp_nb_light) as nb from panneau p
        left join file f on f.file_id = p.image_id
        left join lieu l on l.lieu_id = p.lieu_id
        left join regisseur r on r.reg_id = p.reg_id
        left join annonceur a on a.ann_id = p.ann_id
        left join category c on c.cat_id = p.cat_id
        left join solarpro_pan spp on p.pan_id = spp.spp_pan_id
        where p.pan_solarpro_access = 1 ${w.s}`

        let nb_light_total = (await D.exec_params(sql,w.t))[0].nb
        
        
        return res.send({status:true,panels,nb_light_total})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée ..."})
    }
})

//R2cupération d'un seul panneau
router.get('/panel/:id',async (req,res)=>{
    let D =require('../models/data')

    try {
        //Récupération des panneau qui ont accès à solarpro
        let sql = `select spp.*,p.pan_id,p.pan_ref,p.pan_publoc_ref,p.pan_lumineux,p.pan_list_photo,
        p.pan_list_photo_solarpro,l.*,f.name_file,f.name_min_file,r.reg_label,a.ann_label,c.cat_label, 
        (select cat_label from category where cat_id = c.parent_cat_id  ) as parent_cat_label
        from panneau p
        left join file f on f.file_id = p.image_id
        left join lieu l on l.lieu_id = p.lieu_id
        left join regisseur r on r.reg_id = p.reg_id
        left join annonceur a on a.ann_id = p.ann_id
        left join category c on c.cat_id = p.cat_id
        left join solarpro_pan spp on p.pan_id = spp.spp_pan_id
        where p.pan_id = ? and p.pan_solarpro_access = 1`
        let panel = (await D.exec_params(sql,req.params.id))[0]

        //Récupération des photos solarpros
        //Les images dispo
        let image_list = []
        if(panel.pan_list_photo){
            const ims = await require('../models/File').getInP(panel.pan_list_photo.split(',').map(x => parseInt(x)) )
            image_list = ims
        }

        //Les images de solapro, disponible que quand il y a location
        let image_list_solarpro = []
        if(panel.pan_list_photo_solarpro){
            image_list_solarpro = await require('../models/File').getInP( panel.pan_list_photo_solarpro.split(',').map(x => parseInt(x)) )
        }

        return res.send({status:true,panel,image_list_solarpro,image_list})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée ..."})
    }
})

//Modification de date de contrôle de solarpro
router.put('/panel/:id/date',async (req,res)=>{
    let D = require('../models/data')

    try {
        let d = req.body

        let id_pan = req.params.id

        let spp = {
            spp_pan_id:id_pan,
            spp_date_debut:(d.debut)? new Date(d.debut) :null,
            spp_date_fin:(d.fin)? new Date(d.fin) :null,
            spp_date_control:(d.control)? new Date(d.control) :null,
            spp_type:d.type,
            spp_nb_light:d.nb_light,
            spp_long_pan:d.long_pan
        }

        if(parseInt(id_pan).toString()  == 'NaN'){
            return res.send({status:false,message:`Erreur de donnée en entrée.`})
        }

        //On vérifie d'abord si le lien existe déjà
        const lpan = await D.exec_params(`select spp_id from solarpro_pan where spp_pan_id = ?`,id_pan)

        if( lpan.length > 0){
            await D.updateWhere('solarpro_pan',spp,{spp_pan_id:id_pan})
        }else{
            await D.set('solarpro_pan',spp)
        }

        return res.send({status:true})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée ..."})
    }
})

// ----- Récupération des régisseurs ayant donné accès à solarpro
router.get('/reg/list',async (req,res)=>{
    let D = require('../models/data')

    try {
        let sql = `select r.*,
        (select count(*) from panneau pan where pan.reg_id = r.reg_id and pan.pan_solarpro_access = 1) as nb_panel,
        SUM(spp.spp_nb_light) as nb_light
        from regisseur r
        left join panneau p on p.reg_id = r.reg_id
        left join solarpro_pan spp on spp.spp_pan_id = p.pan_id
        where p.pan_solarpro_access = 1
        group by r.reg_id`
        
        let regs = await D.exec(sql)

        return res.send({status:true,regs})

    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée ..."})
    }
})

//récupération des paneaux d'un seul régisseur
router.get('/reg/:id',async (req,res)=>{
    let D = require('../models/data')
    let reg_id = req.params.id
    try {
        let sql = `select *,
        (select cat_label from category where cat_id = c.parent_cat_id  ) as parent_cat_label
        from panneau p
        left join regisseur r on r.reg_id = p.reg_id
        left join category c on c.cat_id = p.cat_id
        left join solarpro_pan spp on spp.spp_pan_id = p.pan_id

        where r.reg_id = ? and p.pan_solarpro_access = 1`

        let panels = await D.exec_params(sql,reg_id)

        //Compter le nombre de lumière
        sql = `select sum(spp_nb_light) as nb from panneau p
        left join solarpro_pan spp on p.pan_id = spp.spp_pan_id
        where p.reg_id = ? and p.pan_solarpro_access = 1`

        let nb_light_total = (await D.exec_params(sql,reg_id))[0].nb

        return res.send({status:true,panels,nb_light_total})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée ..."})
    }
})

module.exports = router