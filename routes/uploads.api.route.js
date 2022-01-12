let router = require('express').Router()
let fs = require('fs');
let multer = require('multer')


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



router.post('/',upload.single('file'),async (req,res)=>{
    if(req.file){
        let File = require('../models/File')
        let extension = req.file.originalname.split('.')
        extension = extension[extension.length-1]
        

         let tmp_path = req.file.path
         let target = './uploads/'+req.body.name+"."+extension

        let src = fs.createReadStream(tmp_path)
        let dest = fs.createWriteStream(target)
        src.pipe(dest)

        src.on('end',()=>{
            let p = {
                path_file:'./uploads/',
                extension_file:extension,
                size_file:req.file.size,
                name_origin_file:req.file.originalname,
                name_file:req.body.name
            }

            fs.unlinkSync(tmp_path,(err)=>{
                console.log('Erreur de suppression de donnée temporaire')
            })

            File.post(p,(err,result)=>{
                if(err){
                    return res.send({status:false,message:"Erreur de base de donnée."})
                }else{
                    return res.send({status:true,file_id:result.insertId})
                }
            })
        })

        src.on('error',()=>{
            return res.send({status:false,message:"Erreur d'upload du fichier."})
        })
    }else{
        return res.send({status:false,message:"Erreur de donnée."})
    }
})

router.delete('/:id',(req,res)=>{
    if(req.params.id){
        let id = req.params.id
        let File  = require('../models/File')

        File.get_by_id(id,(err,result)=>{
            if(err || result.length == 0){
                return res.send({status:false,message:"Erreur de la base de donnée. Il est posiible que la donnée n'existe plus."})
            }else{
                let r = result[0]
                let path = r.path_file+""+r.name_file+"."+r.extension_file

                try {
                    fs.unlinkSync(path)
                    //file removed

                    File.delete_by_id(id,(err,result)=>{
                        if(err){
                            return res.send({status:false,message:"Erreur de la base de donnée."})
                        }else{
                            return res.send({status:true})
                        }
                    })
                } catch(err) {
                    return res.send({status:false,message:"Erreur de la suppression de donnée."})
                }
            }
        })
    }else{
        return res.send({status:false,message:"Erreur de donnée."})
    }
})

module.exports = router