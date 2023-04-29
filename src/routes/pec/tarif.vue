<template>
    <div class="p-2 flex justify-center items-center">
        <div>
            <div class="">
                <div class="flex mb-2">
                    <button @click="  on_add_tarif = true " class="bt-icon"> <span class="material-icons text-sm"> add </span> </button>
                </div>
                <table class="">
                    <thead class="rounded-t sticky top-0 z-20" >
                        <tr class="bg-gray-50 text-gray-700 text-sm">
                            <th v-for="l in list_label" class="p-2 border text-xs" :key="l.key">
                                {{ l.label }}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr @click=" ()=>{
                                list_selected = p
                            } " class="cursor-pointer relative" v-for="p in list_tarif" :key="p.tarif_id">
                            <td :class="{'bg-indigo-600 bg-opacity-10':list_selected.tarif_id == p.tarif_id}" class="p-2 border text-xs" v-for="l in list_label" :key="l.key">
                                <span> {{ p[l.key] }} </span>
                            </td>

                            <td class="px-2 text-xs flex justify-center items-center" v-if="list_selected.tarif_id == p.tarif_id"> 
                                <button @click=" ()=>{
                                        on_view_tarif = true
                                    } " class="bt-icon z-50 bg-white border shadow-lg absolute -top-2 -right-2"> <i class="i text-lg ic:baseline-edit"></i> </button> </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <add-tarif v-if="on_add_tarif" @validate=" ()=>{
                getTarif()
                on_add_tarif = false
            } " @close="on_add_tarif = false " />

        <det-tarif :t="list_selected" v-if="on_view_tarif" @validate=" ()=>{
                getTarif()
                on_view_tarif = false
            } " @close="on_view_tarif = false " />
    </div>
</template>

<script>
export default {
    data(){
        return{
            list_tarif:[],
            list_label:[
                {label:'Désignation',key:'tarif_label'},
            ],
            on_add_tarif:false,
            on_view_tarif:false,
            list_selected:{}
        }
    },
    methods:{
        async getTarif(){
            try {
                const _r = await this.$http.get('api/tarifs')
                let _d = _r.data

                if(_d.status){
                    this.list_tarif = _d.reponse
                }else{
                    this.showNotif(_d.message)
                }
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        }
    },
    mounted(){
        this.getTarif()
    }
}
</script>

<style>

</style>