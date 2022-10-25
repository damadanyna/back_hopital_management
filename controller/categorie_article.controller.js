let D = require('../models/data')

class Categorie_article{
    static async register(req,res){ 
        
        let _d= req.body; 
        let categorie_article_data={
            cat_label:{front_name:'cat_label',fac:false}, 
            cat_code:{front_name:'cat_code',fac:false}, 
            cat_date_enreg :{front_name:'cat_date_enreg',fac:true,format:()=> new Date()},
            cat_parent_id:{front_name:'cat_parent_id',fac:true ,format:(a)=>(parseInt(a).toString() == 'NaN')?null:parseInt(a)},
        };

        //Vérification du categorie_article
        const _pd_keys = Object.keys(categorie_article_data)
        let _tmp = {}
        let _list_error = []
        
        try {
            _pd_keys.forEach((v,i)=>{
                _tmp = categorie_article_data[v]
                if(!_tmp.fac && !_d[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })
            
            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
    
            //Si la vérification c'est bien passé, 
            // on passe à l'insertion du categorie_article
            let _data = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = categorie_article_data[v]
    
                _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                 
                _data[v] = _d[_tmp.front_name]
            })
            
            //l'objet categorie_article est rempli maintenant
            // on l'insert dans la base de donnée

            await D.set('categorie_article',_data)
            //Ici tous les fonctions sur l'enregistrement d'un categorie_article
            return res.send({status:true,message:"categorie_article bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }


    }

    static async delete(req,res){
        try {   
            await D.del('categorie_article',req.body)
            //Ici tous les fonctions sur l'enregistrement d'un categorie_article
            return res.send({status:true,message:"categorie_article supprimé."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
 
    }  
    
    static async getList(req,res){ 
        let filters = req.query

        let _obj_pat = {
            cat_id:'cat_id',
            cat_label:'cat_label',
            cat_date_enreg:'cat_date_enreg',
        } 
        let default_sort_by = 'cat_id'

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?100:parseInt(filters.limit)
        filters.sort_by = (!filters.sort_by)?_obj_pat[default_sort_by]:_obj_pat[filters.sort_by]

        try { 
            //A reserver recherche par nom_prenom
            let reponse = await D.exec_params(`select * from categorie_article order by ${filters.sort_by} limit ? offset ?`,[
                filters.limit,
                (filters.page-1)*filters.limit
            ])

            //Liste total des categorie_article
            let nb_total_categorie_article = (await D.exec('select count(*) as nb from categorie_article'))[0].nb

            return res.send({status:true,reponse,nb_total_categorie_article})
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
                await D.updateWhere('categorie_article',element,array[0]) 
            }
                //Ici tous les fonctions sur l'enregistrement d'un categorie_article
                return res.send({status:true,message:"Mise à jour, fait"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getListParent(req,res){
        try {
            let s = `select *, (select count(*) from categorie_article ca1 where ca1.cat_parent_id = ca.cat_id ) as nb_child
            from categorie_article ca where ca.cat_parent_id is null`

            let reponse = await D.exec(s)

            return res.send({status:true,reponse})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Categorie_article;
