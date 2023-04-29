/* eslint-disable vue/multi-word-component-names */


import './index.css'

import {createRouter,createWebHashHistory} from 'vue-router'
import { createApp } from 'vue'

import axios from 'axios'

//Pour Prime vue
import PrimeVue from 'primevue/config';

import App from './App.vue'


//les composants
import CustomInput from './components/customInput.vue' //
import sidebar from './components/sidebar.vue' //
import add_patient from './components/add-patient.vue'
import detPatient from './components/detPatient.vue'
import c_select from './components/c-select.vue'

import detEncMvmt from './components/detEncMvmt.vue'

//dans Gestion Stock
import addFourn from './components/addFourn.vue'
import detFourn from './components/detFourn.vue'

import addDep from './components/addDep.vue'
import detDep from './components/detDep.vue'

//Resak user
import detailUser from './components/detailUser.vue'
import addUser from './components/addUser.vue'
import supUser from './components/supUser.vue'

//Catégorie
import addCat from './components/addCat.vue'

//Prise en charge
import addPec from './components/addPec.vue'
import addTarif from './components/addTarif.vue'
import detTarif from './components/detTarif.vue'
import addEnt from './components/addEnt.vue'
import detEnt from './components/detEnt.vue'

import addCons from './components/addCons.vue'

import addMvmt from './components/addMvmt.vue'
import addArticleMvmt from './components/addArticleMvmt'

//Gestion de service
import addService from './components/addService.vue'
import modifPrixTarif from './components/modifPrixTarif.vue'

import addPrepEncaisse from './components/addPrepEncaisse.vue'

import addProductCaisse from "./components/addProductCaisse.vue";

import recapFactPec from "./components/recapFactPec.vue"

import addHosp from './components/addHosp.vue'
import addAvanceHosp from './components/addAvanceHosp.vue'
import paiementFinalHosp from './components/paiementFinalHosp.vue'


//C'est pour le store
import st from './store/store.js'


import btn from './components/btn.vue'
import add_article from './components/addArticle.vue'
import detArticle from './components/detArticle.vue'

import getFactPec from './components/gestFactPec.vue'

import addProductFact from './components/addProductFact.vue'
import selectService from './components/selectService.vue'
import selectProduct from './components/selectProduct.vue'
import selectPatient from './components/selectPatient.vue'

import detFactCaisse from './components/detFactCaisse.vue'
import selectSoc from './components/selectSoc.vue'
import encVersement from './components/encVersement.vue'

//saisie encaissement
import addSaisieEncaisse from './components/addSaisieEncaisse.vue'

import menuPoint from './components/menuPoint.vue'
import menuItem from './components/menuItem.vue'

import notif from './components/notif.vue'

import detMvmt from './components/detMvmt.vue'
import selectMed from './components/selectMed.vue'


//Importation des composants relatifs au dentisterie
import addRdvDt from './components/addRdvDt.vue'
import selectPatDt from './components/selectPatDt.vue'
import addPatientDt from './components/addPatientDt.vue'



//Importation du mixin global
import _mixin from './mixins'



//Tous les imports primevues
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';

import ToastService from 'primevue/toastservice';
import Toast from 'primevue/toast';
import Menubar from 'primevue/menubar'
import Divider from 'primevue/divider'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import ProgressSpinner from 'primevue/progressspinner'
import ContextMenu from 'primevue/contextmenu'
import ConfirmationService from 'primevue/confirmationservice';
import ConfirmPopup from 'primevue/confirmpopup';
import Checkbox from 'primevue/checkbox';
import ConfirmDialog from 'primevue/confirmdialog';
import Calendar from 'primevue/calendar';
import Message from 'primevue/message';
import Tooltip from 'primevue/tooltip';
import TabMenu from 'primevue/tabmenu';
import SelectButton from 'primevue/selectbutton';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import InputNumber from 'primevue/inputnumber';
import SplitButton from 'primevue/splitbutton';
import Inplace from 'primevue/inplace';
import OverlayPanel from 'primevue/overlaypanel';
import Menu from 'primevue/menu';
import Textarea from 'primevue/textarea';

