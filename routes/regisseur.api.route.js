let router = require('express').Router()
const bcrypt = require('bcrypt');
const connection = require('../config/db');
const { route } = require('./p.panel.api.route');


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});

//Suppression de location par le régisseur
router.delete('/location/:id',async (req,res)=>{
    let Data = require('../models/data')
    let id = parseInt(req.params.id)
    if(id.toString() == 'NaN'){
        return res.send({status:false,message:"Erreur de donnée en entrée"})
    }

    try {
        const Loc = require('../models/location')
        const pl = await Loc.getPanLocationById(id)
        let tmp_pl = pl[0]
        //Suppresion de la location
        await Loc.deleteLocationBy({pan_loc_id:id})

        //Modification du panneau en mode disponnible et suppression des références
        await require('../models/data').updateWhere('panneau',{pan_state:1,ann_id:null},{pan_id:tmp_pl.pan_id})

        //Envoie de notification chez l'annonceur

        //Création de notification
        

        const panel = (await Data.exec(`select * from panneau where pan_id = ${tmp_pl.pan_id} `) )[0]

        //Envoi  de notification côté annonceur
        if(tmp_pl.ann_id  != undefined){
            const ann_pr = (await Data.exec(`select * from annonceur as a 
            left join profil as p on p.pr_id = a.pr_id where a.ann_id = ${tmp_pl.ann_id}`))[0]
            let n = {
                notif_type:'ann',
                notif_desc:`<div> Votre Location sur le panneau 
                <nuxt-link class="hover:underline text-indigo-600" to="/panneau/${panel.pan_id}" > ${panel.pan_publoc_ref} </nuxt-link> a été annulé par le régisseur.
                </div>`,
                notif_dest_pr_id:ann_pr.pr_id,
                notif_motif:'del-location',
                notif_title:'Annuation de location par le Régisseur',
            }
    
            await Data.set('notification',n)
            //Notification push
            req.io.emit('new-notif-'+ann_pr.pr_id,{
                t:"Annuation de location",
                c:"Une location a été annulé par le Régisseur",
                e:false
            })
        }

        

        return res.send({status:true})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur de la base de donnée."})
    }
})

//Validation de location pour un régisseur
router.post('/location',async (req,res)=>{
    //console.log(req.body)
    let p = req.body

    try {

        const reg = await require('../models/regisseur').getByIdProfil(req.user.pr_id)

        let loc = {
            pan_loc_by_reg:1,
            reg_id:reg[0].reg_id,
            ann_id:p.ann_id,
            pan_loc_ann_label:(p.ann_id)?null:p.pan_loc_ann_label,
            pan_id:p.pan_id,
            pan_loc_date_debut:p.pan_loc_date_debut,
            pan_loc_month:p.pan_loc_month
        }

        //On détecte si le panneau existe déjà dans la location en tant que réservation
        const pl = await require('../models/location').checkPanInLocation(p.pan_id)

        if(pl.length > 0){
            let pl_t = pl[0]
            await require('../models/data').updateWhere('pan_location',loc,{pan_loc_id:pl_t.pan_loc_id})
        }else{
            await require('../models/annonceur').insertPanLocation(loc)
        }
        await require('../models/data').updateWhere('panneau',{pan_state:3},{pan_id:p.pan_id})

        return res.send({status:true})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur de la base de donnée."})
    }
})


