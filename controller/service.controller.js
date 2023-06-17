let D = require('../models/data')

let utils = require('../utils/utils')

let PDFDocument = require("pdfkit-table");
let fs = require('fs')
const { NumberToLetter } = require("convertir-nombre-lettre");
const ExcelJS = require('exceljs');

//Foncion options des tabs dans le truc
function opt_tab (head,datas,doc){
    return {
        // complex headers work with ROWS and DATAS  
        headers: head,
        // complex content
        datas:datas,
        options:{
            padding:5,
            align:'center',
            divider: {
                header: { disabled: false, width: 2, opacity: 1 },
                horizontal: { disabled: false, width: 2, opacity: 1 },
                vertical: { disabled: false, width: 2, opacity: 1 },
            },
            prepareHeader: () => {
                doc.font("fira_bold").fontSize(6)
                doc.fillAndStroke('black')
            },
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                doc.font("fira_bold").fontSize(7)
                doc.fillAndStroke('#47494d')
                //#47494d

                const {x, y, width, height} = rectCell;
                let head_h = 17
                let line_h = 2

                doc.lineWidth(line_h)

                // first line 
                if(indexColumn === 0){
                    doc
                    .moveTo(x, y)
                    .lineTo(x, y + height+1)
                    .stroke();
                }

                if(indexRow == 0 && indexColumn === 0){
                    doc
                    .lineWidth(line_h)
                    .moveTo(x, y)
                    .lineTo(x, y - head_h)
                    .stroke(); 

                    doc
                    .moveTo(x+width, y)
                    .lineTo(x+width, y - head_h)
                    .stroke(); 

                    doc
                    .moveTo(x, y-head_h)
                    .lineTo(x+width, y - head_h)
                    .stroke();


                }else if(indexRow == 0){
                    doc
                    .moveTo(x+width, y)
                    .lineTo(x+width, y - head_h)
                    .stroke(); 

                    doc
                    .moveTo(x, y-head_h)
                    .lineTo(x+width, y - head_h)
                    .stroke();
                }

                doc
                .moveTo(x + width, y)
                .lineTo(x + width, y + height+1)
                .stroke();

                if(indexRow == datas.length-1){
                    doc
                    .moveTo(x, y)
                    .lineTo(x + width, y)
                    .stroke();

                    doc
                    .moveTo(x, y+height)
                    .lineTo(x + width, y+height)
                    .stroke();

                    //doc.font("fira_bold")
                }
                // doc.fontSize(10).fillColor('#292929');
            },
        },
        // simple content (works fine!)
    } //Fin table options
} // --- fonction sur l'option des tables dans PDF kit

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


            if(req.query.down){
                let dt = {
                    services:srvs,
                    list_tarif,
                    pdf_name:'service-tarification'
                }

                await createTarifServicesPDF(dt)
                return res.send({status:true,pdf_name:dt.pdf_name})

            }else{
                return res.send({status:true,srvs,list_tarif,nb_total_service})
            }

            
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

            let srvs = []
            if(req.query.down){
                srvs = await D.exec_params(`select * from article order by art_code asc`)
            }else{
                srvs = await D.exec_params(`select * from article where art_label like ? order by art_code asc limit ?`,[filters.search,filters.limit])
            }

            //Récupération des tarifs de chaque produits
            for (let i = 0; i < srvs.length; i++) {
                const e = srvs[i];
                e.tarifs = await D.exec_params(`select * from tarif_service 
                left join tarif on tserv_tarif_id = tarif_id
                where tserv_service_id = ? and tserv_is_product = 1`,e.art_id)
            }

            //Liste des tarfis
            const list_tarif = await D.exec('select * from tarif')
            

            if(req.query.down){
                let dt = {
                    services:srvs,
                    list_tarif,
                    pdf_name:'med-tarification'
                }

                await createTarifMedPDF(dt)

                return res.send({status:true,pdf_name:dt.pdf_name})
            }else{
                return res.send({status:true,srvs,list_tarif})
            }
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
            parent_id = parseInt(parent_id)
            // parent_id = (parent_id == -1)?null:parent_id

            let services = [],serv_med=[],serv = []

            if(parent_id == -1){
                serv_med = await D.exec_params(`select *,
                art_label as service_label,art_code as service_code,art_id as service_id
                from article where art_label like ? limit 5`,[`%${label}%`])
                serv = await D.exec_params(`select * from service where service_parent_id is not null 
                and service_label like ? limit 5`,[`%${label}%`])

                services = [...serv,...serv_med]
            }else if(parent_id == -42){
                services = await D.exec_params(`select *,
                art_label as service_label,art_code as service_code,art_id as service_id
                from article where art_label like ? limit 10`,[`%${label}%`])
            }else{
                services = await D.exec_params(`select * from service where service_parent_id = ?
                and service_label like ? limit 10`,[parent_id,`%${label}%`])
            }

            return res.send({status:true,services})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}


