<template>
    <!-- <div class="bg-dialog-box">
        <div class="border rounded-sm shadow-sm bg-white" >
            <div class="p-2 flex items-center">
                <span class="text-sm"> Ajout de société </span>
                <span class="flex-grow"></span>
                <button class="bt-s w-8 h-8 flex justify-center items-center" @click="$emit('close')"> <span class="material-icons"> clear </span> </button>
            </div>

            <div class="p-2">
                <div class="flex flex-col mb-2">
                    <div class="mb-2 flex">
                        <custom-input class="mr-2" v-model="ent.ent_code" label="Code"/>
                        <custom-input class="mr-2 w-56" v-model="ent.ent_label" label="Nom"/>
                    </div>

                    <div class="mb-2 flex">
                        <custom-input class="mr-2 " v-model="ent.ent_pat_percent" label="% Patient"/>
                        <custom-input class="mr-2" v-model="ent.ent_soc_percent" label="% Société"/>
                    </div>

                    <div class="mb-2 flex">
                        <custom-input class="mr-2 w-full" v-model="ent.ent_adresse" label="Adresse"/>
                        
                    </div>
                    <div class="mb-2 flex">
                        <custom-input class="mr-2 w-56" v-model="ent.ent_num_compte" label="Numéro de compte"/>
                    </div>
                </div>
                <div class="p-2 flex justify-end">
                    <button class="bt-p-s" @click="postEnt"> Ajouter </button>
                </div>
            </div>
        </div>
    </div> -->

    <Dialog :maximizable="true" :visible="visible" @update:visible=" ()=>{
            $emit('close') 
        } "  :modal="true" class="p-fluid p-dialog-sm" style="min-width:500px">
        <template #header>
            <span class="text-sm font-bold">Ajout de société</span>
        </template>
        <div class="w-full">
            <div class="mb-2 flex ">
                <!-- <custom-input class="mr-2" v-model="ent.ent_code" label="Code"/> -->
                <div class="flex flex-column" style="width:30%">
                    <span class="text-xs font-bold"> Code </span>
                    <InputText class="p-inputtext-sm " autofocus v-model="ent.ent_code"  />
                </div>
                <!-- <custom-input class="mr-2 w-56" v-model="ent.ent_label" label="Nom"/> -->
                <div class="flex flex-column flex-grow-1 ml-2">
                    <span class="text-xs font-bold"> Nom </span>
                    <InputText class="p-inputtext-sm " v-model="ent.ent_label"  />
                </div>
            </div>
            <div class="mb-2 flex">
                <!-- <custom-input class="mr-2 " v-model="ent.ent_pat_percent" label="% Patient"/> -->
                <div class="flex flex-column">
                    <span class="text-xs font-bold"> % Patient </span>
                    <InputNumber class="p-inputtext-sm " v-model="ent.ent_pat_percent"  />
                </div>
                <!-- <custom-input class="mr-2" v-model="ent.ent_soc_percent" label="% Société"/> -->
                <div class="flex flex-column flex-grow-1 ml-2">
                    <span class="text-xs font-bold"> % Société </span>
                    <InputNumber class="p-inputtext-sm " v-model="ent.ent_soc_percent"  />
                </div>
            </div>

            <div class="mb-2">
                <!-- <custom-input class="mr-2 " v-model="ent.ent_pat_percent" label="% Patient"/> -->
                <div class="flex flex-column">
                    <span class="text-xs font-bold"> Adresse </span>
                    <InputText class="p-inputtext-sm " v-model="ent.ent_adresse"  />
                </div>
            </div>
            <div class="mb-2">
                <!-- <custom-input class="mr-2" v-model="ent.ent_soc_percent" label="% Société"/> -->
                <div class="flex flex-column flex-grow-1">
                    <span class="text-xs font-bold"> Numéro de compte </span>
                    <InputText class="p-inputtext-sm " v-model="ent.ent_num_compte"  />
                </div>
            </div>
        </div>
        <template #footer>
            <Button label="Enregistrer" icon="pi pi-check" class="p-button-sm" @click="postEnt" />
        </template>
    </Dialog>
</template>
<script>
export default {
    props:['visible'],
    data(){
        return{
            ent:{},
        }
    },
    methods:{
        async postEnt(){
            try {
                const _r = await this.$http.post('api/entreprises',this.ent)
                let _d = _r.data

                if(_d.status){
                    this.$emit('validate')
                }else{
                    this.showNotif(_d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de Connexion')
            }
        },
    },
    mounted(){
    }
}
</script> 