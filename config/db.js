let mysql      = require('mysql');
let connection = mysql.createConnection({
  host     : 'localhost',
  user     : (process.env.NODE_ENV == 'production')?'defimg_hopital':'root',
  password : (process.env.NODE_ENV == 'production')?'Hopital_1234':'',
  database : (process.env.NODE_ENV == 'production')?'defimg_hopital':'hopital_base',
  multipleStatements: true
});
 

//Solarpro!!
connection.connect()

module.exports = connection