//fonction de création de pdf pour l'impression des services
//ICI POUR L'EXPORTATION DES AVANCES
async function createTarifServicesPDF(dt){

    let {services,list_tarif} = dt

    //Les débuts du PDF
    let year_cur = new Date().getFullYear()
    const separateNumber = (n)=>{
        return (n)?n.toLocaleString('fr-CA'):''
    }


    //Les options du PDF
    //Création de pdf amzay e 🤣😂, 
    let opt = {
        margin: 15, size: 'A4' ,
        layout:'landscape'
    }   
    let doc = new PDFDocument(opt)

    //les fonts
    doc.registerFont('fira', 'fonts/fira.ttf');
    doc.registerFont('fira_bold', 'fonts/fira-bold.ttf');
    doc.font("fira")

    //Ecriture du PDF
    doc.pipe(fs.createWriteStream(`./files/${dt.pdf_name}.pdf`))

    //les marges et le truc en bas
    //______________________________________
    let bottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    doc.fontSize(8)

    doc.text(
        `Hôpital Andranomadio ${year_cur}`, 
        0.5 * (doc.page.width - 300),
        doc.page.height - 20,
        {
            width: 300,
            align: 'center',
            lineBreak: false,
        })

    // Reset text writer position
    doc.text('', 15, 15);
    doc.page.margins.bottom = bottom;
    doc.on('pageAdded', () => {
        let bottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;
    
        doc.text(
            `Hôpital Andranomadio ${year_cur}`, 
            0.5 * (doc.page.width - 300),
            doc.page.height - 20,
            {
                width: 300,
                align: 'center',
                lineBreak: false,
            })
    
        // Reset text writer position
        doc.text('', 50, 50);
        doc.page.margins.bottom = bottom;
    })
    //-----------------___________________---------------
    //------------- Ajout des titres en haut

    //Textes d'en haut du PDF
    let nom_hop = 'HOPITALY LOTERANA - ANDRANOMADIO'
    let title_pdf = 'Liste Tarification - services'.toUpperCase()
    let date_label = `Journée du : `
    let date_value = `${new Date().toLocaleDateString()}`
    // ----- LES TITRES D'EN HAUT ------------
    doc.font("fira_bold")
    let y_ttl = doc.y
    doc.text(nom_hop,{underline:true})

    let ttl_w = doc.widthOfString(title_pdf)
    
    doc.text(title_pdf,doc.page.width/2 - ttl_w/2,y_ttl)
    let ddl_w = doc.widthOfString(date_label)
    let ddlv_w = doc.widthOfString(date_value)
    doc.text(date_label,doc.page.width - (ddl_w + ddlv_w) - opt.margin,y_ttl)
    
    doc.text(date_value,doc.page.width - ddlv_w - opt.margin,y_ttl)

    y_ttl += 15
    //La ligne au dessous
    doc.lineWidth(.5)
    .moveTo(opt.margin, y_ttl)
    .lineTo(doc.page.width - opt.margin, y_ttl)
    .stroke();

    // ------- FIN HEADER 

    // DEBUT DES CALCULS
    doc.moveDown(2)
    doc.text('',opt.margin)

    let _head = []
    let _datas = []
    let table = {}

    let l_h = 9
    let p_w = 150

    let w_a = ( doc.page.width - (p_w) - opt.margin * 2) / 7
    _head = [
        { label:"Code".toUpperCase(), width:50,  property: 'code',renderer: null ,headerAlign:"center",align:"left"},
        { label:"Désignation".toUpperCase(), width:150,  property: 'service_label',renderer: null ,headerAlign:"center",align:"left"},
        
    ]


    let w_t = ( doc.page.width - (200) - opt.margin * 2) / list_tarif.length
    for (let i = 0; i < list_tarif.length; i++) {
        const t = list_tarif[i];
        
        _head.push({ label:t.tarif_label.toUpperCase(), width:w_t,  property:`tr:${t.tarif_id}`,renderer: null ,headerAlign:"center",align:"right"},)
    }

    let tmp = {}
    for (let i = 0; i < services.length; i++) {
        const e = services[i];
        tmp = {
            code:e.service_code,
            service_label:e.service_label
        }

        if(e.tarifs){
            for (let j = 0; j < e.tarifs.length; j++) {
                const t = e.tarifs[j];
                tmp[`tr:${t.tarif_id}`] = (t.tserv_prix)?separateNumber(t.tserv_prix):'0'   
            }
        }
        
        _datas.push(tmp)
    }

    

    doc.moveDown(5)

    table = opt_tab(_head,_datas,doc)
    await doc.table(table, { /* options */ });

    doc.end()
}

