<template>
    <!-- <div class="bg-dialog-box">
        <div class="border rounded-sm shadow-sm bg-white" >
            <div class="p-2 flex items-center">
                <span class="text-sm"> Ajout Catégorie </span>
                <span class="flex-grow"></span>
                <button class="bt-s w-8 h-8 flex justify-center items-center" @click="$emit('close')"> <span class="material-icons">clear</span> </button>
            </div>

            <div class="p-2">
                <div class="flex mb-2">
                    <custom-input class="mr-2" v-model="cat.cat_code" label="Code" />
                    <custom-input class="mr-2" v-model="cat.cat_label" label="Libellée" />

                    <c-select :datas="cat_parent" label="cat_label" code="cat_id" v-model="cat.cat_parent_id" placeholder="Catégorie parente" />
                </div>
                <div class="p-2 flex justify-end">
                    <button class="bt-p-s" @click=" postCat "> Ajouter </button>
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
        <div class="flex flex-column">
            <div class="flex flex-column mb-2">
                <!-- <c-select :datas="cat_parent" label="cat_label" code="cat_id" v-model="cat.cat_parent_id" placeholder="Catégorie parente" /> -->
                <span class="text-xs font-bold"> Catégorie parente </span>
                <Dropdown :options="cat_parent" class="p-inputtext-sm" optionLabel="cat_label" v-model="cat.cat_parent_id" />
            </div>
            <div class="flex mb-2">
                <!-- <custom-input class="mr-2" v-model="cat.cat_code" label="Code" /> -->
                <div class="flex flex-column mb-2" style="width:30%">
                    <span class="text-xs font-bold"> Code </span>
                    <InputText  class="p-inputtext-sm" v-model="cat.cat_code"/>
                </div>
                <!-- <custom-input class="mr-2" v-model="cat.cat_label" label="Libellée" /> -->
                <div class="flex flex-column mb-2 flex-grow-1 ml-2">
                    <span class="text-xs font-bold"> Libellée </span>
                    <InputText  class="p-inputtext-sm" v-model="cat.cat_label"/>
                </div>
            </div>

        </div>
        <template #footer>
            <Button label="Enregistrer" class="p-button-sm" icon="pi pi-check" @click="postCat" :loading="isLoading" />
        </template>
    </Dialog>
</template>

<script>
export default {
    props:['parent','visible'],

    watch:{
        visible(a){
            this.init()
        }
    },
    data(){
        return{
            cat:{
                cat_parent_id:-1,
            },
            cat_parent:[],
            
            isLoading:false,
            submitted:false
        }
    },
    methods:{
        init(){
            //

            this.cat = {
                cat_parent_id:-1
            }

            this.cat_parent = JSON.parse(JSON.stringify(this.parent))

            console.log(this.cat_parent)
            this.cat_parent.unshift({cat_id:-1,cat_label:"Aucune"})
        },

        async postCat(){
            this.isLoading = true
            this.submitted = true

            try {
                const _r = await this.$http.post('api/categorie_articles',this.cat)
                
                let _d = _r.data

                if(_d.status){
                    this.$emit('validate')
                }else{
                    this.showNotif(_d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de connexionoooo')
            }

            this.isLoading = false
        }
    },
    mounted(){
        this.init()
    }
}
</script>

<style>

</style>