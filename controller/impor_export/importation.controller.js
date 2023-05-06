let D = require('../../models/data')
let fs = require('fs') 
const reader = require('xlsx')

class File_manager{
    static async  article(req,res){

        let val=[]
        let article_data= { } 
        const file = reader.readFile('controller/impor_export/ANTI-INFECTIEUX.xlsx') 
            let data = [] 
            const sheets = file.SheetNames 
             
            for(let i = 0; i < sheets.length; i++)
            {
                const temp = reader.utils.sheet_to_json(
                    file.Sheets[file.SheetNames[i]])
                        temp.forEach((resp) => {
                            data.push(resp)
                        })
            }
            data.shift() 
            const _pd_keys = Object.keys(data[0])
            for (let j = 0; j < data.length; j++) {
                const element = data[j];
                val.push([]) 
                for (let i = 0; i < _pd_keys.length; i++) {
                    const elt = _pd_keys[i];
                    element[elt]?val[j].push(element[elt]):val[j].push(null)  
                }

            }  
            return res.send(val)
    } 
    static async export(req,res){ 
        let file = req.body  
        try {  
            
            console.log(file)
        } catch (e) {
            console.error(e)
            return res.send({status:false,message:"Erreur de l'exporation"})
        }
    } 
    static async import_temp(req,res){ 
        let file = req.body  
        try {
            fs.readFile('controller/impor_export/Tous_les_articles.csv', 'utf8', function (err,data) {
                if (err) {
                    return res.send(err);
                }
                return res.send(data)
            });
        } catch (e) { 
            return res.send({status:false,message:"Erreur de l'exporation"})
        }
    }
}

module.exports = File_manager;