async function createTarifMedPDF(dt){

    let {services,list_tarif} = dt

    //Les débuts du PDF
    let year_cur = new Date().getFullYear()
    const separateNumber = (n)=>{
        return (n)?n.toLocaleString('fr-CA'):''
    }


    //Les options du PDF
    //Création de pdf amzay e 🤣😂, 
    let opt = {
        margin: 15, size: 'A4' ,
        layout:'landscape'
    }   
    let doc = new PDFDocument(opt)

    //les fonts
    doc.registerFont('fira', 'fonts/fira.ttf');
    doc.registerFont('fira_bold', 'fonts/fira-bold.ttf');
    doc.font("fira")

    //Ecriture du PDF
    doc.pipe(fs.createWriteStream(`./files/${dt.pdf_name}.pdf`))

    //les marges et le truc en bas
    //______________________________________
    let bottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    doc.fontSize(8)

    doc.text(
        `Hôpital Andranomadio ${year_cur}`, 
        0.5 * (doc.page.width - 300),
        doc.page.height - 20,
        {
            width: 300,
            align: 'center',
            lineBreak: false,
        })

    // Reset text writer position
    doc.text('', 15, 15);
    doc.page.margins.bottom = bottom;
    doc.on('pageAdded', () => {
        let bottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;
    
        doc.text(
            `Hôpital Andranomadio ${year_cur}`, 
            0.5 * (doc.page.width - 300),
            doc.page.height - 20,
            {
                width: 300,
                align: 'center',
                lineBreak: false,
            })
    
        // Reset text writer position
        doc.text('', 50, 50);
        doc.page.margins.bottom = bottom;
    })
    //-----------------___________________---------------
    //------------- Ajout des titres en haut

    //Textes d'en haut du PDF
    let nom_hop = 'HOPITALY LOTERANA - ANDRANOMADIO'
    let title_pdf = 'Liste Tarification - médicaments'.toUpperCase()
    let date_label = `Journée du : `
    let date_value = `${new Date().toLocaleDateString()}`
    // ----- LES TITRES D'EN HAUT ------------
    doc.font("fira_bold")
    let y_ttl = doc.y
    doc.text(nom_hop,{underline:true})

    let ttl_w = doc.widthOfString(title_pdf)
    
    doc.text(title_pdf,doc.page.width/2 - ttl_w/2,y_ttl)
    let ddl_w = doc.widthOfString(date_label)
    let ddlv_w = doc.widthOfString(date_value)
    doc.text(date_label,doc.page.width - (ddl_w + ddlv_w) - opt.margin,y_ttl)
    
    doc.text(date_value,doc.page.width - ddlv_w - opt.margin,y_ttl)

    y_ttl += 15
    //La ligne au dessous
    doc.lineWidth(.5)
    .moveTo(opt.margin, y_ttl)
    .lineTo(doc.page.width - opt.margin, y_ttl)
    .stroke();

    // ------- FIN HEADER 

    // DEBUT DES CALCULS
    doc.moveDown(2)
    doc.text('',opt.margin)

    let _head = []
    let _datas = []
    let table = {}

    let l_h = 9
    let p_w = 150

    let w_a = ( doc.page.width - (p_w) - opt.margin * 2) / 7
    _head = [
        { label:"Code".toUpperCase(), width:50,  property: 'code',renderer: null ,headerAlign:"center",align:"left"},
        { label:"Désignation".toUpperCase(), width:150,  property: 'service_label',renderer: null ,headerAlign:"center",align:"left"},
        
    ]


    let w_t = ( doc.page.width - (200) - opt.margin * 2) / list_tarif.length
    for (let i = 0; i < list_tarif.length; i++) {
        const t = list_tarif[i];
        
        _head.push({ label:t.tarif_label.toUpperCase(), width:w_t,  property:`tr:${t.tarif_id}`,renderer: null ,headerAlign:"center",align:"right"},)
    }

    let tmp = {}
    for (let i = 0; i < services.length; i++) {
        const e = services[i];
        tmp = {
            code:e.art_code,
            service_label:e.art_label
        }

        if(e.tarifs){
            for (let j = 0; j < e.tarifs.length; j++) {
                const t = e.tarifs[j];
                tmp[`tr:${t.tarif_id}`] = (t.tserv_prix)?separateNumber(t.tserv_prix):'0'   
            }
        }
        
        _datas.push(tmp)
    }

    

    doc.moveDown(5)

    table = opt_tab(_head,_datas,doc)
    await doc.table(table, { /* options */ });

    doc.end()
}

module.exports = Service;
