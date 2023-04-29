 <template>
    <div class="bg-dialog-box">


        <!-- Content Overlay -->
        <div class="border rounded-sm shadow-sm bg-white" style="width:500px" >
            <div class="p-2 flex items-center">
                <span class="text-sm"> {{ (on_modif)?'Modification':'Ajout' }} d'un Rendez-vous, <strong>{{ dateToText(d_date) }}</strong> </span>
                <span class="flex-grow"></span>
                <button class="bt-s w-8 h-8 flex justify-center items-center" @click="$emit('close')"> <span class="material-icons"> clear </span> </button>
            </div>

            <!-- Content -->

            <div class="p-2 flex flex-col">
                <!-- Patient -->
                <div class="flex items-end mb-2">
                    <div class="flex flex-col">
                        <span class="text-xs font-bold"> Patient </span>
                        <span class="text-sm p-1 border rounded cursor-pointer text-center" style="min-width:200px;" @click="on_select_pat = true" > {{ (pat_selected)?pat_selected.pat_nom_et_prenom:'-' }} </span>
                    </div>
                    <span class="flex-grow"></span>
                    <custom-input v-model="rdv.rdv_heure" class="" label="Heure" type="time"/>
                </div>

                <div class="flex mb-2">
                    <c-select :datas="med_list" placeholder="Médecin" label="med_label" code="med_id" v-model="rdv.rdv_med_id" />
                    <span class="flex-grow"></span>
                    <c-select :datas="intervention_list" class="ml-2" placeholder="Intervention" label="interdv_label" code="interdv_id" v-model="rdv.rdv_intervention" />
                </div>

                <div v-if="on_modif" class="flex items-center p-2 rounded border " :class="{'border-blue-500':rdv.rdv_arrived}">
                    <input type="checkbox" id="rdv_arrived" v-model="rdv.rdv_arrived" :checked="rdv.rdv_arrived">
                    <label for="rdv_arrived" class="ml-2"> Arrivé </label>
                </div>
            </div>
            <div class="p-2 flex justify-end border-t">
                <button class="bt-p-s" @click=" (on_modif)?updateRdv():validateRdv() "> {{ (on_modif)?'Modifier':'Ajouter' }} </button>
            </div>
        </div>

        <!-- Sélection de patient dentiste -->
        <select-pat-dt v-if="on_select_pat" @validate="getPat" @close=" on_select_pat = false" />
    </div>
</template>

<script>
export default {
    props:['d_date','on_modif','o_rdv'],
    data(){
        return{
            rdv:{},
            pat_selected:null,
            on_select_pat:false,
            intervention_list:[],
            med_list:[]
        }
    },
    methods:{
        getPat(p){
            this.pat_selected = p
            this.on_select_pat = false

            this.rdv.rdv_pat_id = p.pat_id
        },
        async recupDataUtilsRdv(){
            try {
                const r = await this.$http.get('api/dt/rdv/data-utils')
                let d = r.data
                if(d.status){
                    this.med_list = d.med_list
                    this.intervention_list = d.intervention_list

                    if(!this.on_modif){
                        this.rdv.rdv_med_id = this.med_list[0].med_id
                        this.rdv.rdv_intervention = this.intervention_list[0].interdv_id
                    }
                }else{
                    this.showNotif(d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de donnexion')
                console.log(e)
            }
        },
        async validateRdv(){
            if(!this.rdv.rdv_pat_id){
                this.showNotif(`Le Patient est obligatoire`)
                return
            }else if(!this.rdv.rdv_heure){
                this.showNotif(`L'Heure est obligatoire`)
                return
            }
            try {
                const r = await this.$http.post('api/dt/rdv',this.rdv)
                let d = r.data
                if(d.status){
                    this.$emit('validate')
                }else{
                    this.showNotif(d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de donnexion')
                console.log(e)
            }
        },
        async updateRdv(){
            if(!this.rdv.rdv_pat_id){
                this.showNotif(`Le Patient est obligatoire`)
                return
            }else if(!this.rdv.rdv_heure){
                this.showNotif(`L'Heure est obligatoire`)
                return
            }
            try {
                const r = await this.$http.put('api/dt/rdv',this.rdv)
                let d = r.data
                if(d.status){
                    this.$emit('validate')
                }else{
                    this.showNotif(d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de donnexion')
                console.log(e)
            }
        },
        init(){
            if(this.on_modif){
                this.rdv = JSON.parse(JSON.stringify(this.o_rdv))

                this.pat_selected = {
                    pat_id:this.rdv.pat_id,
                    pat_nom_et_prenom:this.rdv.pat_nom_et_prenom
                }
                // this.rdv.rdv_arrived = 0
            }else{
                this.rdv.rdv_date = this.d_date
            }
        }
    },
    mounted(){
        this.init()
        this.recupDataUtilsRdv()
    }
}
</script>

<style>

</style> 