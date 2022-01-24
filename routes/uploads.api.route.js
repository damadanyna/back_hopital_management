let router = require('express').Router()
let fs = require('fs')
let multer = require('multer')
const sharp = require("sharp")



//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});

//Utilisation de multer
let storage = multer.diskStorage({
   
})

const fileFilter = (req,file,cb)=>{
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png'){
        cb(null,true)
    }else{
        cb(null,false)
    }
}

let upload = multer({
    storage:storage,
    fileFilter:fileFilter
})

router.get('/all',async (req,res)=>{
    let File = require('../models/File')

    let details = []
    try {
        const image = await File.get()
        let i = image[0]
        let im_path = i.path_file+""+i.name_file+"."+i.extension_file
        const metadata = await sharp(im_path).metadata();
        return res.send(metadata);
    } catch (e) {
        console.log("Error: ", e);
    }
})


router.post('/',upload.single('file'),async (req,res)=>{
    if(req.file){
        let File = require('../models/File')
        let extension = req.file.originalname.split('.')
        extension = extension[extension.length-1]
        

        let tmp_path = req.file.path
        try {
        const m = await sharp(tmp_path).toFile('./uploads/'+req.body.name+'.'+extension)
        const r = await sharp(tmp_path).resize(null,400).toFile('./uploads/'+req.body.name+'_min.'+extension)

        let f = {
            path_file:'./uploads/',
            extension_file:extension,
            name_origin_file:req.file.originalname,
            name_file:req.body.name,
            size_file:m.size,
            size_min_file:r.size,
            name_min_file:req.body.name+"_min",
            dimension_file:m.width+','+m.height,
            dimension_min_file:r.width+','+r.height,
            type_file:'tmp'
        }
        fs.unlinkSync(tmp_path,(err)=>{
            console.log('Erreur de suppression de donnée temporaire')
        })

        const i = await File.post(f)
        res.send({status:true,file_id:i.insertId})
        } catch (e) {
            console.log(e)
        return res.send({status:false,message:"Erreur de la base"})
        }
    }else{
        return res.send({status:false,message:"Erreur de donnée."})
    }

})

router.delete('/:id',async (req,res)=>{
    if(parseInt(req.params.id).toString() != 'NaN'){
        let id = req.params.id
        require('../controller/file').deleteFile(id)
        return res.send({status:true})
    }else{
        return res.send({status:false,message:"Erreur de donnée."})
    }
})

module.exports = router