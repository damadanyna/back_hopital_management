<template>
    <Dialog :maximizable="true" :visible="visible" @update:visible=" ()=>{
            $emit('close') 
        } "  :modal="true" class="p-fluid p-dialog-sm">
        <template #header>
            <span class="text-sm font-bold"> {{ (mvmt.mvmt_action == 'entre')?'Détails entrée':'Détails Sortie' }} </span>
        </template>
        <div class="flex" >
            <div class="border-1 flex flex-column border-200 p-2 border-round" >

                <div class="flex mb-2">
                    <div class="flex flex-column">
                        <span class="text-xs font-bold underline"> Numéro </span>
                        <span class=""> {{ mt.mvmt_num }} </span>
                    </div>

                    <div class="flex flex-column ml-2">
                        <span class="text-xs font-bold underline"> Type </span>
                        <span class=""> {{ (mt.mvmt_action == 'entre')?getTypeEntre(mt.mvmt_type):getTypeSortie(mt.mvmt_type) }} </span>
                    </div>
                </div>

                <div class="flex mb-2" v-if="mvmt.mvmt_action == 'sortie'">
                    <div class="flex flex-column">
                        <span class="text-xs font-bold underline"> Dépot de départ </span>
                        <span class=""> {{ mt.depot_exp }} </span>
                    </div>

                    <div class="flex flex-column ml-2">
                        <span class="text-xs font-bold underline"> Dépot de destination </span>
                        <span class=""> {{ (mt.mvmt_type == 'transfert')?mt.depot_dest:mt.dep_label }} </span>
                    </div>
                </div>

                <div class="flex mb-2" v-if="mvmt.mvmt_action == 'entre'">
                    <div class="flex flex-column">
                        <span class="text-xs font-bold underline"> Fournisseur </span>
                        <span class=""> {{ (mt.fourn_label)?mt.fourn_label:'-' }} </span>
                    </div>

                    <div class="flex flex-column ml-2">
                        <span class="text-xs font-bold underline"> Dépot </span>
                        <span class=""> {{ mt.depot_label }} </span>
                    </div>
                </div>

                
            </div>
            <Divider layout="vertical" />

            <div class="" style="min-width:500px">
                <table class="w-full">
                    <thead class="rounded-t sticky top-0 z-20" >
                        <tr class="bg-gray-50 text-gray-700 text-sm">

                            <th v-for="l in list_label" class="p-2 border text-xs text-left" :key="l.key">
                                {{ l.label }}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr @click=" ()=>{
                                list_selected = p
                            } " v-for="p in mt.mart" class="cursor-pointer relative"  :key="p.mart_id">
                            <td   class="p-2 border text-xs" 
                            v-for="l in list_label" :key="l.key">
                                <span class="" v-if=" l.key.split(':')[0] == 'dp'" >
                                    {{ getStockArt(l.key,p) }}
                                </span>
                                <span v-else > {{ p[l.key] }} </span>
                            </td>
                        </tr>

                    </tbody>
                </table>
            </div>
        </div>
        <template #footer>
            <Button label="Imprimer" @click="setPDFDetMvmt"  icon="pi pi-print" class="p-button-sm p-button-raised p-button-text p-button-help" />
        </template>
    </Dialog>
</template>

<script>
export default {
    props:['mvmt','visible'],
    watch:{
        visible(a){
            if(a){
                this.init()
                this.getDetails()
            }
        }
    },
    data(){
        return{
            isLoading:false,
            submitted:false,
            mt:{},

            list_label:[
                {label:"Code",key:"art_code"},
                {label:"Désignation",key:"art_label"},
                {label:"Quantité",key:"mart_qt"},
            ],
            depot:[]
        }
    },
    methods:{
        async getDetails(){
            try {
                const r = await this.$http.get(`api/mvmt/details/${this.mvmt.mvmt_id}`,{params:{action:this.mvmt.mvmt_action}})

                let d = r.data

                if(d.status){
                    this.mt = d.mvmt

                    //ajout des dépots
                    for (let i = 0; i < d.depot.length; i++) {
                        const e = d.depot[i];
                        this.list_label.push({label:e.depot_label,key:`dp:${e.depot_id}`})
                    }
                }else{
                    this.showNotif('error','Détails mouvement',d.message)
                }
            } catch (e) {
                console.error(e)
                this.showNotifServerError()
            }
        },
        getStockArt(k,mart){
            let depot_id = parseInt(k.split(':')[1])

            if(mart.mart_det_stock == null){
                return '-'
            }

            let stk = JSON.parse(mart.mart_det_stock)

            if(Array.isArray(stk)){
                if(stk.length == 0){
                    return '-'
                }else{
                    for (let i = 0; i < stk.length; i++) {
                        const e = stk[i];
                        if(e.depot_id == depot_id){
                            return e.stk_actuel
                        }
                    }
                    return '-'
                }
            }else{
                return '-'
            }
        },

        async setPDFDetMvmt(){
            try {
                const r = await this.$http.get(`api/mvmt/details/${this.mvmt.mvmt_id}/pdf`,{params:{action:this.mvmt.mvmt_action}})

                let d = r.data

                if(d.status){
                    window.electronAPI.downFact(`${this.$http.defaults.baseURL}/api/mvmt/details/pdf/down`)
                }else{
                    this.showNotif('error','PDF Détails mouvement',d.message)
                }
            } catch (e) {
                console.error(e)
                this.showNotifServerError()
            }
        },
        init(){
            this.mt = {}

            this.list_label = [
                {label:"Code",key:"art_code"},
                {label:"Désignation",key:"art_label"},
                {label:"Quantité",key:"mart_qt"},
            ]
            this.depot = []
        }
    },
    mounted(){
        
    }
}
</script>

<style>

</style>