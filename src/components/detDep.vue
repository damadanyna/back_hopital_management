<template>
    <Dialog :maximizable="true" :visible="visible" @update:visible=" ()=>{
            $emit('close') 
        } "  :modal="true" class="p-fluid p-dialog-sm">
        <template #header>
            <span class="text-sm font-bold">MODIFICATION D'UN DEPARTEMENT</span>
        </template>
        <div class="flex">
            <!-- <custom-input class="mr-2" v-model="dep.dep_code" label="Code" /> -->
            <div class="mr-2" style="width:30%">
                <span class="text-xs font-bold"> Code * </span>
                <InputText class="p-inputtext-sm " autofocus v-model="dep.dep_code"  :class="{'p-invalid':submitted && !dep.dep_code}" />
            </div>
            <!-- <custom-input class="mr-2" v-model="dep.dep_label" label="Nom du département" /> -->
            <div class="mr-2 flex-grow-1">
                <span class="text-xs font-bold"> Nom du département *</span>
                <InputText class="p-inputtext-sm " autofocus v-model="dep.dep_label"  :class="{'p-invalid':submitted && !dep.dep_label}" />
            </div>
        </div>
        <template #footer>
            <div class="flex">
                <div>
                    <span class="text-xs"> * : Obligatoire</span>
                </div>
                <span class="flex-grow-1"></span>
                <div class="">
                    <Button label="Enregistrer" class="p-button-sm" icon="pi pi-check" @click="updateDep" :loading="isLoading" />
                </div>
            </div>
        </template>
    </Dialog>
</template>

<script>
export default {
    props:['d','visible'],
    watch:{
        visible(a){
            if(a){
                this.dep  = JSON.parse(JSON.stringify(this.d))
            }
        }
    },
    data(){
        return{
            dep:{},
            isLoading:false,
            submitted:false
        }
    },
    methods:{
        async updateDep(){

            delete this.dep.dep_date_enreg

            this.isLoading = true
            this.submitted = true
            try {
                const _r = await this.$http.put('api/departement',this.dep)

                let _d = _r.data

                if(_d.status){
                    this.$emit('validate')
                }else{
                    this.showNotif(_d.message)
                }
            } catch (e) {
                this.showNotifServerError()
            }

            this.isLoading = false
        },

        async delDep(){
            try {
                const _r = await this.$http.delete('api/departement/'+this.dep.dep_id)
                let _d = _r.data

                if(_d.status){
                    this.$emit('del')
                    this.showNotif('error',`Suppression d'un département`,`Département bien ajouté`)
                }else{
                    this.showNotif('error',`Suppression d'un département`,_d.message)
                }
            } catch (e) {
                this.showNotifServerError()
            }
        }
    },
    mounted(){
        
    }
}
</script>

<style>

</style>