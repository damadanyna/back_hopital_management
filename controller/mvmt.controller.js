let D = require('../models/data')

class Mouvement{

    //Enregistrement d'un mouvement pour le stock
    static async register(req,res){
        let {list_mart,mvmt} = req.body

        let mvmt_data={
            mvmt_num:{front_name:'mvmt_num',fac:false}, 
            mvmt_action :{front_name:'mvmt_action',fac:false},
            mvmt_type:{front_name:'mvmt_type',fac:false}, 
            mvmt_tiers:{front_name:'mvmt_tiers',fac:false},
            mvmt_depot_dest:{front_name:'mvmt_depot_dest',fac:false},
            mvmt_depot_exp:{front_name:'mvmt_depot_exp',fac:false}, 
            mvmt_util_id:{front_name:'mvmt_util_id',fac:true},
            mvmt_date:{front_name:'mvmt_date',fac:false,format:(a)=> new Date(a)}, 
        };

        //ao am list_mart no ahitana ny total des montants

        //calcul an'ny montant total izay hampidirina ao am mvmt
        let total_montant = 0,tmp = {}
        let c_tmp = 0
        for(let i = 0; i<list_mart.length;i++){
            tmp = list_mart[i]
            c_tmp = parseInt(tmp.mart_montant)
            total_montant += (c_tmp.toString != 'NaN')?c_tmp:0 
        }
        //Haza zay ny total montant

        //Tokony ho insertion anle izy amzay
        const _pd_keys = Object.keys(mvmt_data)
        let _tmp = {}
        let _list_error = []

        try {
            

            //Vérification des inputs vides
            _pd_keys.forEach((v,i)=>{
                _tmp = mvmt_data[v]
                if(!_tmp.fac && !mvmt[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })

            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
            
            let _data = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = mvmt_data[v]
    
                mvmt[_tmp.front_name] = (_tmp.format)?_tmp.format(mvmt[_tmp.front_name]):mvmt[_tmp.front_name]
                 
                _data[v] = mvmt[_tmp.front_name]
            })

            _data.mvmt_montant = total_montant
            // _data.mvmt_util_id = req.user.util_id

            //Insertion du mouvement
            let _mvmt = await D.set('mvmt',_data) 

            //Eto amzay ara ny insertion des relations mouvement/articles
            for (let i = 0; i < list_mart.length; i++) {
                let el = list_mart[i]
                //premièrement, modification des stock de l'article actuel : mart_art_id,

                //Entrée alors on ajoute le nombre de l'article au dépot de stock actuel
                if(mvmt.mvmt_action == 'entre'){
                    //On vérifie d'abord si le lien existe
                    let link = await D.exec_params('select * from stock_article where stk_depot_id = ? and stk_art_id = ?',[mvmt.mvmt_depot_dest,el.mart_art_id])

                    //si existe en met à jour
                    if(link.length > 0){
                        await D.exec_params(`update stock_article set  stk_actuel = stk_actuel + ?
                        where stk_depot_id = ? and stk_art_id = ?`,[el.mart_qt,mvmt.mvmt_depot_dest,el.mart_art_id])
                    }else{
                        //si non on crée le lien
                        await D.set('stock_article',{
                            stk_actuel:el.mart_qt,
                            stk_depot_id:mvmt.mvmt_depot_dest,
                            stk_art_id:el.mart_art_id
                        })
                    }
                    //Trop be io zavatra ambony io 👌👌
                    
                }else if(mvmt.mvmt_action == 'sortie'){ //Resaka sortie de méicaments ty e !!
                    //eto am sortie ndray e

                    //On vérifie d'abord si le lien existe
                    let link = await D.exec_params('select * from stock_article where stk_depot_id = ? and stk_art_id = ?',[mvmt.mvmt_depot_exp,el.mart_art_id])
                    if(link.length > 0){
                        //Angalana ny depot d'expédition satri izy no mandefa an'ilay fanfody
                        await D.exec_params(`update stock_article set stk_actuel = stk_actuel - ?
                        where stk_depot_id = ? and stk_art_id = ?`,[el.mart_qt,mvmt.mvmt_depot_exp,el.mart_art_id])
                    }else{
                        
                        //si non on crée le lien
                        await D.set('stock_article',{
                            stk_actuel:0,
                            stk_depot_id:mvmt.mvmt_depot_exp,
                            stk_art_id:el.mart_art_id
                        })
                    }

                    //cas exeptionnel pour le transfert
                    if(mvmt.mvmt_type == 'transfert'){
                        link = await D.exec_params('select * from stock_article where stk_depot_id = ? and stk_art_id = ?',[mvmt.mvmt_depot_dest,el.mart_art_id])

                        //si existe en met à jour
                        if(link.length > 0){
                            //Alefa any am depot e destination le raha, rehefa transfert
                            await D.exec_params(`update stock_article set stk_actuel = stk_actuel + ?
                            where stk_depot_id = ? and stk_art_id = ?`,[el.mart_qt,mvmt.mvmt_depot_dest,el.mart_art_id])
                        }else{
                            //si non on crée le lien
                            await D.set('stock_article',{
                                stk_actuel:el.mart_qt,
                                stk_depot_id:mvmt.mvmt_depot_dest,
                                stk_art_id:el.mart_art_id
                            })
                        }
                    }else{

                    }
                }

                //suppression des données non utilisées
                delete el.mart_art_unit
                delete el.mart_art_label
                
                 //De avy eo ajout an'ilay ligne dans mvmt_art
                 el.mart_mvmt_id = _mvmt.insertId
                 await D.set('mvmt_art',el)
            }

            //Vita a 😎😉
            //Ouf zay vaot vita ny insertion an'ireny article reny ao am table mvmt_art
            

            return res.send({status:true})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getUtilsAdd(req,res){
        try {

            let {action,type} = req.query
            //Récupération des dérniers mvmt de même type et action

            let mvmt_last = await D.exec_params('select * from mvmt where mvmt_action = ? and mvmt_type = ? order by mvmt_id desc',[action,type])

            
            let list_depot = await D.exec('select * from depot')
            let list_fourn = await D.exec('select * from fournisseur')
            let list_dep = await D.exec('select * from departement')

            return res.send({status:true,list_depot,list_fourn,list_dep,mvmt_last})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getEntre(req,res){
        try {
            let {date} = req.query

            date = new Date(date)
            
            let sql = `select *,(select count(*) from mvmt_art where mart_mvmt_id = mvmt_id) as nb_art from mvmt 
            left join depot on mvmt_depot_dest = depot_id
            left join fournisseur on mvmt_tiers = fourn_id
            where mvmt_date = ? and mvmt_action = 'entre'`

            let list = await D.exec_params(sql,[date])

            return res.send({status:true,list})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Mouvement