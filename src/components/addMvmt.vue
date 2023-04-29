 <template>
    <Dialog :maximizable="true" :visible="visible" @update:visible=" ()=>{
            $emit('close') 
        } "  :modal="true" class="p-fluid p-dialog-sm" style="width: 1000px;">
        <template #header>
            <span class="text-sm font-bold"> {{ (action == 'entre')?'Entrée':'Sortie' }} </span>
        </template>
        <div class="flex">
            <div class="border-b py-2 flex flex-column" style="width:40%">
                <div class="flex mb-2 ">
                    <!-- <c-select v-model="mvmt.mvmt_type" class="mr-5" :datas="(action == 'entre')?stock.mvmt_type_entre:stock.mvmt_type_sortie" 
                    label="l" code="k" placeholder="Type de mouvement" /> -->
                    <div class="flex flex-column mb-2">
                        <span class="font-bold text-xs"> Type de mouvement </span>
                        <Dropdown v-model="mvmt.mvmt_type" :options="(action == 'entre')?stock.mvmt_type_entre:stock.mvmt_type_sortie" optionLabel="l" optionValue="k" 
                        placeholder="Type de mouvement" class="p-inputtext-sm" />
                    </div>

                    <!-- <custom-input :disable="true" v-model="mvmt.mvmt_num" class="mr-5" label="N° pièce" /> -->
                     

                    <span class="flex-grow-1"></span>
                    <!-- <custom-input type="date" class="mr-5" v-model="mvmt.mvmt_date" label="Date" /> -->
                    <div class="flex flex-column ml-2">
                        <span class="font-bold text-xs"> Date </span>
                        <Calendar placeholder="ex : 09/09/1998" v-model="mvmt.mvmt_date"  dateFormat="dd/mm/yy" class="p-inputtext-sm"  
                        />    
                    </div>
                </div>
                <div class="flex mb-2">
                    <!-- <c-select v-if="action == 'sortie'" class="mr-5" 
                    :datas="list_depot" v-model="mvmt.mvmt_depot_exp" label="depot_label" code="depot_id" placeholder="Depôt de sortie" /> -->
                    <div class="flex flex-column mr-2" v-if="action == 'sortie'">
                        <span class="font-bold text-xs"> Depôt de sortie </span>
                        <Dropdown v-model="mvmt.mvmt_depot_exp" :options="list_depot" optionLabel="depot_label" optionValue="depot_id" 
                        placeholder="Depôt de sortie" class="p-inputtext-sm" />
                    </div>

                    <!-- <c-select v-if="action == 'entre' || (mvmt.mvmt_type == 'transfert')" 
                    :datas="list_depot" v-model="mvmt.mvmt_depot_dest" label="depot_label" code="depot_id" 
                    :placeholder="(mvmt.mvmt_type=='transfert')?'Dépôt de destination':`Dépôt d'entrée`" /> -->
                    <div class="flex flex-column" v-if="action == 'entre' || (mvmt.mvmt_type == 'transfert')">
                        <span class="font-bold text-xs"> {{ (mvmt.mvmt_type=='transfert')?'Dépôt de destination':`Dépôt d'entrée` }} </span>
                        <Dropdown v-model="mvmt.mvmt_depot_dest" :options="list_depot" optionLabel="depot_label" optionValue="depot_id" 
                        placeholder="Depôt de sortie" class="p-inputtext-sm" />
                    </div>
                </div>
                <div class="flex">
                    <!-- <c-select v-model="mvmt.mvmt_tiers" v-if="action == 'entre'" :datas="list_fourn" label="fourn_label" code="fourn_id" placeholder="Fournisseur" /> -->
                    <div class="flex flex-column" v-if="action == 'entre'">
                        <span class="font-bold text-xs"> Fournisseur </span>
                        <Dropdown v-model="mvmt.mvmt_tiers" :options="list_fourn" optionLabel="fourn_label" optionValue="fourn_id" 
                        placeholder="Fournisseurs" class="p-inputtext-sm" />
                    </div>
                    <!-- <c-select  v-else-if="action == 'sortie' && mvmt.mvmt_type != 'transfert'" v-model="mvmt.mvmt_tiers" :datas="list_dep" 
                    label="dep_label" code="dep_id" placeholder="Département" /> -->
                    <div class="flex flex-column" v-else-if="action == 'sortie' && mvmt.mvmt_type != 'transfert'">
                        <span class="font-bold text-xs"> Département </span>
                        <Dropdown v-model="mvmt.mvmt_tiers" :options="list_dep" optionLabel="dep_label" optionValue="dep_id" 
                        placeholder="Département" class="p-inputtext-sm" />
                    </div>

                    <div class="flex flex-column ml-2">
                        <span class="font-bold text-xs"> N° pièce </span>
                        <InputText type="text" v-model="mvmt.mvmt_num" class="p-inputtext-sm" disabled />
                    </div>
                </div>
            </div>
            <Divider layout="vertical" />

            <div class="flex-grow-1">
                <div class="mb-2 flex flex-column" :class="{'border-1 border-round border-200 p-2':on_search_product}">
                    <div class="flex flex-column">
                        <span class="p-input-icon-right">
                            <i class="pi pi-search" />
                            <InputText @focus="()=>{
                                on_search_product = true
                                researchProd()
                            }" class="p-inputtext-sm" type="text" v-model="filters.search" placeholder="Rechercher un Article"/>
                        </span>
                    </div>

                    <div v-if="on_search_product" class="flex flex-column" style="max-height: 300px;overflow: auto;">
                        <div @click="setArtInList(lp)" class="flex flex-column cursor-pointer border-bottom-1 hover:bg-gray-100 border-200 p-2" v-for="lp in list_art" :key="lp.art_id">
                            <span class="font-bold text-gray-600"> {{ lp.art_label }} </span>
                            <span class="text-gray-500"> {{ lp.art_code }} </span>
                        </div>
                    </div>

                    <div class="mt-2 flex justify-content-end text-center" v-if="on_search_product">
                        <div>
                            <Button class="p-button-sm p-button-text" @click="on_search_product = false" icon="pi pi-times" label="Fermer"/>
                        </div>
                    </div>
                </div>
                <div v-if="!on_search_product" class="" tabindex="0" 
                @keydown.p="addQt('+')" @keydown.add="addQt('+')" @keydown.m="addQt('-')" @keydown.dash="addQt('-')"
                @keydown.up = "changeCurIndex('up')" @keydown.down = "changeCurIndex('down') " @keydown.delete="delArtMart">
                    <table class="w-full">
                        <thead class="rounded-t sticky top-0 z-20" >
                            <tr class="bg-gray-50 text-gray-700 text-sm">

                                <th v-for="l in list_label" class="p-2 text-xs text-left" :key="l.key">
                                    {{ l.label }}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr  @click=" ()=>{
                                art_selected = p 
                                cur_index = i
                            } " :class="{'active-row':art_selected.mart_art_id == p.mart_art_id}"  class="cursor-pointer relative" v-for="p,i in mart_list" :key="p.mart_art_id">
                                <td class="p-2 border text-xs" v-for="l in list_label" :key="l.key">
                                    <div class="w-full flex text-left" v-if="['mart_prix_unit','mart_montant'].indexOf(l.key) != -1">
                                        <span class=""> {{  p[l.key].toLocaleString('fr-CA') }} </span>
                                    </div>

                                    <span v-else-if="l.key == 'mart_qt'"  class="px-2 py-1 border-1 border-round bg-white cursor-pointer flex " @click="showEditQt($event,p)"> {{ p.mart_qt }} </span>

                                    <span v-else class="text-left"> {{ p[l.key] }} </span>
                                </td>
                            </tr>
                            <tr class="">
                                <td class="p-2 border text-xs" colspan="4"> Total </td>
                                <td class="p-2 border text-xs text-left"> 
                                    <span class=""> {{ this.mvmt.mvmt_montant.toLocaleString('fr-CA') }} </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
        <template #footer>
            <div class="flex ">
                <div class="">
                    <!-- <button class="bt-p-s" @click="on_add_article = true"> Ajouter un article </button> -->
                    <!-- <Button label="Ajouter un article" class="p-button-sm p-button-text p-button-raised mr-2" @click="on_add_article = true" /> -->
                    <!-- <button v-if="art_selected.mart_art_id" class="bt-red-s ml-2" @click="delArtMart">Suppimer</button> -->
                    <Button v-if="art_selected.mart_art_id" label="Suppimer" class="p-button-sm p-button-text p-button-raised p-button-danger" @click="delArtMart" />
                </div>
                <span class="flex-grow-1"></span>
                <div class="">
                    <Button label="Enregistrer" class="p-button-sm" icon="pi pi-check" @click="postMvmt"  :loading="isLoading" />
                </div>
            </div>
        </template>

        <!-- <add-article-mvmt :mvmt="mvmt" @validate="onValidateAddArt" :mart_list="mart_list" @close="on_add_article = false" :visible="on_add_article" /> -->

        <OverlayPanel ref="op">
            <div class="flex flex-column">
                <span class="text-xs"> Appuyez sur "Entrer" pour valider </span>
                <InputNumber v-model="cur_qt" @keypress.enter="changeQt" autofocus class="p-inputtext-sm"  />
            </div>
        </OverlayPanel>


    </Dialog>
