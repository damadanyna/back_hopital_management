<template>
    <!-- <div class="bg-dialog-box">
        <div class="border rounded-sm shadow-sm bg-white" :style="{width:`700px`}">
            <div class="p-2 flex items-center">
                <span class="text-sm font-bold"> Ajout d'une avance </span>
                <span class="flex-grow"></span>
                <button class="bt-s w-8 h-8 flex justify-center items-center" @click="$emit('close')"> <span class="text-xs material-icons"> clear </span> </button>
            </div>

            <div class="p-2 flex ">
                <custom-input type="date" v-model="encav.encav_date" label="Date" />
                <custom-input v-model="caissier.util_label" :disable="true" class="ml-2" label="Caissier" />
                <custom-input type="number" v-model="encav.encav_montant" class="ml-2" label="Montant" />
            </div>

            <div class="p-2 flex">
                <span class="flex-grow"></span>
                <button class="bt-p-s" @click="setAvance"> Valider </button>
            </div>
        </div>
    </div> -->
    <Dialog :maximizable="true" :visible="visible" @update:visible=" ()=>{
            $emit('close') 
        } "  :modal="true" class="p-fluid p-dialog-sm">
        <template #header>
            <span class="text-sm font-bold">AJOUT D'UNE AVANCE</span>
        </template>
        <div class="flex">
            <!-- <custom-input type="date" v-model="encav.encav_date" label="Date" /> -->
            <div class="flex flex-column">
                <span class="text-xs font-bold"> Date </span>
                <Calendar dateFormat="dd/mm/yy" class="p-inputtext-sm" v-model="encav.encav_date" />
            </div>


            <!-- <custom-input v-model="caissier.util_label" :disable="true" class="ml-2" label="Caissier" /> -->
            <div class="flex flex-column ml-2">
                <span class="text-xs font-bold"> Caissier </span>
                <InputText class="p-inputtext-sm"  v-model="caissier.util_label" disabled />
            </div>


            <!-- <custom-input type="number" v-model="encav." class="ml-2" label="Montant" /> -->
            <div class="flex flex-column ml-2">
                <span class="text-xs font-bold"> Montant </span>
                <InputNumber class="p-inputtext-sm"  v-model="encav.encav_montant"  />
            </div>
        </div>
        <template #footer>
           <!-- <button class="bt-p-s" @click="setAvance"> Valider </button> -->
           <Button class="p-button-sm" @click="setAvance" label="Valider" icon="pi pi-check" />
        </template>
    </Dialog>
</template>
<script>
export default {
    props:['visible'],
    watch:{
        visible(a){
            this.encav = {
                encav_date:''
            }
            this.caissier = {}
            this.init()
        }
    },
    data(){
        return{
            encav:{
                encav_date:''
            },
            caissier:{}
        }
    },
    methods:{
        init(){
            this.encav.encav_date = new Date()
            this.encav.encav_util_id = this.$store.state.user.util_id
            this.encav.util_label = this.$store.state.user.util_label
            this.encav.encav_id = (new Date()).getTime()

            this.caissier = this.$store.state.user
        },
        async recupDataUtils(){

        },
        setAvance(){
            let mn = parseInt(this.encav.encav_montant)
            if(mn.toString() == 'NaN' ||  mn <= 0){
                this.showNotif('error','Ajout Avance','Le montant doit être supérieur à zéro')
                return
            }

            // console.log(mn)

            this.$emit('validate',this.encav)
        }
    },
    mounted(){
        // this.init()
    }
}
</script> 