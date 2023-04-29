<template>
    <div class="text-sm p-2">
        <!-- Les opérations -->
        <div class="flex align-items-end pb-2 sticky  bg-white " style="top:60px;z-index:50">
            <!-- <button @click="getListEncaissement" class="flex bt-p-s justify-center items-center">
                <span class="material-symbols-outlined"> refresh </span>
            </button> -->
            

            <!-- <custom-input label="Numéro mouvement" v-model="filters.search" ex="Ex : 1,2,..." class="ml-2" /> -->
            <div class="flex flex-column">
                <span class="text-xs font-bold"> Numéro mouvement </span>
                <span class="p-input-icon-right">
                    <i class="pi pi-search" />
                    <InputText class="p-inputtext-sm" type="text" v-model="filters.search" placeholder="Ex : 1,2,..."/>
                </span>
            </div>
            <!-- <c-select class="ml-2" v-model="filters.dep_id"  :datas="list_dep" label="dep_label" code="dep_id" placeholder="Département" /> -->
            <div class="ml-2 flex flex-column">
                <span class="text-xs font-bold"> Département </span>
                <Dropdown class="p-inputtext-sm" v-model="filters.dep_id" :options="list_dep" optionLabel="dep_label" optionValue="dep_id" placeholder="Département" />
            </div>

            <Divider layout="vertical"/>
            
            <div class="flex align-items-end ml-2">
                <!-- <custom-input type="date" v-model="filters.date" :label=" (filters.date)?dateToText(filters.date):'Date 1' " /> -->
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
            </div>

            <span class="flex-grow-1"></span>
            <Button v-tooltip.left="'Actualiser'" @click="getListEncaissement" icon="pi pi-refresh" class="ml-2 p-button-sm  p-button-raised p-button-text" />
            <Button v-tooltip.left="'Déselectionner'" v-if="list_selected.enc_id" @click="list_selected = {}" icon="pi pi-stop"  class="ml-2 p-button-sm  p-button-raised p-button-text" />
        </div>

        <!-- <div class="flex my-2">
            
        </div> -->

        <!-- Ici la liste des encaissements -->
        <div class="">
            <table class="w-full">
                <thead class="" >
                    <tr class="text-left">
                        <th v-for="l in list_label" class="sticky" style="top:134px" :key="l.key">
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

                            <div class="w-full flex justify-end" v-if="['enc_montant'].indexOf(l.key) != -1">
                                <span class=""> {{ (p[l.key]).toLocaleString('fr-CA') }} </span>
                            </div>
                            <span class="" v-else-if="l.key == 'enc_is_pec'"> {{ (p[l.key])?'Oui':'Non' }} </span>
                            <span  v-else-if="l.key == 'enc_time'" class=""> {{ getTimeDate(p.enc_date) }} </span>
                            <div class="flex text-xs" v-else-if="l.key == 'enc_validate'"> 
                                <span class="p-1 border text-white border-round font-bold" :class="{'bg-blue-500':p.enc_validate,'bg-yellow-500':!p.enc_validate}">  {{ (p.enc_validate)?'OUI':'NON' }} </span> 
                            </div>
                            <div class="flex text-xs" v-else-if="l.key == 'vt_id'"> 
                                <span class="p-1 border text-white border-round font-bold" :class="{'bg-blue-500':p.vt_id,'bg-yellow-500':!p.vt_id}">  {{ (p.vt_id)?'OUI':'NON' }} </span> 
                            </div>

                            <span class="" v-else-if="l.key == 'enc_num_mvmt'"> {{ (p[l.key])?`${ (new Date(p.enc_date_enreg)).getFullYear().toString().substr(2)}/${p[l.key].toString().padStart(5,0)}`:'-' }} </span>

                            <span v-else-if="l.key == 'pat_nom_et_prenom'">
                                {{ (p.enc_is_externe)?p.enc_pat_externe:p.pat_nom_et_prenom }}
                                {{ (p.enc_is_hosp)?'(HOSP)':''  }}
                            </span>

                            <span class="" v-else > {{ (p[l.key])?p[l.key]:'-' }} </span>
                        </td>
                    </tr>
                    <tr class="">
                        <td class="last-row" :colspan="list_label.length - 2"> TOTAL </td>
                        <td class="last-row">
                            <div class="flex flex-column">
                                <span class=""> RESULTAT </span>
                                <span class="font-bold"> {{ list_enc.length  }} </span>
                            </div>
                        </td>
                        <td class="last-row">
                            <div class="flex flex-column">
                                <span class=""> MONTANTS </span>
                                <span class="font-bold"> {{ (total_montant)?total_montant.toLocaleString('fr-CA'):0 }} </span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>



        <!-- Pour la préparation encaissement -->
        <add-prep-encaisse @validate=" ()=>{
                on_prep_encaisse = false
                getListEncaissement()
            } " v-if="on_prep_encaisse" @close="on_prep_encaisse = false" />

        <!-- Pour la saisie encaissement -->
        <add-saisie-encaisse @validate=" ()=>{
                getListEncaissement()
            } " v-if="on_saisie_encaisse" @close="on_saisie_encaisse = false" />

        <!-- Pour regarder la liste des détails factures -->
        <det-fact-caisse :enc="list_selected" v-if="on_det_fact" @close="on_det_fact = false" />
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
        'filters.dep_id'(a){
            this.getListEncaissement()
            this.list_selected = {}
        },
        'filters.search'(a){
            this.getListEncaissement()
            this.list_selected = {}
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
            filters:{
                date:'',
                date2:'',
                search:'',
                search_by:'enc_num_mvmt',
                dep_id:-1,
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
                {label:"Encaissée",key:"enc_validate"},
                {label:"Versée",key:"vt_id"},
                {label:"Département",key:"dep_label"},
            ],
            list_selected:{},
            nb_not_validate:0,
            list_dep:[{dep_label:'Tous',dep_id:-1}],
            total_montant:0
        }
    },
    methods:{
        init(){
            this.filters.date = new Date()
            this.filters.date2 = new Date()
        },
        async getListEncaissement(){
            try {
                const r = await this.$http.get('api/encaissements/main',{params:this.filters})
                let d = r.data
                if(d.status){
                    this.list_enc = d.list_enc
                    this.nb_not_validate = d.nb_not_validate
                    this.total_montant = d.total_montant
                    if(this.list_dep.length <= 1){
                        this.list_dep = [...this.list_dep,...d.list_dep]
                    }
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
        this.getListEncaissement()
    }
}
</script>