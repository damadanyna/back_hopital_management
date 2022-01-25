let router = require('express').Router()
const bcrypt = require('bcrypt');
const { now } = require('moment');


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});


router.get('/count',(req,res)=> {
    let Annonceur = require('../models/annonceur')

    Annonceur.count((err,result)=>{
        if(err){
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }else{
            return res.send({status:true,nb:result[0].nb})
        }
    })
})



router.get('/',(req,res)=> {
    let Annonceur = require('../models/annonceur')

    Annonceur.all((err,result)=>{
        if(err){
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }else{
            return res.send({status:true,annonceurs:result})
        }
    })
})



router.post('/',async (req,res)=>{
    let Annonceur = require('../models/annonceur')
    let ar = req.body

    let data_r = ['society','adresse','email_soc','nif','stat','login','pass','c_pass']
    let data_e = ['society','adresse','login','pass']


    data_r.forEach( function(e, index) {
        if(ar[e] == undefined){
            return res.send({status:false,message:"Erreur de donnée en Entrée"})
        }
    });

    data_e.forEach((e,i)=>{
        if(ar[e] == ''){
            return res.send({status:false,message:"Champs obligatoire vide"})
        }
    })

    if(ar.c_pass != '' && ar.pass != ''){
        if(ar.c_pass != ar.pass){
            return res.send({status:false,message:"Les 2 mots de passes sont différents"})
        }
    }

    let soc_pr = {
        soc_pr_label:ar.society,
        soc_pr_adresse:ar.adresse,
        soc_pr_nif: ( ar.nif.trim() == '' )?null:ar.nif.trim(),
        soc_pr_stat:( ar.stat.trim() == '' )?null:ar.stat.trim(),
        soc_pr_email:( ar.email_soc.trim() == '' )?null:ar.email_soc.trim(),
    }


    let Profil = require('../models/profil')
    try {
        //Insertion du profil de la société
        const soc_res = await Profil.addSocProfil(soc_pr)

        //Insertion profil utilisateur de la société
        const pass = await new Promise((resolve,reject)=>{
            bcrypt.hash(ar.pass, 10, function(err, hash) {
                if (err) reject(err)
                resolve(hash)
            });
        })


        let pr = {
            pr_pass:pass,
            pr_login:ar.login,
            pr_type:'ann',
            pr_change_pass:1,
        }


        const pr_res = await Profil.addUserProfil(pr)

        let ann = {
            ann_label:ar.society,
            soc_pr_id:soc_res.insertId,
            pr_id:pr_res.insertId,
            ann_is_agence_com:(ar.agence_com != undefined)?ar.agence_com:null
        }
        const ann_res = await Annonceur.add(ann)
        return res.send({status:true,id:ann_res.insertId})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }

})

//Modification annonceur
router.put('/:id',async (req,res)=>{
    let Annonceur = require('../models/annonceur')
    let ar_brut = req.body

    let ar = {}
    let p = {}

    let list_soc_pr = ['soc_pr_label','soc_pr_adresse','soc_pr_nif','soc_pr_stat','soc_pr_email']
    let list_pr = ['pr_login','pr_pass']

    //return res.send({status:false,id:ar_brut})

    list_soc_pr.forEach(e => {
        ar[e] = ar_brut[e]
    })

    list_pr.forEach(e => {
        p[e] = ar_brut[e]
    })

    //return res.send({status:false,p:p,ar:ar})

    if(p.pr_login == ''){
        return res.send({status:false,message:"Informations de connexion vide !"})
    }

    let soc_pr = {
        soc_pr_label:ar.soc_pr_label,
        soc_pr_adresse:ar.soc_pr_adresse,
        soc_pr_nif: ( ar.soc_pr_nif == null || ar.soc_pr_nif.trim() == '' )?null:ar.soc_pr_nif.trim(),
        soc_pr_stat:( ar.soc_pr_stat == null || ar.soc_pr_stat.trim() == '' )?null:ar.soc_pr_stat.trim(),
        soc_pr_email:( ar.soc_pr_email == null || ar.soc_pr_email.trim() == '' )?null:ar.soc_pr_email.trim(),
    }

    let Profil = require('../models/profil')
    try {
        //Insertion du profil de la société
        const soc_res = await Profil.updateSocProfil(ar_brut.soc_pr_id,soc_pr).catch(e =>{
            return res.send({status:false,message:"Erreur dans la base de donnée [Mise à our profil société]"})
        })


        //Mise à jour profil
        //Insertion profil utilisateur de la société
        const pass = await new Promise((resolve,reject)=>{
            bcrypt.hash(p.pr_pass, 10, function(err, hash) {
                if (err) reject(err)
                resolve(hash)
            });
        })

        let pr = {
            pr_login:p.pr_login,
            pr_change_pass:1
        }

        if(p.pr_pass != ''){
            pr.pr_pass = pass
        }


        const pr_res = await Profil.updateUserProfil(ar_brut.ann_pr_id,pr)

        // console.log(ar_brut)

        let ann = {
            ann_label:ar.soc_pr_label,
            ann_is_agence_com:(ar_brut.ann_is_agence_com)?1:0
        }

        console.log(ann)
        const a = await Annonceur.update(req.params.id,ann)

        return res.send({status:true})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur de base de donnée"})
    }

})

// Manipulation côté espace annonceur
router.get('/p/reservation',async (req,res)=>{
    let Annonceur = require('../models/annonceur')

    try {
        const r = await Annonceur.getListReservation(req.user.pr_id)
        return res.send({status:true,reservation:r})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur pendant l'Affichage de cette page"})
    }
})

