let router = require('express').Router()
const bcrypt = require('bcrypt');
const { now } = require('moment');


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});


router.get('/location/:id',async (req,res)=>{
    let id = parseInt(req.params.id)

    if(id.toString() == 'NaN'){
        return res.send({status:false,message:"Erreur de donnée en entrée"})
    }

    try {
        const d = await require('../models/comments').get(id)

        return res.send({status:true,comments:d})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur de base de donnée"})
    }
})

router.post('/location',async (req,res)=>{
    let coms = req.body
    try {
        //Récupération des infos sur le panneau
        const p =  await require('../models/panel').getPanLocationById(coms.com_obj_id)
        let pl = p[0]
        
        
        //Création de date
        coms.com_date = new Date(coms.com_date)
        const d = await require('../models/comments').set(coms)

        
        let n = {
            notif_title:"Commentaires",
            notif_desc:`<div> Un administrateur a commenté votre réservation </div>`,
            notif_dest_pr_id:pl.pr_id,
            notif_motif:"comment-location",
            notif_type:"ann",
            notif_id_object:coms.com_obj_id
        }

        let n_ad = {
            notif_title:"Commentaires",
            notif_desc:`<div> Un annonceur vient de Commenter une réservation </div>`,
            notif_motif:"comment-location",
            notif_type:"a",
            notif_id_object:coms.com_obj_id
        }

        //Avant de poster les notifs il faut effacer les anciennes notifications et les regroupers
        if(req.user.pr_type == 'a'){
            const c = await require('../models/comments').countCommentNonLuByType([coms.com_obj_id,'ann'])
            await require('../models/notif').deleteCommentAnn(pl.pr_id)
            let count = parseInt(c[0].nb)+1

            n.notif_desc = `<div> Vous avez (${count}) commentaires sur votre <nuxt-link 
            to='/a/reservation/${coms.com_obj_id}' class='text-indigo-600'> reservation </nuxt-link> </div>`

            await require('../models/notif').set(n)
            //Notification instantanné
            req.io.emit('new-notif-'+pl.pr_id,{
                t:"Commentaire",
                c:"Un Administrateur a commenté votre réservation",
                e:false
            })
        }else{
            const c = await require('../models/comments').countCommentNonLuByType([coms.com_obj_id,'a'])
            await require('../models/notif').deleteCommentAdmin()
            let count = parseInt(c[0].nb)+1

            n_ad.notif_desc = `<div> Vous avez (${count}) commentaires sur une <nuxt-link 
            to='/admin/location/${coms.com_obj_id}' class='text-indigo-600'> reservation </nuxt-link> </div>`
            await require('../models/notif').set(n_ad)
            //Notification instantanné
            req.io.emit('new-notif-ad',{
                t:"Commentaire",
                c:"Un Annonceur a commenté sa réservation ",
                e:false
            })
        }

        
        coms.com_id = d.insertId
        req.io.emit('new-com-'+coms.com_obj_id,coms)
        return res.send({status:true})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur de base de donnée"})
    }
})

router.delete('/location/:id_obj',async (req,res)=>{
    try {
        await require('../models/comments').delById(req.query.id)
        req.io.emit('del-com-'+req.params.id_obj,req.query.index)
        return res.send({status:true})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur de base de donnée"})
    }
})

router.put('/vu/:id_obj/:type/all',async (req,res)=>{
    try {
        await require('../models/comments').setVuAllByProfilTypeAndObject([req.params.id_obj,req.params.type])
        return res.send({status:true})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur de base de donnée"})
    }
})

module.exports = router