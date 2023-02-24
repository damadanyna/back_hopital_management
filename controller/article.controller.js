const { updateWhere } = require('../models/data');
let D = require('../models/data')

class Article{
    static async register(req,res){ 
        
        let _d= req.body; 

        let article_data={
            art_id:{front_name:'art_id',fac:true},
            art_label:{front_name:'art_label',fac:false}, 
            art_date_enreg :{front_name:'art_date_enreg',fac:false,format:()=> new Date()},
            id_parent_article:{front_name:'tarif_id',fac:false ,format:(a)=>parseInt(a)},
            art_code:{front_name:'art_code',fac:false }, 
            fourn_id:{front_name:'fourn_id',fac:false },  
        }

        let { article,stock,list_depot } = _d


        //Vérification du article
        const _pd_keys = Object.keys(article_data)
        let _tmp = {}
        let _list_error = []
        
        try {
            // _pd_keys.forEach((v,i)=>{
            //     _tmp = article_data[v]
            //     if(!_tmp.fac && !_d[_tmp.front_name]){
    
            //         _list_error.push({code:_tmp.front_name})
            //     }
            // })
            
            // if(_list_error.length> 0){
            //     return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            // }
    
            // //Si la vérification c'est bien passé, 
            // // on passe à l'insertion du article
            // let _data = {}
            // _pd_keys.forEach((v,i)=>{
            //     _tmp = article_data[v]
    
            //     _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                 
            //     _data[v] = _d[_tmp.front_name]
            // })

            //Détection de champs vide
            if(!article.art_code || !article.art_label){
                // console.log('hahah');
                return res.send({status:false,message:"Certains champs sont vide"})
            }

            // Ajout article
            let _art = await D.set('article',article)

            //Ajout du stock 
            for (let i = 0; i < list_depot.length; i++) {
                let tmp = list_depot[i]
                await D.set('stock_article',{
                    stk_depot_id:tmp.depot_id,
                    stk_art_id:_art.insertId,
                    stk_initial:stock[i].stk_initial,
                    stk_actuel:stock[i].stk_actuel,
                })
            }

            //Ajout relation entre article et tarif
            //Récupération de la liste des tarifs
            let list_tarif = await D.exec('select * from tarif')
            if(list_tarif.length > 0){
                let sql = `insert into tarif_service (tserv_tarif_id,tserv_service_id,tserv_prix,tserv_is_product) values ?;`
                let datas = []
                for (let i = 0; i < list_tarif.length; i++) {
                    datas.push([list_tarif[i].tarif_id,_art.insertId,0,1])
                }
                //insertion
                await D.exec_params(sql,[datas])

            }

            return res.send({status:true,message:"Article bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }

    }

    static async delete(req,res){
        try {   

            //Eto mle verification hoe mbola relier amina table ilaina ve io article io sa tsia
            let {art_id} = req.params

            await D.del('article',{art_id})

            
            //On doit aussi supprimer les relations entre l'article et les autres tables
            //suppression ny relation tarif et article
            await D.exec_params('delete from tarif_service where tserv_service_id = ? and tserv_is_product = 1',art_id)
            //Ici tous les fonctions sur l'enregistrement d'un article
            return res.send({status:true,message:"Article bien supprimé."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
 
    }  

    //
    static async getUtilsAdd(req,res){
        try {
            
            let parent_cat = await D.exec('select * from categorie_article where cat_parent_id is null')
            let sub_cat = await D.exec_params('select * from categorie_article where cat_parent_id = ?',(parent_cat.length > 0)?parent_cat[0].cat_id:-1)

            let list_depot = await D.exec('select * from depot')

            return res.send({status:true,parent_cat,sub_cat,list_depot})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getListSubCat(req,res){
        try {
            
            let sub_cat = await D.exec_params('select * from categorie_article where cat_parent_id = ?',req.params.cat_id)

            return res.send({status:true,sub_cat})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
    
    static async getList(req,res){ 
        let filters = req.query

        let _obj_pat = {
            art_id:'art_id',
            art_label:'art_label',
            art_date_enreg:'art_date_enreg',
        } 
        let default_sort_by = 'art_id'

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?100:parseInt(filters.limit)
        filters.sort_by = (!filters.sort_by)?_obj_pat[default_sort_by]:_obj_pat[filters.sort_by]

        try { 
            //A reserver recherche par nom_prenom
            let articles = await D.exec_params(`select * from article where art_label like ? limit ?`,[`%${filters.search}%`,filters.limit])
            
            let a_size = articles.length

            //Boucle pour récupérer les informations sur le stock
            for (let i = 0; i < a_size; i++) {
                //articles[i]['g_stock'] = await D.exec_params(`select * from stock_article left join depot on depot_id = stk_depot_id where stk_art_id = ? `,articles[i].art_id) 
                articles[i]['g_stock'] = await D.exec_params(`select * from depot 
                left join stock_article on depot_id = stk_depot_id where stk_art_id = ? `,articles[i].art_id) 
            }



            //Liste total des article
            let nb_total_article = (await D.exec('select count(*) as nb from article'))[0].nb

            let list_depot = await D.exec('select * from depot')

            return res.send({status:true,articles,nb_total_article,list_depot})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async update(req,res){ 
        let data = req.body 

        let { article,stock,list_depot } = data

        let g_stock = article.g_stock
        delete article.g_stock
        delete article.art_date_enreg


        var array=[]
        for (const key in data) { 
            array.push({[key]:data[key]})
        }  
        try {
            
            //Mise à jour e l'article
            await D.updateWhere('article',article,{art_id:article.art_id})

            //Puis mise à jour du stock
            if(g_stock.length > 0){
                for(let i=0; i <list_depot.length;i++){
                    await D.exec_params(`update stock_article set ? where stk_depot_id = ? and stk_art_id = ?`,[
                        {
                            stk_initial:stock[i].stk_initial,
                            stk_actuel:stock[i].stk_actuel
                        },list_depot[i].depot_id,article.art_id
                    ])
                }


            }else{
                //Ajout du stock si c'est pas encore déjà inséré
                for (let i = 0; i < list_depot.length; i++) {
                    let tmp = list_depot[i]
                    await D.set('stock_article',{
                        stk_depot_id:tmp.depot_id,
                        stk_art_id:article.art_id,
                        stk_initial:stock[i].stk_initial,
                        stk_actuel:stock[i].stk_actuel,
                    })
                }
            }

            //Ici tous les fonctions sur l'enregistrement d'un article
            return res.send({status:true,message:"Mise à jour, fait"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async searchByLabel(req,res){
        try {
            let q = req.query

            let articles = await D.exec_params(`select * from article 
            where art_label like ? ${(q.id_not_in)?'and art_id not in (?)':''}`,[`%${q.search}%`,q.id_not_in])

            return res.send({status:true,articles})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Article;
