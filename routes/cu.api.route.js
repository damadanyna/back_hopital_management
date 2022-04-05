let router = require('express').Router()
let moment = require('moment')
let fs = require('fs');

const bcrypt = require('bcrypt')


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});


//Pour la récupération des communes urabaines côtés admin
router.get('/ad/all',async (req,res)=>{
    let D = require('../models/data')

    try {
        const cu = await D.exec(`select cu.*,pr.*, (select count(*) from panneau as pan where pan.pan_cu_id = cu.cu_id ) as nb_panel from commune_urbaine as cu 
        left join profil as pr on cu.pr_id = pr.pr_id`)

        return res.send({status:true,cu})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:'Erreur dans la base de donnée.',e})
    }
})

//Post de la commune urbaine côté admin
router.post('/',async (req,res)=>{
    let D = require('../models/data')
    let d = req.body
    let list_champs = ['cu_label','cu_login','cu_pass']

    //On va regarder si les champs sont bien rempli
    for (let i = 0; i < list_champs.length; i++) {
        let tmp = list_champs[i];
        if(d[tmp].trim() == '' ){
            return res.send({status:false,message:'Tous les champs sont obligatoire.'})
        }
    }
    try {
        //insertion du profil

        //Encryption du mot de passe
        let pass = await new Promise((resolve,reject)=>{
            bcrypt.hash(d.cu_pass, 10, (err, hash)=>{
                resolve(hash)
            }) 
        })

        let pr = {
            pr_login:d.cu_login,
            pr_pass:pass,
            pr_type:'cu'
        }

        const pr_a = await D.insert('profil',pr)

        //Insertion de la commune urbaine
        let cu_post = {
            cu_label:d.cu_label,
            pr_id:pr_a.insertId
        }
        await D.insert('commune_urbaine',cu_post)


        return res.send({status:true})

    } catch (e) {
        console.error(e)
        return res.send({status:false,message:'Erreur dans la base de donnée.',e})
    }
})

//Suppression d'une commune urbaine
router.delete('/:id',async (req,res)=>{
    let D = require('../models/data')
    try {
        //Récupération des infos sur la commune
        const cu_i = (await D.getById('commune_urbaine',{cu_id:req.params.id}))[0]

        //suppression du profil
        await D.del('profil',{pr_id:cu_i.pr_id})

        //Suppression de la commune
        await D.del('commune_urbaine',{cu_id:req.params.id})

        //Modification du panneau
        // if(cu_i.pan_id){
        //     await D.updateWhere('panneau')
        // }

        return res.send({status:true})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:'Erreur dans la base de donnée.',e})
    }
})

//Exportation du route
module.exports = router