let mysql      = require('mysql');
let connection = mysql.createConnection({
  host     : 'localhost',
  user     : (process.env.NODE_ENV == 'production')?'root':'root',
  password : (process.env.NODE_ENV == 'production')?'Squadron42!!':'',
  database : (process.env.NODE_ENV == 'production')?'hopital_base':'hopital_base',
  multipleStatements: true
});
 

//Solarpro!!
connection.connect()

module.exports = connection