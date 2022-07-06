let router = require('express').Router()
let fs = require('fs')
let axios = require('axios')
let sharp = require('sharp')

const officeParser = require('officeparser');

const PDFDocument = require('pdfkit');


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});


//Ici gestion des paramètres de pdf
router.get('/test',async (req,res)=>{
    // async/await
    try {
        
        const d = await axios.get(`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/-122.341,37.8305,9.15,0/300x200?access_token=pk.eyJ1IjoiYW5nZWxvMTQyNyIsImEiOiJja3c0aGExMTIwNmp0Mm9udnY2bGNsZnRoIn0.PiJCKKLMoWzmULCaFs2CqA`,
            {
            responseType: 'arraybuffer'
          })


        if(d.status == 200){
            const buffer = Buffer.from(d.data, 'binary').toString('base64')
            console.log(buffer)

            return res.send({status:true,buffer})
        }else{
            return res.send({status:false,message:"Erreur de récupération des données"})
        }
        
       
        
    } catch (err) {
        // resolve error
        console.log(err);
        return res.send({status:false,err})
    }
    
})


module.exports = router