let router = require('express').Router()
const bcrypt = require('bcrypt');
const { now } = require('moment');


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});

//Récupéraion des catégories qui sont à l'annonceur actuel
router.get('/cat/:id_ann',async (req,res)=>{
    let D = require('../models/data')
    try {
        let sql = `select c.cat_id,c.cat_label from category c
        left join panneau p on p.cat_id = c.cat_id where parent_cat_id is null`

        let cat_list = await D.exec_params(sql,req.params.id_ann)

        return res.send({status:true,cat_list})

    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Poste de devis
router.post('/devis',async (req,res)=>{

    let d = req.body
    try {
        const ann = (await require('../models/annonceur').getByIdProfil(req.user.pr_id))[0]
        let devis = {
            d_devis_pan_id:d.pan_id,
            d_devis_ann_id:ann.ann_id,
            d_devis_month:d.month,
            d_devis_date_debut:new Date(d.date_debut)
        }

        let d_id = (await require('../models/data').set('devis_request',devis)).insertId


        //Gestion des notifications
        req.io.emit('new-notif-ad',{
            t:"Demande de devis",
            c:"Un annonceur vient de faire une demande de devis",
            e:false
        })

        //Récupération de infos pour la notification
        const p  = (await require('../models/panel').getById(d.pan_id))[0]

        //Insertion de notifications
        let n = {
            notif_desc:`<div> L'annonceur <nuxt-link class="text-indigo-600" to="/admin/annonceur/${ann.ann_id}"> ${ann.ann_label} </nuxt-link> vient de faire une demande de devis sur le panneau
              <nuxt-link class="text-indigo-600" to="/admin/panneau/${p.pan_id}" > ${p.pan_ref} </nuxt-link>. </div>`,
           
            notif_type:'a',
            notif_motif:'demande-devis',
            notif_title:"Demande de devis",
            notif_id_object:d_id
        }

        //Insertion de la notification
        await require('../models/notif').set(n)

        //-------------------------------
        return res.send({status:true})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

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

//Récupération des annonceurs sauf l'annonceur actuel
router.get('/other',async (req,res)=>{
    if(req.user.pr_type != 'ann') return res.send({status:false,message:"Erreur d'autorisation"})
    let s = (req.query.search === undefined)?'':req.query.search
    s = (s == '')?'':s+'%'
    try {
        const ann = await require('../models/annonceur').getByIdProfil(req.user.pr_id)
        const al = await require('../models/annonceur').getListLikeWhereNot(s,[ann[0].ann_id])

        return res.send({status:true,list:al})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Rcupération des statistiques pour l'annonceur
router.get('/sous-ann/stats',async (req,res)=>{
    try {
        const ann = await require('../models/annonceur').getByIdProfil(req.user.pr_id)
        const pa = await require('../models/annonceur').getListPanSousAnnById(ann[0].ann_id)
        return res.send({status:true,list:pa})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Création d'une location de sous-annonceur
router.post('/sous-ann/location',async (req,res)=>{
    let d = req.body
    try {
        let ann = (await require('../models/annonceur').getByIdProfil(req.user.pr_id))[0]

        let saloc = {
            saloc_ann_id:ann.ann_id,
            saloc_sous_ann_id:d.saloc_sous_ann_id,
            saloc_pan_id:d.saloc_pan_id,
            saloc_month:d.saloc_month,
            saloc_date_debut:d.saloc_date_debut,
            saloc_date_validation:new Date()
        }

        await require('../models/data').updateWhere('panneau',{sous_ann_id:d.saloc_sous_ann_id},{pan_id:d.saloc_pan_id})
        await require('../models/data').set('sous_ann_location',saloc)

        return res.send({status:true})

    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Suppression d'une location de d'annonceur
router.delete('/sous-ann/location/:id',async (req,res)=>{
    let id = parseInt(req.params.id)
    if(id.toString() == 'NaN'){
        return res.send({status:false,message:"Erreur de donnée en entrée"})
    }

    try {

        let sal = (await require('../models/panel').getSousAnnLocById(id))[0]
        await require('../models/data').del('sous_ann_location',{saloc_id:id})
        await require('../models/data').updateWhere('panneau',{sous_ann_id:null},{pan_id:sal.saloc_pan_id})
        return res.send({status:true})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})
//Récupérations si l'annonceur est une agence de com ou pas 
router.get('/socprofil/all',async (req,res)=>{
    try {
        const a = await require('../models/annonceur').getSocByIdProfil(req.user.pr_id)
        return res.send({status:true,a:a[0]})
    }catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

router.get('/locations',async (req,res)=>{
    let Panel = require('../models/panel')
    let type = req.query.type

    try {
        if(type == 'all'){
            const l = await Panel.getAllLocations()
            return res.send({status:true,locations:l})
        }else{
            const l = await Panel.getAllLocationsBy(parseInt(type))
            return res.send({status:true,locations:l})
        }
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})
//Suppresion d'un réservation
router.delete('/location/:id',async (req,res)=>{
    let Panel = require('../models/panel')
    try {
        const l = await Panel.getLocationById(req.params.id)
        if(l.length > 0){
            let loc = l[0]

            //Suppression de la réservation
            await require('../models/data').del('pan_location',{pan_loc_id:req.params.id})

            //Suppression des sous-locations avec le panneau
            await require('../models/data').del('sous_ann_location',{saloc_pan_id:loc.pan_id})

            //Modification du panneau 
            await require('../models/data').updateWhere('panneau',{pan_state:1,ann_id:null,sous_ann_id:null},{pan_id:loc.pan_id})

            //Récupération de l'annonceur
            let an = (await require('../models/annonceur').getByIdProfil(req.user.pr_id))[0]


            //Notification
            let n = {
                notif_desc:`<div>L'Annonceur <nuxt-link class='underline' to='/admin/annonceur/${an.ann_id}' >${an.ann_label}</nuxt-link> 
                a annulé sa réservation sur le panneau <nuxt-link class='underline' to='/admin/panneau/${loc.pan_id}}'> ${loc.pan_ref} </nuxt-link> </div> `,
                notif_type:'a',
                notif_motif:'del-location',
                notif_title:`Annulation d'une réservation.`
            }

            await require('../models/notif').set(n)

            return res.send({status:true})
        }else{
            return res.send({status:false,message:'Il est possible que cette location a été déjà supprimée.'})
        }
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})
router.get('/location/:id',async (req,res)=>{
    let Panel = require('../models/panel')
    let id = req.params.id

    try {
        const l = await Panel.getLocationById(id)
        if(l.length == 0){
            return res.send({status:false,message:"Il est possible que l'objet n'existe plus."})
        }
        return res.send({status:true,location:l[0]})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})


router.get('/',async (req,res)=> {
    let Annonceur = require('../models/annonceur')

    try {
        const a = await Annonceur.getAll()
        return res.send({status:true,annonceurs:a})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
    // Annonceur.all((err,result)=>{
    //     if(err){
    //         return res.send({status:false,message:"Erreur dans la base de donnée"})
    //     }else{
    //         return res.send({status:true,annonceurs:result})
    //     }
    // })
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
        console.error(e)
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
    let D = require('../models/data')

    if(req.user.pr_type != 'ann'){
        return res.send({status:false,message:"Autorisation non suffisante."})
    }



    try {

        let d = req.query

        let w = {
            s:'',
            t:''
        }

        //LEs querys
        if(d.by == 'lieu'){
            w.s = 'l.lieu_label like ? '
            w.t = `%${d.search}%`
        }else if(d.by == 'ref'){
            w.s = 'p.pan_publoc_ref like ?'
            w.t = `%${d.search}%`
        }

        const ann = await Annonceur.getByIdProfil(req.user.pr_id)
        let sql = `select p.pan_id, p.pan_publoc_ref, p.sous_ann_id,p.ann_id as panel_ann_id, p.pan_solarpro_access,
            pl.pan_loc_validate,pl.pan_loc_id,pl.pan_loc_date_debut, pl.pan_loc_month,pl.pan_loc_date_fin,
            sal.*
            ,l.*,f.name_file,f.name_min_file from panneau  p 
            left join pan_location as pl on pl.pan_id = p.pan_id 
            left join lieu as l on l.lieu_id = p.lieu_id 
            left join file as f on f.file_id = p.image_id 
            left join sous_ann_location as sal on p.pan_id = sal.saloc_pan_id 
            where (p.ann_id = ? or p.sous_ann_id = ?) and ${w.s} `

        // const r = await require('../models/panel').getListByAnn(ann[0].ann_id)
        let ann_id = ann[0].ann_id
        let panels = await require('../models/data').exec_params(sql,[ann_id,ann_id,w.t])

        //Récupération du pub verrtical dans l'annonceur
        
        let pub = await D.exec_params(`select * from pub_im where pub_type = ? `,'ann_vert')
        let p_im_list = []
        if(pub.length > 0){
            pub = pub[0]

            p_im_list = await D.exec_params(`select dimension_file,dimension_min_file,
            name_min_file,name_file from file where file_id in (?)`,[pub.pub_im_list.split(',')])
        }

        return res.send({status:true,panels,ann_id:ann[0].ann_id,p_im_list})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur pendant l'Affichage de cette page"})
    }
})

router.get('/p/panel/:id',async (req,res)=>{
    let Annonceur = require('../models/annonceur')
    let D =  require('../models/data')

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
        let panel = r[0]

        //Les images dispo
        let image_list = []
        if(panel.pan_list_photo){
            const ims = await require('../models/File').getInP(panel.pan_list_photo.split(',').map(x => parseInt(x)) )
            image_list = ims
        }

        //Les images de poses, disponible que quand il y a location
        let image_list_pose = []
        if(panel.pan_list_photo_pose){
            image_list_pose = await require('../models/File').getInP( panel.pan_list_photo_pose.split(',').map(x => parseInt(x)) )
        }

        //Les images de solapro, disponible que quand il y a location
        let image_list_solarpro = []
        if(panel.pan_list_photo_solarpro){
            image_list_solarpro = await require('../models/File').getInP( panel.pan_list_photo_solarpro.split(',').map(x => parseInt(x)) )
        }

        //Récupération des informations solarpro si illuminé
        //On va vérifier si le panneau a un lien avec solarpro
        let spp = await require('../models/data').exec_params(`select spp_date_debut,spp_date_fin,spp_date_control,spp_nb_light
        from solarpro_pan where spp_pan_id = ?`,id)

        spp = (spp[0])?spp[0]:null

        //Gestion sous location
        if(panel.sous_ann_id){
            panel.reg_label = panel.ann_label
            //récupération d'information de sous-location
            let d = await D.exec_params('select * from sous_ann_location where saloc_sous_ann_id = ?',panel.sous_ann_id)

            if(d.length > 0){
                d = d[0]

                panel.pan_loc_date_debut = d.saloc_date_debut
                panel.pan_loc_month = d.saloc_month
            }

        }

        //Provisoirement
        panel.reg_label = null

        return res.send({status:true,panel,image_list,image_list_pose,image_list_solarpro,spp})
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
    let t = ['date_debut','pan_id','month','service_id']

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

    let month = parseInt(d.month)
    if(month.toString() == 'NaN' || month < 1){
        return res.send({status:false,message:"Le nombre de mois doit être supérieur à 1 "})
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
            reg = null
            // return res.send({status:false,message:"Le panneau n'a pas encore de Regisseur."})
        }

        //Récupération d'info sur l'annonceur
        //return res.send({status:false,messgae:"sdfqsdf",e:req.user})
        //-------------------------------
        const ann_res = await Annonceur.getByIdProfil(req.user.pr_id)
        ann = ann_res[0]

        

        //Construction de l'objet reservation
        let now = new Date()
        let pan_loc = {
            pan_id:d.pan_id,
            ann_id:ann.ann_id,
            reg_id:(reg)?reg.reg_id:reg,
            pan_loc_month:d.month,
            pr_id:req.user.pr_id,
            pan_loc_date_debut:d.date_debut,
            pan_loc_tarif_id:d.tarif_id,
            pan_loc_service_id:d.service_id,
            pan_loc_reservation_date:new Date()
        }

        state = "insertion-location"
        const res_pl = await Annonceur.insertPanLocation(pan_loc)

        state = "update-panneau"
        await require('../models/data').updateWhere('panneau',{pan_state:2},{pan_id:d.pan_id})

        
        //Insertion de la notification
        state = "insertion-notification"
        let notif = {
            notif_exp_pr_id:req.user.pr_id,
            notif_motif:'reservation',
            notif_id_object:res_pl.insertId,
            notif_title:"Demande de Location"
        }

        let Notif = require('../models/notif')

        if(panel.pan_gold){
            state = 'insertion-notif-regisseur'
            notif.notif_desc = "<div>Un annonceur "+
            " vient de faire une une demande de location pour votre panneau <nuxt-link class='bt text-sm mx-1' to='/panneau/"+panel.pan_id+"'>"+panel.pan_ref+"</nuxt-link> </div>"
            notif.notif_dest_pr_id = reg.pr_id

            req.io.emit('new-notif-'+reg.pr_id,{
                t:"Réservation d'un panneau",
                c:"Un annonceur vient de faire une réservation pour un de de vos panneau",
                e:false
            })
            await Notif.set(notif)
        }

        state = 'insertion-notif-admin'
        notif.notif_dest_pr_id = null
        notif.notif_desc = `<div>L'annonceur <nuxt-link to='/admin/annonceur/${ann.ann_id}' class='text-indigo-600'> <span> ${req.escape_html(ann.ann_label)} </span> 
        </nuxt-link> est intéressé par le panneau  
        <nuxt-link to='/admin/panneau/${panel.pan_id}' class='text-indigo-600'> <span> ${panel.pan_ref} </span> </nuxt-link>,
         <button class='bt text-sm' to='/admin/location/${res_pl.insertId}' > Voir </button>
         </div>`
        notif.notif_type = "a"
        await Notif.set(notif)

        req.io.emit('new-notif-ad',{
            t:"Réservation d'un panneau",
            c:"Un annonceur vient de faire une réservation pour un panneau",
            e:false
        })

        return res.send({status:true})
    } catch (e) {
        console.log("Erreur insertion reservation, state : "+state)
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée",state:state,err:e.toString()})
    }
})




router.get('/profil',async (req,res)=>{
    let Annonceur = require('../models/annonceur')

    if(req.user.pr_type != 'ann'){
        return res.send({status:false,message:"Autorisation non suffisante"})
    }

    let annonceur = {}
    try {
        const result = await Annonceur.getByIdProfil(req.user.pr_id)
        if(result.length > 0) {
            annonceur = result[0]
        }else{
            console.error(req.user);
        }
        return res.send({status:true,annonceur:annonceur})
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

//Modification en detail du profil
router.put('/profil/det',async (req,res)=>{
    if(req.user.pr_type != 'ann'){
        return res.send({status:false,message:"Autorisation non suffisante"})
    }

    let data = req.body

    let soc_p_d = ['soc_pr_email','soc_pr_nif','soc_pr_stat','soc_pr_label','soc_pr_adresse']
    let pr_d = ['pr_login','file_profil']

    try {
        //Récupération des informations du régisseur en question
        const r = await require('../models/annonceur').getByIdProfil(req.user.pr_id)
        let reg = {}
        if(r.length > 0 ){
            ann = r[0]
            for(let i=0;i<soc_p_d.length;i++){
                if(soc_p_d[i] == data.key){
                    await require('../models/data').updateWhere('soc_profil',
                    JSON.parse('{"'+soc_p_d[i]+'":"'+data.value+'"}'),{'soc_pr_id':ann.soc_pr_id})

                    if(data.key == 'soc_pr_label'){
                        await require('../models/data').updateWhere('annonceur',
                            {'ann_label':data.value} ,{'ann_id':ann.ann_id})
                    }
                    return res.send({status:true})
                }
            }

            //Pour le profil
            for(let i=0;i<soc_p_d.length;i++){
                if(pr_d[i] == data.key){
                    await require('../models/data').updateWhere('profil',
                    JSON.parse('{"'+pr_d[i]+'":"'+data.value+'"}'),{'pr_id':ann.pr_id})

                    if(data.key == 'file_profil'){
                        await require('../models/data').updateWhere('file',{type_file:'use'},{file_id:data.value})
                    }
                    return res.send({status:true})
                }
            }

        }else{
            return res.send({status:false,message:"Il est possible que ce compte n'existe plus"})
        }
        
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:'Erreur dans la base de donnée.'})
    }
})

//Changement de mot de passe pour un annonceur
router.put('/profil/pass',async (req,res)=>{
    let {new_pass,old_pass} = req.body.data

    if(new_pass.trim() == ''){
        return res.send({status:false,message:"Champ nouveau mot de passe vide"})
    }

    //Récupération des infos profil de l'annonceur
    try {
        const p = await require('../models/profil').getByIdU(req.user.pr_id)
        if(p.length > 0){
            let pr = p[0]
            const is_true = await new Promise((resolve,reject)=>{
                bcrypt.compare(old_pass, pr.pr_pass, function(err, result) {
                    if(err) return reject(err)
                    resolve(result)
                });
            })

            const pass = await new Promise((resolve,reject)=>{
                bcrypt.hash(new_pass, 10, function(err, hash) {
                    if(err) return reject(err)
                    resolve(hash)
                });
            })
            
            if(is_true){
                await require('../models/data').updateWhere('profil',{pr_pass:pass},{pr_id:req.user.pr_id})
                return res.send({status:true})
            }else{
                return res.send({status:false,message:"Le mot de passe est incorrect."})
            }

        } else{
            return res.send({status:false, message:"Erreur pendant la récupération de vos informations."})
        }
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:'Erreur dans la base de donnée.'})
    }
})

//suppression du notif de l'annonceur
router.delete('/notifs/:id',async(req,res)=>{
    let Notif = require('../models/notif')
    if(req.user.pr_type != 'ann'){
        return res.send({status:false,message:"Autorisation non suffisante"})
    }

    let id  = parseInt(req.params.id)
    if(id.toString() == 'NaN'){
        return res.send({status:false,message:"Erreur de donnée en entrée."})
    }

    try {
        await Notif.deleteByProfilAndId([req.user.pr_id,id])
        return res.send({status:true})

    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})
module.exports = router