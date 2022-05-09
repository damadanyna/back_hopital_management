let mysql      = require('mysql');
let connection = mysql.createConnection({
  host     : 'localhost',
  user     : (process.env.NODE_ENV == 'production')?'publocmg_api':'root',
  password : (process.env.NODE_ENV == 'production')?'Squadron42!!':'root',
  database : (process.env.NODE_ENV == 'production')?'publocmg_api1':'publoc_api',
  multipleStatements: true
});
 

//Solarpro!!
connection.connect()

module.exports = connection