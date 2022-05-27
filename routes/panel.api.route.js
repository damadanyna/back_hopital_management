let router = require('express').Router()
let moment = require('moment')
let fs = require('fs');


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});

//changement de tag pour un panneau
router.put('/ann/tag',async (req,res)=>{
    let D = require('../models/data')
    try {
        let d = req.body
        await D.updateWhere('panneau',{pan_tag:d.tag},{pan_id:d.pan_id})
        return res.send({status:true})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée",e})
    }
})

//Upload et suppressioin d'image selon les modes
router.put('/ims/other',async (req,res)=>{
    let D = require('../models/data')
    try {
        //Les images à ajouter
        let mode = req.body.mode

        let ids = req.body.ims.map( (x)=>{
            return x.file_id
        })

        let mode_set = {
            dispo:'pan_list_photo',
            pose:'pan_list_photo_pose',
            solarpro:'pan_list_photo_solarpro'
        }
        
        //Modification du panneau pour insérer les listes des ids des images
        await D.exec(`update panneau set ${mode_set[req.body.mode]} = '${ ids.join(',')}' where pan_id = ${req.body.pan_id}`)
        //insertion de la première image si en mode dispo en tant que image principale
        if(req.body.mode == 'dispo'){
            await D.exec(`update panneau set image_id = ${ (ids[0])?ids[0]:null }  where pan_id = ${req.body.pan_id} `)
        }

        //Modification de l'image pour mettre en use
        if(ids.length > 0){
            await require('../models/File').setUseFile(ids)
        }

        //Suppresion des images supprimés
        if(req.body.ims_del.length > 0){
            await require('../controller/file').deleteMultipleFile(req.body.ims_del)
        }

        return res.send({status:true})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée",e})
    }
    
})

