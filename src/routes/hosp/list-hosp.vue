<template>
    <div class="text-sm p-2">
        <!-- Les opérations -->
        <div class="flex align-items-end border-b pb-2 sticky top-0">
            <!-- <button @click="on_add_hosp = true" class=" flex bt-p-s justify-center items-center">
                <span class="material-icons"> add </span>
                <span class="ml-2"> Nouvelle facture </span>
            </button> -->

            <Button label="Nouvelle Facture" icon="pi pi-plus"  @click="on_add_hosp = true"  class="p-button-sm" />

            <div class="flex justify-start items-center ml-2">
                <!-- <c-select class="" :datas="list_state_filters" placeholder="Etat" label="label" code="code"  v-model="filters.state"/> -->
                <div class="flex flex-column mr-2">
                    <span class="text-xs font-bold"> Etat </span>
                    <Dropdown class="p-inputtext-sm" :options="list_state_filters" optionLabel="label" optionValue="code" v-model="filters.state" />
                </div>
                <!-- <c-select class="ml-2" :datas="list_date_filters" placeholder="Date" label="label" code="code"  v-model="filters.date_by"/> -->
                <div class="flex flex-column mr-2">
                    <span class="text-xs font-bold"> Date </span>
                    <Dropdown class="p-inputtext-sm" :options="list_date_filters" optionLabel="label" optionValue="code" v-model="filters.date_by" />
                </div>
            </div>

            <span class="flex-grow-1"></span>
            <!-- <button v-if="(list_selected.enc_id)" @click=" ()=>{
                on_add_hosp = true
                is_modif_hosp = true
            } " class=" flex bt-p-s justify-center items-center">
                <span class="material-icons"> edit </span>
                <span class="ml-2"> {{ (list_selected.enc_validate)?'Détails':'Modifier' }} </span>
            </button> -->
            <Button v-if="(list_selected.enc_id)" @click=" ()=>{
                on_add_hosp = true
                is_modif_hosp = true
            } " class="p-button-sm p-button-raised p-button-text p-button-help"  icon="pi pi-pencil" :label="(list_selected.enc_validate)?'Détails':'Modifier'"/>
        </div>

        <div class="my-2">
            <div class="flex align-items-end">
                
                <div class="flex flex-column">
                    <span class="text-xs font-bold">  {{ dateToText(filters.date) }} </span>
                    <Calendar v-model="filters.date" dateFormat="dd/mm/yy" class="p-inputtext-sm" />
                </div>

                <span class="mx-2"> au </span>

                <div class="flex flex-column">
                    <span class="text-xs font-bold">  {{ dateToText(filters.date2) }} </span>
                    <Calendar v-model="filters.date2" dateFormat="dd/mm/yy" class="p-inputtext-sm" />
                </div>
            </div>
        </div>

        <!-- Ici la liste des encaissements -->
        <div class="">
            <table class="w-full">
                <thead class="rounded-t sticky top-28 z-20" >
                    <tr class="bg-gray-50 text-gray-700 text-sm text-left">
                        <th v-for="l in list_label" class="p-2 border text-xs" :key="l.key">
                            {{ l.label }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr @click=" ()=>{
                            list_selected = p
                        } " v-for="p in list_enc" class="cursor-pointer"  :key="p.enc_id">
                        <td :class="{'active-row':list_selected.enc_id == p.enc_id,}"  class="p-2 border text-xs" 
                        v-for="l in list_label" :key="l.key">

                            <div class="w-full flex justify-end" v-if="['enc_montant','enc_total_avance','enc_reste_paie'].indexOf(l.key) != -1">
                                <span class="" v-if="l.key == 'enc_reste_paie'">
                                    {{ ((p.enc_validate)?0:p.enc_reste_paie).toLocaleString('fr-CA') }}
                                </span>
                                <span v-else-if="l.key == 'enc_total_avance'">
                                    {{ ((p.enc_validate)?p.enc_montant:p.enc_total_avance).toLocaleString('fr-CA') }}
                                </span>
                                <span v-else class=""> {{  (p[l.key])?p[l.key].toLocaleString('fr-CA'):0 }} </span>
                            </div>
                            <div class="flex justify-center items-center" v-else-if="l.key == 'enc_num_hosp'">
                                <span class="material-symbols-outlined" :class="{'text-blue-500':p.enc_validate}"> {{ (p.enc_validate)?'verified':'pending' }} </span>
                                <span class="ml-2"> {{ p.enc_num_hosp }} </span>
                            </div>
                            <span v-else-if="(['enc_date_entre','enc_date_sortie'].indexOf(l.key) != -1)"> {{ (p[l.key])?dateToText(p[l.key]):'-' }} </span>
                            <span class="" v-else > {{ (p[l.key])?p[l.key]:'-' }} </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>



        <!-- Pour la préparation encaissement -->
        <add-hosp :en="list_selected" :modif="is_modif_hosp" @validate=" (e)=>{
                getListHosp()
                if(e != undefined){
                    on_add_hosp = false
                    is_modif_hosp = false
                }
            } " :visible="on_add_hosp" @close="()=>{
                on_add_hosp = false
                is_modif_hosp = false
            } " />

        <!-- Pour la saisie encaissement -->
        <add-saisie-encaisse @validate=" ()=>{
                getListHosp()
            } " v-if="on_saisie_encaisse" @close="on_saisie_encaisse = false" />

        <!-- Pour regarder la liste des détails factures -->
        <det-fact-caisse :enc="list_selected" v-if="on_det_fact" @close="on_det_fact = false" />
    </div>
