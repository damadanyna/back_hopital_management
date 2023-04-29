<template>
    <div class="">
        <div class="p-2 flex items-end">
            <button @click=" in_add_rdv = true " class="bt-p-s"> Ajouter </button>
            <custom-input :label="`Le ${dateToText(filters.date)}`" type="date" class="mx-2" v-model="filters.date" />
        </div>

        <div class="flex p-2 justify-end" v-if="list_selected.rdv_id">
            <button class="bt-p-s" @click=" ()=>{
                    in_modif_rdv = true
                    in_add_rdv = true
                } ">
                <span class="material-icons"> edit </span>
                <span > Modifier </span>
            </button>
            <button @click="delRdv" class="bt-red-s ml-2">
                <span class="material-icons"> clear </span>
                <span > Supprimer </span>
            </button>
        </div>


        <!-- La liste des RDV correspondant à la date -->
        <div class="">
            <table class="w-full">
                <thead class="rounded-t sticky top-0 z-20 text-left" >
                    <tr class="bg-gray-50 text-gray-700 text-sm">

                        <th v-for="l in list_label" class="p-2 border text-xs" :key="l.key">
                            {{ l.label }}
                        </th>
                    </tr>
                </thead>
                <tbody>


                    <tr @click=" ()=>{
                            list_selected = p
                        } " v-for="p in rdv" class="cursor-pointer relative"  :key="p.rdv_id">
                        <td :class="{'bg-indigo-600 bg-opacity-10':list_selected.rdv_id == p.rdv_id}"  class="p-2 border text-xs" 
                        v-for="l in list_label" :key="l.key">
                            <div class="flex justify-center items-center" v-if="l.key == 'rdv_arrived'"> 
                                <span class="material-icons" :class="{'text-blue-500':p.rdv_arrived}"> {{ (p.rdv_arrived)?'verified':'unpublished' }} </span>
                            </div>
                            <span v-else> {{ p[l.key] }} </span>
                        </td>
                    </tr>

                </tbody>
            </table>
        </div>

        <!-- Dialog box pour l'ajout d'un RDV -->
        <add-rdv-dt :o_rdv="list_selected" :on_modif="in_modif_rdv" @validate=" ()=>{
            in_add_rdv = false    
            in_modif_rdv = false

            list_selected = {}
            getRdv()
        } " :d_date="filters.date" v-if="in_add_rdv" @close=" ()=>{
            in_add_rdv = false
            in_modif_rdv = false
        } " />
    </div>
</template>

<script>
export default {
    watch:{
        'filters.date'(a){
            this.getRdv()
        }
    },
    data(){
        return{
            filters:{
                date:''
            },
            in_add_rdv:false,
            in_modif_rdv:false,
            rdv:[],

            list_label:[
                {label:'Heur',key:'rdv_heure'},
                {label:'Fiche',key:'pat_numero'},
                {label:'Nom et prébom',key:'pat_nom_et_prenom'},
                {label:'Intervention',key:'interdv_label'},
                {label:'Arrivé',key:'rdv_arrived'},
                {label:'Médecin',key:'med_label'},
            ],

            list_selected:{},
        }
    },
    methods:{
        init(){
            this.filters.date = this.dateToInput(new Date())
        },
        async getRdv(){
            try {
                const r = await this.$http.get('api/dt/rdv',{params:{filters:this.filters}})
                let d = r.data
                if(d.status){
                    this.rdv = d.rdv
                }else{
                    this.showNotif(d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de donnexion')
                console.log(e)
            }
        },
        async delRdv(){
            try {
                const r = await this.$http.delete('api/dt/rdv/'+this.list_selected.rdv_id)
                let d = r.data
                if(d.status){
                    this.list_selected = {}
                    this.getRdv()
                }else{
                    this.showNotif(d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de donnexion')
                console.log(e)
            }
        }
    },
    beforeMount(){
        
    },
    mounted(){
        this.init()
    }
}
</script>