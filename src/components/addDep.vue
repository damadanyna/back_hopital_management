<template>
    <!-- <div class="bg-dialog-box">
        <div class="border rounded-sm shadow-sm bg-white" >
            <div class="p-2 flex items-center">
                <span class="text-sm"> Ajout département </span>
                <span class="flex-grow"></span>
                <button class="bt-s w-8 h-8 flex justify-center items-center" @click="$emit('close')"> <span class="material-icons"> clear </span> </button>
            </div>

            <div class="p-2">
                <div class="flex mb-2">
                    <custom-input class="mr-2" v-model="dep.dep_code" label="Code" />
                    <custom-input class="mr-2" v-model="dep.dep_label" label="Nom du département" />
                </div>
                <div class="p-2 flex justify-end">
                    <button class="bt-p-s" @click="postDep"> Valider </button>
                </div>
            </div>
        </div>
    </div> -->
    <Dialog :maximizable="true" :visible="visible" @update:visible=" ()=>{
            $emit('close') 
        } "  :modal="true" class="p-fluid p-dialog-sm">
        <template #header>
            <span class="text-sm font-bold">AJOUT D'UN DEPARTEMENT</span>
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
                    <Button label="Enregistrer" class="p-button-sm" icon="pi pi-check" @click="postDep" :loading="isLoading" />
                </div>
            </div>
        </template>
    </Dialog>
</template>

<script>
export default {
    props:['visible'],
    watch:{
        visible(a){
            if(a){
                this.dep = {}
                this.isLoading = false
                this.submitted = false
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
        async postDep(){

            // console.log(this.fourn)
            this.isLoading = true
            this.submitted = true
            try {
                const _r = await this.$http.post('api/departements',this.dep)

                let _d = _r.data
                if(_d.status){
                    this.$emit('validate')
                    this.showNotif('success',`Ajout départmement`,`Département bien ajouté`)
                }else{
                    this.showNotif('error',`Ajout départmement`,_d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }

            this.isLoading = false
        },
    }
}
</script>

<style>

</style>