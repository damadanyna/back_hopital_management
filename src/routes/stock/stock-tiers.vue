 <template>
    <div class="">
        <div class="flex p-2 ">
            <SelectButton v-model="cur_onglet" :options="tabTiers" optionValue="value" optionLabel="name" aria-labelledby="single" class="p-button-sm" />
        </div>


        
        <div class="flex justify-center items-center">
            <!-- Onglet Fournisseurs -->
            <div class="w-full" v-if="cur_onglet == 'fourn'">
                <!-- Liste fornisseurs -->
                <div class="w-full p-2">
                    <div class="flex mb-2 py-2 sticky bg-white border-bottom-2 border-200" :style="{top:`60px`,zIndex:105}">
                        <!-- <button @click=" on_add_fourn = true " class="bt-p-s mr-2"> 
                            <span class="material-icons text-sm"> add </span>
                            <span class="ml-2"> Ajouter </span>
                        </button> -->
                        <Button label="Ajouter" icon="pi pi-plus" class="p-button-sm" @click=" on_add_fourn = true "/>
                        <!-- <button v-if="list_selected.fourn_id" @click=" on_view_fourn = true " class="bt-p-s "> 
                            <span class="material-icons text-sm"> edit </span>
                            <span class="ml-2"> Modifier </span>
                        </button> -->
                        <Button v-if="list_selected.fourn_id" label="Modifier" icon="pi pi-pencil" 
                        class="p-button-sm p-button-raised p-button-help p-button-text ml-2" @click=" on_view_fourn = true "/>
                    </div>
                    <table class="w-full">
                        <thead class="rounded-t" >
                            <tr class="bg-gray-50 text-gray-700 text-sm text-left">

                                <th v-for="l in fourn_list_label" class="p-2 border text-xs" :key="l.key">
                                    {{ l.label }}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr @click=" ()=>{
                                    list_selected = p
                                } "  class="cursor-pointer relative" v-for="p in list_fourn" :key="p.fourn_id">
                                <td class="p-2 border text-xs " :class="{'active-row':list_selected.fourn_id == p.fourn_id}" v-for="l in fourn_list_label" :key="l.key">
                                    <span> {{ p[l.key] }} </span>
                                </td> 
                            </tr>
                        </tbody>
                    </table>
                </div> 
            </div> 
            <!-- Onglet département -->
            <div class="w-full" v-else-if="cur_onglet == 'dep'">
                <div class="flex mb-2 p-2 sticky bg-white border-bottom-2 border-200" :style="{top:`60px`,zIndex:105}">
                    <!-- <button @click="  on_add_dep = true " class="bt-p-s mr-2">
                        <span class="material-icons text-sm"> add </span>
                        <span class="ml-2"> Ajouter </span>
                    </button> -->
                    <Button label="Ajouter" icon="pi pi-plus" class="p-button-sm" @click=" on_add_dep = true "/>
                    <!-- <button v-if="list_selected.dep_id" @click=" on_view_dep = true " class="bt-p-s">
                         <span class="material-icons text-sm"> edit </span> 
                         <span class="ml-2"> Modifier </span>
                    </button> -->
                    <Button v-if="list_selected.dep_id" label="Modifier" icon="pi pi-pencil" 
                        class="p-button-sm p-button-raised p-button-help p-button-text ml-2" @click=" on_view_dep = true "/>
                </div>
                <div class="">
                    <table class="w-full">
                        <thead class="rounded-t sticky top-0 z-20" >
                            <tr class="bg-gray-50 text-gray-700 text-sm text-left">

                                <th v-for="l in dep_list_label" class="p-2 border text-xs" :key="l.key">
                                    {{ l.label }}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr @click=" ()=>{
                                    list_selected = p
                                } " class="cursor-pointer relative" v-for="p in list_dep" :key="p.dep_id">
                                <td :class="{'active-row':list_selected.dep_id == p.dep_id}" class="p-2 border text-xs" v-for="l in dep_list_label" :key="l.key">
                                    <span> {{ p[l.key] }} </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </div>

        <!-- Les boîtes de dialogue d'ajout -->

        <!-- Fournisseur -->
        <add-fourn @close=" on_add_fourn = false " :visible="on_add_fourn" @validate=" ()=>{
                on_add_fourn = false
                getListFourn()
            } " />
        <det-fourn :f="list_selected" @close=" on_view_fourn = false " :visible="on_view_fourn" @validate=" ()=>{
                on_view_fourn = false
                getListFourn()
            } "  @del= " ()=>{
                getListFourn()
                list_selected = {}
                on_view_fourn = false
            } " />

        <!-- Département -->
        <add-dep @close=" on_add_dep = false " :visible="on_add_dep" @validate=" ()=>{
                on_add_dep = false
                getListdep()
            } " />

        <det-dep :d="list_selected" @close=" on_view_dep = false " :visible="on_view_dep" @validate=" ()=>{
                on_view_dep = false
                getListdep()
            } " @del = " ()=> {
                getListDep()
                list_selected = {}
                on_view_dep = false
            } " />
                

    </div>
</template>

<script>
export default {
    watch:{
        cur_onglet(a){
            if(a == 'fourn'){
                this.getListFourn()
            }else{
                this.getListdep()
            }

            this.list_selected = {}
        }
    },
    data(){
        return{
            cur_onglet:'fourn',

            fourn_list_label:[
                {label:"Code",'key':'fourn_code'},
                {label:"Nom",key:'fourn_label'},
                {label:"Nif",key:'fourn_nif'},
                {label:"Stat",key:'fourn_stat'}
            ],
            list_fourn:[],
            on_add_fourn:false,
            on_view_fourn:false,

            list_selected:{},


            dep_list_label:[
                {label:"Code",'key':'dep_code'},
                {label:"Nom",'key':'dep_label'},
            ],
            list_dep:[],
            on_add_dep:false,
            on_view_dep:false,

            tabTiers: [
                {name: 'Fournisseurs', value: 'fourn'},
                {name: 'Départments', value: 'dep'},
            ],

        }
    },
    methods:{
        async getListFourn(){
            
            try {
                const _r = await this.$http.get('api/fournisseurs')

                let _d = _r.data

                if(_d.status){
                    this.list_fourn = _d.reponse
                }else{
                    this.showNotif(_d.message)
                }

            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        },
        async getListdep(){
            try {
                const _r = await this.$http.get('api/departements')

                let _d = _r.data

                if(_d.status){
                    this.list_dep = _d.reponse
                }else{
                    this.showNotif(_d.message)
                }

            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        }
    },
    mounted(){
        this.getListFourn()
    }
}
</script>

<style scoped>


.sub-menu-active{
    @apply border-b-2;
}

</style>