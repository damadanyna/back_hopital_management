let router = require('express').Router()
let fs = require('fs')
let axios = require('axios')
let sharp = require('sharp')


const PDFDocument = require('pdfkit');


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});


router.get('/list',async (req,res)=>{
    try {
        const folder = './files/';
        const fs = require('fs');

        fs.readdir(folder, (err, files) => {
            return res.send({status:true,files})
        });
    } catch (e) {
        // resolve error
        console.log(e);
        return res.send({status:false,message:e})
    }
})
//regarder les pdfs 
router.get('/view/:pdf_name',async (req,res)=>{
    try {
        let data = fs.readFileSync(`files/${req.params.pdf_name}.pdf`)
        res.contentType("application/pdf")
        res.send(data)
    } catch (e) {
        // resolve error
        console.log(e);
        return res.send({status:false,message:`Le PDF ${req.params.pdf_name} n'existe pas`})
    }
})

router.post('/generate',async(req,res)=>{
    let D = require('../models/data')
    let name_pdf = req.body.name_pdf
    let pans_id = req.body.pans_id
    let rapport_ann = req.body.rapport_ann

    try {
        let sql = `select *,
        (select cat_label from category c where c.cat_id = format.parent_cat_id ) as parent_cat_label
        from panneau p
        left join category format on p.cat_id = format.cat_id
        left join regisseur as reg on p.reg_id = reg.reg_id
        left join lieu l on p.lieu_id = l.lieu_id 
        left join file on p.image_id = file.file_id
        where p.pan_id in (?)`

        const panels = await D.exec_params(sql,[pans_id])

        await createPDF(name_pdf,panels,rapport_ann)
        

        return res.send({status:true,link_pdf:`/api/a/pdf/view/${name_pdf}`})
        
    } catch (e) {
        // resolve error
        console.log(e);
        return res.send({status:false,err})
    }
})


