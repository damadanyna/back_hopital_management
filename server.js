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

//ici création de la modèle d'action pour l'historique des utilisateurs
let uh = {
    connect:{k:'user-connect',l:'Connexion utilisateur'},

    add_hosp:{k:'add-hosp',l:'Ajout hospitalisation'}, //check
    modif_hosp:{k:'modif-hosp',l:'Modification hospitalisation'},//check
    del_hosp:{k:'del-hosp',l:'Suppression hospitalisation'},//check
    validate_hosp:{k:'validate-hosp',l:'Encaissement hospitalisation'},//check

    add_avance:{k:'add-avance',l:'Ajout Avance'},//check
    del_avance:{k:'del-avance',l:'Suppression Avance'},//check
    validate_avance:{k:'validate-avance',l:'Encaissement avance'},//check

    add_disp:{k:'add-disp',l:'Ajout Dispensaire'},//check
    del_disp:{k:'del-disp',l:'Suppression Dispensaire'},//check
    validate_disp:{k:'validate-disp',l:'Encaissement Dispensaire'},//check

    add_pat:{k:'add-pat',l:'Ajout Patient'},//check
    modif_pat:{k:'modif-pat',l:'Modification Patient'},//check
    del_pat:{k:'del-pat',l:'Suppression Patient'},//check

    add_pec:{k:'add-pec',l:'Ajout Prise en charge'},//check
    modif_fact_pec:{k:'modif-fact-pec',l:'Modification facture prise en  charge'},//check
    del_pec:{k:'del-pec',l:'Suppression Prise en charge'},//check

    add_cons:{k:'add-cons',l:'Ajout consultation'},//check
    modif_cons:{k:'modif-cons',l:'Modification Consultation'},// !!wait
    del_cons:{k:'del-cons',l:'Suppression Consultation'},//check

    add_soc:{k:'add-soc',l:'Ajout Société'},//check
    modif_soc:{k:'modif-soc',l:'Modification Société'},//check
    del_soc:{k:'del-soc',l:'Suppression Société'},//check

    add_art:{k:'add-art',l:'Ajout article'},//check
    modif_art:{k:'modif-art',l:'Modification Article'},//check
    del_art:{k:'del-art',l:'Suppression Article'},//check

    add_mvmt:{k:'add-mvmt',l:'Ajout Mouvement'},//check
    // modif_pat:{k:'modif-pat',l:'Modification Patient'},
    del_mvmt:{k:'del-mvmt',l:'Suppression Mouvement'},//check

    add_dep:{k:'add-dep',l:'Ajout Département'},//check
    modif_dep:{k:'modif-dep',l:'Modification Département'},//check
    del_dep:{k:'del-dep',l:'Suppression Département'},//check

    add_fourn:{k:'add-fourn',l:'Ajout Fournisseur'},//check
    modif_fourn:{k:'modif-fourn',l:'Modification Fournisseur'},//check
    del_fourn:{k:'del-fourn',l:'Suppression Fournisseur'},//check

    validate_vers:{k:'validate-vers',l:'Validation Versement'},//
    modif_vers:{k:'modif-vers',l:'Modification Versement'}

}

app.use((req,res,next)=>{
    req.io = io
    req.escape_html = escape_html
    req.uh = uh
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






