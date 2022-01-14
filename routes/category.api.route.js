let router = require('express').Router()
const bcrypt = require('bcrypt')


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});

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


//Get
router.get('/',(req,res)=> {
    let Category = require('../models/category')

    Category.all((err,result)=>{
        if(err){
            console.log(err)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }else{
            return res.send({status:true,categories:result})
        }
    })
})

//Get parent category
router.get('/parent',async (req,res)=>{
    let Category = require('../models/category')

    try {
        const c_res = await Category.getParentCat()

        return res.send({status:true,cat_parent:c_res})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée."})
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

    Category.post(c,(err,result)=>{
        if(err){
            return res.send({status:false,message:'Erreur de la base de donnée'})
        }else{
            return res.send({status:true})
        }
    })
})


module.exports = router