<template>
    <Dialog :maximizable="true" :visible="visible" @update:visible=" ()=>{
            $emit('close') 
        } "  :modal="true" class="p-fluid p-dialog-sm" style="min-width:500px">
        <template #header>
            <span class="text-sm font-bold">AJOUT D'UN ARTICLE</span>
        </template>
        <div class="flex flex-column">
            <div class="flex flex-column ">
                <div class="flex align-items-center mb-2">
                    <span class="material-symbols-outlined mr-2"> info </span>
                    <span class="font-bold ">Informations article</span>
                </div>
                <div class="flex mb-3">
                    <!-- <c-select class="mr-2" :datas="parent_cat" label="cat_label" placeholder="Famille" code="cat_id" v-model="article.art_parent_cat_id" /> -->
                    <div class="flex flex-column">
                        <span class="font-bold text-sm"> Famille </span>
                        <Dropdown v-model="article.art_parent_cat_id" :options="parent_cat" optionLabel="cat_label" optionValue="cat_id" placeholder="--" class="p-inputtext-sm" />
                    </div>
                    <!-- <c-select class="mr-2"  :datas="sub_cat" label="cat_label" placeholder="Sous Famille" code="cat_id" v-model="article.art_cat_id" /> -->
                    <div class="flex flex-column ml-2">
                        <span class="font-bold text-sm">Sous Famille</span>
                        <Dropdown v-model="article.art_cat_id" :options="sub_cat" optionLabel="cat_label" optionValue="cat_id" placeholder="--" class="p-inputtext-sm" />
                    </div>

                    <div class="flex flex-column ml-2">
                        <span class="font-bold text-sm">Code article</span>
                        <InputText autofocus v-model="article.art_code" placeholder="ex : 0045" :class="{'p-invalid':submitted && !article.art_code}" class="p-inputtext-sm" />
                    </div>
                    
                </div>
                <div class="mb-3 flex">
                    <!-- <custom-input label="Code article" class="w-32 mr-2" v-model="article.art_code" /> -->
                    
                    <!-- <custom-input label="Désignation" class=" w-72 " v-model="article.art_label" /> -->
                    <div class="flex flex-column flex-grow-1">
                        <span class="font-bold text-sm">Désignation</span>
                        <InputText v-model="article.art_label" :class="{'p-invalid':submitted && !article.art_label}" placeholder="ex : PARACETAMOL" class="p-inputtext-sm" />
                    </div>
                </div>
                <div class="mb-3 flex">
                    <!-- <custom-input label="Unité de stock" class="w-32 mr-2" v-model="article.art_unite_stk" /> -->
                    <div class="flex flex-column" style="width:50%">
                        <span class="font-bold text-sm ">Unité de stock</span>
                        <InputText v-model="article.art_unite_stk" class="p-inputtext-sm" />
                    </div>
                    <!-- <custom-input label="Conditionnement" ex="Ex : 50/Car" class="w-32 mr-2" v-model="article.art_conditionnement" /> -->
                    <div class="flex flex-column flex-grow-1 ml-2">
                        <span class="font-bold text-sm">Unité de stock 2</span>
                        <InputText v-model="article.art_unite_stk2" class="p-inputtext-sm" />
                    </div>
                    
                </div>

                <!-- <div class="mb-3 flex">
                    
                    <div class="flex flex-column" style="width:50%">
                        <span class="font-bold text-sm">Conditionnement</span>
                        <InputText v-model="article.art_conditionnement" class="p-inputtext-sm" />
                    </div>

                    <div class="flex flex-column ml-2 flex-grow-1">
                        <span class="font-bold text-sm">Conditionnement 2</span>
                        <InputText v-model="article.art_conditionnement2" class="p-inputtext-sm" />
                    </div>

                </div> -->
                <div class="flex mb-3">
                    <!-- <div class="flex flex-column" style="width:30%">
                        <span class="font-bold text-sm">Nombre de boîte</span>
                        <InputText type="number" v-model="article.art_nb_box" class="p-inputtext-sm" />
                    </div> -->
                    <!-- <custom-input label="Emplacement" class="" v-model="article.art_emplacement" /> -->
                    <div class="flex flex-column flex-grow-1">
                        <span class="font-bold text-sm">Emplacement</span>
                        <InputText v-model="article.art_emplacement" class="p-inputtext-sm" />
                    </div>
                </div>
            </div>
            
            <div class="">
                <div class="flex align-items-center mb-2">
                    <span class="material-symbols-outlined  mr-2"> inventory </span>
                    <span class="font-bold ">Informations Stock</span>
                </div>

                <div>
                    <div class="mb-2" v-for="p,i in list_depot" :key="p.depot_id">
                        <div class="">
                            <span class="font-bold"> {{ p.depot_label }} </span>
                        </div>
                        <div class="flex ">
                            <!-- <custom-input type="number" class="mr-2" label="Stock Initial"  v-model="model_stk_depot[i].stk_initial" /> -->
                            <div class="flex flex-column">
                                <span class="font-bold text-sm">Stock Physique</span>
                                <InputText type="number" v-model="model_stk_depot[i].stk_initial" class="p-inputtext-sm" />
                            </div>
                            <!-- <custom-input type="number" class="mr-2" label="Stock Actuel" ex=" " v-model="model_stk_depot[i].stk_actuel" /> -->
                            <div class="flex flex-column ml-2">
                                <span class="font-bold text-sm">Stock Actuel</span>
                                <InputText disabled v-model="model_stk_depot[i].stk_actuel" class="p-inputtext-sm" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
        <template #footer >
            <Button label="Enregistrer" class="p-button-sm" icon="pi pi-check" @click="putArticle" :loading="isLoading" />
        </template>
    </Dialog>
