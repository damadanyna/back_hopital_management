let router = require('express').Router()
let moment = require('moment')
let fs = require('fs');


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

    

    let limit = parseInt(req.params.nb)
    let page = parseInt(req.params.page)

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
    let id = parseInt(req.params.id)

    if(id.toString() == 'NaN'){
        return res.send({status:false,message:"Erreur de donnée en Entrée"})
    }

    try {
        const p_res = await Panel.getByIdP(id)
        if(p_res.length == 0){
            return res.send({status:false,message:"Donnée pas trouvée"})
        }
        
        return res.send({status:true,panel:p_res[0]})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur de base de donnée"})
    }
})



module.exports = router