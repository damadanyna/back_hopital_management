<template>
    <div class="p-2 w-full relative">
        <!-- Eto ny misy ny filtre sy ny recherche -->
        <div class="flex align-items-center bg-white top-head" :style="top_head_style">
            <div class="my-2 flex align-items-center">
                <!-- <custom-input label="Recherche :" class="w-56" ex="Ralaivao Adonis" icon="search" v-model="filters.search" /> -->
                <div class="flex flex-column mr-2">
                    <span class="p-input-icon-right">
                        <i class="pi pi-search" />
                        <InputText class="p-inputtext-sm" type="text" v-model="filters.search" placeholder="ex : Ralaivao Adonis"/>
                    </span>
                </div>
                <!-- <c-select class="mx-2" :datas="search_by_list" label="label" code="code" placeholder="Par :" v-model="filters.search_by" /> -->
                <Dropdown class="p-inputtext-sm" v-model="filters.search_by" :options="search_by_list" optionLabel="label" optionValue="code" placeholder="Par ..." />
            </div>
            <span class="flex-grow-1"></span>
            <!-- Ajout et tout -->
            <div class="flex my-2">
                <!-- <button @click="  on_add_patient = true " class="bt-p-s"> 
                    <span class="material-icons text-md mr-2"> add </span> 
                <span class=""> Ajouter </span> </button> -->
                <Button label="Ajouter" icon="pi pi-plus" class="p-button-sm" @click="  on_add_patient = true " />
                <!-- <button v-if="list_selected.pat_id" @click="  on_edit_patient = true " class="bt-p-s ml-2"> 
                    <span class="material-icons text-md mr-2"> edit </span> <span class=""> Modifier </span> 
                </button> -->
                <Button v-if="list_selected.pat_id" @click="  on_edit_patient = true " 
                label="Modifier" icon="pi pi-pencil" class="ml-2 p-button-sm  p-button-raised p-button-help p-button-text" />

                <!-- <button @click="on_sup_user = true" v-if="list_selected.pat_id && inTypeUser(['a','m'])"  class="bt-red-s ml-2"> 
                    <span class="material-icons text-md mr-2"> delete </span> <span class=""> Supprimer </span> 
                </button> -->
                <Button v-if="list_selected.pat_id && inTypeUser(['a','m'])" @click="confirmDeletePat($event)" 
                label="Supprimer" icon="pi pi-times" class="ml-2 p-button-sm p-button-text p-button-raised p-button-danger" />
                <!-- <button v-if="list_selected.pat_id" class="bt-p-s" @click=" list_selected = {} "> Déselectionner </button> -->
                <Button v-if="list_selected.pat_id" @click=" list_selected = {} " 
                label="Déselectionner" icon="pi pi-stop" class="ml-2 p-button-sm p-button-raised p-button-text" />
            </div> 
        </div>


        <div class="relative">
            <table class="w-full">
                <thead class="rounded-t z-20" >
                    <tr class="text-left table-head-tr">

                        <th v-for="l in list_label" :style="th_style" class="text-sm" :key="l.key">
                            {{ l.label }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr @click=" ()=>{
                            list_selected = p
                        } " v-for="p in list_patients" class="cursor-pointer relative"  :key="p.pat_id">
                        <td :class="{'active-row':list_selected.pat_id == p.pat_id}"  class="text-xs" 
                        v-for="l in list_label" :key="l.key">
                            <span v-if="l.key == 'pat_date_naiss' || l.key == 'pat_dernier_visite'" class=""> 
                                {{ (p[l.key])?dateToText(p[l.key]):'-' }}    
                            </span>
                            <span class="" v-else-if=" l.key == 'pat_sexe' "> {{ (p[l.key] == 'M')?'Masculin':'Féminin' }} </span>
                            <span class="" v-else-if="l.key == 'pat_age'"> {{ (p.pat_date_naiss)?getAgeByDate(p.pat_date_naiss):'-' }} </span>
                            <span v-else-if="l.key == filters.search_by"> 
                                <div v-html="searchReplace(p[l.key])"> </div>
                            </span>
                            <span v-else> {{ p[l.key] }} </span>
                        </td>
                    </tr>
                    <tr class="">
                        <td class="last-row" :colspan="list_label.length - 3"> Total </td>
                        <td class="last-row">
                            <div class="flex flex-column">
                                <span class=""> Résultat </span>
                                <span class="font-bold"> {{ list_patients.length }} </span>
                            </div>
                        </td>
                        <td class="last-row">
                            <div class="flex flex-column">
                                <span class=""> Affichage </span>
                                <span class="font-bold"> {{ filters.limit }} </span>
                            </div>
                        </td>
                        <td class="last-row">
                            <div class="flex flex-column">
                                <span class=""> Patients </span>
                                <span class="font-bold"> {{ nb_total_patient.toLocaleString('fr-CA') }} </span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <add-patient :visible="on_add_patient" @validate=" ()=>{
            getListPatients()
            on_add_patient = false    
        } " @close=" on_add_patient = false " />

        <det-patient @validate=" ()=>{
            getListPatients()
            on_edit_patient = false    
            } " :visible="on_edit_patient" :pat="list_selected"  @close=" on_edit_patient = false " />

        <sup-user @validate="()=>{
            getListPatients()
            on_sup_user = false    
            list_selected = {}
        }" :u="list_selected"  @close="on_sup_user = false" v-if="on_sup_user"/>
    </div>
