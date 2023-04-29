<template>
    <div class="p-2 flex justify-center items-center w-full">
        <div class="w-full">
            <div class="flex py-2 align-items-end sticky bg-white" style="top:60px;z-index:105">
                <!-- <button @click="  on_add_pec = true " class="bt-p-s">  <span class="material-icons text-md"> add </span> <span class="ml-2"> Ajouter </span> </button> -->
                <Button class="p-button-sm" icon="pi pi-plus" @click="  on_add_pec = true " label="Ajouter" />
                <!-- <button v-if="list_selected.encharge_id && inTypeUser(['a','g','m'])"  class="bt-p-s ml-2" 
                @click="delPec">  <span class="material-icons text-md"> clear </span> <span class="ml-2"> Supprimer </span> </button> -->
                <Button v-if="list_selected.encharge_id && inTypeUser(['a','g','m'])" 
                class="p-button-sm p-button-danger p-button-text p-button-raised ml-2" icon="pi pi-times" @click="delPec" label="Supprimer" />
                
                <div class="flex-grow-1 flex justify-content-center">
                    <!-- <custom-input v-model="filters.search"  class="mr-2" label="Recherche"  /> -->
                    <span class="p-input-icon-right">
                        <i class="pi pi-search" />
                        <InputText class="p-inputtext-sm" type="text" v-model="filters.search" placeholder="Recherche ..."/>
                    </span>

                    <!-- <c-select class="mr-5" placeholder="Par" v-model="filters.search_by"  :datas="list_search_by" label="label" code="code" /> -->
                    <Dropdown :options="list_search_by" class="p-inputtext-sm ml-2" v-model="filters.search_by" optionLabel="label" optionValue="code"/>
                    <Divider layout="vertical" />
                    <!-- <c-select class="ml-2" placeholder="Sélection" v-model="filters.month" :datas="data_month" label="label" code="code" /> -->
                    <Dropdown :options="data_month" class="p-inputtext-sm" v-model="filters.month" optionLabel="label" optionValue="code"/>
                    <!-- <custom-input v-model="filters.year" type="number" class="ml-2 w-16" label="Année"  /> -->
                    <InputText style="width:100px;" class="p-inputtext-sm ml-2" type="number" v-model="filters.year" placeholder="..."/>
                </div>

                
                <!-- <button  class="bt-p-s ml-2"> Facture détaillée </button> -->
                <!-- <menu-point v-if="list_selected.encharge_id" class="relative">
                    <menu-item  @click=" on_edit_fact = true " > <span class="material-icons"> info </span> <span class="ml-2"> Facture détaillée </span> </menu-item>
                    <menu-item  @click=" on_view_recap = true " > <span class="material-icons"> info </span> <span class="ml-2"> Récapitulatif de facture</span> </menu-item>
                </menu-point> -->
                <Button type="button" v-if="list_selected.encharge_id" icon="pi pi-ellipsis-v" class="p-button-sm p-button-rounded p-button-text" 
                @click="showMenu" aria-haspopup="true" aria-controls="overlay_menu"/>
                <Menu id="overlay_menu" ref="menu" class="text-xs" :model="items_menu" :popup="true" />
            </div>
            <table class="w-full">
                <thead class="rounded-t sticky top-0 z-20" >
                    <tr class="bg-gray-50 text-gray-700 text-sm text-left">
                        <th v-for="l in list_label" class="p-2 border text-xs" :key="l.key">
                            {{ l.label }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <!-- <tr v-for="p in list_pec" :key="p.pec_id">
                        <td class="p-2 border text-xs" v-for="l in list_label" :key="l.key">
                            <span> {{ p[l.key] }} </span>
                        </td>
                    </tr> -->

                    <tr @click=" ()=>{
                            list_selected = p
                        } " class="cursor-pointer relative" v-for="p,i in list_pec" :key="p.encharge_id">
                        <td :class="{'active-row':list_selected.encharge_id == p.encharge_id}" class="p-2 border text-xs" v-for="l in list_label" :key="l.key">
                            <span class="" v-if=" ['encharge_date_entre','encharge_date_sortie'].indexOf(l.key) != -1 ">
                                {{ (p[l.key])?dateToText(p[l.key]) :'-' }}
                            </span>
                            <!-- :class="{'bg-blue-500':p[l.key]}" -->
                            <span class=""  v-else-if="['encharge_fact_to_gest','encharge_fact_to_soc'].indexOf(l.key) != -1">
                                <Checkbox :binary="true" v-if="l.key == 'encharge_fact_to_gest'" @click=" setStateFact(l.key,i) " :disabled="(!checkModule('prise-en-charge') || p.encharge_fact_to_gest)" :modelValue="(p[l.key])?true:false" />
                                <Checkbox :binary="true" v-else-if="l.key == 'encharge_fact_to_soc' " @click=" setStateFact(l.key,i) " :disabled=" (!inTypeUser(['g']) || p.encharge_fact_to_soc || !p.encharge_fact_to_gest)"  :modelValue="(p[l.key])?true:false" />
                            </span>
                            <span v-else> {{ (p[l.key] )?p[l.key] :'-'}} </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <add-pec @validate=" ()=>{
                on_add_pec = false
                getPec()
            } " :visible="on_add_pec" @close=" on_add_pec = false " />

        <gest-fact-pec @validate=" ()=>{
                on_edit_fact = false
                getPec()
            } " :pec="list_selected" :visible="on_edit_fact" @close="on_edit_fact = false" />

        <recap-fact-pec :pec="list_selected" :visible="on_view_recap" @close="on_view_recap = false" />
    </div>
