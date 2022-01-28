let express = require('express')
let session = require('express-session')
let bodyParser = require('body-parser')
let cookieParser = require('cookie-parser')



let MemoryStore = require('memorystore')(session)

const { Console } = require("console");
// get fs module for creating write streams
const fs = require("fs");

// make a new logger
const myLogger = new Console({
  stdout: fs.createWriteStream("nlog.txt"),
  stderr: fs.createWriteStream("elog.txt"),
});


let app = express()

//Utilisation de socket.io
let http = require('http').Server(app)
let io = require('socket.io')(http,{path:"/api/ws",cors:{origin:'*',methods:['GET','POST','PUT','DELETE']}})

//Middleware
// cookie parser middleware
app.use(cookieParser());

app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())


app.use((req,res,next)=>{
    req.io = io
    req.logger = myLogger
    next()
})

let init = async () =>{
    let Data = require('./models/data')
    try {
        const t = await Data.execute('data')
        const i = await Data.check_init()

        if(i.length == 0){
            await Data.execute('init')
        }
    } catch (e) {
        console.log(e)
        myLogger.log(e)
    }
}
init()


io.on('connection',(socket)=>{
})


app.use('/api',require('./routes/api.route'))





http.listen(4040)






