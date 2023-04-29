<template>
    <Dialog :maximizable="true" :visible="visible" @update:visible=" ()=>{
            $emit('close') 
        } "  :modal="true" class="p-fluid p-dialog-sm" style="width: 700px;">
        <template #header>
            <span class="text-sm font-bold"> SORTIE MEDICAMENTS ENCAISSEMENT </span>
        </template>
        <div class="flex flex-column w-full">
            <div class="flex ">
                <Calendar placeholder="ex : 09/09/1998" v-model="filters.date"  dateFormat="dd/mm/yy" class="p-inputtext-sm"  />
            </div>

            <Divider/>

            <!-- ----- -->
            <div class="flex flex-column">
                <div class="" v-if="!on_view_med">
                    
                    <div @click=" ()=>{
                        enc_selected = lp
                        on_view_med = true
                    } "  class="p-2 cursor-pointer border-1 border-gray-400 mb-2 flex"

                     v-for="lp in list_pat" :key="lp.pat_id">
                        <div class="flex flex-column">
                            <span class="underline"> {{ (lp.enc_is_externe)?lp.enc_pat_externe:lp.pat_nom_et_prenom }} </span>
                            <span class="text-xs font-bold text-gray-400"> {{ ((new Date(lp.enc_date_validation)).getFullYear().toString().substr(2))+'/'+lp.enc_num_mvmt.toString().padStart(5,'0') }} </span>
                        </div>
                        <span class="flex-grow-1"></span>

                        <span class=" text-xs" :class="{'text-blue-500 font-bold':lp.em_validate,'text-gray-400':!lp.em_validate}"> {{ (lp.em_validate)?'Réçu':'Pas encore réçu' }} </span>
                    </div>

                </div>
                <div class="w-full" v-else>
                    
                    <table class="w-full">
                        <thead class="" >
                            <tr class=" text-left">
                                <th v-for="l in list_label" class="p-2" :key="l.key">
                                    {{ l.label }}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="p in list_med" class="cursor-pointer"  :key="p.art_id">
                                <td   class="" 
                                v-for="l in list_label" :key="l.key">
                                    <span class="" > {{ (p[l.key])?p[l.key]:'-' }} </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                </div>
            </div>
        </div>
        <template #footer>
            
            <Button v-if="on_view_med" label="Retour" class="p-button-sm p-button-raised p-button-text p-button-danger"
                    @click=" on_view_med = false "/>

            <Button @click="validateEncMvmt" v-if="on_view_med" :disabled=" enc_selected.em_validate " label="Effectuer" class="p-button-sm ml-5"
                    />

        </template>
    </Dialog>
</template>


<script>
export default {
    props:['visible'],
    watch:{
        visible(a){
            if(a){
                this.init()
            }
        },
        on_view_med(a){
            if(a){
                this.getListMed()
            }
        }   
    },
    data(){
        return{
            on_view_med:false,
            filters:{
                date:new Date()
            },

            list_pat:[],
            enc_selected:{},
            list_med:[],
            list_label:[
                {label:'Code',key:'art_code'},
                {label:'Désignation des actes',key:'art_label'},
                {label:'Quantité',key:'encserv_qt'},
            ],
        }
    },
    methods:{
        async getListPat(){
            try{
                const _r = await this.$http.get('api/mvmt/encmvmt/pat',{params:{filters:this.filters}})
                let _d = _r.data

                if(_d.status){
                    this.list_pat = _d.list_pat
                }else{
                    this.showNotif('error',`Détails -`,_d.message)
                }
            }catch(e){
                this.showNotifServerError()
            }
        },
        async getListMed(){
            try{
                const _r = await this.$http.get('api/mvmt/encmvmt/list-med',{params:{enc_id:this.enc_selected.enc_id}})
                let _d = _r.data

                if(_d.status){
                    this.list_med = _d.list_med
                }else{
                    this.showNotif('error',`Détails -`,_d.message)
                }
            }catch(e){
                this.showNotifServerError()
            }
        },

        async validateEncMvmt(){
            try{
                const _r = await this.$http.get('api/mvmt/encmvmt/validate',{params:{
                    enc_id:this.enc_selected.enc_id,
                    util_id:this.getUserId()
                }})
                let _d = _r.data

                if(_d.status){
                   this.enc_selected = {}
                   this.on_view_med = false
                   this.getListPat()

                   this.showNotif('success',`Création de Mouvement de sortie`,`Sortie de médicaments bien effectué`)

                   this.$emit('change')
                }else{
                    this.showNotif('error',`Détails -`,_d.message)
                }
            }catch(e){
                this.showNotifServerError()
            }
        },
        init(){
            this.getListPat()
            this.on_view_med = false
            this.enc_selected = {}
        }
    },
    mounted(){
        
    }
}
</script>

<style>

</style>