<template>
    <Dialog :maximizable="true" :visible="visible" @update:visible=" ()=>{
            $emit('close') 
        } "  :modal="true" class="p-fluid p-dialog-sm">
        <template #header>
            <span class="text-sm font-bold"> AJOUTER UN ARTICLE </span>
        </template>

        <div class="flex flex-column">
            <div class="flex align-items-end w-full mb-2">
                <div class="flex flex-column flex-grow-1 ">
                    <span class="text-xs font-bold"> Article </span>
                    <!-- <Dropdown v-model="a_selected" class="p-inputtext-sm" :options="art_search" optionLabel="art_label" @change=" onSelected " :editable="true"/> -->
                    <InputText v-model="a_selected.art_label" class="p-inputtext-sm" @click=" on_select_med = true " />
                </div>
                <div class="flex flex-column text-xs ml-2">
                    <span class="text-xs font-bold">Unité</span>
                    <span class="p-2 border-1 border-200 border-round" > {{ (a_selected.art_unite_stk)?a_selected.art_unite_stk:'--' }} </span>
                </div>
            </div>

            <div class="flex mb-2">
                <!-- <custom-input type="number" class="w-24 mr-2" v-model="mart.mart_qt" label="Qté"  /> -->
                <div class="flex flex-column">
                    <span class="text-xs font-bold"> Quantité </span>
                    <InputNumber inputId="integeronly" class="p-inputtext-sm" v-model="mart.mart_qt" />
                </div>
                <!-- <custom-input type="number" class="w-48" v-model="mart.mart_prix_unit" label="P-U (Ar)"  /> -->
                <div class="flex flex-column ml-2">
                    <span class="text-xs font-bold"> Prix Unitaire (Ar) </span>
                    <InputNumber inputId="integeronly" prefix="Ar " class="p-inputtext-sm" v-model="mart.mart_prix_unit" />
                </div>
                <!-- <div class="flex flex-col text-xs ml-2">
                    <span class="text-xs font-bold">Montant</span>
                    <span class="p-2 border rounded"> {{  mart.mart_montant  }} </span>
                </div> -->
                <div class="flex flex-column ml-2">
                    <span class="text-xs font-bold"> Montant </span>
                    <InputNumber inputId="integeronly" suffix=" Ar" class="p-inputtext-sm" v-model="mart.mart_montant" disabled />
                </div>
            </div>

            <Divider />

            <div class="flex flex-column">
                <span class=""> {{ (mvmt.mvmt_action == 'entre')?getTypeEntre(mvmt.mvmt_type):getTypeSortie(mvmt.mvmt_type) }} (Reste)</span>
                <div class="flex">
                    <div class="border-1 p-2 border-200 flex flex-column" :class="{'border-blue-500':mvmt.mvmt_depot_exp == s.depot_id 
                    || mvmt.mvmt_action == 'entre' && mvmt.mvmt_depot_dest == s.depot_id}" 
                    v-for="s in list_depot" :key="s.depot_id">
                        <span class="text-sm font-bold"> {{ s.depot_label }} </span>
                        <span class=""> {{ restStock(s.depot_id) }} </span>
                    </div>
                </div>
            </div>
        </div>
        <template #footer>
            <Button label="Valider" class="p-button-sm" icon="pi pi-check"  @click="setMart"  /> 
        </template>
        
        <select-med :visible="on_select_med" @close="on_select_med = false" @selected="setMed" />
    </Dialog>
</template>

<script>
export default {
    props:['mart_list','visible','mvmt'],
    watch:{
        search(a){
            this.searchArtByLabel()
        },
        'mart.mart_qt'(a){
            this.mart.mart_montant = a * this.mart.mart_prix_unit

        },
        'mart.mart_prix_unit'(a){
            this.mart.mart_montant = a * this.mart.mart_qt
        },
        visible(a){
            if(a){
                this.mart = {
                    mart_montant:0,
                    mart_qt:0,
                    mart_prix_unit:0
                }

                if(this.mvmt.mvmt_action == 'entre'){
                    this.mvmt.mvmt_depot_exp = -1
                }
            }
        }
    },
    data(){
        return{
            mart:{
                mart_montant:0,
                mart_qt:0,
                mart_prix_unit:0
            },
            on_search_art:false,
            a_selected:'',
            art_search:[],
            search:'',
            on_select_med:false,
            list_depot:[]
        }
    },
    methods:{
        setMart(){
            if(!this.mart.mart_art_id){
                this.showNotif('error',`Ajout article`,`L'article est vide`)
                return
            }
            this.$emit('validate',this.mart)
        },
        async searchArtByLabel(){
            try {
                const _r = await this.$http.get('api/articles/search',{params:{
                    id_not_in:this.mart_list.map(x => x.mart_art_id),
                    search:this.search
                }})

                let _d = _r.data

                if(_d.status){
                    this.art_search = _d.articles
                }else{
                    this.showNotif('error',`Ajout article`,_d.message)
                }
            } catch (e) {
                this.showNotifServerError()
            }
        },
        onSelected(a){
            this.mart.mart_art_id = this.a_selected.art_id
            this.mart.mart_art_unit = this.a_selected.art_unite_stk
            this.mart.mart_art_label = this.a_selected.art_label
        },
        setMed(a,b){
            this.a_selected = a
            this.on_select_med = false


            this.mart.mart_art_id = this.a_selected.art_id
            this.mart.mart_art_unit = this.a_selected.art_unite_stk
            this.mart.mart_art_label = this.a_selected.art_label

            //console.log(a.g_stock)


            //b : c'est la liste de dépot
            this.list_depot = b
        },
        restStock(dp_id){
            let g = this.a_selected.g_stock
            //if(this.mvmt.mvmt_action == 'sortie'){
                if(g.length <= 0){

                    //On regarde les types de sorties
                    //si transfert
                    if(this.mvmt.mvmt_type == 'transfert'){
                        if(dp_id == this.mvmt.mvmt_depot_exp){
                            return 0 - this.mart.mart_qt
                        }else{
                            return this.mart.mart_qt
                        }
                    }else{
                        if(dp_id == this.mvmt.mvmt_depot_exp){
                            return 0 - this.mart.mart_qt
                        }else if(dp_id == this.mvmt.mvmt_depot_dest){
                            if(this.mvmt.mvmt_action == 'entre') return this.mart.mart_qt
                            return 0
                        }
                    }
                    
                }else{
                    for (let i = 0; i < g.length; i++) {
                        const e = g[i];

                        if(e.depot_id == dp_id){
                            if(this.mvmt.mvmt_type == 'transfert'){
                                if(dp_id == this.mvmt.mvmt_depot_exp){
                                    return parseInt(e.stk_actuel) - this.mart.mart_qt
                                }else{
                                    return parseInt(e.stk_actuel) + this.mart.mart_qt
                                }
                            }else{
                                if(dp_id == this.mvmt.mvmt_depot_exp){
                                    return parseInt(e.stk_actuel) - this.mart.mart_qt
                                }else if(dp_id == this.mvmt.mvmt_depot_dest){
                                    if(this.mvmt.mvmt_action == 'entre') return parseInt(e.stk_actuel) + this.mart.mart_qt
                                    return parseInt(e.stk_actuel)
                                }
                            }
                            
                        }
                    }
                }
            //}
        }
    },
    mounted(){
        this.searchArtByLabel()
    }
}
</script>

<style>

</style>