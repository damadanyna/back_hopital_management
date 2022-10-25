let D = require('../models/data')

class Stock_article{
    static async register(req,res){ 
        
        let _d= req.body; 
        let stock_article_data={
            stock_id:{front_name:'stock_id',fac:true},  
            stock_article_date_enreg :{front_name:'stock_article_date_enreg',fac:true,format:()=> new Date()},
            art_id:{front_name:'art_id',fac:false ,format:(a)=>parseInt(a)},
            depot_id:{front_name:'depot_id',fac:false ,format:(a)=>parseInt(a)},
            stock_unit:{front_name:'stock_unit',fac:false ,format:(a)=>parseInt(a)},
            stock_min:{front_name:'stock_min',fac:false ,format:(a)=>parseInt(a)},
            stock_prix_unit:{front_name:'stock_prix_unit',fac:false ,format:(a)=>parseInt(a)},
            stock_prix_tot:{front_name:'stock_prix_tot',fac:false ,format:(a)=>parseInt(a)},
            stock_condi:{front_name:'stock_condi',fac:false},
            stock_emplacement:{front_name:'stock_emplacement',fac:false},
        };

        //Vérification du stock_article
        const _pd_keys = Object.keys(stock_article_data)
        let _tmp = {}
        let _list_error = []
        
        try {
            _pd_keys.forEach((v,i)=>{
                _tmp = stock_article_data[v]
                if(!_tmp.fac && !_d[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })
            
            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
    
            //Si la vérification c'est bien passé, 
            // on passe à l'insertion du stock_article
            let _data = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = stock_article_data[v]
    
                _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                 
                _data[v] = _d[_tmp.front_name]
            })
            
            //l'objet stock_article est rempli maintenant
            // on l'insert dans la base de donnée

            await D.set('stock_article',_data)
            //Ici tous les fonctions sur l'enregistrement d'un stock_article
            return res.send({status:true,message:"stock_article bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }


    }

    static async delete(req,res){
        try {   
            await D.del('stock_article',req.body)
            //Ici tous les fonctions sur l'enregistrement d'un stock_article
            return res.send({status:true,message:"stock_article supprimé."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
 
    }  
    
    static async getList(req,res){ 
        let filters = req.query

        let _obj_pat = {
            stock_id:'stock_id',
            stock_prix_unit:'stock_prix_unit',
            stock_article_date_enreg:'stock_article_date_enreg',
        } 
        let default_sort_by = 'stock_id'

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?100:parseInt(filters.limit)
        filters.sort_by = (!filters.sort_by)?_obj_pat[default_sort_by]:_obj_pat[filters.sort_by]

        try { 
            //A reserver recherche par nom_prenom
            let reponse = await D.exec_params(`select * from stock_article order by ${filters.sort_by} limit ? offset ?`,[
                filters.limit,
                (filters.page-1)*filters.limit
            ])

            //Liste total des stock_article
            let nb_total_stock_article = (await D.exec('select count(*) as nb from stock_article'))[0].nb

            return res.send({status:true,reponse,nb_total_stock_article})
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
                await D.updateWhere('stock_article',element,array[0]) 
            }
                //Ici tous les fonctions sur l'enregistrement d'un stock_article
                return res.send({status:true,message:"Mise à jour, fait"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Stock_article;
