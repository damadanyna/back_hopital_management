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
        };

        //Vérification du article
        const _pd_keys = Object.keys(article_data)
        let _tmp = {}
        let _list_error = []
        
        try {
            _pd_keys.forEach((v,i)=>{
                _tmp = article_data[v]
                if(!_tmp.fac && !_d[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })
            
            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
    
            //Si la vérification c'est bien passé, 
            // on passe à l'insertion du article
            let _data = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = article_data[v]
    
                _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                 
                _data[v] = _d[_tmp.front_name]
            })
            
            //l'objet article est rempli maintenant
            // on l'insert dans la base de donnée

            await D.set('article',_data)
            //Ici tous les fonctions sur l'enregistrement d'un article
            return res.send({status:true,message:"article bien enregistrer."})
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
            let reponse = await D.exec_params(`select * from article order by ${filters.sort_by} limit ? offset ?`,[
                filters.limit,
                (filters.page-1)*filters.limit
            ])

            //Liste total des article
            let nb_total_article = (await D.exec('select count(*) as nb from article'))[0].nb

            return res.send({status:true,reponse,nb_total_article})
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
