let router = require('express').Router()
let moment = require('moment')
let fs = require('fs');
const { table } = require('console');


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});

router.delete('/:id',async (req,res)=>{
    try {
        let id = parseInt(req.params.id)
        if(id.toString() == 'NaN') return res.send({status:false,message:"Erreur de données"})

        await require('../controller/file').deleteFile(id)
        return res.send({status:true})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur de base de donnée"})
    }
})


module.exports = router