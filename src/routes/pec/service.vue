 <template>
    <div class="text-sm">
        <div class="px-2 flex">
            <button class="flex justify-center items-center bt-p-s" @click="on_add_service = true"> Ajouter </button>
            <button v-if="list_selected.service_id" class="flex justify-center items-center bt-p-s ml-2" @click="()=>{
                    on_add_service = true
                    on_modif_service = true
                }  "> Modifier </button>
            <span class="w-16"></span>
            <button class="flex justify-center items-center bt-p-s ml-2" @click="on_add_tarif = true"> Ajouter Tarif </button>
        </div>
        <!-- ici la liste des services avec les tarifs -->
        <div class="mt-5 px-2">
            
            <table class="w-full">
                <thead class="rounded-t sticky top-0 z-20" >
                    <tr class="bg-gray-50 text-gray-700 text-sm">

                        <th v-for="l in list_label" class="p-2 border text-xs  text-left" :key="l.key">
                            <div class="flex items-center" v-if=" l.key.split(':')[1] == 'tarif' "> 
                                <span class="">{{ l.label }}</span>
                                <span class="flex-grow"></span>
                                <button @click=" delTarif(l.key) " class="flex justify-center items-center border ml-2 rounded p-1"> <span class="material-icons text-xs"> clear </span> </button>
                            </div>
                            <span class="" v-else> {{ l.label }} </span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr @click=" ()=>{
                            list_selected = p
                        } " class="cursor-pointer relative" v-for="p in srvs" :key="p.service_id">
                        <td
                        
                        :class="{'bg-indigo-600 bg-opacity-10':list_selected.service_id == p.service_id,'font-bold':!p.service_parent_id}" 
                        class="p-2 border text-xs relative items-center" v-for="l in list_label" :key="l.key">

                            <div v-if="p.service_parent_id && l.key.split(':')[1] == 'tarif'" class="flex items-center">
                                <span   class=""> {{ showTarif(p,l.key) }} </span>
                                <span class="flex-grow"></span>
                                <button class="flex justify-center items-center border ml-2 rounded p-1" @click=" ()=>{
                                    tserv = {
                                        tserv_tarif_id:list_tarif[parseInt(l.key.split(':')[0])].tarif_id,
                                        tserv_service_id:p.service_id
                                    }
                                    on_modif_tarif = true
                                } " > <span class="material-icons text-xs"> edit </span> </button>
                            </div>
                            <span v-else > {{ p[l.key] }} </span>
                            
                        </td>
                        
                        <!-- <td class="px-2 text-xs flex justify-center items-center" v-if="list_selected.service_id == p.service_id"> 
                            <button @click=" on_view_dep = true " class="bt-icon z-50 bg-white border shadow-lg absolute -top-2 -right-2"> <span class="material-icons text-sm"> add </span> </button> </td> -->
                    </tr>
                </tbody>
            </table>
        </div>


        <!-- Ajout de service -->
        <add-service :s="list_selected" :modif="on_modif_service" @validate=" ()=>{
                on_add_service = false
                on_modif_service = false
                getList()
            } " v-if="on_add_service" @close=" ()=> {
                on_add_service = false
                on_modif_service = false
            } " />

        <add-tarif @validate=" ()=>{
                on_add_tarif = false
                getList()
            } "  v-if="on_add_tarif" @close="on_add_tarif = false" />
        
        <modif-prix-tarif :t="tserv"  @validate=" ()=>{
                on_modif_tarif = false
                getList()
            } "  v-if="on_modif_tarif" @close="on_modif_tarif = false" />
    </div>
</template>

<script>
export default {
    data(){
        return{
            on_add_service:false,
            on_modif_service:false,
            on_add_tarif:false,
            on_modif_tarif:false,
            srvs:[],
            list_tarif:[],
            list_label:[
                {label:"Code",key:'service_code'},
                {label:"Désignation",key:'service_label'}
            ],
            list_selected:{},
            cell:{
                edit:false,
                content:''
            },
            tserv:{}
        }
    },
    methods:{
        async getList(){

            //Averina affecter-na ny list_lable fa raha tsy izay misy redondance
            this.list_label = [
                {label:"Code",key:'service_code'},
                {label:"Désignation",key:'service_label'}
            ]

            try {
                const _r = await this.$http.get('api/services')
                let _d = _r.data

                if(_d.status){
                    this.srvs = _d.srvs
                    this.list_tarif = _d.list_tarif

                    for (let i = 0; i < this.list_tarif.length; i++) {
                        this.list_label.push({label:this.list_tarif[i].tarif_label,key:`${i}:tarif`})
                    }
                }else{
                    this.showNotif(_d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        },
        async delTarif(k){
            let tarif_id = this.list_tarif[parseInt(k.split(':')[0])].tarif_id
            try {
                const _r = await this.$http.delete('api/service/del-tarif/'+tarif_id)
                let _d = _r.data

                if(_d.status){
                }else{
                    this.showNotif(_d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        },
        showTarif(p,k){
            let _id = parseInt(k.split((':'))[0])
            return `${p.tarifs[_id].tserv_prix}`
        }
    },
    mounted(){
        this.getList()
    }
}
</script>

<style>

</style>