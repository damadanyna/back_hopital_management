let mysql      = require('mysql');
let connection = mysql.createConnection({
  host     : 'localhost',
  user     : (process.env.NODE_ENV == 'production')?'root':'root',
  password : (process.env.NODE_ENV == 'production')?'hp_back22!!':'hp_back22!!',
  // password : (process.env.NODE_ENV == 'production')?'':'',
  database : (process.env.NODE_ENV == 'production')?'hopital_base':'hopital_base',
  multipleStatements: true
});
 
connection.connect()

//type Utilisateur
module.exports = connection