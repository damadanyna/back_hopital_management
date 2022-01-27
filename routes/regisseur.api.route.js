let router = require('express').Router()
const bcrypt = require('bcrypt');
const connection = require('../config/db');
const { route } = require('./p.panel.api.route');


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});

router.get('/count',(req,res)=> {
    let Regisseur = require('../models/regisseur')

    Regisseur.count((err,result)=>{
        if(err){
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }else{
            return res.send({status:true,nb:result[0].nb})
        }
    })
})




router.get('/',(req,res)=> {
    let Regisseur = require('../models/regisseur')

    Regisseur.all((err,result)=>{
        if(err){
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }else{
            return res.send({status:true,regisseurs:result})
        }
    })
})

router.post('/',async (req,res)=>{
    let Regisseur = require('../models/regisseur')
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
    //Insertion du profil de la société
    const soc_res = await Profil.addSocProfil(soc_pr).catch(e =>{
        return res.send({status:false,message:"Erreur dans la base de donnée [Insertion profil société]"})
    })

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
        pr_type:'reg',
        pr_change_pass:1
    }


    const pr_res = await Profil.addUserProfil(pr).catch(e =>{
        return res.send({status:false,message:"Erreur dans la base de donnée [Insertion profil Utilisateur]"})
    })

    let reg = {
        reg_label:ar.society,
        soc_pr_id:soc_res.insertId,
        pr_id:pr_res.insertId
    }



    const reg_res = await Regisseur.add(reg).catch(e =>{
        return res.send({status:false,message:"Erreur dans la base de donnée [Insertion Regisseur]"})
    })

    return res.send({status:true,id:reg_res.insertId})

})

//Modification annonceur
router.put('/:id',async (req,res)=>{
    let Regisseur = require('../models/regisseur')
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
    //Insertion du profil de la société
    try{
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
    
        const pr_res = await Profil.updateUserProfil(ar_brut.reg_pr_id,pr)
    
        let reg = {
            reg_label:ar.soc_pr_label
        }

        const a = await Regisseur.update(req.params.id,reg)

        return res.send({status:true})
    }catch(e){
        console.log(e)
        return res.send({status:false,message:"Erreur de la base de donnée."})
    }

})


router.get('/profil',async (req,res)=>{
    let Regisseur = require('../models/regisseur')

    if(req.user.pr_type != 'reg'){
        return res.send({status:false,message:"Autorisation non suffisante"})
    }
    try {
        const result = await Regisseur.getByIdProfil(req.user.pr_id)
        return res.send({status:true,regisseur:result[0]})
        // return res.send({st:"Mais merde"})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur de la base de donnée."})
    }
})

