let router = require('express').Router()


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});

router.get('/',async (req,res)=>{
    let Set  = require('../models/settings')
    try {
        const s = await Set.getSlides()
        return res.send({
            status:true,
            menu_slides:s
        })
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

module.exports = router