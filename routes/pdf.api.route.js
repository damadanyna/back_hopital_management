let router = require('express').Router()

//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});

router.get('/panel',async (req,res)=>{
    let D = require('../models/data')

    try {
        let publoc_pan_ref = req.query.ref

        let sql = `select *, (select cat_label from category c where c.cat_id = format.parent_cat_id ) as parent_cat_label
        from panneau p
        left join category format on format.cat_id = p.cat_id
        left join lieu l on l.lieu_id = p.lieu_id
        left join file f on f.file_id = p.image_id
        where p.pan_publoc_ref = ?`

        let panel = (await D.exec_params(sql,publoc_pan_ref))[0]

        return res.send({status:true,panel})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée."})
    }
})

module.exports = router