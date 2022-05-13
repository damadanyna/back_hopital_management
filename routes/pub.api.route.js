let router = require('express').Router()
const bcrypt = require('bcrypt');
const connection = require('../config/db');
const { route } = require('./p.panel.api.route');


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});

//récupération de la liste des pubs selon le type
router.get('/',async (req,res)=>{

    let q = req.query
    let D = require('../models/data')
    
    try {
        let sql = `select * from pub_im where pub_type = ? `
        let pub = await D.exec_params(sql,q.type)
        let pub_im_list = []
        if(pub.length > 0){
            pub = pub[0]

            pub_im_list = await D.exec_params(`select dimension_file,dimension_min_file,file_id,
            name_min_file,name_file from file where file_id in (?)`,[pub.pub_im_list.split(',')])
        }

        return res.send({status:true,pub_im_list})

    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Ajout d'un type de pub dans la base
router.post('/type',async (req,res)=>{
    let D = require('../models/data')
    let d = req.body

    console.log(d)

    try {
        //On détecte dans la base s'il y a le même type de pub
        let _pub = await D.exec_params(`select * from pub_im where pub_type = ? `,d.pub_type)
        let is_exist = false
        is_exist = (_pub.length > 0)?true:false

        let ids_tab = d.pub_im_list.map(x => parseInt(x.file_id))

        // let ids_old_tab = _pub[0].pub_im_list.map(x => parseInt(x.file_id))

        console.log(ids_tab)
        if(is_exist){
            //update
            await D.updateWhere('pub_im',{pub_im_list:ids_tab.join(',')},{pub_type:d.pub_type})

        }else{
            //Insertion des données
            let pub_post = {
                pub_im_list:ids_tab.join(','),
                pub_type:d.pub_type
            }

            await D.set('pub_im',pub_post)
        }

        return res.send({status:true})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

//Suppression d'image dans la pub
router.delete('/im/:im_id',async (req,res)=>{
    let id = req.params.im_id, 
    type = req.params.type

    let D = require('../models/data')
    try {
        await require('../controller/file').deleteMultipleFile([id])
        return res.send({status:true})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:"Erreur dans la base de donnée"})
    }
})

module.exports = router