</template>

<script>
export default {
    watch:{
        'filters.month'(){
            this.list_selected = {}
            this.getPec()
        },
        'filters.year'(){
            this.list_selected = {}
            this.getPec()
        },
        'filters.search'(){
            this.list_selected = {}
            this.getPec()
        },
        
        'filters.search_by'(){
            this.list_selected = {}
            this.getPec()
        }
    },
    data(){
        return{
            list_pec:[],
            on_edit_fact:false,
            list_label:[
                {label:'N°sequence',key:'encharge_seq'},
                {label:'Patient',key:'pat_nom_et_prenom'},
                {label:'Société employeur',key:'ent_label'},
                {label:'Société payeur',key:'ent_label_payeur'},
                {label:'Tarif',key:'tarif_label'},
                {label:'N° compte',key:'ent_num_compte_payeur'},
                {label:"Date d'entrée",key:'encharge_date_entre'},
                {label:"Date de sortie",key:'encharge_date_sortie'},
            ],
            on_add_pec:false,
            on_view_pec:false,
            list_selected:{},

            on_view_recap:false,

            //pour le filtre par date d'insertion
            data_month:[],
            filters:{
                month:0,
                year:new Date().getFullYear(),
                search_by:'pat_nom_et_prenom',
                search:''
            },
            list_search_by:[
                {label:'Patient',code:"pat_nom_et_prenom"},
                {label:'Société',code:"e1.ent_label"},
                {label:'Soc. Payeur',code:"e2.ent_label"}
            ],

            items_menu:[
                {
                    label: 'Facture détaillée',
                    icon: 'pi pi-list',
                    command: () => {
                        this.on_edit_fact = true
                    }
                },
                {
                    label: 'Récapitulatif de facture',
                    icon: 'pi pi-list',
                    command: () => {
                        this.on_view_recap = true 
                    }
                },
            ]

            
        }
    },
    methods:{
        async getPec(){
            try {
                const _r = await this.$http.get('api/encharge',{params:this.filters})
                let _d = _r.data

                if(_d.status){
                    this.list_pec = _d.reponse
                }else{
                    this.showNotif(_d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        },
        async delPec(){
            try {
                const _r = await this.$http.delete('api/encharge/'+this.list_selected.encharge_id)
                let _d = _r.data

                if(_d.status){
                    this.list_selected = {}
                    this.getPec()
                }else{
                    this.showNotif(_d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        },
        init(){
            //Set liste_mois to _data
            this.data_month.push({label:"Toute l'année",code:0})
            for (let i = 0; i < this.list_mois.length; i++) {
                const e = this.list_mois[i]
                this.data_month.push({label:e,code:i+1})
            }

            //Gestion des colonnes pour la gestion de facture
            if(this.checkModule('prise-en-charge') || this.inTypeUser(['m','a'])){
                this.list_label.push({label:'Transmis au gestionnaire',key:'encharge_fact_to_gest'})
            }

            if(this.inTypeUser(['g','a','m'])){
                this.list_label.push({label:'Transmis à l\'Assureur',key:'encharge_fact_to_soc'})
            }

        },
        async setStateFact(st,index){
            let id = this.list_pec[index].encharge_id
            if(this.list_pec[index][st]){
                this.showNotif('Plus possible de modifier')
                return
            }
            try {
                const r = await this.$http.put('api/encharge/fact/state',{key:st,encharge_id:id})
                let d = r.data
                if(d.status){
                    this.showNotif('success','Prise en charge','Modification bien enregistré')
                    this.getPec()
                }else{
                    this.showNotif('error','Prise en charge',d.message)
                }
            } catch (e) {
                this.showNotifServerError()
            }
        },
        showMenu(event) {
            this.$refs.menu.toggle(event);
        },
    },
    beforeMount(){
        this.init()
    },
    mounted(){
        this.getPec()
    }
}
</script>

<style>

</style>