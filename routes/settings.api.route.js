let router = require('express').Router()
let fs = require('fs')


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});


// let p = result[0]
// let tj = p.temp_control_jour.split(':')
// let tn = p.temp_control_nuit.split(':')
// tj[0] = ((tj[0] = parseInt(tj[0])-3) >= 10)?tj[0]:'0'+tj[0]
// tn[0] = ((tn[0] = parseInt(tn[0])-3) >= 10)?tn[0]:'0'+tn[0]

// tj = tj.join(':')+":00"
// tn = tn.join(':')+":00"


//Récupération des paramètres
router.get('/',(req,res)=>{
    let Settings = require('../models/settings')

    Settings.getall((err,result)=>{
        if(err || result.length == 0){
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }else{
            return res.send({status:true,settings:result[0]})
        }
    })
})

//Momdification
router.put('/:id',(req,res)=>{
    let s = req.body
    let Settings = require('../models/settings')
    let Place = require('./../models/place')

    Settings.getall((err,result)=>{
        if(err || result.length == 0){
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }else{
            let p = result[0]
            let tj = p.temp_control_jour.split(':')
            let tn = p.temp_control_nuit.split(':')
            tj[0] = ((tj[0] = parseInt(tj[0])-3) >= 10)?tj[0]:'0'+tj[0]
            tn[0] = ((tn[0] = parseInt(tn[0])-3) >= 10)?tn[0]:'0'+tn[0]

            tj = tj.join(':')+":00"
            tn = tn.join(':')+":00"


            Settings.update(s,(err,result)=>{
                if(err){
                    return res.send({status:false,message:"Erreur dans la base de donnée"})
                }else{
                    Place.modify_stat_by_jour(tj,tn)
                    Place.modify_stat_by_nuit(tj,tn)
                    return res.send({status:true})
                }
            })
        }
    })

    

    
})

module.exports = router
