let D = require('../models/data')

class Patient{
    static async register(req,res){ 
        
        let _d = req.body; 
        let user_id = _d.user_id

        // console.log(_d)
        let patient_data={
            pat_id:{front_name:'pat_id',fac:true},
            pat_nom_et_prenom:{front_name:'pat_nom_et_prenom',fac:false}, 
            pat_date_naiss :{front_name:'pat_date_naiss',fac:true,format:(a)=> new Date(a)},
            pat_adresse:{front_name:'pat_adresse',fac:true}, 
            pat_profession:{front_name:'pat_profession',fac:false}, 
            pat_sexe:{front_name:'pat_sexe',fac:false}, 
            pat_numero:{front_name:'pat_numero',fac:false}, 
            pat_dernier_visite:{front_name:'pat_dernier_visite',fac:true,format:(a)=> (a)?new Date(a):null},

        };

        //Vérification du patient
        const _pd_keys = Object.keys(patient_data)
        let _tmp = {}
        let _list_error = []
        
        try {
            _pd_keys.forEach((v,i)=>{
                _tmp = patient_data[v]
                if(!_tmp.fac && !_d[_tmp.front_name]){
    
                    _list_error.push({code:_tmp.front_name})
                }
            })
            
            if(_list_error.length> 0){
                return res.send({status:false,message:"Certains champs sont vide",data:_list_error})
            }
    
            //Si la vérification c'est bien passé, 
            // on passe à l'insertion du patient
            let _data = {}
            _pd_keys.forEach((v,i)=>{
                _tmp = patient_data[v]
    
                _d[_tmp.front_name] = (_tmp.format)?_tmp.format(_d[_tmp.front_name]):_d[_tmp.front_name]
                 
                _data[v] = _d[_tmp.front_name]
            })
            
            //l'objet patient est rempli maintenant
            // Vérification de l'unicité du numéro patient
            if(_data.pat_numero){
                let existing = await D.exec_params('select pat_id from patient where pat_numero = ? limit 1',[_data.pat_numero])
                if(existing.length > 0){
                    return res.send({status:false,message:`Le numéro ${_data.pat_numero} est déjà attribué à un autre patient`})
                }
            }

            // on l'insert dans la base de donnée
            let pp = await D.set('patient',_data)

            //enregistrement de l'historique utilisateur
            let hist = {
                uh_user_id:user_id,
                uh_code:req.uh.add_pat.k,
                uh_description:req.uh.add_pat.l,
                uh_module:'Fiche Patient',
                uh_extras:JSON.stringify({
                    datas:{
                        patient:(await D.exec_params('select * from patient where pat_id = ?',[pp.pat_id]))[0]
                    }
                })
            }
            await D.set('user_historic',hist)


            //Ici tous les fonctions sur l'enregistrement d'un patient
            return res.send({status:true,message:"patient bien enregistrer."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async delete(req,res){
        try {   
            let pat_id = req.params.pat_id

            //suppresion de TOUS les encaissements liés au patient
            let encList = await D.exec_params('select * from encaissement where enc_pat_id = ?',[pat_id])
            for(let c of encList){
                await D.del('enc_serv',{encserv_enc_id:c.enc_id})
                await D.del('enc_prescri',{encp_enc_id:c.enc_id})
                await D.del('enc_avance',{encav_enc_id:c.enc_id})
                await D.del('encmvmt',{em_enc_id:c.enc_id})
                await D.del('encaissement',{enc_id:c.enc_id})
            }

            //suppresion de TOUTES les prises en charge liées au patient
            let pecList = await D.exec_params('select * from encharge where encharge_pat_id = ?',[pat_id])
            for(let pec of pecList){
                let factList = await D.exec_params('select * from facture where fact_encharge_id = ?',[pec.encharge_id])
                for(let f of factList){
                    await D.del('fact_service',{fserv_fact_id:f.fact_id})
                    await D.del('facture',{fact_id:f.fact_id})
                }
                await D.del('encharge',{encharge_id:pec.encharge_id})
            }

            //suppresion de TOUTES les consultations liées au patient
            await D.exec_params('delete from consultation where cons_pat_id = ?',[pat_id])
            //zay vao vita ny suppresion ana Patient


            let old = (await D.exec_params('select * from patient where pat_id = ?',[pat_id]))[0]
            //Suppression du patient dans la grande liste
            await D.del('patient',{pat_id})

            //enregistrement de l'historique utilisateur
            let {user_id} = req.query
            let hist = {
                uh_user_id:user_id,
                uh_code:req.uh.del_pat.k,
                uh_description:req.uh.del_pat.l,
                uh_module:'Fiche Patient',
                uh_extras:JSON.stringify({
                    datas:{
                        patient:old
                    }
                })
            }
            await D.set('user_historic',hist)
            //Ici tous les fonctions sur l'enregistrement d'un patient
            return res.send({status:true,message:"patient supprimé."})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée. Il est possible que le patient n'existe plus"})
        }
 
    }  
    
    static async getList(req,res){ 
        let filters = req.query

        let _allowed_columns = ['pat_numero','pat_nom_et_prenom','pat_profession','pat_adresse']
        let default_sort_by = 'pat_numero'

        filters.page = (!filters.page )?1:parseInt(filters.page)
        filters.limit = (!filters.limit)?10000:parseInt(filters.limit)
        filters.sort_by = (!filters.sort_by)?default_sort_by:(_allowed_columns.indexOf(filters.sort_by) !== -1 ? filters.sort_by : default_sort_by)

        let search_by = (_allowed_columns.indexOf(filters.search_by) !== -1) ? filters.search_by : 'pat_nom_et_prenom'
        let search = (filters.search || '').trim()
        let likeSearch = `%${search}%`

        try { 
            let t0 = Date.now()

            let searchQuery
            let searchParams
            if(!search){
                searchQuery = `select * from patient order by ${filters.sort_by} limit ?`
                searchParams = [filters.limit]
            }else if(search_by === 'pat_nom_et_prenom' && search.length >= 3){
                // FULLTEXT search — beaucoup plus rapide que LIKE '%xxx%'
                let ftSearch = search.split(/\s+/).map(w => '+' + w + '*').join(' ')
                searchQuery = `select * from patient where MATCH(pat_nom_et_prenom) AGAINST(? IN BOOLEAN MODE) order by ${filters.sort_by} limit ?`
                searchParams = [ftSearch, filters.limit]
            }else if(search_by === 'pat_numero'){
                // Utilise l'index B-tree avec prefix match
                searchQuery = `select * from patient where pat_numero like ? order by ${filters.sort_by} limit ?`
                searchParams = [`${search}%`, filters.limit]
            }else{
                searchQuery = `select * from patient where ${search_by} like ? order by ${filters.sort_by} limit ?`
                searchParams = [likeSearch, filters.limit]
            }

            //Exécuter recherche et count en parallèle
            let [reponse, countResult] = await Promise.all([
                D.exec_params(searchQuery, searchParams),
                D.exec('select count(*) as nb from patient')
            ])

            let nb_total_patient = countResult[0].nb

            let t1 = Date.now()
            if(t1 - t0 > 500) console.log(`[PERF] patient getList: ${t1-t0}ms (search="${search}", by=${search_by})`)

            return res.send({status:true,reponse,nb_total_patient})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async update(req,res){ 
        let p = req.body 

        let {user_id} = p

        let old_p = (await D.exec_params('select * from patient where pat_id = ?',[p.pat_id]))[0]

        delete p.pat_date_enreg
        delete p.user_id

        p.pat_date_naiss = (p.pat_date_naiss)?new Date(p.pat_date_naiss):null
        p.pat_dernier_visite = (p.pat_dernier_visite)?new Date(p.pat_dernier_visite):null

        //quelques vérification des formulaires
        if(!p.pat_nom_et_prenom || !p.pat_nom_et_prenom.trim()){
            return res.send({status:false,message:"Le Patient est obligatoire"})
        }

        if(!p.pat_numero || !p.pat_numero.trim()){
            return res.send({status:false,message:"Le Numéro du Patient est obligatoire"})
        }

        try {
            // Vérification de l'unicité du numéro patient
            let existing = await D.exec_params('select pat_id from patient where pat_numero = ? and pat_id != ? limit 1',[p.pat_numero.trim(), p.pat_id])
            if(existing.length > 0){
                return res.send({status:false,message:`Le numéro ${p.pat_numero} est déjà attribué à un autre patient`})
            }

            await D.updateWhere('patient',p,{pat_id:p.pat_id})

            //enregistrement de l'historique utilisateur
            let hist = {
                uh_user_id:user_id,
                uh_code:req.uh.modif_pat.k,
                uh_description:req.uh.modif_pat.l,
                uh_module:'Fiche Patient',
                uh_extras:JSON.stringify({
                    datas:{
                        patient:old_p
                    }
                })
            }
            await D.set('user_historic',hist)
            //Ici tous les fonctions sur l'enregistrement d'un patient
            return res.send({status:true,message:"Mise à jour, fait"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getRelations(req,res){
        try {
            let pat_id = req.params.pat_id

            let [encResult, pecResult, consResult, factResult, avanceResult] = await Promise.all([
                D.exec_params('select count(*) as nb from encaissement where enc_pat_id = ?',[pat_id]),
                D.exec_params('select count(*) as nb from encharge where encharge_pat_id = ?',[pat_id]),
                D.exec_params('select count(*) as nb from consultation where cons_pat_id = ?',[pat_id]),
                D.exec_params(`select count(*) as nb from facture f 
                    inner join encharge e on f.fact_encharge_id = e.encharge_id 
                    where e.encharge_pat_id = ?`,[pat_id]),
                D.exec_params(`select count(*) as nb from enc_avance ea
                    inner join encaissement e on ea.encav_enc_id = e.enc_id
                    where e.enc_pat_id = ?`,[pat_id])
            ])

            return res.send({status:true, relations:{
                encaissements: encResult[0].nb,
                prises_en_charge: pecResult[0].nb,
                consultations: consResult[0].nb,
                factures: factResult[0].nb,
                avances: avanceResult[0].nb
            }})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async getDuplicates(req,res){
        try {
            let patients = await D.exec(`
                SELECT p.* FROM patient p
                INNER JOIN (
                    SELECT pat_numero, COUNT(*) as nb
                    FROM patient
                    WHERE pat_numero IS NOT NULL AND pat_numero != ''
                    GROUP BY pat_numero
                    HAVING COUNT(*) > 1
                ) dup ON p.pat_numero = dup.pat_numero
                ORDER BY p.pat_numero, p.pat_nom_et_prenom
            `)

            let grouped = {}
            for(let p of patients){
                if(!grouped[p.pat_numero]) grouped[p.pat_numero] = []
                grouped[p.pat_numero].push(p)
            }

            return res.send({status:true, duplicates: grouped, total: patients.length})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async updateNumero(req,res){
        try {
            let {pat_id, pat_numero, user_id} = req.body

            if(!pat_id || !pat_numero || !pat_numero.trim()){
                return res.send({status:false,message:"Le numéro du patient est obligatoire"})
            }

            let old_p = (await D.exec_params('select * from patient where pat_id = ?',[pat_id]))[0]
            if(!old_p) return res.send({status:false,message:"Patient introuvable"})

            // Vérification de l'unicité du numéro patient
            let existing = await D.exec_params('select pat_id from patient where pat_numero = ? and pat_id != ? limit 1',[pat_numero.trim(), pat_id])
            if(existing.length > 0){
                return res.send({status:false,message:`Le numéro ${pat_numero.trim()} est déjà attribué à un autre patient`})
            }

            await D.exec_params('update patient set pat_numero = ? where pat_id = ?',[pat_numero.trim(), pat_id])

            let hist = {
                uh_user_id:user_id,
                uh_code:req.uh.modif_pat.k,
                uh_description:`Modification numéro patient: ${old_p.pat_numero} -> ${pat_numero.trim()}`,
                uh_module:'Fiche Patient',
                uh_extras:JSON.stringify({
                    datas:{
                        patient:old_p,
                        new_numero:pat_numero.trim()
                    }
                })
            }
            await D.set('user_historic',hist)

            return res.send({status:true,message:"Numéro mis à jour"})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async outSearch(req,res){
        try {
            let  {by,search} = req.query

            search = `%${search}%`
            let patients = await D.exec_params(`select * from patient where ${by} like ? or pat_nom_et_prenom like ? limit 50`,[search,search])

            return res.send({status:true,patients})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Patient;
