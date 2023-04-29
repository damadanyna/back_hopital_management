<template>
    <div class="text-sm">
        <div class="p-2 flex border-bottom-2  border-200 bg-white sticky " style="top:60px;z-index:105">
            <!-- <button class="flex justify-center items-center bt-p-s" @click="on_add_service = true">
                <span class="material-icons mr-2"> add </span>
                <span class=""> Ajouter </span>
            </button> -->
            <Button label="Ajouter" icon="pi pi-plus" class="p-button-sm" @click="on_add_service = true" />
            <!-- <button v-if="list_selected.service_id" class="flex justify-center items-center bt-p-s ml-2" @click="()=>{
                    on_add_service = true
                    on_modif_service = true
                }  "> Modifier </button> -->

            <Button v-if="list_selected.service_id" label="Modifier" icon="pi pi-pencil" class="p-button-sm p-button-text p-button-raised p-button-help ml-2" @click="()=>{
                    on_add_service = true
                    on_modif_service = true
                }"  />

            <Button v-if="list_selected.service_id" label="Supprimer" icon="pi pi-times" class="p-button-sm p-button-text p-button-raised p-button-danger ml-2" @click="delService" />
            <span class="flex-grow-1"></span>
            <!-- <button class="flex justify-center items-center bt-p-s ml-2" @click="on_add_tarif = true">
                <span class="material-icons mr-2"> add </span>
                <span class=""> Ajouter Tarif </span>
            </button> -->

            <Button label="Ajouter Tarif" class="p-button-sm p-button-help" icon="pi pi-plus" @click="on_add_tarif = true" />
        </div>
        <!-- ici la liste des services avec les tarifs -->
        <div  class="mt-5 px-2">
            
            <table class="w-full">
                <thead class="" >
                    <tr class="bg-gray-50 text-gray-700 text-sm">
                        <th v-for="l in list_label" class="p-2 border text-xs  text-left sticky"  style="top:115px;z-index:105" :key="l.key">
                            <div class="flex align-items-center" v-if=" l.key.split(':')[1] == 'tarif' "> 
                                <span class="">{{ l.label }}</span>
                                <!-- <button class="" @click="delTarif(l.key)"> X </button> -->
                            </div>
                            <span class="" v-else> {{ l.label }} </span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr @click=" ()=>{
                            list_selected = p
                        } " class="cursor-pointer relative" v-for="p,i in srvs" :key="p.service_id">
                        <td
                        
                        :class="{'active-row':list_selected.service_id == p.service_id,'font-bold':!p.service_parent_id}" 
                        class="p-2 border text-xs relative items-center" v-for="l in list_label" :key="l.key">

                            <div v-if="p.service_parent_id && l.key.split(':')[1] == 'tarif'" class="flex items-center">
                                <span @click=" showEditTarif($event,{
                                        tserv_tarif_id:list_tarif[parseInt(l.key.split(':')[0])].tarif_id,
                                        tserv_service_id:p.service_id,
                                        tserv_is_product:0
                                    },p,parseInt(l.key.split(':')[0]),i) " 
                                    :class="{'border-red-500':tarif_index == parseInt(l.key.split(':')[0])  && service_index == i}"  
                                    class="p-1 border-1 border-round bg-white border-200"> {{ (showTarif(p,l.key)).toString().toLocaleString('fr-CA') }} </span>
                                <!-- <span class="flex-grow"></span>
                                <button class="flex justify-center items-center border ml-2 rounded p-1" @click=" ()=>{
                                    tserv = {
                                        tserv_tarif_id:list_tarif[parseInt(l.key.split(':')[0])].tarif_id,
                                        tserv_service_id:p.service_id,
                                        tserv_is_product:0
                                    }
                                    on_modif_tarif = true
                                } " > <span class="material-icons text-xs"> edit </span> </button> -->
                                
                            </div>
                            <span v-else-if="l.key == 'service_code'" > {{ p[l.key] }} {{ (p.service_rang)?` -- RANG : [${p.service_rang}] `:'' }} </span>
                            <span v-else > {{ p[l.key] }} </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- <div class="flex justify-content-center align-items-center p-5" v-if="on_loading">
            <ProgressSpinner />
        </div> -->

        <OverlayPanel ref="op">
            <div class="flex flex-column">
                <span class="text-xs"> Appuyez sur "Entrer" pour valider </span>
                <InputNumber v-model="cur_tarif" @keypress.enter="changeTarif" autofocus class="p-button-sm"  />
            </div>
        </OverlayPanel>


        <!-- Ajout de service -->
        <add-service :s="list_selected" :modif="on_modif_service" @validate=" ()=>{
                on_add_service = false
                on_modif_service = false
                getList()
            } " :visible="on_add_service" @close=" ()=> {
                on_add_service = false
                on_modif_service = false
            } " />

        <add-tarif @validate=" ()=>{
                on_add_tarif = false
                getList()
            } "  :visible="on_add_tarif" @close="on_add_tarif = false" />
        
        <modif-prix-tarif :t="tserv"  @validate=" ()=>{
                on_modif_tarif = false
                getList()
            } "  v-if="on_modif_tarif" @close="on_modif_tarif = false" />
    </div>
