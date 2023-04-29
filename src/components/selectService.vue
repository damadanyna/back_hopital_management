<template>
    <!-- <div class="bg-dialog-box">
        <div class="border rounded-sm shadow-sm bg-white" >
            <div class="p-2 flex items-end">
                <div class="flex-grow flex ">
                    <custom-input v-model="filters.search" class="w-56" label="Rechercher un Service" />
                </div>
                <button class="bt-s w-8 h-8 flex justify-center items-center" @click="$emit('close')"> <span class="material-icons"> clear </span> </button>
            </div>

            <div class="h-96 overflow-auto">

                <div class="p-2 text-sm">
                    <table class="w-full">
                        <thead class="rounded-t sticky top-0 z-20" >
                            <tr class="bg-gray-50 text-gray-700 text-sm">

                                <th v-for="l in list_label" class="p-2 border text-xs  text-left" :key="l.key">
                                    <div class="flex items-center" v-if=" l.key.split(':')[1] == 'tarif' "> 
                                        <span class="">{{ l.label }}</span>
                                        <span class="flex-grow"></span>
                                    </div>
                                    <span class="" v-else> {{ l.label }} </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr @dblclick=" ()=>{
                                if(p.service_parent_id){
                                    $emit('validate',p)
                                }
                            } " @click=" ()=>{
                                    list_selected = p
                                } " class="cursor-pointer relative" v-for="p in srvs" :key="p.service_id">
                                <td
                                
                                :class="{'bg-indigo-600 bg-opacity-10':list_selected.service_id == p.service_id,'font-bold':!p.service_parent_id}" 
                                class="p-2 border text-xs relative items-center" v-for="l in list_label" :key="l.key">

                                    <div v-if="p.service_parent_id && l.key.split(':')[1] == 'tarif'" class="flex items-center">
                                        <span   class=""> {{ showTarif(p,l.key) }} </span>
                                        <span class="flex-grow"></span>
                                    </div>
                                    <span v-else > {{ p[l.key] }} </span>
                                    
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="p-2 flex justify-end">
                <span class="flex-grow"></span>  
                <div class="">
                    <button class="bt-p-s" @click=" ()=>{
                        if(list_selected.service_id && list_selected.service_parent_id){
                            $emit('validate',list_selected)
                        } 
                    } "> Selectionner </button>
                </div>
            </div>
        </div>
    </div> -->

    <Dialog :maximizable="true" :visible="visible" @update:visible=" ()=>{
            $emit('close') 
        } "  :modal="true" class="p-fluid p-dialog-sm" style="width:800px">
        <template #header>
            <!-- <span class="text-sm font-bold">SELECTION D'UN PATIENT</span> -->
            <div class="flex">
                <span class="p-input-icon-right">
                    <i class="pi pi-search" />
                    <InputText autofocus class="p-inputtext-sm" type="text" v-model="filters.search" placeholder="Rechercher un Service"/>
                </span>
            </div>
        </template>
        <div class="flex flex-column">
            
            <table class="w-full text-xs">
                <thead class="" >
                    <tr class="">

                        <th v-for="l in list_label" class="text-left" :key="l.key" style="top:0;z-index:50">
                            <div class="flex items-align-center" v-if=" l.key.split(':')[1] == 'tarif' "> 
                                <span class="">{{ l.label }}</span>
                                <span class="flex-grow-1"></span>
                            </div>
                            <span class="" v-else> {{ l.label }} </span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr @dblclick=" ()=>{
                        if(p.service_parent_id){
                            $emit('validate',p)
                        }
                    } " @click=" ()=>{
                            list_selected = p
                        } " class="cursor-pointer relative" v-for="p in srvs" :key="p.service_id">
                        <td
                        
                        :class="{'active-row':list_selected.service_id == p.service_id,'font-bold':!p.service_parent_id}" 
                        class="relative items-align-center" v-for="l in list_label" :key="l.key">

                            <div v-if="p.service_parent_id && l.key.split(':')[1] == 'tarif'" class="flex items-center">
                                <span   class=""> {{ showTarif(p,l.key) }} </span>
                                <span class="flex-grow"></span>
                            </div>
                            <span v-else > {{ p[l.key] }} </span>
                            
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <template #footer>
            <div class="pt-2">
                <Button label="Selectionner" class="p-button-sm" icon="pi pi-check" @click=" ()=>{
                        $emit('validate',list_selected)
                    } " />
            </div>
            <!-- <button class="bt-p-s" @click=" ()=>{
                        $emit('validate',list_selected)
                    } "> Selectionner </button> -->
        </template>
    </Dialog>
</template>

<script>
export default {
    props:['visible'],
    watch:{
        'filters.search'(a){
            this.getList()
        }
    },
    data(){
        return{
            srvs:[],
            list_tarif:[],
            list_label:[
                {label:"Code",key:'service_code'},
                {label:"Désignation",key:'service_label'}
            ],
            list_selected:{},
            cell:{
                edit:false,
                content:''
            },
            tserv:{},
            filters:{
                search:''
            }

        }
    },
    methods:{
        async getList(){

            //Averina affecter-na ny list_lable fa raha tsy izay misy redondance
            // this.list_label = [
            //     {label:"Code",key:'service_code'},
            //     {label:"Désignation",key:'service_label'}
            // ]

            try {
                const _r = await this.$http.get('api/services',{params:this.filters})
                let _d = _r.data

                if(_d.status){
                    this.srvs = _d.srvs
                    this.list_tarif = _d.list_tarif

                    if(this.list_label.length  == 2){
                        for (let i = 0; i < this.list_tarif.length; i++) {
                            this.list_label.push({label:this.list_tarif[i].tarif_label,key:`${i}:tarif`})
                        }
                    }
                }else{
                    this.showNotif(_d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        },
        
        showTarif(p,k){
            let _id = parseInt(k.split((':'))[0])
            return `${p.tarifs[_id].tserv_prix}`
        }
    },

    mounted(){
        this.getList()
    }
} 
</script>

<style>

</style>