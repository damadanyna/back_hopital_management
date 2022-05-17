let router = require('express').Router()
let moment = require('moment')
let fs = require('fs');
const { table } = require('console');


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});

//Récupération des stats pour l'accueil
router.get('/stats/acc',async (req,res)=>{
    try {
        //Récupération stats catégories
        const c = await require('../models/category').getStatsPerPanel()
        const v = await require('../models/panel').getStatsVillePerPanel()
        
        return res.send({status:true,cats:c,villes:v})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Récupération des panneaux selon les critères
router.get('/search/all',async (req,res)=>{
    let Panel = require('../models/panel')
    let d_ = ['p_cat','s_cat','ville','reg']

    let tab = [], sql=''
    if(req.query.p_cat !== undefined){
        let p_cat = req.query.p_cat.split(',')
        sql+=((sql.length != 0)?' and ':'')+"( p_cat.cat_label in (?) )"
        tab.push(p_cat)
    }

    if(req.query.s_cat !== undefined){
        let s_cat = req.query.s_cat.split(',')
        sql+=((sql.length != 0)?' and ':'')+"( s_cat.cat_label in (?) )"
        tab.push(s_cat)
    }

    if(req.query.ville !== undefined){
        let ville = req.query.ville.split(',')
        sql+=((sql.length != 0)?' and ':'')+"( l.lieu_ville in (?) )"
        tab.push(ville)
    }

    if(req.query.quartier !== undefined){
        let quartier = req.query.quartier.split(',')
        sql+=((sql.length != 0)?' and ':'')+"( l.lieu_quartier in (?) )"
        tab.push(quartier)
    }

    if(req.query.reg !== undefined){
        let reg = req.query.reg.split(',')
        sql+=((sql.length != 0)?' and ':'')+"( reg.reg_label in (?) )"
        tab.push(reg)
    }

    let l = {
        limit:parseInt(req.query.aff),
        offset:parseInt(req.query.aff) * (parseInt(req.query.page)-1)
    }

    // console.log(l)

    try {
        if(tab.length != 0){
            const p = await Panel.getPanelByLimitAndParams(sql,tab,l)
            const c = await Panel.countPanelByLimitAndParams(sql,tab)

            return res.send({status:true,panels:p,count:c[0].nb})
        }else{

            const p = await Panel.getPanelByLimit(l)
            const c = await Panel.countPanelByLimit()
            return res.send({status:true,panels:p,count:c[0].nb})
        }

        //return res.send({status:false,message:"Fonctionnalités en cours de développement"})

    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Les pub prisés
router.get('/prises',async (req,res)=>{
    try {
        const p = await require('../models/panel').getPrisesPublic()
        return res.send({status:true,prises:p})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Récupérer les quartiers selon les villes séléctionnées
router.get('/ville/quartier', async (req,res)=>{
    try {
        const q = await require('../models/panel').getQuartierByVilleList(req.query.ville)
        return res.send({status:true,list:q})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Récupération des données pour la recherche
router.get('/search/criteria',async (req,res)=>{
    let Cat = require('../models/category')

    try {
        const p = await Cat.getAllParents()
        const sub = await Cat.getAllChilds()
        const r = await require('../models/regisseur').getAbonneReg()

        return res.send({status:true,cat_p:p,cat_childs:sub,reg:r})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Récupéraion des formats selon les catégories sélectionées
router.get('/search/sub-cat',async (req,res)=>{
    let D = require('../models/data')

    try {
        let sql = `select c.cat_label,c.cat_id from category c 
        left join category cat on cat.cat_id = c.parent_cat_id where cat.cat_label in (?) `

        let formats = await D.exec_params(sql,[req.query.cats])
        // console.log(req.query.cats)
        return res.send({status:true,formats})    
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})


//Réupérer les catégoriers et sous catégories 
router.get('/cat/all',async (req,res)=>{
    let Cat = require('../models/category')

    try {
        const p = await Cat.getAllParents()
        const sub = await Cat.getAllChilds()

        return res.send({status:true,parents:p,childs:sub})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Récupération des catégories sans les enfants
router.get('/cat/parent',async (req,res)=>{
    let Cat = require('../models/category')

    try {
        const d = await Cat.getAllParents()

        return res.send({status:true,cats:d})
    }catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Récupérer toutes les sous-catégories
router.get('/cat/child/all',async (req,res)=>{
    let Cat = require('../models/category')
    try {
        const d = await Cat.getAllChilds()
        return res.send({status:true,cats:d})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Récupération des catégories sans les enfants
router.get('/cat/child/:id',async (req,res)=>{
    let Cat = require('../models/category')
    let id = parseInt(req.params.id)
    if(id.toString() == 'NaN'){
        return res.send({status:false,message:"Erreur de donnée en entrée"})
    }
    try {
        const d = await Cat.getAllChilds(id)
        return res.send({status:true,cats:d})
    }catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Récupération panneau avec limit
router.get('/limit/:nb/:page',async (req,res)=>{
    let Panel = require('../models/panel')

    

    let limit = 1000//parseInt(req.params.nb)
    let page = 1//parseInt(req.params.page)

    if(limit.toString() == 'NaN' || page.toString() == 'NaN'){
        return res.send({status:false,message:"Erreur de donnée en entrée"})
    }

    let search = (req.query.search !== undefined)?'%'+req.query.search+'%':"%%"
    let id_cat_child = (req.query.cat_child !== undefined && req.query.cat_child != null )?req.query.cat_child:null
    let id_cat_parent = (req.query.cat_parent !== undefined && req.query.cat_parent != null )?req.query.cat_parent:null
    let r = {}
    let set = ''
    try {
        if(id_cat_child){
            r = await Panel.getAllLimitLikeLieuAndCat(limit,page,search,id_cat_child)
            set = 'cat_child '+id_cat_child
        }else if(id_cat_parent){
            r = await Panel.getAllLimitLikeLieuAndParentCat(limit,page,search,id_cat_parent)
            set = 'cat_parent '+id_cat_parent
        }else{
            r = await Panel.getAllLimitLikeLieu(limit,page,search)
            set = 'no_cat_child'
        }

        //console.log(set+' : ',r)
        
        return res.send({status:true,panels:r})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Récu^ération des panneaux pour la map
router.get('/map',async (req,res)=>{
    let Panel = require('../models/panel')

    try{
        const l = await Panel.getListPanToMap()
        return res.send({status:true,panels:l})
    }catch(e){
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

router.get('/ville',async (req,res)=>{
    let Panel = require('../models/panel')

    try {
        const villes = await Panel.getAllVillePanneau()
        return res.send({status:true,villes:villes})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Récupération des type de service pour le panneau actuel
router.get('/:id_pan/serv',async (req,res)=>{
    let Panel = require('../models/panel')

    let id  = parseInt(req.params.id_pan)

    
    if(req.query.month === undefined) return res.send({status:false,message:"Erreur de donnée en entrér"})
    let month = parseInt(req.query.month)

    if(id.toString() == 'NaN' || month.toString() == 'NaN'){
        return res.send({status:false,message:"Erreur de donnée en entrér"})
    }

    let services = []
    let tarif_id = null
    try {
        const t = await Panel.getTarifByPan(id)

        if(t.length > 0 ){

            for (let i = 0; i < t.length; i++) {
                let tmp = t[i]
                if(month >= tmp.tarif_min_month){
                    const s = await Panel.getServListIn(tmp.tarif_service_list.split(','))
                    services = s
                    tarif_id = tmp.tarif_id
                    break;
                }
            }
        }
        return res.send({status:true,services:services,tarif_id:tarif_id})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Récupération pour un visionnage public d'un panneau
router.get('/:id',async (req,res)=>{
    let Panel = require('../models/panel')
    let Data = require('../models/data')
    let id = parseInt(req.params.id)

    if(id.toString() == 'NaN'){
        return res.send({status:false,message:"Erreur de donnée en Entrée"})
    }

    try {
        const p_res = await Panel.getByIdP(id)
        if(p_res.length == 0){
            return res.send({status:false,message:"Donnée pas trouvée"})
        }
        let ims = []
        if(p_res[0].pan_list_photo){
            ims = await require('../models/File').getFileByIds(p_res[0].pan_list_photo.split(','))
        }

        let pan = {
            panel:p_res[0],
            images:ims
        }

        let ann = null,info = null
        
        //Récupération des informations du régisseur
        let reg = (await require('../models/regisseur').getById(pan.panel.reg_id))[0]

        let info_tmp = {
            reg_label:reg.reg_label,
            soc_pr_adresse:reg.soc_pr_adresse,
            soc_pr_tel:reg.soc_pr_tel,
            soc_pr_email:reg.soc_pr_email,
            name_file:reg.name_file
        }


        //Rcupération des informatioins sur l'annonceur, si connecté
        //Pour récupérer les infos à afficher dans la vue

        info = (reg.soc_sub)?info_tmp:null
        
        if(req.user && req.user.pr_type == 'ann'){
            let sql = `select * from annonceur a where a.pr_id = ${req.user.pr_id} `
            ann = (await Data.exec(sql))[0]

            info = (ann.ann_is_agence_com)?info_tmp:null
        }

        if(!info){
            delete pan.panel.reg_id
            delete pan.panel.pan_ref
        }

        // console.log({label:reg.reg_label,sub:reg.soc_sub})

        // console.log(req.user)
        
        return res.send({status:true,panel:pan,info})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur de base de donnée"})
    }
})



module.exports = router