//Mettre en dispo les panneaux sur la liste et ce qui n'est pas sur la liste sera en indisponnible
router.put('/dispo',async (req,res)=>{
    let Data = require('../models/data')
    try {
        let sql = `update panneau set pan_state = 1, pan_update_at = now() where pan_id in (?) and reg_id = ? `
        const dispo_modif = await Data.exec_params(sql,[req.body.ids,req.body.reg_id])
        sql = `update panneau set pan_state = 4, pan_update_at = now() where pan_id not in (?) and reg_id = ? and pan_state not in (3) `
        const indispo_modif = await Data.exec_params(sql,[req.body.ids,req.body.reg_id])

        return res.send({status:true,dispo_modif,indispo_modif})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Recherche de panneau par ref
router.get('/search/:ref/ref',async (req,res)=>{
    let Data = require('../models/data')
    try {
        const panels = await Data.exec(`select * from panneau where pan_ref like '%${req.params.ref}%' and reg_id = ${req.query.reg} and pan_state in (1,2,4) `)
        return res.send({status:true,panels})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Récupération de panneaux à afficher dans les boîtes de dialogue
router.get('/by',async (req,res)=>{
    try {
        console.log(req.query)
        const p = await require('../models/panel').getWhere(req.query)
        return res.send({status:true,panels:p})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Modification d'image pricipale de panneau
router.put('/:id/im-main',async (req,res)=>{
    try {
        await require('../models/data').updateWhere('panneau',{image_id:req.body.image_id},{pan_id:req.params.id})

        return res.send({status:true})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Récupération de liste de panneau pour la boîte de dialogue
router.get('/list-by',async (req,res)=>{
    if(req.user.pr_id === undefined) return res.send({status:false,message:"Erreur d'autorisation"})
    try {
        let t = {}
        if(req.user.pr_type == 'ann'){
            const a = await require('../models/annonceur').getByIdProfil(req.user.pr_id)
            t.ann_id = a[0].ann_id
        }else if(req.user.pr_type == 'reg'){
            const r = await require('../models/regisseur').getByIdProfil(req.user.pr_id)
            t.reg_id = r[0].reg_id
        }
        const p = await require('../models/panel').getPanelPWhereInNotSousAnnLocation(t)

        return res.send({status:true,list:p})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Get normal
router.get('/',async (req,res)=>{
    let Panel = require('./../models/panel')

    try {
        const p_res = await Panel.all()
        return res.send({status:true,panels:p_res})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:'Erreur dans la base de donnée.'})
    }
})

//Get normal
router.get('/admin/filters',async (req,res)=>{
    let Panel = require('./../models/panel')

    let w = '',t_w= []
    let d = req.query

    //Pour la recherche
    if(d.filter_by == 'pan_ref'){
        w+=`p.pan_ref like ?`
    }else if(d.filter_by == 'lieu_ville' || d.filter_by == 'lieu_quartier' || d.filter_by == 'lieu_region' ){
        w+=`l.${d.filter_by} like ?`
    }else if(d.filter_by == 'ann_label'){
        w+=`a.ann_label like ?`
    }else if(d.filter_by == 'reg_label'){
        w+=`r.reg_label like ?`
    }else if(d.filter_by == 'pan_publoc_ref'){
        w+=`p.pan_publoc_ref like ?`
    }


    t_w.push(`%${d.input}%`)

    //Etat du panneau
    if(d.state){
        w+=` and p.pan_state = ?`
        t_w.push(d.state)
    }

    if(d.validation){
        w+=' and p.pan_validation = ?'
        t_w.push(d.validation)
    }

    //Les offsets
    let limit = ` limit ${d.limit} offset ${d.limit * (d.page-1)} `


    //Ceci possède des filtres
    let sql_request = `select * from panneau p
    left join lieu l on l.lieu_id = p.lieu_id 
    left join annonceur a on p.ann_id = a.ann_id
    left join regisseur r on r.reg_id = p.reg_id
    where ${w} ${limit}`

    let sql_count = `select count(*) as nb from panneau p
    left join lieu l on l.lieu_id = p.lieu_id 
    left join annonceur a on p.ann_id = a.ann_id
    left join regisseur r on r.reg_id = p.reg_id
    where ${w}`

    try {
        const panels = await require('../models/data').exec_params(sql_request,t_w)
        const countPanel = (await require('../models/data').exec_params(sql_count,t_w))[0].nb

        return res.send({status:true,panels,countPanel,sql_request,sql_count,d})

    } catch (e) {
        console.log(e)
        return res.send({status:false,message:'Erreur dans la base de donnée.',d})
    }
})


//Insertion d'un panneau
router.post('/',async (req,res)=>{
    let Panel = require('./../models/panel')
    let d = req.body
    let pan = ['reg_id','cat_id','image_id','pan_surface','pan_ref'
    ,'pan_description','pan_support','pan_lumineux']
    let lieu = ['lieu_pays','lieu_ville','lieu_quartier','lieu_region','lieu_label','lieu_lat','lieu_lng']

    

    let p = {}
    //Insertion panneau
    for(let i = 0;i<pan.length;i++){
        if(d[pan[i]] == undefined){
            return res.send({status:false,message:"Erreur des données entrées",data:pan[i]})
        }
        p[pan[i]] = (d[pan[i]] === '')?null:d[pan[i]] 
    }

    let l = {}
    //Inertion Lieu
    for(let i = 0;i<lieu.length;i++){
        if(d[lieu[i]] === undefined){
            return res.send({status:false,message:"Erreur des données entrées",data:lieu[i]})
        }
        l[lieu[i]] = (d[lieu[i]] == '')?null:d[lieu[i]] 
    }

    if(d.pan_list_photo.length > 0){
        p.pan_list_photo = d.pan_list_photo.join(',')
        await require('../models/File').setUseFile(d.pan_list_photo)
        p.image_id = d.pan_list_photo[0]
    }

    //Insertion dans la base avec un try catch
    try {
        const lieu_res = await Panel.addLieu(l)

        p.pan_validation = (req.user.pr_type == 'a')?1:0
        p.pan_state = 1
        p.lieu_id = lieu_res.insertId

        //Insertion du Panneau
        //récupération des nombres de panneau
        const nbp = (await require('../models/data').exec('select count(*) as nbp from panneau  '))[0].nbp
        if(nbp+1> 1000){
            p.pan_publoc_ref = 'PBLC-'+(nbp+1)
        }else if(nbp+1 > 100){
            p.pan_publoc_ref = 'PBLC-0'+(nbp+1)
        }else if(nbp+1> 10){
            p.pan_publoc_ref = 'PBLC-00'+(nbp+1)
        }else{
            p.pan_publoc_ref = 'PBLC-000'+(nbp+1)
        }
        const pan_res = await Panel.add(p)

        //Insertion  de la commune urbaine si existe
        //'pan_date_auth_cu','pan_num_auth_cu','pan_id_cu'
        d.pan_date_auth_cu = (d.pan_date_auth_cu)?d.pan_date_auth_cu:null
        d.pan_num_auth_cu = (d.pan_num_auth_cu)?d.pan_num_auth_cu:null
        d.pan_cu_id = (d.pan_cu_id)?d.pan_cu_id:null


        return res.send({status:true,id:pan_res.insertId})

    } catch (e) {
        console.log(e)
        return res.send({status:false,message:'Erreur dans la base de donnée.'})
    }

})

//Modification d'un panneau
router.put('/:id',async (req,res)=>{
    let Panel = require('./../models/panel')
    let d = req.body
    let pan = ['reg_id','cat_id','image_id','pan_surface','pan_ref','pan_description','pan_lumineux']
    let lieu = ['lieu_pays','lieu_ville','lieu_quartier','lieu_commune','lieu_region','lieu_label','lieu_lat','lieu_lng']

    let p = {}
    //Insertion panneau
    for(let i = 0;i<pan.length;i++){
        if(d[pan[i]] === undefined){
            return res.send({status:false,message:"Erreur des données entrées",data:pan[i]})
        }
        p[pan[i]] = (!d[pan[i]])?null:d[pan[i]] 
    }

    let l = {}
    //Inertion Lieu
    for(let i = 0;i<lieu.length;i++){
        if(d[lieu[i]] === undefined){
            return res.send({status:false,message:"Erreur des données entrées",data:lieu[i]})
        }
        l[lieu[i]] = (!d[lieu[i]])?null:d[lieu[i]] 
    }

    if(d.pan_list_photo.length > 0){
        p.pan_list_photo = d.pan_list_photo.join(',')
        await require('../models/File').setUseFile(d.pan_list_photo)
        p.image_id = d.pan_list_photo[0]
    }else{
        p.image_id = null
        p.pan_list_photo = null
    }

    console.error(p)
    console.error(l)

    console.error(d)

    try {
        const l_res = await Panel.updateLieu(d.lieu_id,l)

        //Modification de la date de dérnière modification
        p.pan_update_at = new Date()
        //--------------------------
        //Insertion de la commune urbaine
        p.pan_cu_id = d.pan_cu_id
        p.pan_num_auth_cu = d.pan_num_auth_cu
        p.pan_date_auth_cu = new Date(d.pan_date_auth_cu)

        //Insertion de catégorie si besoin
        p.cat_id = d.cat_id

        const p_res = await Panel.update(d.pan_id,p) 
        return res.send({status:true})

    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée ..."})
    }

})

//Compter les panneaux
router.get('/count',(req,res)=>{
    let Panel = require('./../models/panel')
    Panel.count((err,result)=>{
        if(err){
            return res.send({status:false,message:'Erreur de la base de donnée'})
        }else{
            return res.send({status:true,nb:result[0].nb})
        }
    })
})

//Récupération d'un panneau pour la viewPanel
router.get('/:id',async (req,res)=>{
    let Panel = require('./../models/panel')
    let id = parseInt(req.params.id)
    if(id.toString() == 'NaN'){
        return res.send({status:false,message:'Erreur de donnée en Entrée.'})
    }

    try {
        const p_res = await Panel.getById(id)
        let image_list = []
        let panel = p_res[0]



        if(panel.pan_list_photo){
            const ims = await require('../models/File').getIn(panel.pan_list_photo.split(',').map(x => parseInt(x)) )
            image_list = ims
        }

        //Les images de poses, disponible que quand il y a location
        let image_list_pose = []
        if(panel.pan_list_photo_pose){
            image_list_pose = await require('../models/File').getInP( panel.pan_list_photo_pose.split(',').map(x => parseInt(x)) )
        }

        //Les images de solapro, disponible que quand il y a location
        let image_list_solarpro = []
        if(panel.pan_list_photo_solarpro){
            image_list_solarpro = await require('../models/File').getInP( panel.pan_list_photo_solarpro.split(',').map(x => parseInt(x)) )
        }

        
        
        return res.send({status:true,panel:p_res[0],image_list,image_list_pose,image_list_solarpro})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:'Erreur dans la base de donnée'})
    }
})

//Récupération d'un panneau pour la modification
router.get('/:id/edit',async (req,res)=>{
    let Panel = require('./../models/panel')
    let Data = require('../models/data')
    let id = parseInt(req.params.id)
    if(id.toString() == 'NaN'){
        return res.send({status:false,message:'Erreur de donnée en Entrée.'})
    }

    try {
        const p_res = await Panel.getById(id)
        let image_list = []
        if(p_res[0].pan_list_photo != null){
            const ims = await require('../models/File').getIn(p_res[0].pan_list_photo.split(',').map(x => parseInt(x)) )
            image_list = ims
        }

        //R2cupération des annonceurs
        const ann = await Data.exec('select a.ann_id, a.ann_label from annonceur a')

        //Récupération des catégories
        const cat = await Data.exec('select * from category where parent_cat_id is null')

        //Récupération de formats
        const format = await Data.exec(`select * from category where parent_cat_id = ${p_res[0].parent_cat_id } `)

        //Récupération des régisseurs
        const reg = await Data.exec('select r.reg_id, r.reg_label from regisseur r ')

        //Récupération des listes de cu
        const cu = await Data.exec('select cu.cu_id, cu_label,cu_label_2 from commune_urbaine cu')
        
        return res.send({status:true,panel:p_res[0],image_list:image_list,ann,cat,format,reg,cu})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:'Erreur dans la base de donnée'})
    }
})

//Récupération panneau avec limit
router.get('/limit/:nb/:page',async (req,res)=>{
    let Panel = require('../models/panel')

    let limit = parseInt(req.params.nb)
    let page = parseInt(req.params.page)

    if(limit.toString() == 'NaN' || page.toString() == 'NaN'){
        return res.send({status:false,message:"Erreur de donnée en entrée"})
    }

    console.log('Putain  de merde !!')


   try {
        const r = await Panel.getAllLimit(limit,page)
        return res.send({status:true,panels:e})
   } catch (e) {
        console.error(e)
        return res.send({status:false,message:'Erreur dans la base de donnée'})
   }
})

//Suppression d'un panneau
router.delete('/:id',async (req,res) =>{
    let Panel = require('../models/panel')
    try {
        const p_res = await Panel.delete(id)
        return res.send({status:true})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Mette un panneau en vérifié pa publoc
router.put('/:id/verified',async (req,res)=>{
    if(req.user.pr_type != "a"){
        return res.send({status:false,message:"Autorisation non satisfaisante"})
    }

    try{
        await require('../models/panel').updateTo( [{pan_verified_by_publoc:1}, {pan_id:req.params.id}] )
        return res.send({status:true})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})




module.exports = router