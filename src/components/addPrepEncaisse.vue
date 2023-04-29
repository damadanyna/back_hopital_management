<template>
    <Dialog :maximizable="true" :visible="visible" @update:visible=" ()=>{
            $emit('close') 
        } "  :modal="true" class="p-fluid p-dialog-sm" >
        <template #header>
            <span class="text-sm font-bold">SAISIE D'ENCAISSEMENT</span>
        </template>
        <div class="flex">

            <div class="" style="width:40%">
                <div class="flex items-end mb-5">
                    <!-- <custom-input  :disable="true" v-model="enc.enc_num_mvmt" label="N° Mouvement" /> -->
                    <div class="flex flex-column mt-2" style="width:30%">
                        <span class="font-bold text-sm"> N° Mouvement </span>
                        <InputText class="p-inputtext-sm" type="text" v-model="enc.enc_num_mvmt" disabled/>
                    </div>
                    <Divider layout="vertical" style="width:5%" />
                    <!-- <custom-input  :disable="true" v-model="enc.enc_date" label="Date" type="date" class="ml-2" /> -->
                    <div class="flex flex-column mt-2" style="width:65%">
                        <span class="font-bold text-sm"> Date </span>
                        <Calendar placeholder="ex : 09/09/1998" v-model="enc.enc_date"  dateFormat="dd/mm/yy" class="p-inputtext-sm" disabled/>    
                    </div>

                </div>
                <div class="flex flex-column mb-2">
                    <!-- <div class="flex flex-colum">
                        <span class="text-xs font-bold">Patient</span>
                        <span class="flex items-center justify-center border p-2 rounded w-full cursor-pointer" @click=" in_select_pat = true ">  
                            {{ (pat_selected.pat_id != undefined)?pat_selected.pat_nom_et_prenom:'-' }} </span>
                    </div>   -->

                    <div class="field-checkbox text-sm mb-2">
                        <Checkbox inputId="binary" v-model="enc.enc_is_externe" :binary="true" />
                        <label for="binary"> Externe </label>
                    </div>
                    <div class="flex w-full align-items-end">
                        <div class="flex flex-column" style="width:85%">
                            <span class="font-bold text-sm"> Patients </span>
                            <InputText class="p-inputtext-sm" type="text" v-model="pat_selected.pat_nom_et_prenom" :class="{'p-invalid':!this.enc.enc_pat_id && submitted}"/>
                        </div>
                        <div class=" flex justify-content-end" style="width:15%">
                            <Button :disabled="enc.enc_is_externe"  @click=" in_select_pat = true " 
                            icon="pi pi-pencil" class="ml-2 p-button-sm  p-button-raised p-button-text" />
                        </div>
                    </div>
                </div>
                <div class="flex items-end mb-2">
                    <!-- <c-select :datas="choice_pec" label="label" code="code" v-model="enc.enc_is_pec"  placeholder="Choix de paiement" /> -->
                    <div class="flex flex-column">
                        <span class="font-bold text-sm"> Choix de paiement </span>
                        <Dropdown v-model="enc.enc_is_pec" :options="choice_pec" optionLabel="label" optionValue="code" placeholder="Paiement" class="p-inputtext-sm" />
                    </div>
                    <!-- <c-select v-if="enc.enc_is_pec == 1" :datas="soc" label="ent_label" code="ent_id" class="ml-2" v-model="enc.enc_ent_id"  placeholder="Société payeur" /> -->
                    <div class="flex flex-column ml-2" v-if="enc.enc_is_pec == 1">
                        <span class="font-bold text-sm"> Société payeur </span>
                        <Dropdown  v-model="enc.enc_ent_id" :options="soc" optionLabel="ent_label" optionValue="ent_id" placeholder="Société" class="p-inputtext-sm" />
                    </div>
                </div>

                <div class="flex items-end mb-2" >
                    <!-- <c-select :datas="tarif" label="tarif_label" code="tarif_id" v-model="enc.enc_tarif_id"  placeholder="Tarif" /> -->
                    <div class="flex flex-column" style="width:40%">
                        <span class="font-bold text-sm"> Tarif </span>
                        <Dropdown :disabled=" encserv.length > 0 " v-model="enc.enc_tarif_id" :options="tarif" optionLabel="tarif_label" optionValue="tarif_id" placeholder="Société" class="p-inputtext-sm" />
                    </div>

                    <!-- Département -->
                    <!-- <div class="flex flex-column ml-2">
                        <span class="text-xs font-bold"> Département </span>
                        <Dropdown class="p-inputtext-sm" :options="dep" optionLabel="dep_label" optionValue="dep_id"  v-model="enc.enc_dep_id" placeholder="Département" />
                    </div> -->
                </div>

                <!-- <div class="flex ">
                    <div class="flex flex-column p-2 border-1 border-gray-400 border-round">
                        <span class="font-bold text-xs"> Reste paie </span>
                        <span class=""> {{ enc.enc_reste_paie.toLocaleString('fr-CA') }} </span>
                    </div>

                    <div class="flex flex-column p-2 border-1 border-gray-400 border-round ml-2">
                        <span class="font-bold text-xs"> Total Montant Avance </span>
                        <span class=""> {{ enc.enc_total_avance.toLocaleString('fr-CA') }} </span>
                    </div>
                </div> -->
            </div>

            <Divider layout="vertical"/>

            <div class="flex flex-column flex-grow-1">
                <Message v-show="encserv.length == 0 " severity="warn" :closable="false"> Vous devez ajouter au moins <strong> 1 produits ou services</strong> </Message>

                <!-- L'ONGLET -->
                <!-- <div class="mt-2 border-1 border-200 p-2 text-md flex sticky top-0 bg-white mb-2" style="z-index:105">
                    <div class="mr-2 cursor-pointer" @click="cur_view = l.code" :class="{'border-bottom-2 font-bold border-blue-500':cur_view == l.code}" v-for="l in list_view" :key="l.code">
                        <span class=""> {{ l.label }} </span>
                    </div>
                </div> -->

                <!-- GESTION AVANCE DANS ENCAISSEMENT -->
                <!-- ********** -->
                <!-- <div v-if="cur_view == 'avance'" class="">
                    <table class="w-full">
                        <thead class="rounded-t " >
                            <tr class="bg-gray-50 text-gray-700 text-sm">
                                <th v-for="l in av_label_list" class="p-2 border text-xs text-left" :key="l.key">
                                    {{ l.label }}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr @click=" ()=>{
                                    av_selected = p
                                } " v-for="p in encav" class="cursor-pointer"  :key="p.encav_id">
                                <td :class="{'active-row':av_selected.encav_id == p.encav_id}"  class="p-2 border text-xs" 
                                v-for="l in av_label_list" :key="l.key">

                                    <div class="w-full flex justify-end" v-if="['encav_montant'].indexOf(l.key) != -1">
                                        <span class=""> {{  parseInt(p[l.key]).toLocaleString('fr-CA') }} </span>
                                    </div>
                                    <span v-else-if="l.key == 'encav_date'"> {{ dateToText(p[l.key]) }} </span>
                                    <span class="" v-else > {{ p[l.key] }} </span>
                                </td>
                            </tr>
                            <tr class="text-xs">
                                <td class="p-2 border"  colspan="2">
                                    <span class="font-bold"> Total </span>
                                </td>
                                <td class="p-2 border ">
                                    <div class="w-full flex text-left">
                                        <span class="">{{ enc.enc_total_avance.toLocaleString('fr-CA') }}</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div v-if="!enc.enc_validate || inTypeUser(['g','m','a'])" class="flex mt-2">
                        <div class="flex w-full">
                            <div>
                                <Button class="p-button-sm " label="Avance" icon="pi pi-plus" @click="on_add_avance = true" />
                            </div>

                            
                            <div>
                                <Button  v-if="av_selected.encav_id && inTypeUser(['a','g','m'])" 
                                class="p-button-sm p-button-text p-button-danger p-button-raised ml-2" @click="delAvance" label="Supprimer" icon="pi pi-times" />
                            </div>

                            <span class="flex-grow-1"> </span>
                            
                        </div> 
                        
                    </div>
                </div> -->

                <!-- GESTION ENCAISSEMENT -->
                <!-- ********** -->
                
                <div v-if="cur_view == 'acte'" class="flex flex-column">

                    <div class="mb-2 flex flex-column" :class="{'border-1 border-round border-200 p-2':on_search_product}">
                        <div class="flex flex-column">
                            <span class="p-input-icon-right">
                                <i class="pi pi-search" />
                                <InputText @focus="()=>{
                                    on_search_product = true
                                    researchProdServ()
                                }" class="p-inputtext-sm" type="text" v-model="filters.search" placeholder="Rechercher un produit ou un service"/>
                            </span>
                        </div>

                        <div v-if="on_search_product" class="flex flex-column" style="max-height: 300px;overflow: auto;">
                            <div @click="getTservProd(lp)" class="flex flex-column cursor-pointer border-bottom-1 hover:bg-gray-100 border-200 p-2" v-for="lp in list_prod_serv" :key="lp.service_code">
                                <span class="font-bold text-gray-600"> {{ lp.service_label }} </span>
                                <span class="text-gray-500"> {{ lp.service_code }} </span>
                            </div>
                        </div>

                        <div class="mt-2 flex justify-content-end text-center" v-if="on_search_product">
                            <div>
                                <Button class="p-button-sm p-button-text" @click="on_search_product = false" icon="pi pi-times" label="Fermer"/>
                            </div>
                        </div>
                    </div>
                    
                    <div class="" v-if="!on_search_product" tabindex="0" 
                    @keydown.p="addQt('+')" @keydown.add="addQt('+')" @keydown.m="addQt('-')" @keydown.dash="addQt('-')"
                    @keydown.up = "changeCurIndex('up')" @keydown.down = "changeCurIndex('down') " @keydown.delete="delFserv" >
                        <table class="w-full" >
                            <thead class="" >
                                <tr class="">
                                    <th v-for="l in es_label_list" class="text-left text-sm" :key="l.key">
                                        {{ l.label }}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr @click=" ()=>{
                                        list_selected = p
                                        cur_index = i
                                    } " v-for="p,i in encserv" class="cursor-pointer"  :key="p.service_code">
                                    <td :class="{'active-row':list_selected.service_code == p.service_code}"  class="text-xs" 
                                    v-for="l in es_label_list" :key="l.key">

                                        <div class="w-full flex justify-end" v-if="['encserv_montant','encserv_prix_unit'].indexOf(l.key) != -1">
                                            <span class=""> {{  p[l.key].toLocaleString('fr-CA') }} </span>
                                        </div>

                                        <span v-else-if="l.key == 'encserv_qt'"  class="px-2 py-1 border-1 border-round bg-white cursor-pointer flex " @click="showEditQt($event,p)"> {{ p.encserv_qt }} </span>

                                        <span class="" v-else > {{ p[l.key] }} </span>
                                    </td>
                                </tr>
                                <tr class="text-xs">
                                    <td class="p-2 border"  colspan="5">
                                        <span class="font-bold"> Total </span>
                                    </td>
                                    <td class="p-2 border ">
                                        <div class="w-full flex justify-end">
                                            <span class="font-bold">{{ enc.enc_montant.toLocaleString('fr-CA') }}</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
            
        </div>
        <template #footer>
            <div class="flex">

                <Button v-if="list_selected.service_code" @click="delFserv" 
                label="Supprimer" icon="pi pi-times" class="ml-2 p-button-sm p-button-text p-button-raised p-button-danger" />

                <div class="flex mx-2"  v-if="list_selected.service_code">
                    <Button icon="pi pi-minus" @click="addQt('-')" class="p-button-sm p-button-text p-button-raised"  />
                    <Button icon="pi pi-plus" @click="addQt('+')" class=" p-button-text p-button-raised p-button-sm ml-2"  />
                </div>

                <span class="flex-grow-1"></span>

                <Button label="Enregistrer" class="p-button-sm" icon="pi pi-check"  :loading="isLoading" @click="setEncaissement" />
            </div>
        </template>

        <select-patient @validate=" setPatient " :visible="in_select_pat" @close="in_select_pat = false" />
        <add-product-caisse :tarif="tarif_selected" :visible="on_add_product" @close="on_add_product = false" @validate="setProduct" />
        <add-avance-hosp @validate=" setAvance " :visible="on_add_avance" @close="on_add_avance = false" />

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
    props:['visible'],
    watch:{
        'enc.enc_tarif_id'(a){
            for (let i = 0; i < this.tarif.length; i++) {
                const e = this.tarif[i];
                if(a == e.tarif_id){
                    this.tarif_selected = e
                    break
                }
            }
        },
        'enc.enc_total_avance'(a){
            this.enc.enc_reste_paie = parseInt(this.enc.enc_montant) - parseInt(a) 
        },
        'enc.enc_montant'(a){
            this.enc.enc_reste_paie = parseInt(a) - parseInt(this.enc.enc_total_avance)
        },
        visible(a){
            if(a){
                this.reinit()
                this.recupAddUtils()
            }
        },
        'filters.search'(a){
            this.researchProdServ()
        },
        list_selected(a){
            if(!this.list_selected.service_code) this.cur_index = -1
        },
        cur_index(a){
            if(a > -1){
                this.list_selected = this.encserv[a] 
            }
        }

    },
    data(){
        return{
            enc:{
                enc_is_pec:0,
                enc_tarif_id:-1,
                enc_montant:0,
                enc_percent_tarif:null,
                enc_total_avance:0,
                enc_reste_paie:0,
                enc_dep_id:null,
                enc_is_externe:false
            },
            in_select_pat:false,
            pat_selected:{},
            soc:[],
            tarif:[],
            choice_pec:[
                {label:'Au comptant',code:0},
                {label:'Prise en Charge',code:1},
            ],

            encserv:[],
            es_label_list:[
                {label:'Code',key:'service_code'},
                {label:'Désignation',key:'service_label'},
                {label:'Quantité',key:'encserv_qt'},
                {label:'Unité',key:'art_unite_stk'},
                {label:'Prix Unitaire',key:'encserv_prix_unit'},
                {label:'Montant',key:'encserv_montant'},
            ],
            av_label_list:[
                {label:'Date',key:'encav_date'},
                {label:'Caissier',key:'util_label'},
                {label:'Montant',key:'encav_montant'},
            ],
            on_add_product:false,
            list_selected:{},
            tarif_selected:{},

            isLoading:false,
            submitted:false,

            on_search_product:false,

            filters:{
                search:''
            },

            list_prod_serv:[],
            cur_index:-1,


            cur_view:'acte',
            list_view:[
                {label:'DETAILS PAR DESIGNATION',code:'acte'},
                {label:'AVANCES PERCUES',code:'avance'},
            ],
            av_selected:{},
            encav:[],
            on_add_avance:false,

            dep:[],
            cur_qt:0
        }
    },
    methods:{
        changeCurIndex(p){
            let t = this.encserv.length

            if(p == 'up'){
                this.cur_index -= (this.cur_index > 0 )?1:0
            }else{
                this.cur_index += (this.cur_index < t-1)?1:0
            }

            console.log(p)
        },

        changeQt(){
            if(this.cur_qt <= 0 ) return

            for (let i = 0; i < this.encserv.length; i++) {
                const e = this.encserv[i];
                
                if(e.service_code == this.list_selected.service_code){
                    this.encserv[i].encserv_qt = this.cur_qt

                    this.encserv[i].encserv_montant = parseInt(e.encserv_prix_unit) * parseInt(this.encserv[i].encserv_qt)
                    this.calcMontant()

                    this.$refs.op.toggle();
                    // console.log(this.list_modif_hosp)
                    break
                }
            }
        },
        showEditQt(e,p){
           
            // console.log(p.tarifs[index])

             this.$refs.op.toggle(e) 

            this.list_selected = p
            this.cur_qt = p.encserv_qt

        },
        reinit(){
            this.enc = {
                enc_is_pec:0,
                enc_tarif_id:-1,
                enc_montant:0,
                enc_percent_tarif:null,
                enc_total_avance:0,
                enc_reste_paie:0,
                enc_dep_id:null,
                enc_is_externe:false
            }

            this.pat_selected = {}
            this.soc = []
            this.tarif = []

            this.list_selected = {},
            this.tarif_selected = {},

            this.encserv = []

            this.submitted = false

            this.init()
            this.on_search_product = false
            this.list_prod_serv = []
            this.filters.search = ''

            this.cur_view = 'acte'

            this.av_selected = {}
            this.encav = []

            this.enc.enc_util_id = this.$store.state.user.util_id

            this.on_add_avance = false
            this.cur_qt = 0
        },
        async recupAddUtils(){
            try {
                const r = await this.$http.get('api/encaissement/add-utils')
                let d = r.data

                this.soc = d.soc
                this.tarif = d.tarif

                this.dep = d.dep

                this.enc.enc_ent_id = d.soc[0].ent_id

                this.enc.enc_num_mvmt = d.last_mvmt + 1

                //
                this.tarif_selected = this.tarif[0]
                this.enc.enc_tarif_id = this.tarif[0].tarif_id

            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        },

        async researchProdServ(){
            try {
                const r = await this.$http.get('api/caisse/search/prod-serv',{params:this.filters})

                let d = r.data
                if(d.status){
                    this.list_prod_serv = d.list
                }else{
                    this.showNotif('error','Récupération des données',d.message)
                }
            } catch (e) {
                this.showNotifServerError()
            }
        },

        addQt(s){
            if(! this.list_selected.service_code) return 


            for (let i = 0; i < this.encserv.length; i++) {
                const e = this.encserv[i];
                
                if(e.service_code == this.list_selected.service_code){
                    if(s == '-'){
                        this.encserv[i].encserv_qt -= (this.encserv[i].encserv_qt > 1)?1:0
                    }else{
                        this.encserv[i].encserv_qt += 1
                    }

                    this.encserv[i].encserv_montant = parseInt(e.encserv_prix_unit) * parseInt(this.encserv[i].encserv_qt)
                    this.calcMontant()


                    if(this.encserv[i].encserv_qt == 0){
                        this.encserv.splice(i,1)
                        this.list_selected = {}
                    }

                    break
                }
            }
        },

        setAvance(a){
            this.encav.push(a)
            this.on_add_avance = false
            this.calcTotalAvance()
        },

        calcTotalAvance(){
            this.enc.enc_total_avance  = 0
            for (let i = 0; i < this.encav.length; i++) {
                const e = this.encav[i];
                if(!e.to_delete){
                    this.enc.enc_total_avance += parseInt(e.encav_montant)
                }
            }
        },

        //Ajout de l'encaissement dans la base
        async setEncaissement(){
            if(!this.enc.enc_is_pec){
                this.enc.enc_ent_id  = null
            }
            this.submitted = true

            if((!this.enc.enc_pat_id && !this.enc.enc_is_externe) || (this.enc.enc_is_externe && !this.pat_selected.pat_nom_et_prenom)){
                this.showNotif('error','Preparation encaissement','Le patient est obligatoire')
                return
            }


            //Modification du montant s'il y a des montant avec 50 Ar
            /* - */ let x = parseInt(this.enc.enc_montant)
            /* - */ let xr = x % 100
            /* - */ x -= (xr < 50)?xr:xr - 100

            this.enc.enc_montant = x
            // Fin modif du prix ----------

            this.enc.enc_pat_externe = (this.enc.enc_is_externe)?this.pat_selected.pat_nom_et_prenom:null

            try {
                const r = await this.$http.post('api/encaissement',{enc:this.enc,encserv:this.encserv})
                let d = r.data

                if(d.status){
                    this.$emit('validate')
                    this.showNotif('success','Preparation encaissement',d.message)
                }else{
                    this.showNotif('error','Preparation encaissement',d.message)
                }
            } catch (e) {
                this.showNotifServerError()
            }
        },

        async getTservProd(lp){
            try {



                //Recherche d'abord si le truc est déja dans la liste

                for (let i = 0; i < this.encserv.length; i++) {
                    const e = this.encserv[i];

                    if(e.service_code == lp.service_code){
                        this.encserv[i].encserv_qt += 1
                        this.encserv[i].encserv_montant = parseInt(e.encserv_prix_unit) * parseInt(this.encserv[i].encserv_qt)

                        this.calcMontant()
                        this.on_search_product = false
                        return
                    }
                    
                }

                //---------------------------
                const r = await this.$http.get('api/caisse/tarif-prod',{params:{
                    service_id:(lp.art_id)?lp.art_id:lp.service_id,
                    is_product:(lp.art_id)?1:0,
                    tarif_id:this.enc.enc_tarif_id
                }})

                let d = r.data
                if(d.status){
                    

                    let ts = d.tserv

                    //Ajout de l'encserv
                    this.encserv.push({
                        encserv_serv_id:(lp.art_id)?lp.art_id:lp.service_id,
                        service_label:lp.service_label,
                        service_code:lp.service_code,
                        encserv_qt:1,
                        encserv_prix_unit:ts.tserv_prix,
                        encserv_montant:1 * parseInt(ts.tserv_prix),
                        encserv_is_product:(lp.art_id)?1:0,
                        art_unite_stk:(lp.art_id)?lp.art_unite_stk:null
                    })

                    this.calcMontant()

                }else{
                    this.showNotif('error','Preparation encaissement',d.message)
                }


                this.on_search_product = false
            } catch (e) {
                this.showNotifServerError()
            }
        },
        setPatient(p){
            this.pat_selected = p
            this.enc.enc_pat_id = p.pat_id

            this.in_select_pat = false
        },
        init(){
            this.enc.enc_date = new Date()
            this.enc.enc_util_id = this.$store.state.user.util_id
        },
        setProduct(a){
            this.on_add_product = false
            this.encserv.push(a)
            this.calcMontant()
            
        },
        calcMontant(){
            this.enc.enc_montant = 0
            for (let i = 0; i < this.encserv.length; i++) {
                const e = this.encserv[i];
                this.enc.enc_montant += parseInt(e.encserv_montant)
            }
        },
        delFserv(){
            for (let i = 0; i < this.encserv.length; i++) {
                const e = this.encserv[i];
                if(e.service_code == this.list_selected.service_code){
                    this.encserv.splice(i,1)
                    this.list_selected = {}
                    break
                }
            }

            this.calcMontant()
        }
    },
    beforeMount(){
        this.recupAddUtils()
    },
    mounted(){  

        this.init()
    }
}
</script> 