const createPDF = async (name_pdf,panels,rapport_ann)=>{
    let D = require('../models/data')
    try {
        const doc = new PDFDocument({autoFirstPage: false});
        doc.pipe(fs.createWriteStream(`files/${name_pdf}.pdf`))

        let pan = {}

        for(let i = 0;i<panels.length;i++){
            pan = panels[i]
            doc.addPage({
                size: 'a4'
            });
    
            // Register a font
            doc.registerFont('f_bold', 'statics/typewcond_bold.otf');
            doc.registerFont('f_regular', 'statics/typewcond_regular.otf');
            
    
            //Slider
            let side = {
                w:150
            }
    
            //Le fond du pdf
    
            let grad = doc.linearGradient(0, 0, doc.page.width, doc.page.height);
            grad.stop(0, 'white')
                .stop(1, '#BC3230');
    
                doc.save()
            doc.rect(0, 0, doc.page.width, doc.page.height);
            doc.fill(grad);
    
            doc.restore()
    
            //
            //Insertion d'image
            doc.save()
            doc.circle(75, 75, 70).clip()
            .lineWidth(10).strokeOpacity(1)
            .stroke("white")
            doc.image('statics/app_icon.jpg',5,5,{width: 140})
            doc.restore()
            
    
            let ft_sz = {
                n:14,
                s:10
            }
            
            doc.fillColor('#646464')
            //Ref Publoc
            
    
            doc.lineWidth(5)
            doc.lineJoin('round')
            .rect(10, 160, 130, doc.page.height-400)
            .fillAndStroke('#BC3230','#BC3230');
    
            doc.save()
            doc.fillColor('white')
            doc.fontSize(ft_sz.s).font('f_bold').text('Référene ...',20,170)
            doc.fontSize(ft_sz.n).font('f_regular').text(pan.pan_publoc_ref)
            doc.moveDown()
            //Insertion de la catégorie
            doc.fontSize(ft_sz.s).font('f_bold').text('Catégorie ...')
            doc.fontSize(ft_sz.n).font('f_regular').text(pan.parent_cat_label)
            doc.moveDown()
    
            //Insertion de la Format
            doc.fontSize(ft_sz.s).font('f_bold').text('Format ...')
            doc.fontSize(ft_sz.n).font('f_regular').text(pan.cat_label)
            doc.moveDown()
    
            //Insertion de la catégorie
            doc.fontSize(ft_sz.s).font('f_bold').text('Surface ... (m2)')
            doc.fontSize(ft_sz.n).font('f_regular').text(pan.pan_surface)
            doc.moveDown()

            //Insertion de la catégorie
            doc.fontSize(ft_sz.s).font('f_bold').text('Ville ...')
            doc.fontSize(ft_sz.n).font('f_regular').text(pan.lieu_ville)
            doc.moveDown()
    
            //Insertion de la catégorie
            doc.fontSize(ft_sz.s).font('f_bold').text('Quartier ...')
            doc.fontSize(ft_sz.n).font('f_regular').text(pan.lieu_quartier)
            doc.moveDown()
    
            doc.restore()
    
            
    
            //Traçage de la ligne qui sépare le side et le content
            doc.moveTo(side.w, 0).lineTo(side.w,doc.page.height).strokeOpacity(0.3).lineWidth(1).stroke('black')
    
            //L'autre côté du pdf
    
            let content = {
                w:doc.page.width - side.w
            }
    
    
            //titre de l'image du panneau
    
            //Création de style pour le titre de l'image
            doc.strokeOpacity(1)
            doc.lineWidth(25);
    
            //Curent position
        
            // doc.lineCap('round')
            // .moveTo(300, doc.page.height / 16 +10)
            // .lineTo(460, doc.page.height / 16 +10)
            // .stroke('#BC3230');

            // doc.fillColor('white')
            // doc.fontSize(14).text(pan.pan_publoc_ref.toUpperCase(),305,doc.page.height / 16)


            //------------ Pour mettre le text et le fond au milieu
            let txt_ref = pan.pan_publoc_ref.toUpperCase()
            let _s_txt = {
                w: doc.widthOfString(txt_ref),
                h: doc.heightOfString(txt_ref)
            }
            let _x_ref = ((content.w-20) /2 - _s_txt.w/2 )
            doc.lineCap('round')
            .moveTo( _x_ref + side.w + 10, doc.page.height / 16 +10)
            .lineTo( _x_ref + side.w + 10  + _s_txt.w, doc.page.height / 16 +10)
            .stroke('#BC3230')

            doc.fillColor('white')
            doc.fontSize(14).text(txt_ref,_x_ref+side.w + 12 ,doc.page.height / 16)
            
            //-------------
            
            doc.moveDown()


            doc.fontSize(14).text('-',side.w+10,doc.page.height / 8 + 10)
            
            if(pan.pan_list_photo_pose && rapport_ann){
                let id_im_pose = parseInt(pan.pan_list_photo_pose.split(',')[0])
                let ims = (await D.exec_params(`select * from file where file_id = ?`,id_im_pose))[0]

                pan.name_file = ims.name_file
                pan.dimension_file = ims.dimension_file
                pan.extension_file = ims.extension_file
            }
    
            
            //Insertion d'image du panneau
            if(!pan.name_file){
                doc.image('statics/placeholder-image.png',{width:content.w-20})
    
                const metadata = await sharp('statics/placeholder-image.png').metadata()
    
                pan.dimension_file = [metadata.width,metadata.height].join(',')
            }else{
                let _s = {}
                let p_dim = pan.dimension_file.split(',').map(x => parseInt(x))

                let scl = (content.w-20) / p_dim[0] // scale de l'image

                let h_scl = p_dim[1] * scl
                let w_scl = (300 / p_dim[1]) * p_dim[0] //  si h_scl > 300

                let _x = ( (content.w-20) /2 - w_scl/2 ) + side.w + 10
                _s = (h_scl > 300)?{height:300,x:_x}:{width:content.w-20}

                doc.image(`uploads/${pan.name_file}.${pan.extension_file}`,_s)
            }
    
            doc.fontSize(14)
            doc.moveDown()
    
            //titre de la carrte du panneau
            
            // doc.lineCap('round')
            // .moveTo(doc.x+5, doc.y+10)
            // .lineTo(doc.x + doc.widthOfString(`Localisation : ${pan.lieu_label}`.toUpperCase()), doc.y+10)
            // .stroke('#BC3230');
            // doc.text(`Localisation : ${pan.lieu_label}`.toUpperCase())


            doc.fontSize(12)
            let txt_lieu = pan.lieu_label.toUpperCase()
            let _s_lieu = {
                w:doc.widthOfString(txt_lieu),
                h:doc.heightOfString(txt_lieu)
            }

            let _x_lieu = ((content.w-20) /2 - _s_lieu.w/2 )


            // console.log({l:_s_lieu.w ,c:content.w})

            doc.lineCap('round')
            .moveTo(_x_lieu + side.w +10, doc.y+10)
            .lineTo(_x_lieu + side.w +10 + _s_lieu.w, doc.y+10)
            .stroke('#BC3230');

            

            doc.text(txt_lieu,_x_lieu + side.w + 12,doc.y)

            doc.moveDown()
    
            const d = await axios.get(`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+2e67ea(${pan.lieu_lng},${pan.lieu_lat})/${pan.lieu_lng},${pan.lieu_lat},16,0/1200x700?access_token=pk.eyJ1IjoiYW5nZWxvMTQyNyIsImEiOiJja3c0aGExMTIwNmp0Mm9udnY2bGNsZnRoIn0.PiJCKKLMoWzmULCaFs2CqA`,
                {
                responseType: 'arraybuffer'
              })
            const buffer = Buffer.from(d.data, 'binary')//.toString('base64')
            await sharp(buffer).toFile(`statics/tmp_carte${i}.png`)
            //Insertion d'image du panneau
            doc.image(`statics/tmp_carte${i}.png`,{width:content.w-20,x:side.w+10})

            await fs.unlinkSync(`statics/tmp_carte${i}.png`)

    
    
            //Bas de page pour les infos de publoc
            doc.fontSize(10)
    
            
    
            doc.page.margins.bottom = 0;
            doc.page.margins.right = 0;
            let w_text = 0
            let b_to_top = 60
            
            doc.save()
            doc.lineWidth(5)
            doc.lineJoin('round')
            .rect(side.w +5,doc.page.height-b_to_top-5, content.w-10, 50)
            .fillAndStroke('black');
    
            doc.restore()
            //Le téléphone
            doc.text('Téléphone',side.w +10,doc.page.height-b_to_top)
            doc.text('+261 34 99 329 12')
            w_text = doc.widthOfString('+261 34 99 329 12')
            //Localisation
            doc.text('Adresse',side.w +20+w_text,doc.page.height-b_to_top)
            doc.text('Immeuble TMT Anosivavala')
            doc.text('101 Antananarivo, Madagascar')
            w_text += doc.widthOfString('101 Antananarivo, Madagascar')+10
            //Réseaux
            doc.text('Réseaux',side.w +20+w_text,doc.page.height-b_to_top)
            doc.text('Web : www.publoc.mg')
            doc.text('Facebook, Linkedin : Publoc Madagascar')
            doc.moveDown()
        }

        //Fin de panneau
        doc.end();
    } catch (e) {
        console.log(e)
    }
}