</template>

<script>
export default {
    watch:{
        'filters.date'(a){
            this.getListHosp()
            this.list_selected = {}

            this.on_date_now  = (this.dateToInput(a) == this.dateToInput(new Date()))?true:false
        },
        'filters.date2'(a){
            this.getListHosp()
            this.list_selected = {}
            this.on_date_now2  = (this.dateToInput(a) == this.dateToInput(new Date()))?true:false
        },
        'filters.state'(a){
            this.getListHosp()
        },
        'filters.date_by'(a){
            this.getListHosp()
        }

    },
    data(){
        return{
            m_date_encaisse:'',
            on_add_hosp:false,
            on_saisie_encaisse:false,
            on_det_fact:false,
            list_enc:[],
            on_date_now:true,
            on_date_now2:true,
            filters:{
                date:'',
                date2:'',
                date_by:'enc_date_entre',
                state:-1
            },
            list_label:[
                {label:"Référence",key:"enc_num_hosp"},
                {label:"Patient",key:"pat_numero"},
                {label:"Nom et prénom",key:"pat_nom_et_prenom"},
                {label:"Entrée",key:"enc_date_entre"},
                {label:"Montant Total",key:"enc_montant"},
                {label:"Payé",key:"enc_total_avance"},
                {label:"Restant",key:"enc_reste_paie"},
                {label:"Sortie",key:"enc_date_sortie"},
                {label:"Département",key:"dep_label"},
            ],

            list_date_filters:[
                {label:"Date d'entrée",code:'enc_date_entre'},
                {label:"Date de sortie",code:'enc_date_sortie'},
            ],
            //Filtre des hospitalisations en cours ou sortie
            list_state_filters:[
                {label:"Tous",code:-1},
                {label:"En cours",code:0},
                {label:"Sortie",code:1},
            ],
            list_selected:{},
            nb_not_validate:0,

            //Moification de hospitalisation
            is_modif_hosp:false
        }
    },
    methods:{
        init(){
            this.filters.date = new Date()
            this.filters.date2 = new Date()
        },

        reselect(){
            for (let i = 0; i < this.list_enc.length; i++) {
                const e = this.list_enc[i];
                if(e.enc_id == this.list_selected.enc_id){
                    this.list_selected = e
                    break
                }
            }
        },
        async getListHosp(){
            try {
                
                const r = await this.$http.get('api/encaissements/hosp',{params:this.filters})
                let d = r.data
                if(d.status){
                    this.list_enc = d.list_enc
                }else{
                    this.showNotif(d.message)
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
                    this.showNotif(d.message)
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
                    this.showNotif('Ligne encaissement bien supprimer')
                    this.getListEncaissement()
                    this.list_selected =  {}
                }else{
                    this.showNotif(d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        }
    },
    beforeMount(){
        this.init()
    },
    mounted(){
        this.getListHosp()
    }
}
</script>