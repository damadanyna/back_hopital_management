<!-- eslint-disable no-unused-vars -->
<template>
    <div class="text-sm p-2">
        <!-- Les opérations -->
        <div class="flex border-b py-2 sticky  bg-white" style="top:58px">
            <!-- <button @click="on_prep_encaisse = true" class=" flex bt-p-s justify-center items-center">
                <span class="material-icons"> add </span>
                <span class="ml-2"> Saisie d'encaissement </span>
            </button> -->
            <Button label="Saisie d'encaissement" icon="pi pi-plus" @click="on_prep_encaisse = true" class="p-button-sm" />

            <!-- <button @click="on_saisie_encaisse = true" class="ml-2 flex bt-p-s justify-center items-center">
                <span class="material-icons"> point_of_sale </span>
                <span class="ml-2"> Encaissement </span>
                <span v-if="nb_not_validate" class="ml-2 rounded-full font-bold bg-red-500 text-white w-6 h-6 text-center flex justify-center items-center text-mg"> {{ nb_not_validate }} </span>
            </button> -->
            <Button v-if="nb_not_validate > 0" class="p-button-sm ml-2" @click="on_saisie_encaisse = true" >
                <span class="flex align-items-center">
                    <span class="material-symbols-outlined" style="font-size:1rem"> point_of_sale </span>
                    <span class="ml-2"> Encaissement </span>
                    <span v-if="nb_not_validate" class="ml-2 border-round font-bold bg-red-500 text-white px-2 text-center flex justify-content-center align-items-center text-mg"> {{ nb_not_validate }} </span>
                </span>
            </Button>

            <div class="flex flex-grow-1 align-items-center justify-content-center">
                <Button v-tooltip.top="'Actualiser'" @click="getListEncaissement" icon="pi pi-refresh" class="mr-2 p-button-sm  p-button-raised p-button-text" />
                <Button v-tooltip.top="'Déselectionner'" v-if="list_selected.enc_id" @click=" ()=>{
                        list_selected = {}
                } " icon="pi pi-stop"  class="p-button-sm  p-button-raised p-button-text" />
            </div>

            <div class="">
                <Button label="Supprimer" v-if="(list_selected.enc_id && !list_selected.enc_validate && !list_selected.enc_is_hosp)" @click="delEnc" icon="pi pi-times" 
                class="p-button-danger p-button-raised p-button-text p-button-sm" />
                
                <Button label="Détail Facture" v-if="list_selected.enc_id" @click="on_det_fact = true" icon="pi pi-exclamation-circle" 
                class="p-button-help p-button-raised p-button-text ml-2 p-button-sm" />

                <Button label="Voir Facture" v-if="list_selected.enc_id && list_selected.enc_validate" @click="viewFact" icon="pi pi-print" 
                class="p-button-help p-button-raised p-button-text ml-2 p-button-sm" />

                <Button label="Versement" @click="on_versement = true" icon="pi pi-euro" 
                class="p-button-help p-button-raised p-button-text ml-2 p-button-sm" />
            </div>

            <!-- <Button icon="pi pi-ellipsis-h" class="p-button-sm p-button-raised p-button-text" /> -->
        </div>

        <div class="flex align-items-end mb-2 sticky bg-white" style="top:110px">
            <div class="flex flex-column mt-2">
                <span class="font-bold text-xs"> {{ (filters.date)?dateToText(filters.date):'Date 1'  }} </span>
                <Calendar placeholder="ex : 09/09/1998" v-model="filters.date"  dateFormat="dd/mm/yy" class="p-inputtext-sm"/>    
            </div>
            <span class="m-2"> au </span>
            <!-- <custom-input type="date" v-model="filters.date2" :label=" (filters.date2)?dateToText(filters.date2):'Date 2' " /> -->
            <div class="flex flex-column mt-2">
                <span class="font-bold text-xs"> {{ (filters.date2)?dateToText(filters.date2):'Date 2' }} </span>
                <Calendar placeholder="ex : 09/09/1998" v-model="filters.date2"  dateFormat="dd/mm/yy" class="p-inputtext-sm"/>    
            </div>

            <div class="flex flex-column ml-2">
                <span class="font-bold text-xs"> Etat </span>
                <Dropdown v-model="filters.validate" :options="list_label_validate" optionLabel="label" optionValue="value" placeholder="Etat" class="p-inputtext-sm" />   
            </div>

            <div class="flex flex-column ml-5 border-1 border-gray-400 border-round p-2 align-items-center">
                <span class="text-sm font-bold"> Total Montant Encaissé </span>
                <span class="font-semibold text-lg"> {{ total_encaisse.toLocaleString('fr-CA') }} </span>
            </div>
        </div>

        <!-- Ici la liste des encaissements -->
        <div class="">
            <table class="w-full">
                <thead class="" >
                    <tr class=" text-left">
                        <th v-for="l in list_label" class="stycky" style="top:178px" :key="l.key">
                            {{ l.label }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr @click=" ()=>{
                            list_selected = p
                        } " v-for="p in list_enc" class="cursor-pointer"  :key="p.enc_id">
                        <td :class="{'border-yellow-500':!p.enc_validate,'active-row':list_selected.enc_id == p.enc_id,}"  class="" 
                        v-for="l in list_label" :key="l.key">

                            <div class="w-full flex justify-end" v-if="['enc_montant','enc_total_avance'].indexOf(l.key) != -1">
                                <span class=""> {{  (p[l.key])?p[l.key].toLocaleString('fr-CA'):'0' }} </span>
                            </div>
                            <span class="" v-else-if="l.key == 'enc_is_pec'"> {{ (p[l.key])?'Oui':'Non' }} </span>
                            <span  v-else-if="l.key == 'enc_time'" class=""> {{ getTimeDate(p.enc_date) }} </span>
                            <div class="flex text-xs" v-else-if="l.key == 'enc_validate'"> 
                                <span class="p-1 border text-white border-round font-bold" :class="{'bg-blue-500':p.enc_validate,'bg-yellow-500':!p.enc_validate}">  {{ (p.enc_validate)?'OUI':'NON' }} </span> 
                            </div>
                            <div class="flex text-xs" v-else-if="l.key == 'enc_versement'"> 
                                <span class="p-1 border text-white border-round font-bold" :class="{'bg-blue-500':p.enc_versement,'bg-yellow-500':!p.enc_versement}">  {{ (p.enc_versement)?'OUI':'NON' }} </span> 
                            </div>
                            <span class="" v-else-if="l.key == 'enc_num_mvmt'"> {{ (p[l.key])?`${ (new Date(p.enc_date_enreg)).getFullYear().toString().substr(2)}/${p[l.key].toString().padStart(5,0)}`:'-' }} </span>
                            <span v-else-if="l.key == 'pat_nom_et_prenom'">
                                {{ (p.enc_is_externe)?p.enc_pat_externe:p.pat_nom_et_prenom }}
                                {{ (p.enc_is_hosp)?'(HOSP)':''  }}
                            </span>
                            <span class="" v-else > {{ (p[l.key])?p[l.key]:'-' }} </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>



        <!-- Pour la préparation encaissement -->
        <add-prep-encaisse @validate=" ()=>{
                on_prep_encaisse = false
                getListEncaissement()
            } " :visible="on_prep_encaisse" @close="on_prep_encaisse = false" />

        <!-- Pour la saisie encaissement -->
        <add-saisie-encaisse @validate=" ()=>{
                getListEncaissement()
            } " :visible="on_saisie_encaisse" @close="on_saisie_encaisse = false" />

        <!-- Pour regarder la liste des détails factures -->
        <det-fact-caisse :visible="on_det_fact" :enc="list_selected" @close="on_det_fact = false" />

        <!-- Pour le versement -->
        <enc-versement @validate=" getListEncaissement " :e="list_selected" :visible="on_versement" @close=" on_versement = false " />
    </div>
