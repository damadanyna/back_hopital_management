<template>
    <Dialog :maximizable="true" :visible="visible" @update:visible=" ()=>{
            $emit('close') 
        } "  :modal="true" class="p-fluid p-dialog-sm" style="width:800px">
        <template #header>
            <!-- <span class="text-sm font-bold">SELECTION D'UN PATIENT</span> -->
            <div class="flex">
                <span class="p-input-icon-right">
                    <i class="pi pi-search" />
                    <InputText autofocus class="p-inputtext-sm" type="text" v-model="filters.search" placeholder="Rechercher un produit"/>
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
                        $emit('selected',p,depot)
                    } " @click=" ()=>{
                            list_selected = p
                        } " class="cursor-pointer relative" v-for="p in articles" :key="p.art_id">
                        <td
                        
                        :class="{'active-row':list_selected.art_id == p.art_id}" 
                        class="relative items-align-center" v-for="l in list_label" :key="l.key">
                            
                            <span class="" v-if="l.key == 'nb_stock_total'"> 
                                {{ stock_total(p.g_stock) }}    
                            </span>

                            <span class="" v-else-if="l.key.split(':')[0] == 'depot'"> 
                                {{ check_depot_stock(p.g_stock,l.key) }}
                            </span>
                            <span class="" v-else> {{ p[l.key] }} </span>
                            
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <template #footer>
            <div class="pt-2">
                <Button label="Selectionner" class="p-button-sm" icon="pi pi-check" @click=" ()=>{
                        $emit('selected',list_selected,depot)
                    } " />
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
                this.getMed()
            }
        },
        'filters.search'(a){
            this.getMed()
        }
    },
    data(){
        return{
            list_selected:{},
            filters:{
                search:'',
                limit:100
            },
            list_label:[
                {label:"Code",key:'art_code'},
                {label:"Désignation",key:'art_label'},
                {label:'Nb. boîte',key:'art_nb_box'},
                {label:'Stock Total',key:'nb_stock_total'},
            ],

            articles:[],
            depot:[],
            on_add_list_depot:false
        }
    },
    methods:{
        async getMed(){
            try {
                const r = await this.$http.get('api/articles',{params:this.filters})
                let d = r.data

                if(d.status){
                    this.articles = d.articles
                    this.depot = d.list_depot

                    if(!this.on_add_list_depot){
                        for (let i = 0; i < this.depot.length; i++) {
                            this.list_label.push({label:`${this.depot[i].depot_label}`,key:`depot:${this.depot[i].depot_id}`})
                        }

                        this.on_add_list_depot = true
                    }
                }else{
                    this.showNotif('error','Récupération des données',d.message)
                }

            } catch (e) {
                console.log(e)
                this.showNotifServerError()
            }
        },
        stock_total(p){
            let s = 0
            for(let i = 0;i<p.length;i++){
                let tmp = p[i]
                
                s += parseInt(tmp.stk_actuel)
            }
            return s
        },
        check_depot_stock(p,l){
            let r = parseInt(l.split(':')[1])
            
            for (let i = 0; i < p.length; i++) {
                const e = p[i];
                if(e.stk_depot_id == r){
                    return e.stk_actuel
                }
            }

            return 0
        }
    }
}
</script>