router.get('/p/panel',async (req,res)=>{
    let Annonceur = require('../models/annonceur')

    if(req.user.pr_type != 'ann'){
        return res.send({status:false,message:"Autorisation non suffisante."})
    }

    try {
        const r = await Annonceur.getListPanel(req.user.pr_id)
        return res.send({status:true,panels:r})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur pendant l'Affichage de cette page"})
    }
})

router.get('/p/panel/:id',async (req,res)=>{
    let Annonceur = require('../models/annonceur')
    if(req.user.pr_type != 'ann'){
        return res.send({status:false,message:"Autorisation non suffisante."})
    }

    let id = parseInt(req.params.id)
    if(id.toString() == 'NaN'){
        return res.send({status:false,message:"Erreur de donnée en entrée"})
    }

    try {
        const r = await Annonceur.getPanel(id)
        if(r.length == 0){
            console.log('Vide')
            return res.send({status:false,message:"Panneau inexistant"})
        }
        return res.send({status:true,panel:r[0]})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur pendant l'Affichage de cette page"})
    }
})

router.post('/reservation',async (req,res)=>{
    let Annonceur = require('../models/annonceur')
    let Panel = require('../models/panel')
    let Regisseur = require('../models/regisseur')
    
    let d = req.body
    let t = ['date_debut','date_fin','pan_id']

    for(let i = 0;i<t.length;i++){
        if(d[t[i]] === undefined){
            return res.send({status:false,message:"Erreur de donnée en Entrée"})
        }
    }

    for(let i = 0;i<t.length;i++){
        if(d[t[i]] == ''){
            return res.send({status:false,message:"Champs obligatoire vide."})
        }
    }

    //Construction de l'objet reservation
    let state = "debut"
    let panel = {}
    let reg = {}
    let ann = {}
    try {
        //Récupération de l'information du panneau
        const res_pan_0 = await Panel.getById(d.pan_id)

        if(res_pan_0.length>0){
            panel = res_pan_0[0]
        }else{
            return res.send({status:false,message:"Panneau Inexistant. Il est possible que le panneau a été supprimer."})
        }

        //Récupération des infos du regisseur
        const res_reg = await Regisseur.getProfilByPan(d.pan_id)
        if(res_reg.length>0 && res_reg[0].pr_id != null){
            reg = res_reg[0]
        }else{
            return res.send({status:false,message:"Le panneau n'a pas encore de Regisseur."})
        }

        //Construction de l'objet reservation
        let now = new Date()
        let pan_loc = {
            pan_id:d.pan_id,
            pr_id:req.user.pr_id,
            pan_loc_date_debut:d.date_debut,
            pan_loc_date_fin:d.date_fin,
            pan_loc_reservation_date:new Date()
        }

        state = "insertion-location"
        const res_pl = await Annonceur.insertPanLocation(pan_loc)

        state = "update-panneau"
        await Annonceur.setPanLocated(d.pan_id)

        //Récupération d'info sur l'annonceur
        const ann_res = await Annonceur.getByIdProfil(req.user.pr_id)
        ann = ann_res[0]
        //Insertion de la notification
        state = "insertion-notification"
        let notif = {
            notif_exp_pr_id:req.user.pr_id,
            notif_motif:'reservation',
            notif_id_object:res_pl.insertId,
            notif_title:"Demande de Location"
        }

        let Notif = require('../models/notif')

        state = 'insertion-notif-regisseur'
        notif.notif_desc = "<div>Un annonceur "+
        " vient de faire une une demande de location pour votre panneau <nuxt-link class='bt text-sm mx-1' to='/panneau/"+panel.pan_id+"'>"+panel.pan_ref+"</nuxt-link> </div>"
        notif.notif_dest_pr_id = reg.pr_id
        
        
        await Notif.set(notif)

        state = 'insertion-notif-admin'
        notif.notif_dest_pr_id = null
        notif.notif_desc = "<div>L'Annonceur <nuxt-link class='bt text-sm mx-1' to='/admin/annonceur/"+ann.ann_id+"'>"+ann.ann_label+"</nuxt-link> "+
        " vient de faire une réservation du panneau <nuxt-link class='bt text-sm mx-1' to='/admin/panneau/"+panel.pan_id+"'>"+panel.pan_ref+"</nuxt-link> </div>"
        notif.notif_type = "a"
        await Notif.set(notif)

        return res.send({status:true})
    } catch (e) {
        console.log("Erreur insertion reservation, state : "+state)
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée",state:state})
    }
})




router.get('/profil',async (req,res)=>{
    let Annonceur = require('../models/annonceur')

    if(req.user.pr_type != 'ann'){
        return res.send({status:false,message:"Autorisation non suffisante"})
    }
    try {
        const result = await Annonceur.getByIdProfil(req.user.pr_id)
        console.log(result)
        return res.send({status:true,annonceur:result[0]})
        // return res.send({st:"Mais merde"})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur de la base de donnée."})
    }
})

router.get('/notif',async (req,res)=>{
    let Notif = require('../models/notif')

    try {
        const n_res = await Notif.getNotifByDestId(req.user.pr_id)
        return res.send({status:true,notifs:n_res})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})
//Récupération
router.get('/:id',async (req,res)=>{
    let Annonceur = require('../models/annonceur')

    let id = parseInt(req.params.id)

    if(id.toString() == 'NaN'){
        return res.send({status:false,message:"Erreur de donnée en Entrée"})
    }
    try {
        const result = await Annonceur.getById(id)
        return res.send({status:true,annonceur:result[0]})
        // return res.send({st:"Mais merde"})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur de la base de donnée."})
    }
})



module.exports = router