</template>

<script>
export default {
    watch:{
        'filters.date'(a){
            this.getListEncaissement()
            this.list_selected = {}

            this.on_date_now  = (this.dateToInput(a) == this.dateToInput(new Date()))?true:false
        },
        'filters.date2'(a){
            this.getListEncaissement()
            this.list_selected = {}

            this.on_date_now2  = (this.dateToInput(a) == this.dateToInput(new Date()))?true:false
        },
        'filters.validate'(a){
            this.getListEncaissement()
            this.list_selected = {}
        },

    },
    data(){
        return{
            m_date_encaisse:'',
            on_prep_encaisse:false,
            on_saisie_encaisse:false,
            on_det_fact:false,
            list_enc:[],
            on_date_now:true,
            on_date_now2:true,
            on_versement:false,
            filters:{
                date:'',
                date2:'',
                validate:-1
            },

            list_label_validate:[
                {label:"Tous",value:-1},
                {label:"Encaissés",value:1},
                {label:"Non Encaissés",value:0},
            ],
            list_label:[
                {label:"Heure",key:"enc_time"},
                {label:"N° Mouvement",key:"enc_num_mvmt"},
                {label:"Patient",key:"pat_nom_et_prenom"},
                {label:"Prise en charge",key:"enc_is_pec"},
                {label:"Société",key:"ent_label"},
                {label:"Montant Total",key:"enc_montant"},
                {label:"Avance",key:"enc_total_avance"},
                {label:"Encaissée",key:"enc_validate"},
                {label:"Versée",key:"enc_versement"},
                {label:"Département",key:"dep_label"},
            ],
            list_selected:{},
            nb_not_validate:0,
            items:[
                {
                    label:'Supprimer',
                    icon:'pi pi-times',
                    command: ()=>{

                    }
                }
            ],
            year_cur:new Date().getFullYear(),
            total_encaisse:0
        }
    },
    methods:{
        init(){
            this.filters.date = new Date()
            this.filters.date2 = new Date()
        },
        async getListEncaissement(){
            try {
                const r = await this.$http.get('api/encaissements',{params:this.filters})
                let d = r.data
                if(d.status){
                    this.list_enc = d.list_enc
                    this.nb_not_validate = d.nb_not_validate
                    this.total_encaisse = d.total_encaisse
                }else{
                    this.showNotif('error',`Liste d'encaissements`,d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        },
        async viewFact(){
            try {
                let f = this.list_selected
                const r = await this.$http.get('api/encaissement/set-pdf/'+f.enc_id)
                let d = r.data

                if(d.status){
                    window.electronAPI.downFact(this.$http.defaults.baseURL+'/api/encaissement/download')
                }else{
                    this.showNotif('error','Facture',d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        },
        async delEnc(){
            try {
                let f = this.list_selected
                const r = await this.$http.delete('api/encaissement/'+f.enc_id)
                let d = r.data

                if(d.status){
                    //Encaissememt bien supprimer
                    this.showNotif('error',`Suppression d'encaissement`,'Ligne encaissement bien supprimer')
                    this.getListEncaissement()
                    this.list_selected =  {}
                }else{
                    this.showNotif('error',`Suppression d'encaissement`,d.message)
                }
            } catch (e) {
                this.showNotifServerError()
            }
        }
    },
    beforeMount(){
        this.init()
    },
    mounted(){
        this.getListEncaissement()
    }
}
</script>