router.get('/ann',async (req,res)=>{
    let Regisseur = require('../models/regisseur')
    if(req.user.pr_type != 'reg'){
        return res.send({status:false,message:"Autorisation non suffisante"})
    }
    
    try {
        const ann = await Regisseur.getListAnn(req.user.pr_id)
        return res.send({status:true,annonceurs:ann})

    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//récupération des notificatioins du régisseur
router.get('/notifs',async(req,res)=>{
    let Notif = require('../models/notif')
    if(req.user.pr_type != 'reg'){
        return res.send({status:false,message:"Autorisation non suffisante"})
    }

    try {
        const n = await Notif.getNotifByDestId(req.user.pr_id)
        return res.send({status:true,notifs:n})

    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//suppression du notif du régisseur
router.delete('/notifs/:id',async(req,res)=>{
    let Notif = require('../models/notif')
    if(req.user.pr_type != 'reg'){
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
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Récupération de la liste des panneaux du régisseur
router.get('/panel',async (req,res)=>{
    let Panel = require('../models/panel')

    if(req.user.pr_type != 'reg'){
        return res.send({status:false,message:"Autorisation non suffisante"})
    }

    try {
        //Récupération du régisseur actuel 
        let Profil = require ('../models/profil')
        const reg = await Profil.getRegByProfil(req.user.pr_id)
        if(reg.length == 0){
            return res.send({status:false,message:"Aucun profil trouver. Il est possible que votre compte a été supprimeé ou bloqué"})
        }

        const p = await Panel.getListByReg(reg[0].reg_id)

        return res.send({status:true,panels:p})
        
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Récupération d'un seul panneau pour la visulaisation côté régisseur
//Récupération d'un panneau pour la viewPanel
router.get('/panel/:id',async (req,res)=>{
    let Panel = require('./../models/panel')
    let id = parseInt(req.params.id)
    if(id.toString() == 'NaN'){
        return res.send({status:false,message:'Erreur de donnée en Entrée.'})
    }

    try {
        const p_res = await Panel.getById(id)
        let image_list = []
        if(p_res[0].pan_list_photo != null){
            const ims = await require('../models/File').getInP(p_res[0].pan_list_photo.split(',').map(x => parseInt(x)) )
            image_list = ims
        }
        return res.send({status:true,panel:p_res[0],image_list:image_list})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:'Erreur dans la base de donnée'})
    }

})

//Ajout d'un panneau par un régisseur
router.post('/panel',async(req,res)=>{
    let Regisseur = require('../models/regisseur')

    if(req.user.pr_type != 'reg'){
        return res.send({status:false,message:"Autorisation non suffisante"})
    }

    let Panel = require('./../models/panel')
    let Profil = require('./../models/profil')

    //Récupération de l'id du régisseur
    const reg_r = await Profil.getRegByProfil(req.user.pr_id)

    if(reg_r.length == 0){
        return res.send({status:false,message:"Aucun profil trouvé ou votre profil a été désactivé."})
    }

    let d = req.body
    let pan = ['reg_id','cat_id','image_id','pan_surface','pan_ref','pan_num_quittance','pan_description','pan_support','pan_lumineux']
    let lieu = ['lieu_pays','lieu_ville','lieu_quartier','lieu_region','lieu_label','lieu_lat','lieu_lng']

    if(d.pan_ref == ''){
        return res.send({status:false,message:"Un panneau doit voir une référence"})
    }
    

    let p = {}
    //Insertion panneau
    for(let i = 0;i<pan.length;i++){
        if(d[pan[i]] == undefined){
            return res.send({status:false,message:"Erreur des données entrées",data:pan[i]})
        }
        p[pan[i]] = (d[pan[i]] === '')?null:d[pan[i]] 
    }

    let l = {}
    //Inertion Lieu
    for(let i = 0;i<lieu.length;i++){
        if(d[lieu[i]] === undefined){
            return res.send({status:false,message:"Erreur des données entrées",data:lieu[i]})
        }

        if(d[lieu[i]] == ''){
            return res.send({status:false,message:"La partie lieu est obligatoire. Vous pouvez l'ajouter par carte.",data:lieu[i]})
        }

        l[lieu[i]] = (d[lieu[i]] == '')?null:d[lieu[i]] 
    }

    if(d.pan_list_photo.length > 0){
        p.pan_list_photo = d.pan_list_photo.join(',')
        await require('../models/File').setUseFile(d.pan_list_photo)
        p.image_id = d.pan_list_photo[0]
    }

    //Insertion dans la base avec un try catch
    try {
        const lieu_res = await Panel.addLieu(l)

        p.pan_validation = 0
        p.pan_state = 1
        p.lieu_id = lieu_res.insertId

        p.reg_id = reg_r[0].reg_id
        p.pan_add_by_reg = 1

        //Insertion du Panneau
        const pan_res = await Panel.add(p)


        let no = {
            id_pr:req.user.pr_id,
            id_object:pan_res.insertId,
            reg_id:p.reg_id,
            reg_label:reg_r[0].reg_label,
            pan_ref:p.pan_ref
        }

        notifToAddPanel(no)

        req.io.emit('new-notif-ad',{t:"Ajout d'un panneau",c:"Le régisseur "+reg_r[0].reg_label+" vient d'ajouter un panneau.",e:false})

        //Insertion d'une notification pour l'Admin
        return res.send({status:true,id:pan_res.insertId})

    } catch (e) {
        console.log(e)
        return res.send({status:false,message:'Erreur dans la base de donnée.'})
    }
})


async function notifToAddPanel(p){
    let Notif = require('../models/notif')
    let d = "<div>"
    d+="Le régisseur <nuxt-link to='/admin/regisseur/"+p.reg_id+"' class='text-indigo-600' > <span v-html='\" "+ p.reg_label +" \"'></span> </nuxt-link> "
    d+=" vient d'ajouter le panneau "
    d+="<nuxt-link to='/admin/panneau/"+p.id_object+"' class='text-indigo-600' > <span v-html='\" "+ p.pan_ref +" \"'></span> </nuxt-link>"
    d+="</div>"
    let n = {
        notif_exp_pr_id:p.id_pr,
        notif_id_object:p.id_object,
        notif_title:"Ajout d'un panneau",
        notif_motif:"ajout-panneau",
        notif_type:'a',
        notif_data:'regisseur',
        notif_desc:d
    }
    await Notif.set(n)
}


//Modification en detail du profil
router.put('/profil/det/:id',async (req,res)=>{
    if(req.user.pr_type != 'reg'){
        return res.send({status:false,message:"Autorisation non suffisante"})
    }

    let data = req.body

    let soc_p_d = ['soc_pr_email','soc_pr_nif','soc_pr_stat','soc_pr_label','soc_pr_adresse']
    let pr_d = ['pr_login','file_profil']

    try {
        //Récupération des informations du régisseur en question
        const r = await require('../models/regisseur').getByIdProfil(req.user.pr_id)
        let reg = {}
        if(r.length > 0 ){
            reg = r[0]
            for(let i=0;i<soc_p_d.length;i++){
                if(soc_p_d[i] == data.key){
                    await require('../models/data').updateWhere('soc_profil',
                    JSON.parse('{"'+soc_p_d[i]+'":"'+data.value+'"}'),{'soc_pr_id':reg.soc_pr_id})

                    if(data.key == 'soc_pr_label'){
                        await require('../models/data').updateWhere('regisseur',
                            {'reg_label':data.value} ,{'reg_id':reg.reg_id})
                    }
                    return res.send({status:true})
                }
            }

            //Pour le profil
            for(let i=0;i<soc_p_d.length;i++){
                if(pr_d[i] == data.key){
                    await require('../models/data').updateWhere('profil',
                    JSON.parse('{"'+pr_d[i]+'":"'+data.value+'"}'),{'pr_id':reg.pr_id})

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
        console.log(e)
        return res.send({status:false,message:'Erreur dans la base de donnée.'})
    }
})

router.post('/tarif',async (req,res)=>{
    if(req.user.pr_type != 'reg'){
        return res.send({status:false,message:"Autorisation non suffisante"})
    }

    let Regisseur = require('../models/regisseur')

    let d = req.body

    let list_p = ['tarif_min_month','tarif_service','tarif_type','tarif_prix','cat_id','tarif_pan_dimension']

    for(let i=0;i<list_p.length;i++){
        if(d[list_p[i]] === undefined){
            return res.send({status:false,message:"Erreur de donnée en Entrée"})
        }
    }

    //--------------
    if(parseInt(d.tarif_min_month) < 1){
        return res.send({status:false,message:"La durée minimale d'une location est de 1 mois"})
    }

    if(d.tarif_service == ''){
        return res.send({status:false,message:"Vous devez specifier un type de Service"})
    }
    let prix = parseInt(d.tarif_prix)
    if(prix.toString() == 'NaN' || prix < 0){
        return res.send({status:false,message:"Erreur de donnée pour le prix"})
    }

    //insertion de service
    try {
        const serv = await Regisseur.insertServ({pan_serv_label:d.tarif_service})

        let tarif = {
            tarif_pr_id:req.user.pr_id,
            service_id:serv.insertId,
            cat_id:d.cat_id,
            tarif_type:d.tarif_type,
            tarif_min_month:d.tarif_min_month,
            tarif_pan_dimension:d.tarif_pan_dimension,
            tarif_prix:parseInt(d.tarif_prix)
        }

        const t = await Regisseur.insertTarif(tarif)

        const nbp = await Regisseur.getNbPanelTarif([tarif.tarif_pan_dimension,tarif.cat_id,req.user.pr_i])

        tarif.tarif_id = t.insertId
        tarif.nbPanel = nbp[0].nb
        return res.send({status:true,tarif:tarif})

    } catch (e) {
        console.log(e)
        return res.send({status:false,message:'Erreur dans la base de donnée.'})
    }
})

router.get('/tarif',async (req,res)=>{
    if(req.user.pr_type != 'reg'){
        return res.send({status:false,message:"Autorisation non suffisante"})
    }

    let Reg = require('../models/regisseur')

    try {
        const tarif = await Reg.getTarifListByProfil(req.user.pr_id)

        return res.send({status:true,tarifs:tarif})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:'Erreur dans la base de donnée.'})
    }
})



//Get d'un rrégisseur
router.get('/:id',async (req,res)=>{
    let Regisseur = require('../models/regisseur')

    let id = parseInt(req.params.id)

    if(id.toString() == 'NaN'){
        return res.send({status:false,message:"Erreur de donnée en Entrée"})
    }

    try {
        const r = await Regisseur.getById(id)
        return res.send({status:true,regisseur:r[0]})
    } catch (e) {
        console.log(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

module.exports = router