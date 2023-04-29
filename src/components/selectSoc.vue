<template>
    <!-- <div class="bg-dialog-box">
        <div class="border rounded-sm shadow-sm bg-white" >
            <div class="p-2 flex items-end">
                
                <div class="flex-grow flex ">
                    <custom-input v-model="filters.search" class="w-56" label="Rechercher un patient" />
                </div>
                <button class="bt-s w-8 h-8 flex justify-center items-center" @click="$emit('close')"> <span class="material-icons"> clear </span> </button>
            </div>

            <div class="h-96 overflow-auto">
                <div class="p-2 text-sm">
                    <table class="w-full">
                        <thead class="rounded-t sticky top-0 z-20" >
                            <tr class="bg-gray-50 text-gray-700 text-sm">

                                <th v-for="l in list_label" class="p-2 border text-xs  text-left" :key="l.key">
                                    <span class=""> {{ l.label }} </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr @dblclick=" ()=>{
                                $emit('validate',p)
                            } " @click=" ()=>{
                                    list_selected = p
                                } " class="cursor-pointer relative" v-for="p in list_pat" :key="p.pat_id">
                                <td
                                
                                :class="{'bg-indigo-600 bg-opacity-10':list_selected.pat_id == p.pat_id}" 
                                class="p-2 border text-xs relative items-center" v-for="l in list_label" :key="l.key">
                                    <span class=""> {{ p[l.key] }} </span>
                                    
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
                        $emit('validate',list_selected)
                    } "> Selectionner </button>
                </div>
            </div>
        </div>
    </div> -->

    <Dialog :maximizable="true" :visible="visible" @update:visible=" ()=>{
            $emit('close') 
        } "  :modal="true" class="p-fluid p-dialog-sm" style="width:400px;max-height:500px">
        <template #header>
            <!-- <span class="text-sm font-bold">SELECTION D'UN PATIENT</span> -->
            <div class="flex">
                <span class="p-input-icon-right">
                    <i class="pi pi-search" />
                    <InputText autofocus class="p-inputtext-sm" type="text" v-model="filters.search" placeholder="ex : Socolait"/>
                </span>
            </div>
        </template>
        <div class="flex flex-column">
            
            <table class="w-full">
                <thead class="" >
                    <tr class="">
                        <th v-for="l in list_label" class="text-left" :key="l.key">
                            <span class=""> {{ l.label }} </span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr @dblclick=" ()=>{
                        $emit('validate',p)
                    } " @click=" ()=>{
                            list_selected = p
                        } " class="cursor-pointer relative" v-for="p in list_soc" :key="p.ent_id">
                        <td
                        
                        :class="{'active-row':list_selected.ent_id == p.ent_id}" 
                        class="p-2 border text-xs relative items-center" v-for="l in list_label" :key="l.key">
                            <span class=""> {{ p[l.key] }} </span>
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
            if(!this.in_search){
                this.getList()
            }

            this.have_to_search = true
        }
    },
    data(){
        return{
            srvs:[],
            list_soc:[],
            list_label:[
                {label:"Code",key:'ent_code'},
                {label:"Nom",key:'ent_label'}
            ],
            list_selected:{},
            filters:{
                search:'',
                limit:100
            },
            in_search:false,
            have_to_search:false

        }
    },
    methods:{
        async getList(){
            this.in_search = true

            try {
                const _r = await this.$http.get('api/entreprises/out/search',{params:{by:'ent_label',search:this.filters.search}})
                let _d = _r.data

                if(_d.status){
                    this.list_soc = _d.ents
                    this.in_search = false
                    if(this.have_to_search){
                        this.getList()
                        this.have_to_search = false
                    }
                }else{
                    this.showNotif('error','Selection de Société',_d.message)
                }
            } catch (e) {
                this.showNotifServerError()
            }
        },
    },

    mounted(){
        this.getList()
    }
} 
</script>

<style>

</style>