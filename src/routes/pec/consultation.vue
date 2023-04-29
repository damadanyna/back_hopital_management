<template>
    <div class="p-2 flex justify-center items-center">
        <div class="w-full">
            <div class="flex flex-column">
                <div class="flex mb-2 align-items-end">
                    <!-- <button @click="  on_add_cons = true " class="bt-p-s"> 
                        <span class="material-icons "> add </span> 
                        <span class="ml-2"> Ajouter </span>
                    </button> -->
                    <div class=" flex flex-column mr-2">
                        <span class="text-xs font-bold"> Date</span>
                        <Calendar placeholder="ex : 09/09/1998" v-model="filters.date"  dateFormat="dd/mm/yy" class="p-inputtext-sm"/>    
                    </div>
                    <Button label="Ajouter" icon="pi pi-plus" class="p-button-sm" @click="on_add_cons = true " />
                    <!-- <button v-if="list_selected.cons_id"  @click=" delCons " class="bt-icon ml-2"> <span class="material-icons text-sm "> clear </span> </button> -->
                    <Button label="Supprimer" icon="pi pi-times" class="p-button-sm p-button-danger p-button-text p-button-raised ml-2" 
                    v-if="list_selected.cons_id" @click=" delCons " />

                </div>
                <table class="w-full">
                    <thead class="rounded-t sticky top-0 z-20" >
                        <tr class="bg-gray-50 text-gray-700 text-sm">
                            <th v-for="l in list_label" class="p-2 border text-xs text-left" :key="l.key">
                                {{ l.label }}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr @click=" ()=>{
                                list_selected = p
                            } " class="cursor-pointer relative" v-for="p in list_cons" :key="p.cons_id">
                            <td :class="{'active-row':list_selected.cons_id == p.cons_id}" class="p-2 border text-xs" v-for="l in list_label" :key="l.key">
                                <span class="" v-if="['cons_montant','cons_montant_calc'].indexOf(l.key) != -1"> {{ (p[l.key])?p[l.key].toLocaleString('fr-CA'):'-' }} </span>
                                <span v-else> {{ p[l.key] || '-' }} </span>
                            </td>
                        </tr>

                        <tr class="">
                            <td class="last-row" :colspan="3"> TOTAL </td>
                            <td class="last-row">
                                <div class="flex flex-column">
                                    <span class=""> MONTANTS espèce </span>
                                    <span class="font-bold"> {{ (total_esp)?total_esp.toLocaleString('fr-CA'):0 }} </span>
                                </div>
                            </td>
                            <td class="last-row">
                                <div class="flex flex-column">
                                    <span class=""> MONTANTS calculé </span>
                                    <span class="font-bold"> {{ (total_calc)?total_calc.toLocaleString('fr-CA'):0 }} </span>
                                </div>
                            </td>
                            <td class="last-row">
                                <div class="flex flex-column">
                                    <span class=""> RESULTATS </span>
                                    <span class="font-bold"> {{ list_cons.length  }} </span>
                                </div>
                            </td>
                            <td class="last-row" :colspan="2">  </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Ajout consultation -->
        <add-cons @validate=" ()=>{
            on_add_cons = false
            getCons()    
        } "  :visible="on_add_cons" @close=" on_add_cons = false " />
    </div>
</template>

<script>
export default {
    watch:{
        'filters.date'(a){
            this.getCons()
        }
    },
    data(){
        return{
            list_cons:[],
            list_label:[
                {label:'Heure',key:'cons_time'},
                {label:'N° Patient',key:'pat_numero'},
                {label:'Nom et prenom',key:'pat_nom_et_prenom'},
                {label:'Montant espéce',key:'cons_montant'},
                {label:'Montant calculé',key:'cons_montant_calc'},
                {label:'Médecin',key:'cons_medcin'},
                {label:'Société',key:'ent_label'},
                {label:'N° Dossier',key:'cons_num_dossier'},
            ],
            on_add_cons:false,
            list_selected:{},
            filters:{
                date:new Date()
            },
            total_calc:0,
            total_esp:0
        }
    },
    methods:{
         async getCons(){
            try {
                const _r = await this.$http.get('api/consultation',{params:this.filters})
                let _d = _r.data

                if(_d.status){
                    this.list_cons = _d.reponse
                    this.total_calc = _d.nb_total_calc
                    this.total_esp = _d.nb_total_esp

                }else{
                    this.showNotif(_d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        },

        async delCons(){
            try {
                const _r = await this.$http.delete('api/consultation/'+this.list_selected.cons_id)
                let _d = _r.data

                if(_d.status){
                    this.list_selected = {}
                    this.getCons()
                }else{
                    this.showNotif(_d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        }
    },
    mounted(){
        this.getCons()
    }
}
</script>

<style>

</style>