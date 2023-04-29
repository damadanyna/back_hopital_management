<template>
    <!-- <div class="bg-dialog-box">
        <div class="border rounded-sm shadow-sm bg-white" >
            <div class="p-2 flex items-center">
                <span class="text-sm font-bold"> Ajout de produits | <span class="p-1 rounded bg-blue-600 text-white"> Tarif :  {{ tarif.tarif_label }} </span></span>
                <span class="flex-grow"></span>
                <button class="bt-s w-8 h-8 flex justify-center items-center" @click="$emit('close')"> <span class="material-icons"> clear </span> </button>
            </div>

            <div>

                <div class="p-2 text-sm">
                    <div class="mb-2 flex items-end">
                        <c-select v-model="cur_prod" :datas="list_choice" label="label" code="code" placeholder="Services / Produits" />
                    </div>
                    <div class="mb-2 flex items-end">
                        <div v-if="cur_prod == 'serv'" class=" flex flex-col w-56">
                            <span class="text-xs font-bold"> Choix de services </span>
                            <span class="text-xs flex items-center justify-center border rounded p-2 cursor-pointer"
                             @click="on_select_service = true"> {{ (service_label)?service_label:'-' }} </span>
                        </div>
                        <div v-else-if="cur_prod == 'med'" class=" flex flex-col w-56">
                            <span class="text-xs font-bold"> Choix de médicaments </span>
                            <span class="text-xs flex items-center justify-center border rounded p-2 cursor-pointer"
                             @click="on_select_product = true"> {{ (art_label)?art_label:'-' }} </span>
                        </div>

                        <custom-input v-model="encserv.encserv_qt" type="number" class="w-16 ml-2" label="Quantité" />
                        <custom-input v-model="encserv.encserv_prix_unit" type="number" :disable="true" class="w-32 ml-2" label="Prix Unitaire" />
                        <custom-input disable="true" v-model="encserv.encserv_montant" type="number" class="w-32 ml-2" label="Montant" />

                    </div>
                </div>

                <div class="p-2 flex justify-end">
                    <span class="flex-grow"></span>  
                    <div class="">
                        <button class="bt-p-s" @click=" addProduct " > Ajouter </button>
                    </div>
                </div>
            </div>
        </div>

        <select-service @validate=" getService " v-if="on_select_service" @close="on_select_service = false" />
        <select-product @validate=" getProduct " v-if="on_select_product" @close="on_select_product = false"  />
    </div> -->

    <Dialog :maximizable="true" :visible="visible" @update:visible=" ()=>{
            $emit('close') 
        } "  :modal="true" class="p-fluid p-dialog-sm">
        <template #header>
            <span class="text-sm font-bold"> AJOUT DE PRODUITS  </span> <Divider layout="vertical" /> <span class="p-2 border-round bg-blue-600 text-white font-bold"> Tarif :  {{ tarif.tarif_label }} </span>
        </template>
        <div class="">
            <div class="text-sm">
                <div class="mb-2 flex">
                    <!-- <c-select v-model="cur_prod" :datas="list_choice" label="label" code="code" placeholder="Services / Produits" /> -->
                    <div class="flex flex-column mr-2" style="width:30%">
                        <span class="font-bold text-sm"> Services / Produits </span>
                        <Dropdown v-model="cur_prod" :options="list_choice" optionLabel="label" optionValue="code" placeholder="Services/Produits" class="p-inputtext-sm" />
                    </div>
                    <div v-if="cur_prod == 'serv'" class=" flex" style="width:65%">
                        <!-- <span class="text-xs font-bold"> Choix de services </span>
                        <span class="text-xs flex items-center justify-center border rounded p-2 cursor-pointer"
                            @click="on_select_service = true"> {{ (service_label)?service_label:'-' }} </span> -->
                        <div class="flex flex-column flex-grow-1 ">
                            <span class="font-bold text-sm"> Choix de services </span>
                            <InputText class="p-inputtext-sm cursor-pointer" type="text" v-model="service_label" @click="on_select_service = true"/>
                        </div>
                    </div>
                    <div v-else-if="cur_prod == 'med'" class="" style="width:65%">
                        <!-- <span class="text-xs font-bold"> Choix de médicaments </span>
                        <span class="text-xs flex items-center justify-center border rounded p-2 cursor-pointer"
                            @click="on_select_product = true"> {{ (art_label)?art_label:'-' }} </span> -->
                        <div class="flex flex-column">
                            <span class="font-bold text-sm"> Choix de médicaments </span>
                            <InputText class="p-inputtext-sm cursor-pointer" type="text" v-model="art_label" @click="on_select_product = true"/>
                        </div>
                    </div>
                </div>

                <div class="mb-2 flex items-end">
                    <!-- <custom-input v-model="encserv.encserv_qt" type="number" class="w-16 ml-2" label="Quantité" /> -->
                    <div class="flex flex-column">
                        <span class="font-bold text-sm"> Quantité </span>
                        <InputText type="number" v-model="encserv.encserv_qt" class="p-inputtext-sm" />
                    </div>
                    <!-- <custom-input v-model="encserv.encserv_prix_unit" type="number" :disable="true" class="w-32 ml-2" label="Prix Unitaire" /> -->
                    <div class="flex flex-column ml-2">
                        <span class="font-bold text-sm"> Prix Unitaire </span>
                        <InputText type="number" disabled v-model="encserv.encserv_prix_unit" class="p-inputtext-sm" />
                    </div>
                    <!-- <custom-input disable="true" v-model="encserv.encserv_montant" type="number" class="w-32 ml-2" label="Montant" /> -->
                    <div class="flex flex-column ml-2">
                        <span class="font-bold text-sm"> Montant </span>
                        <InputText type="number" disabled v-model="encserv.encserv_montant" class="p-inputtext-sm" />
                    </div>

                </div>
            </div>

        </div>
        <template #footer>
            <Button label="Ajouter" class="p-button-sm" icon="pi pi-check" @click=" addProduct " />
        </template>

        <select-service @validate=" getService " :visible="on_select_service" @close="on_select_service = false" />
        <select-product @validate=" getProduct " :visible="on_select_product" @close="on_select_product = false"  />
    </Dialog>

    
