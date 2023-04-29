<template>
    <!-- <div class="bg-dialog-box">
        <div class="border rounded-sm shadow-sm bg-white" >
            <div class="p-2 flex items-center">
                <span class="text-sm"> Détails fournisseur </span>
                <span class="flex-grow"></span>
                <button class="bt-s w-8 h-8 flex justify-center items-center" @click="$emit('close')"> <span class="material-icons"> clear </span> </button>
            </div>

            <div class="p-2">
                <div class="flex mb-2">
                    <custom-input class="mr-2" v-model="fourn.fourn_code" label="Code" />
                    <custom-input class="mr-2" v-model="fourn.fourn_label" label="Nom du fournisseur" />
                </div>
                <div class="mb-2">
                    <div class="flex flex-col">
                        <label for="" class="text-xs text-indigo-600 font-bold">Adresse</label>
                        <textarea v-model="fourn.fourn_adresse" class="input-alt text-xs" placeholder="Adresse"></textarea>
                    </div>
                </div>
                <div class="flex mb-2">
                    <custom-input class="mr-2" v-model="fourn.fourn_nif" label="N° Nif" />
                    <custom-input class="mr-2" v-model="fourn.fourn_stat" label="N° Stat" />
                </div>

                <div class="mb-2">
                    <div class="flex flex-col">
                        <label for="" class="text-xs text-indigo-600 font-bold">Infos</label>
                        <textarea v-model="fourn.fourn_info" class="input-alt text-xs" placeholder="Infos"></textarea>
                    </div>
                </div>
                <div class="mb-2">
                    <div class="flex items-center py-2">
                        <input type="checkbox" class="mr-2" :checked="fourn.fourn_tva" v-model="fourn.fourn_tva" id="fourn_tva" >
                        <label for="fourn_tva" class="text-xs"> TVA Automatique </label>
                    </div>
                </div>
                <div class="py-2 flex justify-end">
                    <button class="bt-red-s"  @click="delFourn"> Supprimer </button>
                    <span class="flex-grow"></span>
                    <button class="bt-p-s" @click="updateFourn"> Enregistrer </button>
                </div>
            </div>
        </div>
    </div> -->
    <Dialog :maximizable="true" :visible="visible" @update:visible=" ()=>{
            $emit('close') 
        } "  :modal="true" class="p-fluid p-dialog-sm">
        <template #header>
            <span class="text-sm font-bold">AJOUT D'UN FOURNISSEUR</span>
        </template>
        <div class="">
            <div class="flex mb-2">
                <!-- <custom-input class="mr-2" v-model="fourn.fourn_code" label="Code" /> -->
                <div class="mr-2" style="width:30%">
                    <span class="text-xs font-bold"> Code * </span>
                    <InputText class="p-inputtext-sm " :class="{'p-invalid':submitted && !fourn.fourn_code}" autofocus v-model="fourn.fourn_code"  />
                </div>
                <!-- <custom-input class="mr-2" v-model="fourn.fourn_label" label="Nom du fournisseur" /> -->
                <div class="mr-2 flex-grow-1">
                    <span class="text-xs font-bold"> Nom du fournisseur * </span>
                    <InputText class="p-inputtext-sm " :class="{'p-invalid':submitted && !fourn.fourn_label}" v-model="fourn.fourn_label"  />
                </div>
            </div>

            <div class="mb-2">
                <!-- <div class="flex flex-col">
                    <label for="" class="text-xs text-indigo-600 font-bold">Adresse</label>
                    <textarea v-model="fourn.fourn_adresse" class="input-alt text-xs" placeholder="Adresse"></textarea>
                </div> -->
                <div class="mr-2">
                    <span class="text-xs font-bold"> Adresse </span>
                    <InputText class="p-inputtext-sm " v-model="fourn.fourn_adresse"  />
                </div>
            </div>

            <div class="flex mb-2">
                <!-- <custom-input class="mr-2" v-model="fourn.fourn_nif" label="N° Nif" /> -->
                <div class="mr-2 flex-grow-1">
                    <span class="text-xs font-bold"> N° Nif </span>
                    <InputText class="p-inputtext-sm " v-model="fourn.fourn_nif"  />
                </div>
                <!-- <custom-input class="mr-2" v-model="fourn.fourn_stat" label="N° Stat" /> -->
                <div class="mr-2 flex-grow-1">
                    <span class="text-xs font-bold"> N° Stat </span>
                    <InputText class="p-inputtext-sm " v-model="fourn.fourn_stat"  />
                </div>
            </div>

            <div class="mb-2">
                <!-- <div class="flex flex-col">
                    <label for="" class="text-xs text-indigo-600 font-bold">Infos</label>
                    <textarea v-model="fourn.fourn_info" class="input-alt text-xs" placeholder="Infos"></textarea>
                </div> -->
                <div class="mr-2">
                    <span class="text-xs font-bold"> Infos </span>
                    <InputText class="p-inputtext-sm " v-model="fourn.fourn_info"  />
                </div>
            </div>

            <div class="mb-2 mt-5">
                <!-- <div class="flex items-center py-2">
                    <input type="checkbox" class="mr-2" :checked="fourn.fourn_tva" v-model="fourn.fourn_tva" id="fourn_tva" >
                    <label for="fourn_tva" class="text-xs"> TVA Automatique </label>
                </div> -->
                <div class="field-checkbox text-sm">
                    <Checkbox inputId="binary" v-model="fourn.fourn_tva" :binary="true" />
                    <label for="binary">TVA Automatique</label>
                </div>
            </div>


        </div>
        <template #footer>
            <div class="flex">
                <div>
                    <span class="text-xs"> * : Obligatoire</span>
                </div>
                <span class="flex-grow-1"></span>
                <div class="">
                    <Button class="p-button-sm p-button-danger p-button-raised p-button-text mr-2" icon="pi pi-times" @click="delFourn" label="Supprimer"/> 
                    <Button label="Enregistrer" class="p-button-sm" icon="pi pi-check" @click="updateFourn" :loading="isLoading" />
                </div>
            </div>
            <!-- <Button label="Enregistrer" class="p-button-sm" icon="pi pi-check" @click="addPatient"  :loading="isLoading" /> -->
        </template>
    </Dialog>
</template>

<script>
export default {
    props:['f','visible'],
    watch:{
        visible(a){
            if(a){
                this.fourn  = JSON.parse(JSON.stringify(this.f))
            }
        }
    },
    data(){
        return{
            fourn:{},
            isLoading:false,
            submitted:false
        }
    },
    methods:{
        async updateFourn(){

            delete this.fourn.fourn_date_enreg

            this.isLoading = true
            this.submitted = true

            try {
                const _r = await this.$http.put('api/fournisseur',this.fourn)

                let _d = _r.data

                if(_d.status){
                    this.$emit('validate')
                }else{
                    this.showNotif(_d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }

            this.isLoading = false
        },

        async delFourn(){
            try {
                const _r = await this.$http.delete('api/fournisseur/'+this.fourn.fourn_id)
                let _d = _r.data

                if(_d.status){
                    this.$emit('del')
                }else{
                    this.showNotif(_d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        }
    },
    mounted(){
        
    }
}
</script>

<style>

</style>