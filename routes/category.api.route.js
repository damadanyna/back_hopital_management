let router = require('express').Router()
const bcrypt = require('bcrypt')


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});
//Récupérer la liste des catégorie parent
router.get('/parent',async(req,res)=>{
    try {
        const c = await require('../models/category').getAllParents()
        return res.send({status:true,list:c})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée."})
    }
})

//Récupérer la liste de sous-catégorie
router.get('/sous/:id',async (req,res)=>{
    try {
        const c = await require('../models/category').getListSousCat(req.params.id)
        return res.send({status:true,list:c})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée."})
    }
})

//Compter le nombre de catégorie
router.get('/count',(req,res)=> {
    let Category = require('../models/category')

    Category.count((err,result)=>{
        if(err){
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }else{
            return res.send({status:true,nb:result[0].nb})
        }
    })
})


//Récupération de toutes les catégories
// router.get('/',(req,res)=> {
//     let Category = require('../models/category')

//     Category.all((err,result)=>{
//         if(err){
//             console.log(err)
//             return res.send({status:false,message:"Erreur dans la base de donnée"})
//         }else{
//             return res.send({status:true,categories:result})
//         }
//     })
// })

//Création de nouvelles méthodes de récupération des catégories (côté admin)
router.get('/',async (req,res)=>{
    let Category = require('../models/category')
    try {
        const c = await Category.getAllToAdmin()
        return res.send({status:true,categories:c})
    }catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})


router.get('/:id',(req,res)=>{
    let Category = require('../models/category')
    let id = parseInt(req.params.id)
    if(id.toString == 'NaN'){
        return res.send({status:false,message:"Erreur de donnée entrée"})
    }

    Category.getById(id,(err,result)=>{
        if(err){
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }else{
            return res.send({status:true,cat:result[0]})
        }
    })
})

router.post('/',(req,res)=>{
    let Category = require('../models/category')

    let c = req.body

    if(c.cat_label === undefined){
        return res.send({status:false,message:'Erreur de donnée en Entrée'})
    }

    if(c.cat_label.trim() == ''){
        return res.send({status:false,message:'Champ obligatoire'})
    }
    // console.log(c)
    c.parent_cat_id = (c.parent_cat_id == '')?null:c.parent_cat_id
    Category.post(c,(err,result)=>{
        if(err){
            
            console.error(err)
            return res.send({status:false,message:'Erreur de la base de donnée'})
        }else{
            return res.send({status:true})
        }
    })
})

router.delete('/',async (req,res)=>{
    let Category = require('../models/category')
    let Panel = require('../models/panel')

    let d = req.body
    console.log(d)
    let state = "delete-begin"
    let cat_ids = []
    try {
        for (let i = 0; i < d.length; i++) {
            let c = d[i]
            cat_ids.push(d[i].cat_id)
        }

        state = "update-panel"
        await Panel.changeCatToNull(cat_ids)
        state = "delete-sous-cat"
        await Category.deleteAllSousCat(cat_ids)
        state = "delet-cat"
        await Category.deleteMultiple(cat_ids)

    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
    
    return res.send({status:true})
})

//Récupération des sous-cat d'un parent
router.get('/:id/sub',async (req,res)=>{
    try {
        
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

router.put('/:id',async (req,res)=>{
    let Category = require('../models/category')
    let id = parseInt(req.params.id)

    if(id.toString() == "NaN"){
        return res.send({status:false,message:"Erreur des données en entrées"})
    }

    let d_brut = req.body 

    let c = {
        cat_label:d_brut.cat_label,
        parent_cat_id:d_brut.parent_cat_id,
        cat_color:d_brut.cat_color,
        cat_icon:d_brut.cat_icon
    }

    try {
        const c_res = await Category.update(id,c)
        return res.send({status:true})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"}) 
    }
})

router.get('/reg/:id_reg_pr',async (req,res)=>{

    if(req.user.pr_type !='reg'){
        return res.send({status:false,message:"Autorisation non suffisante"})
    }


    let id = parseInt(req.params.id_reg_pr)
    console.log(id);
    if(id.toString() == 'NaN'){
        return res.send({status:false,message:"Erreur de donnée en Entrée"})
    }

    //Récupération des catégories pour les panneux du régisseur
    try {
        const cat = await require('../models/category').getRegByIdProfil(id)

        return res.send({status:true,categories:cat})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"}) 
    }

})

module.exports = router