</template>

<script>
export default {
    watch:{
        'filters.search'(a){
            if(this.in_search){
                this.have_to_search = true
            }else{
                this.getListPatients()
            }
        },
        'selectedPat'(a){
            this.lockRows = [a]
        }
    },
    data(){
        return{
            list_label:[
                {label:'Numéro',key:'pat_numero'},
                {label:'Nom et prénom',key:'pat_nom_et_prenom'},
                {label:'Date de naissance',key:'pat_date_naiss'},
                {label:'Age',key:'pat_age'},
                {label:'Sexe',key:'pat_sexe'},
                {label:'Profession',key:'pat_profession'},
                {label:'Adresse',key:'pat_adresse'},
                {label:"Dérnière Visite",key:"pat_dernier_visite"},
            ],
            list_patients:[],
            on_add_patient:false,
            on_edit_patient:false,
            on_sup_user:false,
            nb_total_patient:0,
            lockRows:[],

            list_selected:{},

            selectedPat:null,
            

            //Filtre de recherche
            filters:{
                search_by:'pat_nom_et_prenom',
                search:'',
                limit:40
            },

            
            search_by_list:[
                {label:"Nom/Prenom",code:"pat_nom_et_prenom"},
                {label:"Numéro",code:"pat_numero"},
                {label:"Profession",code:"pat_profession"},
                {label:"Adresse",code:"pat_adresse"},
            ],


            //Des styles
            top_head_style:{
                height:`70px`,
            },
            th_style:{
                top:'70px'
            },


            have_to_search:false,
            in_search:false
        }
    },methods:{
        async getListPatients(){
            this.in_search = true
            try {
                const _r = await this.$http.get('api/patients',{params:this.filters})

                let _d = _r.data

                if(_d.status){
                    this.list_patients = _d.reponse
                    this.nb_total_patient = _d.nb_total_patient
                }else{
                    this.showNotif('error','Patient',_d.message)
                }
                
                if(this.have_to_search){
                    this.getListPatients()
                }
                this.in_search = false
                this.have_to_search = false
            } catch (e) {
                this.showNotif('Erreur de donnexion')
                console.log(e)
            }
        },
        deleteSelection(){
            this.lockRows = []
            this.selectedPat = null
            
        },
        async delPat(pat_id){
            try {
                const _r = await this.$http.delete('api/patient/'+pat_id)
                    let _d = _r.data
                    if(_d.status){
                    this.getListPatients()
                }
            } catch (e) {
                this.showNotif('Erreur de donnexion')
            }
        },
        searchReplace(val){
            return (!this.filters.search.trim())?val:val.replace(new RegExp(this.filters.search,'gmi'),`<span class="font-bold text-indigo-600">${this.filters.search.toUpperCase()}</span>`)
        },
        confirmDeletePat(event) {
            this.$confirm.require({
                target: event.currentTarget,
                message: `<div class="flex flex-column"> <span>Voulez vous vraiment <strong> supprimer ce Patient </strong> ? </span>
                <span class="mt-2">La suppression de ce patient supprimera aussi les informations lui concernant dans le <strong>module prise en charge</strong> et 
                dans le <strong> module caisse </strong></span>
                </div>`,
                icon: 'pi pi-info-circle',
                acceptClass: 'p-button-danger',
                acceptLabel:"Oui",
                rejectLabel:"Non",
                header:`Suppression d'un patient`,
                accept: () => {
                    this.delPat()
                },
                reject: () => {
                    
                }
            });
        },
        async delPat(){
            try {
                const _r = await this.$http.delete('api/patient/'+this.list_selected.pat_id)
                    let _d = _r.data
                if(_d.status){
                    this.list_selected = {}
                    this.getListPatients()
                    this.showNotif('success','Suppression d\'un patient',`Le patient a bien été supprimé`)
                }else{
                    this.showNotif('error','Suppression d\'un patient',_d.message)
                }
            } catch (e) {
                console.log(e)
                this.showNotif('Erreur de donnexion')

            }
        },
    },
    mounted(){
        this.getListPatients()
    }
}
</script>