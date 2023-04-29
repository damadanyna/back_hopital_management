<template>
    <div class="bg-dialog-box">


        <!-- Content Overlay -->
        <div class="border rounded-sm shadow-sm bg-white" :style="{width:'500px'}" >
            <div class="p-2 flex items-center">
                <span class="text-md font-bold border-b border-red-500"> Suppression d'un patient </span>
                <span class="flex-grow"></span>
                <button class="bt-s w-8 h-8 flex justify-center items-center" @click="$emit('close')"> <span class="material-icons"> clear</span> </button>
            </div>

            <div class="p-2">
                <div class="text-sm flex items-start">
                    <span class="material-icons text-4xl mr-2 text-red-500"> warning </span>
                    <div class="flex flex-col">
                        <span class="font-bold text-md"> Voulez vous vraiment supprimer ce patient ? </span>
                        <span class=""> La suppression de ce patient supprimera aussi les informations lui concernant dans le module prise en charge et dans le module caisse </span>
                    </div>
                </div>
            </div>
            <div class="p-2 flex">
                <span class="flex-grow"></span>
                <button class="bt-red-s" @click=" delPat "> 
                    <span class="material-icons mr-2 text-red-500"> gpp_maybe </span>
                    <span class="font-bold"> Oui </span>
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props:['u'],
    data(){
        return{
        }
    },
    methods:{
        async delPat(){
            try {
                const _r = await this.$http.delete('api/patient/'+this.u.pat_id)
                    let _d = _r.data
                if(_d.status){
                    this.$emit('validate')
                }else{
                    this.showNotif(_d.message)
                }
            } catch (e) {
                console.log(e)
                this.showNotif('Erreur de donnexion')

            }
        },
    },

    mounted(){
        // console.log(this.u)
    }
} 
</script>

<style>

</style>