</template>

<script>
export default {

    props:['art','visible'],
    watch:{
        'article.art_parent_cat_id'(a){
            this.getSubCat(a)
        },
        visible(a){
            if(a){
                this.getUtilsAdd()
            }
        },
        // 'article.art_conditionnement'(a){
        //     let c = parseInt(a) || 0
        //     let nb = parseInt(this.article.art_nb_box) || 0

        //     this.model_stk_depot[1].stk_actuel = c * nb

        //     console.log("qsdz");
        // },
        // 'article.art_nb_box'(a){
        //     let c = parseInt(a) || 0
        //     let nb = parseInt(this.article.art_conditionnement) || 0

        //     this.model_stk_depot[1].stk_actuel = c * nb

        //     console.log("qsdz");
        // }
    },
    data(){
        return{
            parent_cat:[],
            sub_cat:[],
            list_depot:[],
            article:{},
            model_stk_depot:[],
            stk_depot:{},

            isLoading:false,
            submitted:false,
        }
    },
    methods:{
        async getUtilsAdd(){
            try {
                const _r = await this.$http.get('api/articles/utils-add')

                let _d = _r.data

                if(_d.status){
                    this.parent_cat = _d.parent_cat
                    this.sub_cat = _d.sub_cat
                    this.list_depot = _d.list_depot

                    // this.article.art_parent_cat_id = (this.parent_cat[0])?this.parent_cat[0].cat_id:null
                    // this.article.art_cat_id = (this.sub_cat[0])?this.sub_cat[0].cat_id:null

                    this.article = JSON.parse(JSON.stringify(this.art))

                    if(this.article.g_stock.length > 0){
                        //initialisation des dépots initiales
                        for(let i = 0; i < this.article.g_stock.length; i++){
                            let tmp = this.article.g_stock[i]
                            this.model_stk_depot[i] = {stk_initial:tmp.stk_initial,stk_actuel:tmp.stk_actuel}
                        }
                    }else{
                        //initialisation des dépots initiales
                        for(let i = 0; i < this.list_depot.length; i++){
                            this.model_stk_depot[i] = {stk_initial:0,stk_actuel:0}
                        }
                    }
                }else{
                    this.showNotif(_d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        },
        async getSubCat(s){
            try {
                const _r = await this.$http.get('api/articles/sub-cat/'+s)

                let _d = _r.data

                if(_d.status){
                    this.sub_cat = _d.sub_cat
                    // this.article.art_cat_id = (this.sub_cat.length <= 0)?null:this.sub_cat[0].cat_id
                }else{
                    this.showNotif(_d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        },
        async putArticle(){
            try {
                const _r = await this.$http.put('api/article',{article:this.article,stock:this.model_stk_depot,list_depot:this.list_depot})
                let _d = _r.data

                if(_d.status){
                    this.$emit('validate')
                }else{
                    this.showNotif(_d.message)
                }

            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        },
    },
    mounted(){
    }
}
</script>

<style>

</style>