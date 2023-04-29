<template>
    <div class="text-sm">
        <div class="px-2 flex items-end sticky  py-2 bg-white z-30" style="top:60px;z-index:105">
            <!-- <button class="flex justify-center items-center bt-p-s ml-2" @click="on_add_tarif = true">
                <span class="material-icons mr-2"> add </span>
                <span class=""> Ajouter Tarif </span>
            </button> -->
            <span class="flex-grow-1"></span>
            <div class="flex ">
                <!-- <custom-input v-model="filters.search" class="w-56" label="Rechercher un produit" /> -->
                <span class="p-input-icon-right">
                    <i class="pi pi-search" />
                    <InputText class="p-inputtext-sm" type="text" v-model="filters.search" placeholder="ex : PARACETAMOL"/>
                </span>
            </div>
        </div>
        <!-- ici la liste des services avec les tarifs -->
        <div class="">

            <div class="p-2 text-sm">
                <table class="w-full">
                    <thead class="" >
                        <tr class="bg-gray-50 text-gray-700 text-sm">

                            <th v-for="l in list_label" class="p-2 border text-xs sticky text-left" style="top:115px;z-index:110" :key="l.key">
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
                            $emit('validate',p)
                        } " @click=" ()=>{
                                list_selected = p
                            } " class="cursor-pointer relative" v-for="p,i in srvs" :key="p.art_id">
                            <td
                            
                            :class="{'active-row':list_selected.art_id == p.art_id}" 
                            class="p-2 border text-xs relative items-center" v-for="l in list_label" :key="l.key">

                                <div v-if="l.key.split(':')[1] == 'tarif'" class="flex items-center">
                                    <span @click=" showEditTarif($event,{
                                        tserv_tarif_id:list_tarif[parseInt(l.key.split(':')[0])].tarif_id,
                                        tserv_service_id:p.art_id,
                                        tserv_is_product:1
                                    },p,parseInt(l.key.split(':')[0]),i) " :class="{'border-red-500':tarif_index == parseInt(l.key.split(':')[0])  && service_index == i}"  
                                    class="p-1 border-1 border-round bg-white border-200"> {{ (showTarif(p,l.key)).toString().toLocaleString('fr-CA') }} </span>
                                </div>
                                <span class="" v-else> {{ p[l.key] }} </span>
                                
                            </td>
                            
                            <!-- <td class="px-2 text-xs flex justify-center items-center" v-if="list_selected.service_id == p.service_id"> 
                                <button @click=" on_view_dep = true " class="bt-icon z-50 bg-white border shadow-lg absolute -top-2 -right-2"> <span class="material-icons text-sm"> add </span> </button> </td> -->
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <OverlayPanel ref="op">
            <div class="flex flex-column">
                <span class="text-xs"> Appuyez sur "Entrer" pour valider </span>
                <InputNumber v-model="cur_tarif" @keypress.enter="changeTarif" autofocus class="p-button-sm"  />
            </div>
        </OverlayPanel>

        <add-tarif @validate=" ()=>{
                on_add_tarif = false
                getList()
            } "  v-if="on_add_tarif" @close="on_add_tarif = false" />
        
        <modif-prix-tarif :t="tserv"  @validate=" ()=>{
                on_modif_tarif = false
                getList()
            } "  v-if="on_modif_tarif" @close="on_modif_tarif = false" />
    </div>
</template>

<script>
export default {
    watch:{
        'filters.search'(a){
            if(!this.in_search){
                this.getList()
            }else{
                this.have_to_search = true
            }
        }
    },
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
            filters:{
                search:''
            },
            have_to_search:false,
            in_search:false,


            cur_tarif:0,
            service_index:-1,
            tarif_index:-1
        }
    },
    methods:{
        async getList(){
            this.in_search = true

            //Averina affecter-na ny list_lable fa raha tsy izay misy redondance
            this.list_label = [
                {label:"Code",key:'art_code'},
                {label:"Désignation",key:'art_label'}
            ]

            try {
                const _r = await this.$http.get('api/products/tarifs',{params:this.filters})
                let _d = _r.data

                this.in_search = false

                if(_d.status){
                    this.srvs = _d.srvs
                    this.list_tarif = _d.list_tarif

                    for (let i = 0; i < this.list_tarif.length; i++) {
                        this.list_label.push({label:this.list_tarif[i].tarif_label,key:`${i}:tarif`})
                    }

                    if(this.have_to_search){
                        this.getList()
                        this.have_to_search = false
                    }
                }else{
                    this.showNotif(_d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        },
        async delTarif(k){
            let tarif_id = this.list_tarif[parseInt(k.split(':')[0])].tarif_id
            try {
                const _r = await this.$http.delete('api/service/del-tarif/'+tarif_id)
                let _d = _r.data

                if(_d.status){
                }else{
                    this.showNotif(_d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        },
        showTarif(p,k){
            let _id = parseInt(k.split((':'))[0])
            return `${(p.tarifs[_id])?p.tarifs[_id].tserv_prix:'0'}`
        },
        showEditTarif(e,tserv,p,index,serv_index){
            this.tserv = tserv
            this.cur_tarif = (p.tarifs[index])?p.tarifs[index].tserv_prix:0
            // console.log(p.tarifs[index])

             this.$refs.op.toggle(e) 
            //  this.$refs.iop.focus() 

            this.service_index = serv_index
            this.tarif_index = index
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
    },
    mounted(){
        this.getList()
    }
}
</script>

<style>

</style>