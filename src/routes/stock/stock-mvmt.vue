<template>
    <div class="">
        <div class="text-sm flex p-2 sticky bg-white" style="top:58px">
            <!-- <button v-if="!($store.state.user.util_type == 'ph')" :class="{'sub-menu-active':cur_onglet == 'entre'}" @click=" ()=> {
                    cur_onglet = 'entre'
                } " class="mx-2">Les Entrées</button>
            <button @click=" ()=>{
                    cur_onglet = 'sortie'
                } " :class="{'sub-menu-active':cur_onglet == 'sortie'}"  class="mx-2"> Les Sorties </button> -->
            <SelectButton v-model="cur_onglet" :options="tabMvmt" optionValue="value" optionLabel="name" aria-labelledby="single" class="p-button-sm" />
        </div>


        <div class="">

            <!-- Liste et saisie des entrées -->
            <div v-if="cur_onglet == 'entre'" class=" flex flex-column">
                <!-- Ty le eo ambony iny e !!  -->
                <div class="p-2 flex align-items-end sticky border-bottom-1 border-200 bg-white" style="top:118px">
                    <!-- <custom-input type="date" v-model="date_entre"  :label=" dateToText(date_entre)" /> -->
                    <div class="flex flex-column mt-2">
                        <span class="font-bold text-sm"> {{ dateToText(date_entre2) }} </span>
                        <Calendar placeholder="ex : 09/09/1998" v-model="date_entre2"  dateFormat="dd/mm/yy" class="p-inputtext-sm"  />    
                    </div>
                    <span class="mx-2"> au </span>
                    <div class="flex flex-column mt-2">
                        <span class="font-bold text-sm"> {{ dateToText(date_entre) }} </span>
                        <Calendar placeholder="ex : 09/09/1998" v-model="date_entre"  dateFormat="dd/mm/yy" class="p-inputtext-sm"  />    
                    </div>
                    <!-- <button class="bt-p-s ml-2" @click=" on_add_mvmt = true"> Ajouter </button> -->
                    <Button label="Ajouter" class="p-button-sm ml-2" icon="pi pi-plus" @click="on_add_mvmt = true" />

                    <Button :loading="loading" label="Imprimer" class="p-button-sm p-button-raised p-button-text p-button-help ml-2" icon="pi pi-print" 
                    @click="printListMvmt"/>

                    <span class="flex-grow-1"></span>

                    <Button v-if="list_selected.mvmt_id" label="Détails" class="p-button-sm p-button-raised p-button-text" @click="on_det_mvmt = true" />
                </div>
                <!-- Eto ny liste e ! -->
                <div class="w-full p-2">
                    <table class="w-full">
                        <thead class="" >
                            <tr class="bg-gray-50 text-gray-700 text-sm text-center " >

                                <th v-for="l in list_label_entre" class="p-2 border text-xs text-left sticky" style="top:198px" :key="l.key">
                                    {{ l.label }}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr @click=" ()=>{
                                    list_selected = p
                                } " v-for="p in list_entre" class="cursor-pointer relative"  :key="p.mvmt_id">
                                <td :class="{'active-row':list_selected.mvmt_id == p.mvmt_id}"  class="p-2 border text-xs" 
                                v-for="l in list_label_entre" :key="l.key">
                                    <span v-if="l.key == 'mvmt_type'"> {{ getTypeEntre(p[l.key]) }} </span>
                                    <span class="" v-else-if="l.key == 'mvmt_montant'"> {{ p[l.key].toLocaleString('fr-CA') }} </span>
                                    <span v-else > {{ p[l.key] }} </span>
                                </td>
                            </tr>

                        </tbody>
                    </table>
                </div>
            </div>
            

            <!-- Liste et saisie des sorties -->
            <div class="flex flex-column " v-if="cur_onglet == 'sortie'">
                <!-- Ty le eo ambony iny e !!  -->
                <div class="p-2 flex align-items-end sticky border-bottom-1 border-200 bg-white" style="top:120px">
                    <!-- <custom-input type="date" v-model="date_entre"  :label=" dateToText(date_sortie)" />
                    <button class="bt-p-s ml-2" @click=" on_add_mvmt = true"> Ajouter </button> -->
                    <div class="flex flex-column mt-2">
                        <span class="font-bold text-sm"> {{ dateToText(date_sortie2) }} </span>
                        <Calendar placeholder="ex : 09/09/1998" v-model="date_sortie2"  dateFormat="dd/mm/yy" class="p-inputtext-sm"  />    
                    </div>
                    <span class="mx-2"> au </span>
                    <div class="flex flex-column mt-2">
                        <span class="font-bold text-sm"> {{ dateToText(date_sortie) }} </span>
                        <Calendar placeholder="ex : 09/09/1998" v-model="date_sortie"  dateFormat="dd/mm/yy" class="p-inputtext-sm"  />    
                    </div>
                    <!-- <button class="bt-p-s ml-2" @click=" on_add_mvmt = true"> Ajouter </button> -->
                    <Button label="Ajouter" class="p-button-sm ml-2" icon="pi pi-plus" @click="on_add_mvmt = true" />
                    
                    <Button :loading="loading" label="Imprimer" class="p-button-sm p-button-raised p-button-text p-button-help ml-2" icon="pi pi-print" 
                    @click="printListMvmt"/>

                    

                    <div class="relative">
                        <Button v-if="$store.state.user.util_type == 'ph' || inTypeUser(['g','m','a']) " label="Pharmacie" class="p-button-sm p-button-raised p-button-text p-button-danger ml-2" 
                            @click="on_det_em = true"/>

                        <span v-if="nbEncMvmt != 0" class="absolute text-xs bg-red-500 p-1 border-1 border-red-500 text-red-500" style="top:-2px;right: -2px;"></span>
                    </div>


                    <span class="flex-grow-1"></span>

                    <Button v-if="list_selected.mvmt_id" label="Détails" class="p-button-sm p-button-raised p-button-text" @click="on_det_mvmt = true" />
                </div>

                <!-- Eto ny liste e ! -->
                <div class="w-full p-2">
                    <table class="w-full">
                        <thead class="rounded-t" >
                            <tr class="bg-gray-50 text-gray-700 text-sm ">

                                <th v-for="l in list_label_sortie" class="p-2 border text-xs text-left sticky" style="top:215px" :key="l.key">
                                    {{ l.label }}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr @click=" ()=>{
                                    list_selected = p
                                } " v-for="p in list_sortie" class="cursor-pointer relative"  :key="p.mvmt_id">
                                <td :class="{'active-row':list_selected.mvmt_id == p.mvmt_id}"  class="p-2 border text-xs" 
                                v-for="l in list_label_sortie" :key="l.key">
                                    <span v-if="l.key == 'mvmt_type'"> {{ getTypeSortie(p[l.key]) }} </span>
                                    <span class="" v-else-if="l.key == 'depot_dest'"> {{ (p.mvmt_type == 'transfert')?p[l.key]:(p.dep_label)?p.dep_label:'-' }} </span>
                                    <!-- <span class="" v-else-if="l.key == 'dep_label'"> {{ (p.mvmt_type == 'transfert')?'-':p[l.key] }} </span> -->
                                    <span class="" v-else-if="l.key == 'mvmt_montant'"> {{ p[l.key].toLocaleString('fr-CA') }} </span>
                                    <span v-else > {{ p[l.key] }} </span>
                                </td>
                            </tr>

                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Ajout de mouvement -->
        <add-mvmt :visible="on_add_mvmt" @close=" on_add_mvmt = false" @validate=" ()=>{

                on_add_mvmt = false
                if(cur_onglet == 'entre'){
                    getListEntreByDate()
                }else{
                    getListSortieByDate()
                }
        } " :action="cur_onglet" />

        <!-- Détails de mouvement -->

        <det-mvmt :mvmt="list_selected" :visible="on_det_mvmt" @close=" on_det_mvmt = false"  />


        <!-- Détails de sortie médicaments encaissements -->
        <det-enc-mvmt :visible="on_det_em" @close=" on_det_em = false" @change=" ()=>{
            getListSortieByDate()
            getNbEncMvmtNow()
        } " />
    </div>