</template>

<script>
export default {
    data(){
        return{
            on_add_service:false,
            on_modif_service:false,
            on_add_tarif:false,
            on_modif_tarif:false,
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
            
            on_loading:false,
            
            cur_tarif:0,
            service_index:-1,
            tarif_index:-1
        }
    },
    methods:{
        async getList(){
            this.on_loading = true
            //Averina affecter-na ny list_lable fa raha tsy izay misy redondance
            this.list_label = [
                {label:"Code",key:'service_code'},
                {label:"Désignation",key:'service_label'}
            ]

            try {
                const _r = await this.$http.get('api/services')
                let _d = _r.data

                if(_d.status){
                    this.srvs = _d.srvs
                    this.list_tarif = _d.list_tarif

                    for (let i = 0; i < this.list_tarif.length; i++) {
                        this.list_label.push({label:this.list_tarif[i].tarif_label,key:`${i}:tarif`})
                    }
                }else{
                    this.showNotif(_d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }

            this.on_loading = false
        },
        async delTarif(k){
            let tarif_id = this.list_tarif[parseInt(k.split(':')[0])].tarif_id
            try {
                const _r = await this.$http.delete('api/service/del-tarif/'+tarif_id)
                let _d = _r.data

                if(_d.status){
                    this.getList()
                }else{
                    this.showNotif(_d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        },
        showTarif(p,k){
            let _id = parseInt(k.split((':'))[0])
            // if(!p.tarifs[_id]){
            //     p.tarifs[_id] = {
            //         tserv_prix:0
            //     }
            // }
            return `${(p.tarifs[_id])?p.tarifs[_id].tserv_prix:'0'}`
        },
        async changeTarif(){
            try {
                this.tserv.tserv_prix = this.cur_tarif

                const _r = await this.$http.put('api/service/modif-prix',this.tserv)
                let _d = _r.data

                if(_d.status){
                    this.showNotif('success','Changement Tarif','Tarif bien changé')
                    // this.getList()

                    let er = this.srvs[this.service_index].tarifs[this.tarif_index]
                    if(er){
                        this.srvs[this.service_index].tarifs[this.tarif_index].tserv_prix = this.cur_tarif
                    }else{
                        this.srvs[this.service_index].tarifs[this.tarif_index] = this.tserv
                    }
                    this.$refs.op.toggle();
                }else{
                    this.showNotif('error','Changement Tarif',_d.message)
                }
            } catch (e) {
                this.showNotifServerError()
            }
        },

        async delService(){
            try {
                const r = await this.$http.delete(`api/service/${this.list_selected.service_id}`)
                let d = r.data

                if(d.status){
                    this.showNotif('success','Suppression d\'un Service','Service bien supprimer')
                    this.getList()
                }else{
                    this.showNotif('error','Suppression d\'un Service',d.message)
                }
            } catch (e) {
                this.showNotifServerError()
            }
        },
        showEditTarif(e,tserv,p,index,serv_index){
            this.tserv = tserv
            this.cur_tarif = (p.tarifs[index])?p.tarifs[index].tserv_prix:0
            // console.log(p.tarifs[index])

             this.$refs.op.toggle(e) 
            //  this.$refs.iop.focus() 

            this.service_index = serv_index
            this.tarif_index = index
        }
    },
    mounted(){
        this.getList()
    }
}
</script>

<style>

</style>