</template>

<script>
export default {
    props:['action','visible'],
    watch:{
        'mvmt.mvmt_depot_dest'(a,old){
            if(this.mvmt.mvmt_type == 'transfert'){
                if(a == this.mvmt.mvmt_depot_exp){
                    this.mvmt.mvmt_depot_exp = old
                }
            }
        },
        'mvmt.mvmt_depot_exp'(a,old){
            if(this.mvmt.mvmt_type == 'transfert'){
                if(a == this.mvmt.mvmt_depot_dest){
                    this.mvmt.mvmt_depot_dest = old
                }
            }
        },
        'mvmt.mvmt_type'(a){
            if(a == 'transfert'){
                this.mvmt.mvmt_depot_exp = this.list_depot[0].depot_id
                 this.mvmt.mvmt_depot_dest = this.list_depot[1].depot_id
            }
            this.getUtilsAdd()
        },
        visible(a){
            if(a){
                this.init()
                this.getUtilsAdd()
            }
        },
        'filters.search'(a){
            this.researchProd()
        },
        art_selected(a){
            if(!this.art_selected.mart_art_id) this.cur_index = -1
        },
        cur_index(a){
            if(a > -1){
                this.art_selected = this.mart_list[a] 
            }
        }


    },
    data(){
        return{
            on_add_article:false,
            mvmt:{
                mvmt_date:new Date(),
                mvmt_montant:0
            },
            mart_list:[],
            list_depot:[],
            list_fourn:[],
            list_dep:[],
            

            list_label:[
                {label:"Désignation",'key':'mart_art_label'},
                {label:"Quantité",key:'mart_qt'},
                {label:"Unité",key:'mart_art_unit'},
                {label:"Prix Unitaire (Ar)",key:'mart_prix_unit'},
                {label:"Montant (Ar)",key:'mart_montant'}
            ],
            art_selected:{},

            isLoading:false,
            submitted:false,

            on_search_product:false,
            filters:{
                search:''
            },

            list_art:[],
            cur_index:-1,
            cur_qt:0
        }
    },
    methods:{
        init(){
            this.mvmt.mvmt_action = this.action
            this.mvmt.mvmt_util_id = this.$store.state.user.util_id

            // alert(this.$store.state.user.util_id)

            this.mart_list = []
            this.mvmt = {
                mvmt_date:new Date(),
                mvmt_montant:0,
                mvmt_action:this.action
            }

            //Raha ohatra ka pharmacien de tsy mahazo manao transfert
            if(this.$store.state.user.util_type == 'ph'){
                for (let i = 0; i < this.stock.mvmt_type_sortie.length; i++) {
                    const e = this.stock.mvmt_type_sortie[i]
                    if(e.k == 'transfert'){
                        this.stock.mvmt_type_sortie.splice(i,1)
                        return
                    }
                }
            }

            if(this.action == 'entre'){
                this.mvmt.mvmt_type = this.stock.mvmt_type_entre[0].k //achat
            }else if(this.action == 'sortie'){
                this.mvmt.mvmt_type = this.stock.mvmt_type_sortie[0].k
            }

            this.on_search_product = false
            this.filters = {
                search:''
            }
            this.list_art = []
            this.cur_index = -1

            this.cur_qt = 0
        },
        //Changement d'index courant
        changeCurIndex(p){
            let t = this.mart_list.length

            if(p == 'up'){
                this.cur_index -= (this.cur_index > 0 )?1:0
            }else{
                this.cur_index += (this.cur_index < t-1)?1:0
            }

            console.log(p)
        },
        addQt(a){

            //on parcours la liste de mart_list
            let ts = this.mart_list.length
            for (var i = 0; i < this.mart_list.length; i++) {
                const ms = this.mart_list[i]
                if(ms.mart_art_id == this.art_selected.mart_art_id){
                    if(a == '-'){
                        this.mart_list[i].mart_qt -= (ms.mart_qt>1)?1:0
                    }else{
                        this.mart_list[i].mart_qt += 1
                    }

                    break
                }
            }

        },


        changeQt(){
            if(this.cur_qt <= 0 ) return

            //on parcours la liste de mart_list
            let ts = this.mart_list.length
            for (var i = 0; i < this.mart_list.length; i++) {
                const ms = this.mart_list[i]
                if(ms.mart_art_id == this.art_selected.mart_art_id){
                    this.mart_list[i].mart_qt =  this.cur_qt
                    this.$refs.op.toggle();
                    break
                }
            }
        },
        showEditQt(e,p){
           
            // console.log(p.tarifs[index])

             this.$refs.op.toggle(e) 

            this.art_selected = p
            this.cur_qt = p.mart_qt

        },

        async researchProd(){
            try {
                const r = await this.$http.get('api/articles/mvmt/search',{params:this.filters})

                let d = r.data
                if(d.status){
                    this.list_art = d.articles
                }else{
                    this.showNotif('error','Récupération des données',d.message)
                }
            } catch (e) {
                this.showNotifServerError()
            }
        },
        setArtInList(a){
            //on va détecter si l'article n'est pas déjà dans la liste

            for (var i = 0; i < this.mart_list.length; i++) {
                const ml = this.mart_list[i]

                if(ml.mart_art_id == a.art_id){
                    this.mart_list[i].mart_qt += 1
                    this.on_search_product = false
                    return
                }
            }

            // suite
            let ml = {
                mart_art_id:a.art_id,
                mart_art_label:a.art_label,
                mart_art_unit:a.art_unite_stk,

                mart_montant:0,
                mart_qt:1,
                mart_prix_unit:0
            }

            this.mart_list.push(ml)

            this.on_search_product = false


        },
        async getUtilsAdd(){
            try {
                const _r = await this.$http.get('api/mvmt/utils-add',{params:{action:this.action,type:this.mvmt.mvmt_type}})
                let _d = _r.data

                if(_d.status){

                    if(this.action == 'entre'){
                        _d.list_depot.splice(0,1)
                    }

                    this.list_depot = _d.list_depot
                    this.list_fourn = _d.list_fourn
                    this.list_dep = _d.list_dep

                    if(this.inTypeUser(['ph'])){
                        this.list_depot.splice(1,1)
                    }

                    let last_mvmt = _d.mvmt_last

                    if(last_mvmt.length <= 0){
                        this.mvmt.mvmt_num = `${this.stock.prefix_num[this.mvmt.mvmt_type]}-${'1'.padStart(4,0)}`
                    }else{
                        last_mvmt = last_mvmt[0]
                        let _num = parseInt(last_mvmt.mvmt_num.split('-')[1])
                        this.mvmt.mvmt_num = `${this.stock.prefix_num[this.mvmt.mvmt_type]}-${(_num+1).toString().padStart(4,0)}`
                    }


                    //Initialisation des données
                    if(this.action == 'entre'){
                        this.mvmt.mvmt_tiers = this.list_fourn[0].fourn_id

                        //depot
                        this.mvmt.mvmt_depot_dest = this.list_depot[0].depot_id
                        this.mvmt.mvmt_depot_exp = this.list_depot[0].depot_id
                    }else{
                        this.mvmt.mvmt_tiers = this.list_dep[0].dep_id
                        //depot
                        this.mvmt.mvmt_depot_dest = this.list_depot[0].depot_id
                        this.mvmt.mvmt_depot_exp = this.list_depot[0].depot_id
                    }


                }else{
                    this.showNotif(_d.message)
                }
            } catch (e) {
                console.log(e);
                this.showNotif('Erreur de connexion')
            }
        },
        async postMvmt(){
            try {
                const _r = await this.$http.post('api/mvmt',{mvmt:this.mvmt,list_mart:this.mart_list})

                let _d = _r.data

                if(_d.status){
                    this.$emit('validate')
                    this.showNotif('success','Mouvement d\'Article',"Ajout bien effectué")
                }else{
                    this.showNotif('error','Mouvement d\'Article',_d.message)
                }
            } catch (e) {
                this.showNotifServerError()
            }
        },
        onValidateAddArt(a){
            this.mart_list.push(a)


            //Calcul du total montant
            this.mvmt.mvmt_montant = 0
            for (let i = 0; i < this.mart_list.length; i++) {
                const e = this.mart_list[i];
                this.mvmt.mvmt_montant += parseInt(e.mart_montant) || 0
            }
            this.on_add_article = false
        },
        delArtMart(){
            for(let i=0;i < this.mart_list.length;i++){
                if(this.mart_list[i].mart_art_id == this.art_selected.mart_art_id){
                    this.mart_list.splice(i,1)
                    this.art_selected = {}
                    break
                }
            }


            //Calcul du total montant
            this.mvmt.mvmt_montant = 0
            for (let i = 0; i < this.mart_list.length; i++) {
                const e = this.mart_list[i];
                this.mvmt.mvmt_montant += parseInt(e.mart_montant) || 0
            }


            this.art_selected = {}
        }
    },
    beforeMount(){
        this.init()
    },
    mounted(){
        this.getUtilsAdd()
    }
}
</script>

<style>

</style>