//Ici gestion des paramètres de pdf
router.get('/test',async (req,res)=>{
    let D = require('../models/data')
    // async/await
    try {
        
        // const d = await axios.get(`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+2e67ea(-122.341,37.8305)/-122.341,37.8305,16,0/512x400?access_token=pk.eyJ1IjoiYW5nZWxvMTQyNyIsImEiOiJja3c0aGExMTIwNmp0Mm9udnY2bGNsZnRoIn0.PiJCKKLMoWzmULCaFs2CqA`,
        //     {
        //     responseType: 'arraybuffer'
        //   })


        // if(d.status == 200){
        //     const buffer = Buffer.from(d.data, 'binary')//.toString('base64')


        //     await sharp(buffer).toFile('test_carte.png')

        //     return res.send({status:true,buffer})
        // }else{
        //     return res.send({status:false,message:"Erreur de récupération des données"})

        // }

        //Pour le moment on va juste récupérer un seul panneau
        let pan_publoc_ref = 'PBLC-0001'

        let sql = `select *,
        (select cat_label from category c where c.cat_id = format.parent_cat_id ) as parent_cat_label
        from panneau p
        left join category format on p.cat_id = format.cat_id
        left join regisseur as reg on p.reg_id = reg.reg_id
        left join lieu l on p.lieu_id = l.lieu_id 
        left join file on p.image_id = file.file_id
        where p.pan_publoc_ref = ?`

        const pan = (await D.exec_params(sql,pan_publoc_ref))[0]

        //Création de pdf avec pdfkit
        const doc = new PDFDocument({autoFirstPage: false});   

        doc.addPage({
            size: 'a4'
        });

        // Register a font
        doc.registerFont('f_bold', 'statics/typewcond_bold.otf');
        doc.registerFont('f_regular', 'statics/typewcond_regular.otf');
        doc.pipe(res);

        //Slider
        let side = {
            w:150
        }

        //Le fond du pdf
        doc.page.margins.bottom = 0;
        doc.page.margins.right = 0;

        let grad = doc.linearGradient(0, 0, doc.page.width, doc.page.height);
        grad.stop(0, 'white')
            .stop(1, '#BC3230');

            doc.save()
        doc.rect(0, 0, doc.page.width, doc.page.height);
        doc.fill(grad);

        doc.restore()

        //
        //Insertion d'image
        doc.save()
        doc.circle(75, 75, 70).clip()
        .lineWidth(10).strokeOpacity(1)
        .stroke("white")
        doc.image('statics/app_icon.jpg',5,5,{width: 140})
        doc.restore()
        

        let ft_sz = {
            n:14,
            s:10
        }
        
        doc.fillColor('#646464')
        //Ref Publoc
        

        doc.lineWidth(5)
        doc.lineJoin('round')
        .rect(10, 160, 130, doc.page.height-400)
        .fillAndStroke('#BC3230','#BC3230');

        doc.save()
        doc.fillColor('white')
        doc.fontSize(ft_sz.s).font('f_bold').text('Référene ...',20,170)
        doc.fontSize(ft_sz.n).font('f_regular').text(pan.pan_publoc_ref)
        doc.moveDown()
        //Insertion de la catégorie
        doc.fontSize(ft_sz.s).font('f_bold').text('Catégorie ...')
        doc.fontSize(ft_sz.n).font('f_regular').text(pan.parent_cat_label)
        doc.moveDown()

        //Insertion de la Format
        doc.fontSize(ft_sz.s).font('f_bold').text('Format ...')
        doc.fontSize(ft_sz.n).font('f_regular').text(pan.cat_label)
        doc.moveDown()

        //Insertion de la catégorie
        doc.fontSize(ft_sz.s).font('f_bold').text('Surface ... (m2)')
        doc.fontSize(ft_sz.n).font('f_regular').text(pan.pan_surface)
        doc.moveDown()

        //Insertion de la Ville
        doc.fontSize(ft_sz.s).font('f_bold').text('Ville ...')
        doc.fontSize(ft_sz.n).font('f_regular').text(pan.lieu_ville)
        doc.moveDown()

        //Insertion de la Quartier
        doc.fontSize(ft_sz.s).font('f_bold').text('Quartier ...')
        doc.fontSize(ft_sz.n).font('f_regular').text(pan.lieu_quartier)
        doc.moveDown()

        doc.restore()

        

        //Traçage de la ligne qui sépare le side et le content
        doc.moveTo(side.w, 0).lineTo(side.w,doc.page.height).strokeOpacity(0.3).lineWidth(1).stroke('black')

        //L'autre côté du pdf

        let content = {
            w:doc.page.width - side.w
        }


        //titre de l'image du panneau

        //Création de style pour le titre de l'image
        doc.strokeOpacity(1)
        doc.lineWidth(25);

        //Curent position
        
        doc.lineCap('round')
        .moveTo(300, doc.page.height / 16 +10)
        .lineTo(460, doc.page.height / 16 +10)
        .stroke('#BC3230');

        doc.fillColor('white')
        doc.fontSize(14).text(pan.pan_publoc_ref.toUpperCase(),305,doc.page.height / 16)
        
        doc.moveDown()


        doc.fontSize(14).text('-',side.w+10,doc.page.height / 8 + 10)
        
        //Insertion d'image du panneau
        if(!pan.name_file){
            doc.image('statics/placeholder-image.png',{width:content.w-20})

            const metadata = await sharp('statics/placeholder-image.png').metadata()

            pan.dimension_file = [metadata.width,metadata.height].join(',')
        }else{
            doc.image(`uploads/${pan.name_file}.${pan.extension_file}`,{width:content.w-20})
        }

        doc.fontSize(14)
        doc.moveDown()

        //titre de la carrte du panneau
        
        doc.lineCap('round')
        .moveTo(doc.x+5, doc.y+10)
        .lineTo(doc.x + doc.widthOfString(`Localisation : ${pan.lieu_label}`.toUpperCase()), doc.y+10)
        .stroke('#BC3230');
        doc.text(`Localisation : ${pan.lieu_label}`.toUpperCase())
        doc.moveDown()

        const d = await axios.get(`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+2e67ea(${pan.lieu_lng},${pan.lieu_lat})/${pan.lieu_lng},${pan.lieu_lat},16,0/1200x700?access_token=pk.eyJ1IjoiYW5nZWxvMTQyNyIsImEiOiJja3c0aGExMTIwNmp0Mm9udnY2bGNsZnRoIn0.PiJCKKLMoWzmULCaFs2CqA`,
            {
            responseType: 'arraybuffer'
          })
        const buffer = Buffer.from(d.data, 'binary')//.toString('base64')
        await sharp(buffer).toFile('statics/tmp_carte.png')
        //Insertion d'image du panneau
        doc.image(`statics/tmp_carte.png`,{width:content.w-20})


        //Bas de page pour les infos de publoc
        doc.fontSize(10)

        

        doc.page.margins.bottom = 0;
        doc.page.margins.right = 0;
        let w_text = 0
        let b_to_top = 60
        
        doc.save()
        doc.lineWidth(5)
        doc.lineJoin('round')
        .rect(side.w +5,doc.page.height-b_to_top-5, content.w-10, 50)
        .fillAndStroke('black');

        doc.restore()
        //Le téléphone
        doc.text('Téléphone',side.w +10,doc.page.height-b_to_top)
        doc.text('+261 34 99 329 12')
        w_text = doc.widthOfString('+261 34 99 329 12')
        //Localisation
        doc.text('Localisation',side.w +20+w_text,doc.page.height-b_to_top)
        doc.text('Immeuble TMT Anosivavala')
        doc.text('101 Antananarivo, Madagascar')
        w_text += doc.widthOfString('101 Antananarivo, Madagascar')+10
        //Réseaux
        doc.text('Réseaux',side.w +20+w_text,doc.page.height-b_to_top)
        doc.text('Web : www.publoc.mg')
        doc.text('Facebook, Linkedin : Publoc Madagascar')
        doc.moveDown()


        

        

        doc.end();
    } catch (err) {
        // resolve error
        console.log(err);
        return res.send({status:false,err})
    }
    
})


module.exports = router