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

            return res.send({status:true,message:"Article bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }


    }

    static async delete(req,res){
        try {   
            await D.del('article',req.body)
            //Ici tous les fonctions sur l'enregistrement d'un article
            return res.send({status:true,message:"article supprimé."})
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
            let articles = await D.exec(`select * from article`)
            
            let a_size = articles.length

            //Boucle pour récupérer les informations sur 
            for (let i = 0; i < a_size; i++) {
                articles[i]['g_stock'] = await D.exec_params(`select * from stock_article left join depot on depot_id = stk_depot_id where stk_art_id = ? `,articles[i].art_id) 
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
        var array=[]
        for (const key in data) { 
            array.push({[key]:data[key]})
        }  
        try {  
            for (let i = 1; i < array.length; i++) {
                const element = array[i]; 
                await D.updateWhere('article',element,array[0]) 
            }
                //Ici tous les fonctions sur l'enregistrement d'un article
                return res.send({status:true,message:"Mise à jour, fait"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Article;
