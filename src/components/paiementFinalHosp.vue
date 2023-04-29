<template>
    <!-- <div class="bg-dialog-box">
        <div class="border rounded-sm shadow-sm bg-white" :style="{width:`600px`}">
            <div class="p-2 flex items-center">
                <span class="text-sm font-bold"> Saisie encaissement facture </span>
                <span class="flex-grow"></span>
                <button class="bt-s w-8 h-8 flex justify-center items-center" @click="$emit('close')"> <span class="text-xs material-icons"> clear </span> </button>
            </div>

            <div class="p-2">
                <div class="flex flex-col p-5 border rounded mb-2">
                    <div class="flex mb-2">
                        <custom-input :disable="true" class="" v-model="enc.enc_num_mvmt" label="N° Mouvement" />
                        <custom-input :disable="true" class="ml-2" v-model="enc.enc_date" label="Date" type="date" />
                        <custom-input :disable="true" class="ml-2" v-model="(enc.enc_num_hosp)" label="Référence Hospitalisation" />
                    </div>

                    <div class="flex">
                        <custom-input :disable="true" class="" v-model="op" label="Opérateur" />
                        <custom-input :disable="true" class="ml-2 flex-grow" v-model="pat.pat_nom_et_prenom" label="Patient" />
                    </div>

                </div>
                <div class="flex justify-center items-center p-5 border rounded">
                    <custom-input :disable="true" class="" v-model="reste_paie" label="Reste à payer" />

                    <custom-input :disable="true" class="ml-2 " v-model="enc.enc_total_avance" label="Montant payé (avance)" />
                </div>
            </div>

            <div class="flex justify-center items-center p-5">
                <button class="bt-p-s" @click="setToCaisse">Passer à la caisse</button>
            </div>
        </div>
    </div> -->
    <Dialog :maximizable="true" :visible="visible" @update:visible=" ()=>{
            $emit('close') 
        } "  :modal="true" class="p-fluid p-dialog-sm">
        <template #header>
            <span class="text-sm font-bold">MODIFICATION D'UN DEPARTEMENT</span>
        </template>
        <div class="flex flex-column">
            <div class="flex mb-2">
                <!-- <custom-input :disable="true" class="" v-model="enc.enc_num_mvmt" label="N° Mouvement" /> -->
                <div class="flex flex-column">
                    <span class="text-xs font-bold"> N° Mouvement </span>
                    <InputText class="p-inputtext-sm " disabled v-model="enc.enc_num_mvmt" />
                </div> 
                <!-- <custom-input :disable="true" class="ml-2" v-model="enc.enc_date" label="Date" type="date" /> -->
                <div class="flex flex-column ml-2">
                    <span class="text-xs font-bold"> Date </span>
                    <Calendar dateFormat="dd/mm/yy" class="p-inputtext-sm " disabled v-model="enc.enc_date" />
                </div> 
                <!-- <custom-input :disable="true" class="ml-2" v-model="(enc.enc_num_hosp)" label="Référence Hospitalisation" /> -->
                <div class="flex flex-column ml-2">
                    <span class="text-xs font-bold"> Référence Hospitalisation </span>
                    <InputText class="p-inputtext-sm " disabled v-model="enc.enc_num_hosp" />
                </div> 
            </div>

             <div class="flex">
                <!-- <custom-input :disable="true" class="" v-model="op" label="Opérateur" /> -->
                <div class="flex flex-column ">
                    <span class="text-xs font-bold"> Opérateur </span>
                    <InputText class="p-inputtext-sm " disabled v-model="op" />
                </div> 
                <!-- <custom-input :disable="true" class="ml-2 flex-grow" v-model="pat.pat_nom_et_prenom" label="Patient" /> -->
                <div class="flex flex-column ml-2">
                    <span class="text-xs font-bold"> Patient </span>
                    <InputText class="p-inputtext-sm " disabled v-model="pat.pat_nom_et_prenom" />
                </div> 
            </div>

            <Divider />
            <div class="flex justify-center items-center p-5 border rounded">
                <!-- <custom-input :disable="true" class="" v-model="reste_paie" label="Reste à payer" /> -->
                <div class="flex flex-column">
                    <span class="text-xs font-bold"> Reste à payer </span>
                    <InputText class="p-inputtext-sm " disabled v-model="reste_paie" />
                </div> 

                <!-- <custom-input :disable="true" class="ml-2 " v-model="enc.enc_total_avance" label="Montant payé (avance)" /> -->
                <div class="flex flex-column ml-2">
                    <span class="text-xs font-bold"> Montant payé (avance) </span>
                    <InputText class="p-inputtext-sm " disabled v-model="enc.enc_total_avance" />
                </div>
                
            </div>

        </div>
        <template #footer>
            <Button label="Passer à la caisse" class="p-button-sm" icon="pi pi-check" @click="setToCaisse" :loading="isLoading" />
        </template>
    </Dialog>
</template>
<script>

export default {
    props:['en','pat','visible'],

    watch:{
        visible(a){
            if(a){
                this.init()
                this.recupAddUtils()
            }
        }
    },
    data(){
        return{
            enc:{},
            op:'',
            reste_paie:0,
            isLoading:false,
            submitted:false
        }
    },
    methods:{
        async recupAddUtils(){
            try {
                const r = await this.$http.get('api/encaissement/add-utils')
                let d = r.data
                this.enc.enc_num_mvmt = (!this.enc.enc_num_mvmt)?d.last_mvmt + 1:this.enc.enc_num_mvmt
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        },
        init(){

            this.enc = {}
            this.op = ''
            this.reste_paie = 0
            this.isLoading = false
            this.submitted = false

            this.enc = JSON.parse(JSON.stringify(this.en))
            this.enc.enc_date = this.dateToInput(new Date())
            this.op = this.$store.state.user.util_label

            this.enc.enc_total_avance = (!this.enc.enc_total_avance)?0:this.enc.enc_total_avance

            this.reste_paie = parseInt(this.enc.enc_montant) - parseInt((this.enc.enc_total_avance)?this.enc.enc_total_avance:0)

        },
        async setToCaisse(){
            this.isLoading = true
            this.submitted = true
            try {
                const r = await this.$http.put('api/encaissement/hosp/to-caisse',{enc_id:this.enc.enc_id,enc_num_mvmt:this.enc.enc_num_mvmt})
                let d = r.data
                if(d.status){
                    this.$emit('close')
                }else{
                    this.showNotif(d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }

            this.isLoading = false
        }
    },
    beforeMount(){
        this.init()
    },  

    mounted(){
        this.recupAddUtils()
    }
}
</script> 