</template>

<script>
export default {
    watch:{
        cur_onglet(a){
            if(a == 'entre'){
                this.getListEntreByDate()
            }else if(a == 'sortie'){
                this.getListSortieByDate()
                this.getNbEncMvmtNow()
            }

            this.list_selected = {}

            // console.log(a)
        },
        date_entre2(a){
            this.getListEntreByDate()
            this.list_selected = {}
        },
        date_sortie2(a){
            this.getListSortieByDate()
            this.list_selected = {}
        },
        date_entre(a){
            this.getListEntreByDate()
            this.list_selected = {}
        },
        date_sortie(a){
            this.getListSortieByDate()
            this.list_selected = {}
        }
    },
    data(){
        return{
            on_add_mvmt:false,
            on_det_mvmt:false,
            cur_onglet:'',
            date_entre: new Date(),
            date_entre2: new Date(),
            date_sortie2:new Date(),
            date_sortie: new Date(),
            list_entre:[],
            list_sortie:[],

            list_selected:{},

            list_label_entre:[
                {label:"Numéro",key:"mvmt_num"},
                {label:"Type mouvement",key:"mvmt_type"},
                {label:"Fournisseur",key:"fourn_label"},
                {label:"Depot",key:"depot_label"},
                {label:"Nombre d'article ",key:"nb_art"},
                {label:"Montant ",key:"mvmt_montant"},
            ],
            list_label_sortie:[
                {label:"Numéro",key:"mvmt_num"},
                {label:"Type mouvement",key:"mvmt_type"},
                {label:"Depot de départ",key:"depot_exp"},
                {label:"Depot de déstination",key:"depot_dest"},

                {label:"Nb. article ",key:"nb_art"},
                {label:"Montant ",key:"mvmt_montant"},
            ],

            tabMvmt: [
                {name: 'Les Sorties', value: 'sortie'},
            ],

            loading:false,
            nbEncMvmt:0,

            on_det_em:false
        }
    },
    methods:{
        init(){
            if(this.$store.state.user.util_type == 'ph'){
                this.cur_onglet = 'sortie'
            }else{
                this.tabMvmt.unshift({name: 'Les Entrées', value: 'entre'})
                this.cur_onglet = 'entre'
            }
        },
        
        async getListEntreByDate(){
            try {
                const _r = await this.$http.get('api/mvmts/entre',{params:{date:this.date_entre,date2:this.date_entre2}})
                let _d = _r.data

                if(_d.status){
                    this.list_entre = _d.list
                }else{
                    
                }
            } catch (e) {
                this.showNotifServerError()
            }
        },
        async getListSortieByDate(){
            try {
                const _r = await this.$http.get('api/mvmts/sortie',{params:{date:this.date_sortie,date2:this.date_sortie2}})
                let _d = _r.data

                if(_d.status){
                    this.list_sortie = _d.list
                }else{
                    
                }
            } catch (e) {
                this.showNotifServerError()
            }
        },

        async printListMvmt(){

            this.loading = true
            try {
                const _r = await this.$http.get('api/mvmts/print/es',{params:
                    {action:this.cur_onglet,
                    date:(this.cur_onglet == 'entre')?this.date_entre:this.date_sortie,
                    date2:(this.cur_onglet == 'entre')?this.date_entre2:this.date_sortie2,}})
                let _d = _r.data

                if(_d.status){

                    setTimeout(()=> {
                        window.electronAPI.downFact(`${this.$http.defaults.baseURL}/api/mvmts/print/es/down`)
                        this.loading = false
                    }, 3000);
                    
                }else{
                    this.showNotif('error','PDF Détails mouvement',d.message)
                }
            } catch (e) {
                this.showNotifServerError()
            }
        },

        async getNbEncMvmtNow(){
            try {
                const _r = await this.$http.get('api/mvmt/enc-med/nb')
                let _d = _r.data

                if(_d.status){
                    this.nbEncMvmt = _d.nbEncMvmt
                }else{
                    
                }
            } catch (e) {
                this.showNotifServerError()
            }
        }
    },
    beforeMount(){
        this.init()

        this.getNbEncMvmtNow()
    },
    mounted(){
        
    }
}
</script>

<style>

</style>