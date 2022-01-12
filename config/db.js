let mysql      = require('mysql');
let connection = mysql.createConnection({
  host     : 'localhost',
  user     : (process.env.NODE_ENV == 'production')?'ucomadmg_solarpro':'root',
  password : (process.env.NODE_ENV == 'production')?'Solarpro!!':'',
  database : (process.env.NODE_ENV == 'production')?'ucomadmg_publoc':'publoc_api',
  multipleStatements: true
});
 

//Solarpro!!
connection.connect()

module.exports = connection