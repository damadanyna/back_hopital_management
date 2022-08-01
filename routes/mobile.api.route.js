let router = require('express').Router()
let moment = require('moment')
let fs = require('fs');


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});

router.get('/panel/limit/:limit',async (req,res)=>{
    let D = require('../models/data')

    try {
        let panels = await D.exec_params(`select * from panneau p
        left join lieu l on l.lieu_id = p.lieu_id limit ?`,[req.params.limit])

        return res.send({status:true,panels})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

module.exports = router