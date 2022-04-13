let router = require('express').Router()
const bcrypt = require('bcrypt');
const { now } = require('moment');


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});

router.get('/',async (req,res)=>{
    let D = require('../models/data')

    try {
        //Récupération de tous les dévis par non réponse 
        let sql = `select * from devis_request as dr 
        left join panneau as p on p.pan_id = dr.d_devis_pan_id
        left join file as f on f.file_id = p.image_id
        left join  annonceur as a on a.ann_id = dr.d_devis_ann_id 
        order by dr.d_devis_response`
        const d = await D.exec(sql)
         return res.send({status:true,devis:d})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }    
})


//Exportation
module.exports = router