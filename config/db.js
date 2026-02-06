let mysql      = require('mysql');
require('dotenv').config()

console.log("process.env.DB_PASSWORD",process.env.DB_PASSWORD)

let connection = mysql.createPool({
  host     : process.env.DB_HOST || 'localhost',
  user     : process.env.DB_USER || 'root',
  password : process.env.DB_PASSWORD,
  // password : (process.env.NODE_ENV == 'production')?'':'',
  database : process.env.DB_NAME || 'hopital_base',
  multipleStatements: true,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0
});

//type Utilisateur
module.exports = connection