router.get('/count',(req,res)=> {
    let Regisseur = require('../models/regisseur')

    Regisseur.count((err,result)=>{
        if(err){
            console.log(err)
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
            console.log(err)
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
        console.error(e)
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

    //Etat de panneau
    let st = {
        'dispo':1,
        'location':3,
        'indispo':4
    }

    let w = (req.query.state == 'tous')?null:{'pan_state':st[req.query.state]}

    try {
        //Récupération du régisseur actuel 
        let Profil = require ('../models/profil')
        const reg = await Profil.getRegByProfil(req.user.pr_id)
        if(reg.length == 0){
            return res.send({status:false,message:"Aucun profil trouver. Il est possible que votre compte a été supprimeé ou bloqué"})
        }

        const p = await Panel.getListByReg(reg[0].reg_id,w)

        return res.send({status:true,panels:p})
        
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Récupération d'un seul panneau pour la visualisation côté régisseur
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
    let pan = ['reg_id','cat_id','image_id','pan_surface','pan_ref','pan_num_quittance','pan_description','pan_support','pan_lumineux','pan_cu_id','pan_num_auth_cu']
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
    //Insertion Lieu
    for(let i = 0;i<lieu.length;i++){
        if(d[lieu[i]] === undefined){
            return res.send({status:false,message:"Erreur des données entrées",data:lieu[i]})
        }

        if(d[lieu[i]] == ''){
            if(lieu[i] == 'lieu_lat' || lieu[i] == 'lieu_lng'){
                return res.send({status:false,message:"Les coordonnées sont obligatoire.",data:lieu[i]})
            }
            
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
        //récupération des nombres de panneau
        const nbp = (await require('../models/data').exec('select count(*) as nbp from panneau '))[0].nbp
        if(nbp+1> 1000){
            p.pan_publoc_ref = 'PBLC-'+(nbp+1)
        }else if(nbp+1 > 100){
            p.pan_publoc_ref = 'PBLC-0'+(nbp+1)
        }else if(nbp+1> 10){
            p.pan_publoc_ref = 'PBLC-00'+(nbp+1)
        }else{
            p.pan_publoc_ref = 'PBLC-000'+(nbp+1)
        }
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

    let soc_p_d = ['soc_pr_email','soc_pr_nif','soc_pr_stat','soc_pr_label','soc_pr_adresse','soc_pr_facebook','soc_pr_linkedin','soc_pr_whatsapp',
                    'soc_pr_tel']
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

router.post('/tarif',async (req,res)=>{
    if(req.user.pr_type != 'reg'){
        return res.send({status:false,message:"Autorisation non suffisante"})
    }

    let Regisseur = require('../models/regisseur')

    let d = req.body
    let tarif_l = ['tarif_designation','cat_id','tarif_min_month']
    let service = ['serv_label','serv_tarif_prix','serv_tarif_type']

    let serv_id_list = []
    let serv = {}
    try {

        for(let i=0;i<d.services.length;i++){
            let tmp = d.services[i]
            delete tmp.id
            serv = await Regisseur.insertServ(tmp)
            serv_id_list.push(serv.insertId)
        }

        let t = d.tarif

        t.tarif_service_list = serv_id_list.join(',')
        t.tarif_pr_id = req.user.pr_id

        const ta = await Regisseur.insertTarif(d.tarif)

        return res.send({status:true})

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
        let tarifs = tarif
        let size = tarifs.length

        for(let i=0;i<size;i++){
            tarifs[i].services = await Reg.getListServIn(tarif[i].tarif_service_list.split(','))
        }

        return res.send({status:true,tarifs:tarifs})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:'Erreur dans la base de donnée.'})
    }
})


router.get('/reservation',async (req,res)=>{
    let Regisseur = require('../models/regisseur')

    if(req.user.pr_type != 'reg'){
        return res.send({status:false,message:"Autorisation non suffisante"})
    }


    let pan_archive = (req.query.state == 'finish')?1:0
    let validate = (req.query.state == 'finish' || req.query.state == 'progress')?1:0

    try {
        const r = await Regisseur.getReservationList([req.user.pr_id,pan_archive,validate])
        return res.send({status:true,res:r})
        
    } catch (e) {
        console.error(e)
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
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Récupérer la liste des choses utils lors de l'ajout de panneau côté régisseur
router.get('/panel/add/util',async (req,res)=>{
    let D = require('../models/data')
    try {

        //Pour la récupération des catégories parentes
        const c = await require('../models/category').getAllParents()

        //Récupération de la liste des comunes urbaines
        const cu = await D.exec(`select * from commune_urbaine`)

        return res.send({status:true,cat_parent:c,cu})
        
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Mettre un panneau en non dispo
router.put('/panel/:id/state',async (req,res)=>{

    let pan_state = parseInt(req.body.pan_state)
    let id = parseInt(req.params.id)

    if(pan_state.toString() == 'NaN' || id.toString() == 'NaN'){
        return res.send({status:false,message:"Erreur de donnée en entrée"})
    }

    try {
        await require('../models/data').updateWhere('panneau',{pan_state:pan_state},{pan_id:id})
        return res.send({status:true})  
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Mette un panneau visible ou invisible
//Quand il est disponible

router.put('/panel/:id/visible/:v',async (req,res)=>{
    let id = parseInt(req.params.id),
    v = parseInt(req.params.v)

    if(id.toString() == 'NaN' || v.toString() == 'NaN'){
        return res.send({status:false,message:"Erreur de donnée en entrée"})
    }

    try {
        await require('../models/panel').updateTo([ {pan_visible:v}, {pan_id:id} ])
        return res.send({status:true})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

module.exports = router