<template>
    <div class="">
        <div class="flex h-16 Z-30 p-2  bg-white items-center  sticky" style="top:58px;z-index:105">
            <div class="flex" v-if="!($store.state.user.util_type == 'ph')">
                <!-- <button @click="on_add_article = true " class="bt-p-s mr-2">
                    <span class="material-icons text-md"> add </span> 
                    <span class=""> Ajouter </span>
                </button> -->
                <Button label="Ajouter" class="p-button-sm" icon="pi pi-plus" @click="on_add_article = true "/>
                <!-- <button @click.stop="on_edit_article = true " v-if="list_selected.art_id" class="bt-p-s"> 
                    <span class="material-icons text-md mr-2"> edit </span>
                    <span class="text-md"> Modifier </span>
                </button> -->
                <Button label="Modifier" class="p-button-sm ml-2 p-button-raised p-button-text p-button-help" icon="pi pi-pencil" 
                v-if="list_selected.art_id" @click="on_edit_article = true "/>

                <Button label="Supprimer" class="p-button-sm ml-2 p-button-raised p-button-text p-button-danger" icon="pi pi-timex" 
                v-if="list_selected.art_id && (this.$store.state.user.util_type == 'mg' || inTypeUser(['m','a']))" @click="deleteArticle"/>
            </div>
            <span class="flex-grow-1"></span>
            <!-- <custom-input v-model="filters.search" label="Recherche ..." /> -->
            <Button label="Imprimer" class="p-button-sm mr-2 p-button-text" icon="pi pi-print" :loading="on_print" @click=" printArticle"/>
            <span class="p-input-icon-right">
                <i class="pi pi-search" />
                <InputText class="p-inputtext-sm" type="text" v-model="filters.search" placeholder="ex : PARACETAMOL" autofocus/>
            </span>
        </div>
        <div class="relative px-2">
            <table class="w-full">
                <thead class="" >
                    <tr class="text-left">
                        <th v-for="l in list_label" class="text-xs sticky" style="top:115px;" :key="l.key">
                            {{ l.label }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr @click=" ()=>{
                            list_selected = p
                        } " v-for="p in list_article" class="cursor-pointer"  :key="p.art_id">
                        <td :class="{'active-row':list_selected.art_id == p.art_id}"  class="text-xs" 
                        v-for="l in list_label" :key="l.key">
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
        <!-- add_article -->
        <add-article @validate=" ()=>{
                on_add_article = false
                this.getArticle()
            } " :visible="on_add_article"  @close="on_add_article = false" />

        <det-article :art="list_selected"  @validate=" ()=>{
            on_edit_article = false
            this.getArticle()
        } " :visible="on_edit_article" @close="on_edit_article = false" />
    </div>
</template>

<script>
export default {
    watch:{
        'filters.search'(){
            this.getArticle()
        }
    },
    data(){
        return{
            list_article:[],
            list_label:[
                {label:'Code',key:'art_code'},
                {label:'Désignation',key:'art_label'},
                {label:'Unité',key:'art_unite_stk'},
                {label:'Stock Total',key:'nb_stock_total'},
            ],

            on_add_article:false,
            list_depot:[],
            on_add_list_depot:false,
            on_edit_article:false,

            list_selected:{},
            filters:{
                search:'',
                limit:100
            },
            on_print:false
        }
    },

    methods:{
        async getArticle(){
            try {
                const _r = await this.$http.get('api/articles',{params:this.filters})

                let _d = _r.data
                if(_d.status){
                    this.list_article = _d.articles
                    this.list_depot = _d.list_depot

                    if(!this.on_add_list_depot){
                        for (let i = 0; i < this.list_depot.length; i++) {
                            this.list_label.push({label:`${this.list_depot[i].depot_label}`,key:`depot:${this.list_depot[i].depot_id}`})
                        }

                        this.on_add_list_depot = true
                    }
                }else{
                    this.showNotif('error','Liste Articles',_d.message)
                }
            } catch (e) {
                this.showNotifServerError()
            }
        },
        async deleteArticle(){
            try {
                const _r = await this.$http.delete('api/article/'+this.list_selected.art_id)

                let _d = _r.data
                if(_d.status){
                    this.getArticle()
                    this.list_selected = {}

                }else{
                    this.showNotif('error','Liste Articles',_d.message)
                }
            } catch (e) {
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
        },
        async printArticle(){
            this.on_print = true
            try {
                const r = await this.$http.get('api/article/print/all')
                let d = r.data

                if(d.status){
                    this.showNotif('success','Impression Articles','Article bien imprimés')
                   setTimeout(() => {
                    window.electronAPI.downFact(this.$http.defaults.baseURL+'/api/article/download')
                   }, 1000);

                    console.log(this.$http.defaults.baseURL+'/api/article/download')
                }else{
                    this.showNotif('error','Impression Articles',d.message)
                }
            } catch (e) {
                this.showNotifServerError()
            }

            this.on_print = false
        }
    },
    mounted(){
        this.getArticle()
    }

}
</script>