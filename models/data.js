let connection = require('../config/db')
let fs = require('fs')


class Data{
    static create(){
        fs.readFile('data.sql','utf8',(err,data)=>{
            connection.query(data,(err,result) =>{
                if(err) throw err
            })
        })
    }
}

module.exports = Data