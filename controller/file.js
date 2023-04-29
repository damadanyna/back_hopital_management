let F = require('../models/File')
let fs = require('fs')

class File{
    static async deleteFile(id){
        const t =  await F.getById(id)
        if(t.length > 0){
            let r = t[0]
            let path = r.path_file+""+r.name_file+"."+r.extension_file
            fs.unlinkSync(path)
            path = r.path_file+""+r.name_min_file+"."+r.extension_file
            fs.unlinkSync(path)
            await F.deleteById(id)
        }
    }

    static async deleteMultipleFile(ids){
        const t =  await F.getIn(ids)
        if(t.length > 0){
            for(let i =0 ;i<t.length;i++){
                let r = t[i]
                let path = r.path_file+""+r.name_file+"."+r.extension_file
                fs.unlinkSync(path)
                path = r.path_file+""+r.name_min_file+"."+r.extension_file
                fs.unlinkSync(path)
                await F.deleteById(r.file_id)
            }
        }
    }
}

module.exports = File