//Ny routes ny APP rehetra


const routes = [

    //Ny MEnu principale rehefa avy ni-connect 
    {path:'/',component:() =>  import('./layouts/dashboard.vue'),
        children:[
            { path:'',name:'home-app', component:() => import('./routes/home-app.vue') },

            //Pour la gestion patients
            { path:'/patients',component:() => import('./routes/patients.vue') , 
                children:[
                    { path:'',name:'patients',component:() => import('./routes/patients/list-patient.vue') },
                ]
            },


            //Pour la gestion Caisse
            { path:'/caisse',component:() => import('./routes/caisse.vue') , 
                children:[
                    { path:'',name:'caisse-main',component:() => import('./routes/caisse/caisse-main.vue') },
                    { path:'/disp',name:'caisse-disp',component:() => import('./routes/caisse/caisse-disp.vue') },
                ]
            },


            //Pour la gestion des paramètres
            { path:'/settings',component:() => import('./routes/settings.vue') , 
                children:[
                    { path:'',name:'settings-user',component:() => import('./routes/settings/gestion-user.vue') },
                    { path:'module',name:'settings-module',component:() => import('./routes/settings/gestion-module.vue') },
                ]
            },


            //Pour la gestion de stock
            { path:'/stock',component:() => import('./routes/stock.vue') , 
                children:[
                    { path:'',name:'stock-fiche',component:() => import('./routes/stock/stock-fiche.vue') },
                    { path:'tiers',name:'stock-tiers',component:() => import('./routes/stock/stock-tiers.vue') },
                    { path:'cat',name:'stock-cat',component:() => import('./routes/stock/stock-cat.vue') },
                    { path:'mvmt',name:'stock-mvmt',component:() => import('./routes/stock/stock-mvmt.vue') },
                ]
            },

            //Prise en charge changé en hospitalisation
            { path:'/pec',component:() => import('./routes/pec.vue') , 
                children:[
                    { path:'',name:'pec-index',component:() => import('./routes/pec/index.vue') },
                    { path:'consultation',name:'pec-consultation',component:() => import('./routes/pec/consultation.vue') },
                    { path:'service',name:'pec-service',component:() => import('./routes/pec/service.vue') },
                    // { path:'tarif',name:'pec-tarif',component:() => import('./routes/pec/tarif.vue') },
                    { path:'soc',name:'pec-soc',component:() => import('./routes/pec/soc.vue') },
                ]
            },

            { path:'/tarif',component:() => import('./routes/tarification.vue') , 
                children:[
                    { path:'',name:'tarif-service',component:() => import('./routes/tarif/tarif-service.vue') },
                    { path:'med',name:'tarif-med',component:() => import('./routes/tarif/tarif-med.vue') },
                ]
            },
            { path:'/hosp',component:() => import('./routes/hosp.vue') , 
                children:[
                    { path:'',name:'hosp',component:() => import('./routes/hosp/list-hosp.vue') },
                ]
            },
            { path:'/dt',component:() => import('./routes/dt.vue') , 
                children:[
                    { path:'',name:'dt-patient',component:() => import('./routes/dt/dt-pat.vue') },
                    { path:'',name:'dt-rdv',component:() => import('./routes/dt/dt-rdv.vue') },
                ]
            },
        ]   
    },

    //Rehefa mbola tsy ni-connect ny utilisateur
    {
        path:'/login',name:'login',component:() => import('./routes/login.vue')
    }
] 

const router  = createRouter({
    history:createWebHashHistory(),
    routes
})

const app = createApp(App)
app.use(router)

let trad = {
    dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
    dayNamesShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    dayNamesMin: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
    monthNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Decembre'],
    monthNamesShort: ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jui', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Dec'],
    firstDayOfWeek: 1,
}

app.use(PrimeVue,{inputStyle: 'filled',ripple: true,locale:trad})
app.use(ToastService)
app.use(ConfirmationService)
app.directive('tooltip', Tooltip);

