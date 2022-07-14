let router = require('express').Router()


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});

router.get('/ann',async (req,res)=>{
    let D = require('../models/data')

    try {
        //On récupère l'id de l'annonceur actuel
        let ann_id = (await D.exec_params('select ann_id from annonceur where pr_id = ?',req.user.pr_id))[0].ann_id


        //Puis on récupère les panneaux dans la proposition
        let sql = `select p.pan_publoc_ref,p.pan_id,c.cat_label as format_label,l.*,f.name_file,f.name_min_file,
        (select cat_label from category p_cat where p_cat.cat_id = c.parent_cat_id) as cat_label
        from panneau p
        left join category c on c.cat_id = p.cat_id
        left join lieu l on l.lieu_id = p.lieu_id
        left join file f on f.file_id = p.image_id
        left join props_pan pp on pp.props_pan_id = p.pan_id
        where pp.props_ann_id = ?`

        let props = await D.exec_params(sql,ann_id)

    


        // console.log(req.user)
        return res.send({status:true,props})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:'Erreur dans la base de donnée'})
    }
})

//Suppresion d'une proposition annonceur
router.delete('/:id',async (req,res)=>{
    let D = require('../models/data')
    let pp_id = req.params.id
    try {

        const d = await D.exec_params('delete from props_pan where props_id = ? ',[pp_id])
        return res.send({status:true})

    } catch (e) {
        console.error(e)
        return res.send({status:false,message:'Erreur dans la base de donnée'})
    }
})

//Récupération des panneaux proposés à un annonceur
router.get('/panel/:id',async (req,res)=>{
    let D = require('../models/data')
    let ann_id = req.params.id
    try {
        let sql = `select * from panneau p 
        left join props_pan pp on p.pan_id = pp.props_pan_id
        where pp.props_ann_id  = ?`

        let panels = await D.exec_params(sql,ann_id)

        return res.send({status:true,panels})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:'Erreur dans la base de donnée'})
    }
})

//get props 
router.get('/list',async (req,res)=>{
    let D = require('../models/data')
    let list_by = req.query.list_by

    try {
        let sql_ann = `select distinct a.ann_id,a.* ,(select count(*) from props_pan pa where pa.props_ann_id = a.ann_id) as nb_panel from annonceur a 
        left join props_pan pp on pp.props_ann_id = a.ann_id
        where pp.props_ann_id is not null `

        let sql_pan = `select distinct p.*,pp.*,(select count(props_pan_id) from props_pan pr where pr.props_pan_id = p.pan_id ) as nb_ann from props_pan pp
        left join panneau p on p.pan_id = pp.props_pan_id`

        let props = await D.exec((list_by == 'ann')?sql_ann:sql_pan)

        return res.send({status:true,props})
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:'Erreur dans la base de donnée'})
    }
})

//On post les propositions pour les annonceurs
router.post('/ann',async (req,res)=>{
    let D = require('../models/data')
    let ann = req.body.ann
    let pans_id = req.body.pans_id


    
    try {

        //On va devoir faire  une boucle pour le truc

        let _tmp_obj = {},sql = '',_tmp_res = {}

        //Pas de boucle ??
        //Non il y a encore de boucle

        for(let i = 0; i < pans_id.length;i++){
            //Vérification si le couple panneau et annonceur n'est pas déjà dans le truc
            _tmp_res = await D.exec_params(`select props_id from props_pan 
            where props_pan_id = ? and props_ann_id = ?`,[pans_id[i],ann.ann_id])

            if(_tmp_res.length <= 0){
                //Ajout des relations entres panneaux et annonceurs
                _tmp_obj = {
                    props_pan_id:pans_id[i],
                    props_ann_id:ann.ann_id
                }

                await D.set('props_pan',_tmp_obj)
            }

        }

        //
        return res.send({status:true})
        
    } catch (e) {
        console.error(e)
        return res.send({status:false,message:'Erreur dans la base de donnée'})
    }
})


module.exports = router
