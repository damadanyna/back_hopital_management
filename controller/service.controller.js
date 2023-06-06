let D = require('../models/data')

let utils = require('../utils/utils')

class Service{
    static async register(req,res){ 
        
        let _d= req.body; 
        let service_data={
            service_id:{front_name:'service_id',fac:true},
            service_label:{front_name:'service_label',fac:false},
            service_parent_id:{front_name:'service_parent_id',fac:true},
            service_util_id:{front_name:'service_util_id',fac:true},
            service_date_enreg :{front_name:'service_date_enreg',fac:true,format:()=> new Date()},
            
        };

        //Vérification du service
        const _pd_keys = Object.keys(service_data)
        let _tmp = {}
        let _list_error = []
        
        try {
            _pd_keys.forEach((v,i)=>{
                _tmp = service_data[v]
                if(!_tmp.fac && !_d[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })
            
            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
    
            //Si la vérification c'est bien passé, 
            // on passe à l'insertion du service
            let _data = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = service_data[v]
    
                _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                 
                _data[v] = _d[_tmp.front_name]
            })
            
            //l'objet service est rempli maintenant
            // on l'insert dans la base de donnée

            //Eto alo création anle code service
            //Raha misy ilay service parent de récupérérna ny enfant-ny farany 
            let code ='',pre_code = 3
            // console.error(_data.service_parent_id)
            if(parseInt(_data.service_parent_id) != -1){
                let c = await D.exec_params(`select * from service where service_parent_id = ? order by service_id desc limit 1`,_data.service_parent_id)
                if(c.length > 0){
                    c = c[0]
                    code = utils.setPrefixZero(parseInt(c.service_code.substr(pre_code)) + 1) //On extracte le chiffre
                    code = `${c.service_code.substr(0,pre_code)}${code}`
                }else{
                    let c_tmp = (await D.exec_params(`select * from service where service_id = ?`,_data.service_parent_id))[0].service_label
                    code = c_tmp.substr(0,pre_code).toUpperCase()
                    code = `${code}${utils.setPrefixZero(1)}`
                }
            }else{
                code = _data.service_label.substr(0,pre_code).toUpperCase()
            }

            _data.service_code = code
            
            if(parseInt(_data.service_parent_id) == -1){
                _data.service_parent_id = null
            }
            
            let _serv = await D.set('service',_data)

            let list_tarif = []

            //Eto ndray ny création ana relation entre service et tarif
            if(_data.service_parent_id){
                list_tarif = await D.exec('select * from tarif')
                if(list_tarif.length > 0){
                    let sql = `insert into tarif_service (tserv_tarif_id,tserv_service_id,tserv_is_product,tserv_prix) values ?;`
                    let datas = []
                    for (let i = 0; i < list_tarif.length; i++) {
                        datas.push([list_tarif[i].tarif_id,_serv.insertId,0,0])
                    }
                    //insertion
                    await D.exec_params(sql,[datas])
                }
            }
            //Ici tous les fonctions sur l'enregistrement d'un service
            return res.send({status:true,message:"Service bien enregistrer.",list_tarif})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async delete(req,res){
        try {   

            let {service_id} = req.params
            //Tokony mbola hisy vérification hoe relié amina table hafa ve sa tsia

            let s = (await D.exec_params('select * from service where service_id = ?',[service_id]))[0]
            if(s && !s.service_parent_id){
                //recherche des enfants de la service

                let ch = await D.exec_params('select * from service where service_parent_id = ?',[service_id])

                if(ch.length > 0){
                    return res.send({status:false,message:"Le Service contient des services enfants qui doivent être supprimé avant"})
                }
            }

            //-suppression
            await D.del('service',{service_id})
            //On supprimer les relations des services et les autres tables
            

            //Suppression an'ny relation service et tarif
            await D.exec_params('delete from tarif_service where tserv_service_id = ? and tserv_is_product = 0',service_id)
            //Ici tous les fonctions sur l'enregistrement d'un service
            return res.send({status:true,message:"Service bien supprimé."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
 
    }  

    static async getAddUtils(req,res){
        try {
            const srv_parent = await D.exec('select * from service where service_parent_id is null')
            
            return res.send({status:true,srv_parent})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
    
    static async getList(req,res){ 
        let filters = req.query

        // console.log(filters);

        let _obj_pat = {
            service_id:'service_id',
            service_label:'service_label',
            service_date_enreg:'service_date_enreg',
        } 
        let default_sort_by = 'service_id'

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?1000:parseInt(filters.limit)
        filters.sort_by = (!filters.sort_by)?_obj_pat[default_sort_by]:_obj_pat[filters.sort_by]

        try { 
            //A reserver recherche par nom_prenom
            // let reponse = await D.exec_params(`select * from service order by ${filters.sort_by} limit ? offset ?`,[
            //     filters.limit,
            //     (filters.page-1)*filters.limit
            // ])

            filters.search = (filters.search === undefined)?'%%':`%${filters.search}%`


            let srvs = await D.exec_params(`select * from service where service_label like ? order by service_code asc`,[filters.search])

            //Récupération des tarifs de chaque service
            for (let i = 0; i < srvs.length; i++) {
                const e = srvs[i];
                if(e.service_parent_id){
                    e.tarifs = await D.exec_params(`select * from tarif_service 
                    left join tarif on tserv_tarif_id = tarif_id
                    where tserv_service_id = ? and tserv_is_product = 0`,e.service_id)
                }
            }

            //Liste total des service
            let nb_total_service = (await D.exec('select count(*) as nb from service'))[0].nb

            //Liste des tarfis
            const list_tarif = await D.exec('select * from tarif')

            return res.send({status:true,srvs,list_tarif,nb_total_service})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getListTarifsProducts(req,res){
        let filters = req.query

        // console.log(filters);

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

            filters.search = (filters.search === undefined)?'%%':`%${filters.search}%`


            let srvs = await D.exec_params(`select * from article where art_label like ? order by art_code asc limit ?`,[filters.search,filters.limit])

            //Récupération des tarifs de chaque produits
            for (let i = 0; i < srvs.length; i++) {
                const e = srvs[i];
                e.tarifs = await D.exec_params(`select * from tarif_service 
                left join tarif on tserv_tarif_id = tarif_id
                where tserv_service_id = ? and tserv_is_product = 1`,e.art_id)
            }

            //Liste des tarfis
            const list_tarif = await D.exec('select * from tarif')
            
            return res.send({status:true,srvs,list_tarif})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getModifPrix(req,res){
        try {
            let t = req.query

            let tserv = (await D.exec_params(`select * from tarif_service 
            left join tarif on tarif_id = tserv_tarif_id
            left join service on service_id = tserv_service_id
            where tserv_tarif_id = ? and tserv_service_id = ? and tserv_is_product = 0`,[t.tserv_tarif_id,t.tserv_service_id]))[0]

            return res.send({status:true,tserv})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getModifPrixProduct(req,res){
        try {
            let t = req.query

            let tserv = (await D.exec_params(`select *,art_label as service_label from tarif_service 
            left join tarif on tarif_id = tserv_tarif_id
            left join article on art_id = tserv_service_id
            where tserv_tarif_id = ? and tserv_service_id = ? and tserv_is_product = 1`,[t.tserv_tarif_id,t.tserv_service_id]))[0]

            return res.send({status:true,tserv})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async modifPrix(req,res){
        try {
            let t = req.body

            let prix = parseInt(t.tserv_prix)

            console.log(t)


            if(prix.toString() == 'NaN'){
                return res.send({status:false,message:'Prix non correct'})
            }

            //Recherche d'abord si le truc existe dans la base ou non
            let tserv_test = await D.exec_params(`select * from tarif_service where tserv_tarif_id = ? and tserv_service_id = ? and tserv_is_product = ?`,
            [t.tserv_tarif_id,t.tserv_service_id,t.tserv_is_product])

            if(tserv_test.length > 0){
                await D.exec_params(`update tarif_service set tserv_prix = ? where tserv_tarif_id = ? and tserv_service_id = ? and tserv_is_product =  ?`,
                [prix,t.tserv_tarif_id,t.tserv_service_id,t.tserv_is_product])


            }else{
                //On crée le truc
                await D.set('tarif_service',{
                    tserv_service_id:t.tserv_service_id,
                    tserv_is_product:t.tserv_is_product,
                    tserv_tarif_id:t.tserv_tarif_id,
                    tserv_prix:t.tserv_prix
                })


                
            }

            // await D.exec_params(`update tarif_service set tserv_prix = ? where tserv_tarif_id = ? and tserv_service_id = ? and tserv_is_product =  ?`,
            // [prix,t.tserv_tarif_id,t.tserv_service_id,t.tserv_is_product])

            return res.send({status:true})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }



    static async update(req,res){ 
        
        try {  
            let s = req.body 
            //Mise à jour du service
            await D.updateWhere('service',s,{service_id:s.service_id})
            
            //Ici tous les fonctions sur l'enregistrement d'un service
            return res.send({status:true,message:"Mise à jour, fait"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    //Suppression d'un tarif
    static async delTarif(req,res){
        try {
            let tarif_id = req.params.tarif_id

            //Suppression des relations entra tarifs et services
            await D.del('tarif_service',{tserv_tarif_id:tarif_id})

            //suppression tarif
            await D.del('tarif',{tarif_id})

            return res.send({status:true})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }


    //récupération des sérvices enfant 
    //selon ou pas un service parent
    static async searchChild(req,res){
        try {
            let {parent_id,label} = req.query
            parent_id = (parent_id)?parent_id:null
            let services = await D.exec_params(`select * from service where service_parent_id ${(parent_id)?'= ?':'is not ?'} 
            and service_label like ?`,[parent_id,`%${label}%`])

        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Service;