</template>

<script>
export default {
    props:['tarif','visible'],
    watch:{
        cur_prod(a){
            this.encserv.encserv_is_product = (a == 'med')?1:0
        },
        'encserv.encserv_prix_unit'(a){
            this.encserv.encserv_montant = parseInt(a) * parseInt(this.encserv.encserv_qt)
        },
        'encserv.encserv_qt'(a){
            this.encserv.encserv_montant = parseInt(a) * parseInt(this.encserv.encserv_prix_unit)
        }
    },
    data(){
        return{
            on_select_service:false,
            on_select_product:false,
            encserv:{
                encserv_qt:1,
                encserv_prix_unit:0,
                encserv_montant:0,
                encserv_is_product:0
            },
            service_label:'',
            art_label:'',

            cur_prod:'serv',

            list_choice:[
                {label:"Médicaments",code:"med"},
                {label:"Services",code:"serv"}
            ]
        }
    },
    methods:{
        getService(a){
            this.service_label = a.service_label
            this.encserv.encserv_serv_id = a.service_id
            this.encserv.service_label = a.service_label
            this.encserv.service_code = a.service_code




            for (let i = 0; i < a.tarifs.length; i++) {
                const e = a.tarifs[i];
                if(this.tarif.tarif_id == e.tarif_id){
                    this.encserv.encserv_prix_unit = e.tserv_prix
                    break
                }
            }

            this.on_select_service = false
        },

        getProduct(a){
            this.art_label = a.art_label
            this.encserv.encserv_serv_id = a.art_id

            this.encserv.service_label = a.art_label
            this.encserv.service_code = a.art_code

            this.encserv.art_unite_stk = a.art_unite_stk


            for (let i = 0; i < a.tarifs.length; i++) {
                const e = a.tarifs[i];
                if(this.tarif.tarif_id == e.tarif_id){
                    this.encserv.encserv_prix_unit = e.tserv_prix
                    break
                }
            }

            this.on_select_product = false
        },
        async addProduct(){
            try {
                if(!this.encserv.encserv_serv_id){
                    this.showNotif('error','Caisse - Ajout de produit','Aucun produit/médicaments sélectionnés')
                    return
                }
                this.$emit('validate',this.encserv)
                this.reinit()

            } catch (e) {
                this.showNotifServerError()
            }
        },
        reinit(){
            this.on_select_service = false
            this.on_select_product = false
            this.encserv = {
                encserv_qt:1,
                encserv_prix_unit:0,
                encserv_montant:0,
                encserv_is_product:0
            },
            this.service_label = ''
            this.art_label = '',

            this.cur_prod = 'serv'
        }
    },

    mounted(){
    }
} 
</script>

<style>

</style>