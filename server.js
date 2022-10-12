let express = require('express')
let session = require('express-session')
let bodyParser = require('body-parser')
let cookieParser = require('cookie-parser')

var cors = require('cors')

let MemoryStore = require('memorystore')(session)

const { Console } = require("console");
// get fs module for creating write streams
const fs = require("fs");

let app = express()




//Utilisation de socket.io
let http = require('http').Server(app)
let io = require('socket.io')(http,{path:"/api/ws",cors:{origin:'*',methods:['GET','POST','PUT','DELETE']}})

//Middleware
// cookie parser middleware
app.use(cookieParser());

app.use(cors())
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())


let escape_html = (t)=>{
    return t.replace(/'/g, "\\'").replace(/"/g, "\\\"")
}

app.use((req,res,next)=>{
    req.io = io
    req.escape_html = escape_html
    next()
})



io.on('connection',(socket)=>{
})


app.use('/api',require('./routes/api.route'))

http.listen(4044)


/*
--- Leture d'un fichier xls
XLSX = require('xlsx');

const workBook = XLSX.readFile(inputFilename);
XLSX.writeFile(workBook, outputFilename, { bookType: "csv" });
*/






