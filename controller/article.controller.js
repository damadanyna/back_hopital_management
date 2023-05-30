const { updateWhere } = require('../models/data');
let PDFDocument = require("pdfkit-table");
let fs = require('fs')
let D = require('../models/data')
let U = require('../utils/utils')

const ExcelJS = require('exceljs');

class Article{
    static async register(req,res){ 
        
        let _d = req.body;
        let {user_id} = _d 

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

            //historique de l'utilisateur
            let hist = {
                uh_user_id:user_id,
                uh_code:req.uh.add_art.k,
                uh_description:req.uh.add_art.l,
                uh_module:'Stock',
                uh_extras:JSON.stringify({
                    datas:{
                        article:(await D.exec_params('select * from article where art_id = ?',[_art.insertId]))[0]
                    }
                })
            }

            await D.set('user_historic',hist)
            //Fin historique

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

            //Suppression des occurences
            await U.delOccurStk()

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
            let {user_id} = req.query

            
            //historique de l'utilisateur
            let hist = {
                uh_user_id:user_id,
                uh_code:req.uh.del_art.k,
                uh_description:req.uh.del_art.l,
                uh_module:'Stock',
                uh_extras:JSON.stringify({
                    datas:{
                        article:(await D.exec_params('select * from article where art_id = ?',[art_id]))[0]
                    }
                })
            }

            await D.set('user_historic',hist)
            //Fin historique


            await D.del('article',{art_id})

            
            //On doit aussi supprimer les relations entre l'article et les autres tables
            //suppression ny relation tarif et article
            await D.exec_params('delete from tarif_service where tserv_service_id = ? and tserv_is_product = 1',[art_id])

            //suppression dans mart
            await D.exec_params('delete from mvmt_art where mart_art_id = ?',[art_id])

            //suppression dans stock
            await D.exec_params('delete from stock_article where stk_art_id = ?',[art_id])

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

        let { article,stock,list_depot,user_id } = data

        let g_stock = article.g_stock
        delete article.g_stock
        delete article.art_date_enreg


        // var array=[]
        // for (const key in data) { 
        //     array.push({[key]:data[key]})
        // }  

        
        try {
            let old = (await D.exec_params('select * from article where art_id = ?',[article.art_id]))[0]
            
            //Mise à jour e l'article
            await D.updateWhere('article',article,{art_id:article.art_id})

            //historique de l'utilisateur
            let hist = {
                uh_user_id:user_id,
                uh_code:req.uh.modif_art.k,
                uh_description:req.uh.modif_art.l,
                uh_module:'Stock',
                uh_extras:JSON.stringify({
                    datas:{
                        article:old
                    }
                })
            }

            await D.set('user_historic',hist)
            //Fin historique

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

            //Suppression des occurences
            await U.delOccurStk()

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

    static async searchInMvmt(req,res){
        try {
            let filters = req.query
            filters.search = (filters.search)?filters.search:''

            let articles = await D.exec_params(`select * from article where 
                art_label like ? limit 50`,[`%${filters.search}%`])
            return res.send({status:true,articles})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async exportList(req,res){
        try {

            //initialisation de l'Excel
            const workbook = new ExcelJS.Workbook();

            //----------------------------------------
            workbook.creator = 'xd creator';
            workbook.lastModifiedBy = 'xd creator';
            workbook.lastPrinted = new Date(2016, 9, 27);
            workbook.properties.date1904 = true;
            workbook.calcProperties.fullCalcOnLoad = true;

            //-----------------------------------------
            workbook.views = [
                {
                  x: 0, y: 0, width: 10000, height: 20000,
                  firstSheet: 0, activeTab: 1, visibility: 'visible'
                }
              ]
            //________________________________________

            //Ajout du sheet
            const sheet = workbook.addWorksheet('Articles');


            //Récupération des données
            let articles = await D.exec_params(`select * from article`)
            
            let a_size = articles.length

            //Boucle pour récupérer les informations sur le stock
            for (let i = 0; i < a_size; i++) {
                //articles[i]['g_stock'] = await D.exec_params(`select * from stock_article left join depot on depot_id = stk_depot_id where stk_art_id = ? `,articles[i].art_id) 
                articles[i]['g_stock'] = await D.exec_params(`select * from depot 
                left join stock_article on depot_id = stk_depot_id where stk_art_id = ? `,articles[i].art_id) 
            }
            let list_depot = await D.exec('select * from depot')
            let year_cur = new Date().getFullYear()

            //Insertion ana tableau amzay
            let _head = [
                { header:"Code".toUpperCase(), key: 'art_code',width:10},
                { header:"Désignation".toUpperCase(), key: 'art_label',width:40},
                { header:"Unité".toUpperCase(), key: 'art_unite_stk',width:10},
                { header:"Conditionnement".toUpperCase(), key: 'art_conditionnement',width:20},
                { header:"Nb boîte".toUpperCase(), key: 'art_nb_box',width:10},
                { header:"Stock Total".toUpperCase(), key: 'stock_total',width:15},
                { header:list_depot[0].depot_label, key: 'depot_1',width:15},
                { header:list_depot[1].depot_label, key: `depot_2`,width:20},
            ]

            

            sheet.columns = _head

            //les datas
            let _datas = [],cur_d = {}

            function getStockTotal(g_stock){
                if(g_stock.length <= 0) return 0

                let s = 0
                //Calcul kely
                for (let i = 0; i < list_depot.length; i++) {
                    const d = list_depot[i];
                    for (let j = 0; j < g_stock.length; j++) {
                        const st = g_stock[j];
                        if(st.depot_id == d.depot_id){
                            s += parseInt(st.stk_actuel)
                            break
                        }
                    }
                }

                return s
            }

            function getDepotStock(g_stock,dp_id){
                if(g_stock.length <= 0) return 0

                for (let j = 0; j < g_stock.length; j++) {
                    const st = g_stock[j];
                    if(st.depot_id == dp_id){
                        return parseInt(st.stk_actuel)
                        
                    }
                }

                return 0
            }

            //Boucle sur le facture
            for (let i = 0; i < articles.length; i++) {
                const e = articles[i];
                _datas.push({
                    art_code: e.art_code,
                    art_label:e.art_label,
                    art_unite_stk:(e.art_unite_stk)?e.art_unite_stk:'',
                    art_conditionnement:(e.art_conditionnement)?e.art_conditionnement:'',
                    art_nb_box:(e.art_nb_box)?e.art_nb_box:0,
                    stock_total:getStockTotal(e.g_stock),
                    depot_1:getDepotStock(e.g_stock,list_depot[0].depot_id),
                    depot_2:getDepotStock(e.g_stock,list_depot[1].depot_id),
                })
            }

            sheet.addRows(_datas);

            sheet.insertRow(1, [`inventaire le ${new Date().toLocaleDateString()}`.toUpperCase()]);
            sheet.insertRow(2, ['']);


            sheet.getRow(3).font = {bold:true,}
            sheet.getRow(1).font = {bold:true,size: 16,underline: true,}
            
            // sheet.columns = [
            //     { header: 'Id', key: 'id', width: 10 },
            //     { header: 'Name', key: 'name', width: 32 },
            //     { header: 'D.O.B.', key: 'DOB', width: 10, outlineLevel: 1 }
            // ];

            // sheet.addRow({id: 1, name: 'John Doe', dob: new Date(1970,1,1)});
            // sheet.addRow({id: 2, name: 'Jane Doe', dob: new Date(1965,1,7)});


            let path = req.query.filepath
            await workbook.xlsx.writeFile(`${path}.xlsx`);
            // console.log('Exportation article en Excel');
            return res.send({status:true})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }

    }

    static async printList(req,res){
        try {


            //Récupération des données à imprimer
            let articles = await D.exec_params(`select * from article`)
            
            let a_size = articles.length

            //Boucle pour récupérer les informations sur le stock
            for (let i = 0; i < a_size; i++) {
                //articles[i]['g_stock'] = await D.exec_params(`select * from stock_article left join depot on depot_id = stk_depot_id where stk_art_id = ? `,articles[i].art_id) 
                articles[i]['g_stock'] = await D.exec_params(`select * from depot 
                left join stock_article on depot_id = stk_depot_id where stk_art_id = ? `,articles[i].art_id) 
            }

            let list_depot = await D.exec('select * from depot')



            let year_cur = new Date().getFullYear()
            const separateNumber = (n)=>{
                return (n)?n.toLocaleString('fr-CA'):''
            }


            //Les options du PDF
            //Création de pdf amzay e, 
            let opt = {
                margin: 15, size: 'A4' ,layout:'landscape'
            }   
            let doc = new PDFDocument(opt)

            //les fonts
            doc.registerFont('fira', 'fonts/fira.ttf');
            doc.registerFont('fira_bold', 'fonts/fira-bold.ttf');
            doc.font("fira")



            //Ecriture du PDF
            doc.pipe(fs.createWriteStream(`./files/article.pdf`))

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

            //Définition des tailles
            let margin = 25
            

            //Insertion ana tableau amzay
            let _head = [
                { label:"code", property: 'art_code',renderer: null ,width:50},
                { label:"Désignation", property: 'art_label', renderer: null,align: "left" ,headerAlign:"center" ,width:200},
                { label:"Unité", property: 'art_unite_stk', renderer: null,align: "left" ,headerAlign:"center" ,width:70},
                { label:"Conditionnement", property: 'art_conditionnement', renderer: null,align: "right" ,headerAlign:"center" ,width:100},
                { label:"Nb boîte", property: 'art_nb_box', renderer: null,align: "right" ,headerAlign:"center" ,width:50},
                { label:"Stock Total", property: 'stock_total', renderer: null,align: "right" ,headerAlign:"center" ,width:100},
                { label:list_depot[0].depot_label, property: 'depot_1', renderer: null,align: "right" ,headerAlign:"center" ,width:100},
                { label:list_depot[1].depot_label, property: `depot_2`, renderer: null,align: "right" ,headerAlign:"center" ,width:100},
            ]

            //les datas
            let _datas = [],cur_d = {}

            function getStockTotal(g_stock){
                if(g_stock.length <= 0) return 0

                let s = 0
                //Calcul kely
                for (let i = 0; i < list_depot.length; i++) {
                    const d = list_depot[i];
                    for (let j = 0; j < g_stock.length; j++) {
                        const st = g_stock[j];
                        if(st.depot_id == d.depot_id){
                            s += parseInt(st.stk_actuel)
                            break
                        }
                    }
                }

                return s
            }

            function getDepotStock(g_stock,dp_id){
                if(g_stock.length <= 0) return 0

                for (let j = 0; j < g_stock.length; j++) {
                    const st = g_stock[j];
                    if(st.depot_id == dp_id){
                        return parseInt(st.stk_actuel)
                        
                    }
                }

                return 0
            }

            //Boucle sur le facture
            for (let i = 0; i < articles.length; i++) {
                const e = articles[i];
                _datas.push({
                    art_code: e.art_code,
                    art_label:e.art_label,
                    art_unite_stk:(e.art_unite_stk)?e.art_unite_stk:'-',
                    art_conditionnement:(e.art_conditionnement)?e.art_conditionnement:'-',
                    art_nb_box:(e.art_nb_box)?e.art_nb_box:'-',
                    stock_total:getStockTotal(e.g_stock).toLocaleString('fr-CA'),
                    depot_1:getDepotStock(e.g_stock,list_depot[0].depot_id).toLocaleString('fr-CA'),
                    depot_2:getDepotStock(e.g_stock,list_depot[1].depot_id).toLocaleString('fr-CA'),
                })
            }

            //Insertion des écritures
            doc.font('fira')
            doc.fontSize(10)
            doc.text('INVENTAIRE')
            doc.text(`Le ${new Date().toLocaleDateString()}`)

            doc.moveDown()


            // Table du truc
            const table = {
                // complex headers work with ROWS and DATAS  
                headers: _head,
                // complex content
                datas:_datas,
                options:{
                    padding:5,
                    align:'center',
                    divider: {
                        header: { disabled: false, width: 1, opacity: 0.5 },
                        horizontal: { disabled: false, width: 0.5, opacity: 0 },
                        vertical: { disabled: false, width: 0.5, opacity: 0.5 },
                    },
                    prepareHeader: () => {
                        doc.font("fira_bold").fontSize(8)
                        doc.fillAndStroke('#575a61')
                    },
                    prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                        doc.font("fira").fontSize(8)
                        doc.fillAndStroke('#47494d')
                        //#47494d

                        const {x, y, width, height} = rectCell;
                        let head_h = 17

                        // first line 
                        if(indexColumn === 0){
                            doc
                            .lineWidth(.5)
                            .moveTo(x, y)
                            .lineTo(x, y + height+1)
                            .stroke();
                        }

                        if(indexRow == 0 && indexColumn === 0){
                            doc
                            .lineWidth(.5)
                            .moveTo(x, y)
                            .lineTo(x, y - head_h)
                            .stroke(); 

                            doc
                            .lineWidth(.5)
                            .moveTo(x+width, y)
                            .lineTo(x+width, y - head_h)
                            .stroke(); 

                            doc
                            .lineWidth(.5)
                            .moveTo(x, y-head_h)
                            .lineTo(x+width, y - head_h)
                            .stroke();


                        }else if(indexRow == 0){
                            doc
                            .lineWidth(.5)
                            .moveTo(x+width, y)
                            .lineTo(x+width, y - head_h)
                            .stroke(); 

                            doc
                            .lineWidth(.5)
                            .moveTo(x, y-head_h)
                            .lineTo(x+width, y - head_h)
                            .stroke();
                        }

                        doc
                        .lineWidth(.5)
                        .moveTo(x + width, y)
                        .lineTo(x + width, y + height+1)
                        .stroke();

                        if(indexRow == _datas.length-1){
                            doc
                            .lineWidth(.5)
                            .moveTo(x, y)
                            .lineTo(x + width, y)
                            .stroke();

                            doc
                            .lineWidth(.5)
                            .moveTo(x, y+height)
                            .lineTo(x + width, y+height)
                            .stroke();

                            doc.font("fira_bold")
                        }
                        // doc.fontSize(10).fillColor('#292929');
                    },
                },
                // simple content (works fine!)
            }

            await doc.table(table, { /* options */ });

            //Famaranana an'ilay document
            doc.end();

            return res.send({status:true})
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }

    static async downloadArticleList(req,res){
        try {
            let data = fs.readFileSync(`./files/article.pdf`)
            res.contentType("application/pdf")
            // console.log(data)
            // res.download(`./facture.pdf`)
            res.send(data);
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur dans la base de donnée"})
        }
    }
}

module.exports = Article;
