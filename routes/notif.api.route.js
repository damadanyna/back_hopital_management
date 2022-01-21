let router = require('express').Router()
let moment = require('moment')
let fs = require('fs');


//midlware spécifique pour la route
router.use((req, res, next) => {
    if(req.user.pr_type != 'a'){
        return res.send({status:false,message:"Autorisation non suffisante."})
    }
    next();
});


router.get('/',async (req,res)=>{
    let Notif = require('../models/notif')

    try {
        let notifs = {}
        const nb = await Notif.countAdmin() 
        if(nb.length == 0){
            nb = [{nbTotal:0,nbVu:0}]
        }

        const r = await Notif.getAll()

        return res.send({status:true,notifs:r,nb:nb[0].nbTotal})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée."})
    }
})

router.get('/reservation',async (req,res)=>{
    let Notif = require('../models/notif')

    try {
        let notifs = {}
        const nb = await Notif.countAll('reservation') 

        const r = await Notif.getAll('reservation')
        notifs.reservation = r
        return res.send({status:true,notifs:notifs,nb_reservation:nb[0].nb})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée."})
    }
})

router.get('/inscription',async (req,res)=>{
    let Notif = require('../models/notif')

    try {
        let notifs = {}
        const nb = await Notif.countAll('inscription') 

        const r = await Notif.getAll('inscription')
        notifs.inscription = r
        return res.send({status:true,notifs:notifs,nb_ins:nb[0].nb})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée."})
    }
})

router.get('/count',async (req,res)=>{
    let Notif = require('../models/notif')
    try {
        const d = await Notif.countAdmin()
        return res.send({status:true,count:d[0]})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})


module.exports = router