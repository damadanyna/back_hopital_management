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

router.put('/response',async (req,res)=>{
    let Data  = require('../models/data')

    try {
        let dr = req.body

        //Modification du devis correspindant
        await Data.updateWhere('devis_request',{d_devis_response:dr.d_devis_response},{d_devis_id:dr.d_devis_id})

        //Création de notification
        const ann_pr = (await Data.exec(`select * from annonceur as a 
        left join profil as p on p.pr_id = a.pr_id where a.ann_id = ${dr.d_devis_ann_id}`))[0]

        //Envoi  de notification côté annonceur
        let n = {
            notif_type:'ann',
            notif_desc:`<div> Vous avez reçu une réponse pour votre demande de devis sur le panneau <nuxt-link class="hover:underline text-indigo-600" 
            to="/panneau/${dr.pan_id}" > ${dr.pan_publoc_ref} </nuxt-link>.
            <nuxt-link class="hover:underline text-indigo-600" to="/a/devis/${dr.d_devis_id}" > Voir </nuxt-link>
            </div>`,
            notif_dest_pr_id:ann_pr.pr_id,
            notif_motif:'devis-response',
            notif_title:'Réponse de demande de devis',
            notif_id_object:dr.d_devis_id
        }

        await Data.set('notification',n)

        //Notification push
        req.io.emit('new-notif-'+ann_pr.pr_id,{
            t:"Réponse demande de devis",
            c:"Vous avez réçu une réponse de demande de devis",
            e:false
        })

        return res.send({status:true})

    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Récupération des données devis côté annonceur

router.get('/ann',async (req,res)=>{
    let Data = require('../models/data')
    try {
        let sql = `select d.*,p.pan_publoc_ref from devis_request as d left join panneau as p on p.pan_id = d.d_devis_pan_id 
        order by d_devis_response asc, d_devis_date desc`
        const devis  = await Data.exec(sql)

        return res.send({status:true,devis} )

    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Supression de devis de la part de l'annonceur
router.delete('/ann/:id',async (req,res)=>{
    let Data = require('../models/data')

    try {
        let id = parseInt(req.params.id)

        //Suppression des notifications concernant le devis
        await Data.del('notification',{notif_id_object:id})

        //Suppression du devis
        await Data.del('devis_request',{d_devis_id:id})

        return res.send({status:true} )

    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})


//Exportation
module.exports = router