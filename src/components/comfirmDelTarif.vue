<template>
    <div class="bg-dialog-box">


        <!-- Content Overlay -->
        <div class="border rounded-sm shadow-sm bg-white" >
            <div class="p-2 flex items-center">
                <span class="text-sm"> Modification de prix </span>
                <span class="flex-grow"></span>
                <button class="bt-s w-8 h-8 flex justify-center items-center" @click="$emit('close')"> <span class="material-icons text-sm">clear</span> </button>
            </div>

            <div class="p-2">
                <div class="flex mb-2">
                    <div class="flex flex-col mr-2 border rounded p-1">
                        <span class="text-sm"> Service </span>
                        <span class="text-gray-500"> {{ tserv.service_label }} </span>
                    </div>
                    <div class="flex flex-col mr-2 border rounded p-1">
                        <span class="text-sm"> Tarif </span>
                        <span class="text-gray-500"> {{ tserv.tarif_label }} </span>
                    </div>
                </div>  
                <div class="pr-2">
                    <custom-input v-model="tserv.tserv_prix" type="number" label="Prix ..." />
                </div>  
                <div class="p-2 flex justify-end">
                    <button class="bt-p-s" @click="modifPrix"> Modifier </button>
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
            
        }
    },
    methods:{

    },

    mounted(){
    }
} 
</script>

<style>

</style>