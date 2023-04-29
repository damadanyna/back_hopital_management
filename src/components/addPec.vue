<template>
    <Dialog :maximizable="true" :visible="visible" @update:visible=" ()=>{
            $emit('close') 
        } "  :modal="true" class="p-fluid p-dialog-sm">
        <template #header>
            <span class="text-sm font-bold">EDITION PRISE EN CHARGE</span>
        </template>
        <div class="flex">
            <div class="flex flex-column">
                <div class="flex mb-2">
                    <!-- <custom-input class="mr-2 w-32" :disable="true" v-model="pec.encharge_seq" label="N° Séquence" /> -->
                    <div class="flex flex-column" style="width:30%">
                        <span class="text-xs font-bold"> N° Séquence </span>
                        <InputText class="p-inputtext-sm" v-model="pec.encharge_seq" disabled />
                    </div>

                    <div class="flex flex-column ml-2 flex-grow-1">
                        <span class="text-xs font-bold"> Patient </span>
                        <InputText class="p-inputtext-sm" v-model="p_selected.pat_nom_et_prenom" @click="in_select_pat = true" />
                    </div>
                </div>

                <div class="flex mb-2">
                    <div class="flex flex-column">
                        <span class="text-xs font-bold"> Société employeur </span>
                        <InputText class="p-inputtext-sm" v-model="soc_selected.ent_label" @click="in_select_soc = true" />
                    </div>
                    <div class="flex flex-column ml-2">
                        <span class="text-xs font-bold"> Société payeur </span>
                        <InputText class="p-inputtext-sm" v-model="soc_pay_selected.ent_label" @click="in_select_soc2 = true" />
                    </div>
                </div>

                <div class="flex ">
                    <!-- <custom-input type="date" v-model="pec.encharge_date_entre" class="mr-2" label="Date d'entrée " /> -->
                    <div class="flex flex-column">
                        <span class="text-xs font-bold"> Date d'entrée </span>
                        <Calendar class="p-inputtext-sm" v-model="pec.encharge_date_entre" dateFormat="dd/mm/yy"  />
                    </div>
                    <!-- <custom-input type="date" v-model="pec.encharge_date_sortie" class="mr-2" label="Date de sortie " /> -->
                    <div class="flex flex-column ml-2">
                        <span class="text-xs font-bold"> Date de sortie </span>
                        <Calendar class="p-inputtext-sm" v-model="pec.encharge_date_sortie" dateFormat="dd/mm/yy"  />
                    </div>
                </div>

            </div>
        </div>
        <template #footer>
            <!-- <button class="bt-p-s" @click="postPec"> Ajouter </button> -->
            <Button label="Enregistrer"  icon="pi pi-check" class="p-button-sm"  @click="postPec"/>
        </template>

        <select-patient @validate=" setPatient " :visible="in_select_pat" @close="in_select_pat = false" />

        <select-soc @validate=" setSoc " :visible="in_select_soc" @close="in_select_soc = false" />
        <select-soc @validate=" setSoc2 " :visible="in_select_soc2" @close="in_select_soc2 = false" />
    </Dialog>
</template>

<script>
export default {
    props:['visible'],
    watch:{
        search(a){
            if(!a) return

            if(this.on_search_patient) {
                this.searchPatByNum()
            }else if(this.on_search_soc || this.on_search_soc2){
                this.searchSocByNum()
            }
        },
        visible(a){
            if(a){
                this.init()
                this.getUtilsAdd()
            }
        }
    },
    data(){
        return{
            pec:{
                encharge_util_id:this.$store.state.user.util_id
            },
            p_selected:{},
            soc_selected:{},
            soc_pay_selected:{}, 

            tarifs:[],
            soc:[],
            pat_search:[],
            search:'',
            in_select_pat:false,
            on_search_soc:false,
            on_search_soc2:false,

            //entreprise
            ent_search:[],
            in_select_soc:false,
            in_select_soc2:false
        }
    },
    methods:{
        async getUtilsAdd(){
            try {
                const _r = await this.$http.get('api/encharge/utils/add')
                let _d = _r.data

                if(_d.status){
                    this.tarifs = _d.tarifs

                    this.pec.encharge_tarif_id = (this.tarifs.length > 0)?this.tarifs[0].tarif_id:null
                    this.soc =_d.soc


                    let last_seq = _d.last_seq
                    let year = (new Date()).getFullYear().toString().substring(2)
                    if(last_seq == 0){
                        this.pec.encharge_seq = `${year}/${'1'.padStart(4,0)}`
                    }else{
                        last_seq = (parseInt(last_seq.split('/')[1]) + 1).toString()
                        this.pec.encharge_seq = `${year}/${last_seq.padStart(4,0)}`
                    }
                }else{
                    this.showNotif('Erreur de connexion')
                }
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        },
        setPatient(p){
            this.p_selected = p
            this.pec.encharge_pat_id = p.pat_id

            this.in_select_pat = false
        },

        setSoc(s){
            this.soc_selected = s
            this.pec.encharge_ent_id = s.ent_id

            this.in_select_soc = false
        },

        setSoc2(s){
            this.soc_pay_selected= s
            this.pec.encharge_ent_payeur = s.ent_id

            this.in_select_soc2 = false
        },
        async searchSocByNum(){
            try {
                const _r = await this.$http.get('api/entreprises/out/search',{params:{by:'ent_code',search:this.search}})

                let _d = _r.data
                if(_d.status){
                    this.ent_search = _d.ents
                }else{
                    this.showNotif(_d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        },

        async postPec(){
            try {
                if(!this.p_selected.pat_id){
                    this.showNotif('error','Edition Prise en charge',`Le Patient est obligatoire`)
                    return
                }
                
                this.pec.encharge_pat_id = (this.p_selected.pat_id)?this.p_selected.pat_id:null
                this.pec.encharge_ent_id = (this.soc_selected.ent_code)?this.soc_selected.ent_id:null
                this.pec.encharge_ent_payeur = (this.soc_pay_selected.ent_code)?this.soc_pay_selected.ent_id:null

                const _r = await this.$http.post('api/encharge',this.pec)

                let _d = _r.data
                if(_d.status){
                    this.$emit('validate')
                }else{
                    this.showNotif('error','Edition Prise en charge',_d.message)
                }
            } catch (e) {
                this.showNotifServerError()
            }
        },
        init(){
            this.pec = {
                encharge_util_id:this.$store.state.user.util_id
            }

            this.pec.encharge_date_entre = new Date()
            this.p_selected = {}
            this.soc_selected = {}
            this.soc_pay_selected = {},

            this.tarifs = []
            this.soc = []
            this.pat_search = []
            this.search = ''
            this.in_select_pat = false
            this.on_search_soc = false
            this.on_search_soc2 = false

            //entreprise
            this.ent_search = []

            this.in_select_soc = false
            this.in_select_soc2 = false
        }
    },

    mounted(){
        // this.getUtilsAdd()
    }
} 
</script>

<style>

</style>