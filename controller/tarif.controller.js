let D = require('../models/data')

class Tarif{
    static async register(req,res){ 
        
        let _d= req.body; 
        let tarif_data={
            tarif_label:{front_name:'tarif_label',fac:false}, 
            tarif_percent:{front_name:'tarif_percent',fac:true}, 
            tarif_link_id:{front_name:'tarif_link_id',fac:true}, 
            tarif_date_enreg :{front_name:'tarif_date_enreg',fac:true,format:()=> new Date()},
        };

        //Vérification du tarif
        const _pd_keys = Object.keys(tarif_data)
        let _tmp = {}
        let _list_error = []
        
        try {
            _pd_keys.forEach((v,i)=>{
                _tmp = tarif_data[v]
                if(!_tmp.fac && !_d[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })
            
            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
    
            //Si la vérification c'est bien passé, 
            // on passe à l'insertion du tarif
            let _data = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = tarif_data[v]
    
                _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                 
                _data[v] = _d[_tmp.front_name]
            })
            
            //l'objet tarif est rempli maintenant
            // on l'insert dans la base de donnée

            // console.log(_d)
            // console.log(_data)

            if(!_d.tarif_percent || ! _d.tarif_link_id){
                _data.tarif_percent = null
                _data.tarif_link_id = null
            }

            let _tarif = await D.set('tarif',_data)

            if(_d.tarif_link_id == null){
                //Eto ny insertion ny relation entre service sy tarifs
                let list_service = await D.exec('select * from service where service_parent_id is not null')
                let datas = []

                if(list_service.length > 0){
                    let sql = `insert into tarif_service (tserv_tarif_id,tserv_service_id,tserv_prix) values ?;`
                    for (let i = 0; i < list_service.length; i++) {
                        datas.push([_tarif.insertId,list_service[i].service_id,0])
                    }

                    await D.exec_params(sql,[datas])
                }

                //Eto ny insertion entre produits (médicaments) sy tarif
                datas = []
                let list_med = await D.exec('select * from article')
                if(list_med.length > 0){
                    let sql = `insert into tarif_service (tserv_tarif_id,tserv_service_id,tserv_prix,tserv_is_product) values ?;`
                    for (let i = 0; i < list_med.length; i++) {
                        datas.push([_tarif.insertId,list_med[i].art_id,0,1])
                    }
                    await D.exec_params(sql,[datas])
                }
            }else{


                //Pour les services alony
                let list_serv = await D.exec_params(`select * from tarif_service where tserv_tarif_id = ? and tserv_is_product = 0`,[_d.tarif_link_id])
                let dt = []

                // console.log(list_serv)

                if(list_serv.length > 0){
                    let sql = `insert into tarif_service (tserv_tarif_id,tserv_service_id,tserv_prix,tserv_is_product) values ?;`

                    for (let i = 0; i < list_serv.length; i++) {
                        const e = list_serv[i];
                        dt.push([_tarif.insertId,e.tserv_service_id, parseInt(_d.tarif_percent) * parseInt(e.tserv_prix) /100 ,0])
                    }

                    await D.exec_params(sql,[dt])
                }

                //Pour les médicaments
                let list_med = await D.exec_params(`select * from tarif_service where tserv_tarif_id = ? and tserv_is_product = 1`,[_d.tarif_link_id]) 
                dt = []
                if(list_med.length > 0){
                    let sql = `insert into tarif_service (tserv_tarif_id,tserv_service_id,tserv_prix,tserv_is_product) values ?;`

                    for (let i = 0; i < list_med.length; i++) {
                        const e = list_med[i];
                        dt.push([_tarif.insertId,e.tserv_service_id, parseInt(_d.tarif_percent) * parseInt(e.tserv_prix) /100 ,1])
                    }
                    await D.exec_params(sql,[dt])
                }
            }


            //Ici tous les fonctions sur l'enregistrement d'un tarif
            return res.send({status:true,message:"tarif bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }


    }

    static async delete(req,res){
        try {   
            let {tarif_id} = req.params
            await D.del('tarif',{tarif_id})

            //Suppression anle relation entre tarif_service sy tarif
            await D.del('tarif_service',{tserv_tarif_id:tarif_id})

            //Modification de tous les tarifs avec un pourcentage du tarif
            await D.exec_params(`update set tarif_percent = null, tarif_link_id = null where tarif_link_id = ?`,[tarif_id])

            //Ici tous les fonctions sur l'enregistrement d'un tarif
            return res.send({status:true,message:"tarif supprimé."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
 
    }  
    
    static async getList(req,res){ 
        let filters = req.query

        let _obj_pat = {
            tarif_id:'tarif_id',
            tarif_label:'tarif_label',
            tarif_date_enreg:'tarif_date_enreg',
        } 
        let default_sort_by = 'tarif_id'

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?100:parseInt(filters.limit)
        filters.sort_by = (!filters.sort_by)?_obj_pat[default_sort_by]:_obj_pat[filters.sort_by]

        try { 
            //A reserver recherche par nom_prenom
            let reponse = await D.exec_params(`select * from tarif order by ${filters.sort_by} limit ? offset ?`,[
                filters.limit,
                (filters.page-1)*filters.limit
            ])

            //Liste total des tarif
            let nb_total_tarif = (await D.exec('select count(*) as nb from tarif'))[0].nb

            return res.send({status:true,reponse,nb_total_tarif})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getListNoPercent(req,res){
        try {
            let tarifs = await D.exec_params('select * from tarif where tarif_percent is null')

            res.send({status:true,tarifs})
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
                await D.updateWhere('tarif',element,array[0]) 
            }
                //Ici tous les fonctions sur l'enregistrement d'un tarif
                return res.send({status:true,message:"Mise à jour, fait"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Tarif;
