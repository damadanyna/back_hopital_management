 <template>
    <div class="p-2 flex justify-center items-center">
        <div class="w-full">
            <div class="flex mb-2 sticky bg-white p-2" style="top:60px;z-index:105">
                <!-- <button @click="  on_add_ent = true " class="bt-p-s"> 
                    <span class="material-icons mr-2"> add </span> 
                    <span class=""> Ajouter </span>
                </button> -->
                <Button label="Ajouter" icon="pi pi-plus" class="p-button-sm" @click="on_add_ent = true" />
            
                <!-- <button v-if="list_selected.ent_id && inTypeUser(['g','a','m'])" @click="  on_view_ent = true " class="bt-p-s ml-2" > 
                    <span class="material-icons mr-2"> edit </span> 
                    <span class=""> Modifier </span>
                </button> -->

                <Button label="Modifier" v-if="list_selected.ent_id && inTypeUser(['g','a','m'])" @click="  on_view_ent = true " 
                class="p-button-sm p-button-text p-button-raised ml-2" icon="pi pi-pencil" />
            </div>
            <table class="w-full">
                <thead class="rounded-t sticky top-0 z-20" >
                    <tr class="bg-gray-50 text-gray-700 text-sm">
                        <th v-for="l in list_label" class="p-2 border text-xs text-left sticky" style="top:115px;" :key="l.key">
                            {{ l.label }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr @click=" ()=>{
                            list_selected = p
                        } " class="cursor-pointer relative" v-for="p in list_ent" :key="p.ent_id">
                        <td :class="{'active-row':list_selected.ent_id == p.ent_id}" class="p-2 border text-xs" v-for="l in list_label" :key="l.key">
                            <span> {{ p[l.key] }} </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <add-ent :visible="on_add_ent" @validate=" ()=>{
                getEnt()
                on_add_ent = false
            } " @close="on_add_ent = false " />

        <det-ent :e="list_selected" :visible="on_view_ent" @deleted=" ()=>{
                getEnt()
                on_view_ent = false
                list_selected = {}
            } " @validate=" ()=>{
                getEnt()
                on_view_ent = false
            } " @close="on_view_ent = false " />
    </div>
</template>

<script>
export default {
    data(){
        return{
            list_ent:[],
            list_label:[
                {label:'Code',key:'ent_code'},
                {label:'Nom',key:'ent_label'},
                {label:'N° compte',key:'ent_num_compte'},
                {label:'% Patient',key:'ent_pat_percent'},
                {label:'% Société',key:'ent_soc_percent'},
                {label:'Adresse',key:'ent_adresse'},

            ],
            on_add_ent:false,
            on_view_ent:false,
            list_selected:{}
        }
    },
    methods:{
        async getEnt(){
            try {
                const _r = await this.$http.get('api/entreprises')
                let _d = _r.data

                if(_d.status){
                    this.list_ent = _d.reponse
                }else{
                    this.showNotif(_d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        }
    },
    mounted(){
        this.getEnt()
        // alert(this.$store.state.user.util_type)
    }
}
</script>

<style>

</style>