app.use(st)


//configuration axios

//'http://192.168.88.254:4044' //Sur serveur
//axios.defaults.baseURL = 'http://localhost:4044' 
axios.defaults.baseURL = 'http://192.168.88.254:4044' //'http://localhost:4044'

//Ajout de axios dans vue
app.config.globalProperties.$http = axios
//Gestion du mixins global
app.mixin(_mixin)

//Tous les composants primevue
app.component('Button',Button)
app.component('InputText',InputText)
app.component('Password',Password)
app.component('Toast',Toast)
app.component('Menubar',Menubar)
app.component('Divider',Divider)
app.component('Card',Card)
app.component('DataTable',DataTable)
app.component('Column',Column)
app.component('Dialog',Dialog)
app.component('Dropdown',Dropdown)
app.component('ProgressSpinner',ProgressSpinner)
app.component('ContextMenu',ContextMenu)
app.component('ConfirmPopup',ConfirmPopup)
app.component('Checkbox',Checkbox)
app.component('ConfirmDialog',ConfirmDialog)
app.component('Calendar',Calendar)
app.component('Message',Message)
app.component('TabMenu',TabMenu)
app.component('SelectButton',SelectButton)
app.component('TabView',TabView)
app.component('TabPanel',TabPanel)
app.component('InputNumber',InputNumber)
app.component('SplitButton',SplitButton)
app.component('Inplace',Inplace)
app.component('OverlayPanel',OverlayPanel)
app.component('Menu',Menu)
app.component('Textarea',Textarea)

//Ajout des composants utiles globalment
app.component('custom-input',CustomInput)
app.component('sidebar',sidebar)
app.component('add-patient',add_patient)
app.component('det-patient',detPatient)
app.component('c-select',c_select)

app.component('det-enc-mvmt',detEncMvmt)

//user
app.component('detail-user',detailUser)
app.component('add-user',addUser)
app.component('sup-user',supUser)
//-----------------------------

app.component('btn',btn)
app.component('add-article',add_article)
app.component('det-article',detArticle)

//--------------
app.component('add-fourn',addFourn)
app.component('det-fourn',detFourn)

app.component('add-dep',addDep)
app.component('det-dep',detDep)

//Cat
app.component('add-cat',addCat)

//Gestion prise en charge
app.component('add-pec',addPec)
app.component('add-tarif',addTarif)
app.component('det-tarif',detTarif)
app.component('add-ent',addEnt)
app.component('det-ent',detEnt)

app.component('add-cons',addCons)


app.component('notif',notif)
app.component('add-mvmt',addMvmt)
app.component('add-article-mvmt',addArticleMvmt)


//service
app.component('add-service',addService)
app.component('modif-prix-tarif',modifPrixTarif)

app.component('gest-fact-pec',getFactPec)

app.component('select-service',selectService)
app.component('select-product',selectProduct)
app.component('select-patient',selectPatient)
app.component('select-soc',selectSoc)

app.component('add-prep-encaisse',addPrepEncaisse)


//--------------
app.component('add-product-fact',addProductFact)

// -------------
app.component('add-product-caisse',addProductCaisse)


//saisie encaissment
app.component('add-saisie-encaisse',addSaisieEncaisse)

app.component('det-fact-caisse',detFactCaisse)


app.component('recap-fact-pec',recapFactPec)

app.component('add-hosp',addHosp)
app.component('add-avance-hosp',addAvanceHosp)
app.component('paiement-final-hosp',paiementFinalHosp)


//Gestion menu point
app.component('menu-point',menuPoint)
app.component('menu-item',menuItem)


//Les composants relatifs au dentisterie
app.component('add-rdv-dt',addRdvDt)
app.component('select-pat-dt',selectPatDt)
app.component('add-patient-dt',addPatientDt)


app.component('det-mvmt',detMvmt)

app.component('select-med',selectMed)
app.component('enc-versement',encVersement)

app.mount('#app')


