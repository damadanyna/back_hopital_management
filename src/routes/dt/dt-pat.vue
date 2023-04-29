<template>
    
    <div class="relative">
        <div class="p-2 flex sticky bg-white" style="top:60px">
            <div class="my-2 flex">
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
            <div class="flex my-2">
                <Button label="Ajouter" icon="pi pi-plus" class="p-button-sm" @click="  on_add_patient = true " />
                
                <Button v-if="list_selected.pat_id" @click="  on_edit_patient = true " 
                label="Modifier" icon="pi pi-pencil" class="ml-2 p-button-sm  p-button-raised p-button-help p-button-text" />
                <Button v-if="list_selected.pat_id && inTypeUser(['a','m'])" @click="confirmDeletePat($event)" 
                label="Supprimer" icon="pi pi-times" class="ml-2 p-button-sm p-button-text p-button-raised p-button-danger" />
                <Button v-if="list_selected.pat_id" @click=" list_selected = {} " 
                label="Déselectionner" icon="pi pi-stop" class="ml-2 p-button-sm p-button-raised p-button-text" /> 
            </div> 
        </div>


        <div class="p-2">
            
            <table class="w-full">
                <thead class="" >
                    <tr class="bg-gray-50 text-gray-700 text-sm">

                        <th v-for="l in list_label" class="p-2 border text-left sticky" style="top:125px" :key="l.key">
                            {{ l.label }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr @click=" ()=>{
                            list_selected = p
                        } " v-for="p in list_patients" class="cursor-pointer relative"  :key="p.pat_id">
                        <td :class="{'active-row':list_selected.pat_id == p.pat_id}"  class="p-2 border text-xs" 
                        v-for="l in list_label" :key="l.key">
                            <span v-if="l.key == 'pat_date_naiss'" class=""> 
                                {{ (p[l.key])?dateToText(p[l.key]):'-' }}    
                            </span>
                            <span class="" v-else-if=" l.key == 'pat_sexe' "> {{ (p[l.key] == 'M')?'Masculin':'Féminin' }} </span>
                            <span class="" v-else-if="l.key == 'pat_age'"> {{ (p.pat_date_naiss)?getAgeByDate(p.pat_date_naiss):'-' }} </span>
                            <span v-else-if="l.key == filters.search_by"> 
                                <!-- {{ (filters.search.trim())?p[l.key].replace(/filters.search/gmi,`<span class="bg-indigo-600"> ${filters.search} </span>`):p[l.key] }} </span> -->
                                <div v-html="searchReplace(p[l.key])"> </div>
                                <!-- '  -->
                            </span>
                            <span v-else> {{ p[l.key] }} </span>
                        </td>
                    </tr>

                </tbody>
            </table>
        </div>

        <add-patient :visible="on_add_patient" type="dt" @validate=" ()=>{
            getListPatients()
            on_add_patient = false    
        } " @close=" on_add_patient = false " />

        <det-patient @validate=" ()=>{
            getListPatients()
            on_edit_patient = false    
            } " :visible="on_edit_patient" type="dt" :pat="list_selected"   @close=" on_edit_patient = false " />
    </div>
</template>

<script>
export default {
    watch:{
        'filters.search'(a){
            this.getListPatients()
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
            ],
            list_patients:[],
            list_selected:{},
            filters:{
                limit:100,
                search:'',
                search_by:'pat_nom_et_prenom'
            },
            search_by_list:[
                {label:"Nom/Prenom",code:"pat_nom_et_prenom"},
                {label:"Numéro",code:"pat_numero"},
                {label:"Profession",code:"pat_profession"},
                {label:"Adresse",code:"pat_adresse"},
            ],


            on_add_patient:false,
            on_edit_patient:false
        }
    },
    methods:{
        async getListPatients(){
            try {
                const _r = await this.$http.get('api/dt/patients',{params:this.filters})

                let _d = _r.data

                if(_d.status){
                    this.list_patients = _d.reponse
                }else{
                    this.showNotif(_d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de donnexion')
                console.log(e)
            }
        },
        searchReplace(val){
            return (!this.filters.search.trim())?val:val.replace(new RegExp(this.filters.search,'gmi'),`<span class="font-bold text-indigo-600">${this.filters.search.toUpperCase()}</span>`)
        },
        confirmDeletePat(event) {
            this.$confirm.require({
                target: event.currentTarget,
                message: `<div class="flex flex-column"> <span>Voulez vous vraiment <strong> supprimer ce Patient </strong> ? </span>
                <span class="mt-2">La suppression de ce patient supprimera aussi les informations lui concernant
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
                const _r = await this.$http.delete('api/dt/patient/'+this.list_selected.pat_id)
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