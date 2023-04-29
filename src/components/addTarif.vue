<template>

    <Dialog :maximizable="true" :visible="visible" @update:visible=" ()=>{
            $emit('close') 
        } "  :modal="true" class="p-fluid p-dialog-sm">
        <template #header>
            <span class="text-sm font-bold">AJOUT D'UN TARIIF</span>
        </template>
        <div class="flex flex-column">
            <div class="mr-2">
                <span class="text-xs font-bold"> Libellé du Tarif </span>
                <InputText class="p-inputtext-sm " autofocus v-model="tarif.tarif_label"  :class="{'p-invalid':submitted && !tarif.tarif_label}" />
            </div>

            <Divider />
            <div class="flex flex-column">
                <div class="flex align-items-center mb-2">
                    <Checkbox v-model="on_set_percent" class="p-inputtext-sm "  :binary="true"  inputId="tarif_percent" />
                    <label for="tarif_percent" class="ml-2"> Lié le tarif </label>
                </div>

                <div class="flex flex-column" v-if="on_set_percent"> 
                    <div class="flex flex-column mb-2">
                        <span class="text-xs font-bold"> Le poucentage </span>
                        <InputNumber class="p-inputtext-sm " :max="100" placeholder="80" v-model="tarif.tarif_percent" />
                    </div>
                    <div class="flex flex-column">
                        <span class="text-xs font-bold"> Le tarif </span>
                        <Dropdown class="p-inputtext-sm " :options="tarifs" placeholder="Choisissez un tarif" v-model="tarif.tarif_link_id" optionLabel="tarif_label" optionValue="tarif_id" />
                    </div>
                </div>
            </div>
        </div>
        <template #footer>
            <Button  label="Ajouter" class="p-button-sm" icon="pi pi-check" @click="postTarif" :loading="isLoading" />
        </template>
    </Dialog>
</template>
<script>
export default {
    props:['visible'],
    watch:{
        visible(a){
            if(a){
                this.submitted = false

                this.tarif = {},
                this.on_set_percent = false
                this.getListTarifNoPercent()
            }
        }
    },
    data(){
        return{
            tarif:{},
            on_set_percent:false,
            
            isLoading:false,
            submitted:false,
            tarifs:[],

            
        }
    },
    methods:{
        async postTarif(){
            this.isLoading = true
            this.submitted = true
            try {
                const _r = await this.$http.post('api/tarifs',this.tarif)
                let _d = _r.data

                if(_d.status){
                    this.$emit('validate')
                    this.showNotif('success','Ajout d\'un Tarif','Tarif bien ajouté')
                }else{
                    this.showNotif('error','Ajout d\'un service',_d.message)
                }
            } catch (e) {
                this.showNotifServerError()
            }

            this.isLoading = false
        },
        async getListTarifNoPercent(){
            try {
                const r = await this.$http.get('api/tarif/no-percent')
                let d = r.data

                if(d.status){
                    this.tarifs = d.tarifs
                }else{
                    this.showNotif('error',`Tarif`,_d.message)
                }
            } catch (e) {
                this.showNotifServerError()
            }
        }
    },
    mounted(){
        this.getListTarifNoPercent()
    }
}
</script> 