<template>
    <div class="bg-dialog-box">


        <!-- Content Overlay -->
        <div class="border rounded-sm shadow-sm bg-white" >
            <div class="p-2 flex items-center">
                <span class="text-sm"> Gestion Tarif </span>
                <span class="flex-grow"></span>
                <button class="bt-s w-8 h-8 flex justify-center items-center" @click="$emit('close')"> <span class="material-icons"> clear </span> </button>
            </div>

            <div class="p-2">
                <div class="flex flex-col mb-2">
                    <div class="mb-2 flex">
                        <custom-input class="mr-2 w-56" v-model="tarif.tarif_label" label="Désignation"/>
                    </div>
                </div>
                <div class="p-2 flex justify-end">
                    <button class="bt-red-s" @click="delTarif"> Supprimer </button>
                    <span class="flex-grow"></span>
                    <button class="bt-p-s" @click="upTarif"> Enregistrer </button>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
export default {
    props:['t'],
    data(){
        return{
            tarif:{},
        }
    },
    methods:{
        async upTarif(){
            
            try {
                const _r = await this.$http.put('api/tarif',this.tarif)
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
        async delTarif(){
            try {
                const _r = await this.$http.delete('api/tarif/'+this.tarif.tarif_id)
                let _d = _r.data

                if(_d.status){
                    this.$emit('validate')
                }else{
                    this.showNotif(_d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de Connexion')
            }
        }
    },
    mounted(){
        this.tarif = this.t
        delete this.tarif.tarif_date_enreg
    }
}
</script> 