let router = require('express').Router();

let D = require('../models/data');


//Pour la gestion d'authentification 
let auth = require('./../middleware/auth');
router.use(auth);

//les requires utils


//Message de Vérification
router.get('/',(req,res)=>{
    res.send({message:"API 1.0 Fonctionnel"})
});

//Ajout de l'admin si c'est pas déjà fait
router.get('/add-m',require('../controller/status.controller').addMaster);

//Route pour les test
router.get('/test-hash',require('../controller/test.controller').testBcrypt);


//Gestion de connexion
router.get('/status-connexion',require('../controller/status.controller').status);

//Route d'authentification
router.post('/auth',require('../controller/status.controller').auth);


// //Gestion de patient
// router.post('/patient',require('../controller/patient.controller').register); //enregistrement d'un patient
// router.get('/patients',require('../controller/patient.controller').getList);//Récupération de la liste des patiens 
// router.delete('/patient/:patient_num',require('../controller/patient.controller').delUser); //Suppression d'un utilisateur


//Pour la gestion hospitalisation 
router.post('/hosp',require('../controller/hosp.controller').create); // Ajout des données de l'hospitalisation
router.get('/hosp',require('../controller/hosp.controller').getListHosp); // récupération des données hospitalisation
router.delete('/hosp/:ref',require('../controller/hosp.controller').deleteHosp); // Suppression d'une ligne d'hospitalisation par paramètre


//Gestion des utilisateur
router.post('/users',require('../controller/utilisateur.controller').register);
router.delete('/user',require('../controller/utilisateur.controller').delete);
router.get('/users',require('../controller/utilisateur.controller').getList);
router.post('/user',require('../controller/utilisateur.controller').update);

//Gestion des visite
router.post('/visites',require('../controller/visite.controller').register);
router.delete('/visite',require('../controller/visite.controller').delete);
router.get('/visites',require('../controller/visite.controller').getList);
router.post('/visite',require('../controller/visite.controller').update);

//Gestion des patient
router.post('/patients',require('../controller/patient.controller').register);
router.delete('/patient',require('../controller/patient.controller').delete);
router.get('/patients',require('../controller/patient.controller').getList);
router.post('/patient',require('../controller/patient.controller').update);


//------
module.exports = router