<template>
    <Dialog :maximizable="true" :visible="visible" @update:visible=" ()=>{
            $emit('close') 
        } "  :modal="true" class="p-fluid p-dialog-sm">
        <template #header>
            <span class="text-sm font-bold">Détails facture</span>
        </template>
        <div class="flex flex-column">
            <table class="">
                <thead class="" >
                    <tr class=" text-left">
                        <th v-for="l in list_label" class="p-2" :key="l.key">
                            {{ l.label }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="p in list_serv" class="cursor-pointer"  :key="p.encserv_id">
                        <td   class="" 
                        v-for="l in list_label" :key="l.key">

                            <div class="w-full flex justify-content-end" v-if="['encserv_montant'].indexOf(l.key) != -1">
                                <span class=""> {{  p[l.key].toLocaleString('fr-CA') }} </span>
                            </div>
                            <span class="" v-else > {{ (p[l.key])?p[l.key]:'-' }} </span>
                        </td>
                    </tr>
                    <tr class="font-bold">
                        <td class="" :colspan="(enc.enc_percent_tarif)?1:2">
                            Total
                        </td>
                        <td class="p-2 border flex justify-content-end text-right w-full" v-if="enc.enc_percent_tarif" >
                            <span class="font-bold"> {{ ( enc.enc_montant * enc.enc_percent_tarif / 100 ).toLocaleString('fr-CA') }} </span>
                            <span class="font-bold ml-2"> ({{ enc.enc_percent_tarif }} %) </span>
                        </td>
                        <td class=""> 
                            <div class="w-full flex justify-content-end" >
                                <span class=""> {{  enc.enc_montant.toLocaleString('fr-CA') }} </span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            
        </div>

        <template #footer>
            <Button label="Imprimer" icon="pi pi-print"  @click="printDetFactCaisse"
                class="p-button-help p-button-raised p-button-text p-button-sm" />
        </template>
    </Dialog>
</template>

<script>
export default {
    props:['enc','visible'],
    watch:{
        visible(a){
            if(a){
                this.getListEncserv()
            }
        }
    },
    data(){
        return{
            list_label:[
                {label:'Code',key:'service_code'},
                {label:'Désignation des actes',key:'service_label'},
                {label:'Montant',key:'encserv_montant'},
            ],
            list_serv:[]
        }
    },
    methods:{
        async getListEncserv(){
            try {
                const r = await this.$http.get('api/encaissement/det/'+this.enc.enc_id)
                let d = r.data
                if(d.status){
                    this.list_serv = d.list_serv
                } else{
                    this.showNotif('error','Détails encaissement',d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        },

        //Ajout vaovao daholo ireto an !
        async printDetFactCaisse(){
            try{

                const r = await this.$http.get(`api/encaissement/det/${this.enc.enc_id}/print`)
                let d = r.data

                if(d.status){
                    //Eto misy an'ilay visualisation an'ilay PDF,
                    //Ny tena grave zao dia ilay mi-créer anle PDF ho afficher-na


                    //Fa vita ihany 😊😊
                    this.showNotif('success','PDF Détails encaissement',d.message)
                    window.electronAPI.downFact(`${this.$http.defaults.baseURL}${d.link}`)
                }else{
                    this.showNotif(d.message)
                }
            } catch(e){
                this.showNotif('Erreur de connexion')
            }
        }
    },
    mounted(){
        
    }
}
</script> 