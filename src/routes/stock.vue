<template>
    <div class="text-gray-600 relative w-full">
        <div class="p-2">
            <span class="text-2xl font-bold"> Stock </span>
        </div>
        <TabMenu :model="items" class="sticky top-0 " style="z-index:100">
            <!-- <template #item="{item}">
                <span class="material-symbols-outlined mr-2"> {{ item.icon }} </span>
                <router-link :to="item.to">{{item.label}}</router-link>
            </template> -->
        </TabMenu>
        <transition name="fade">
            <router-view />
        </transition>
    </div>
</template>

<script>
export default {
    data(){
        return {
            module_name:"stock",
            on_show:false,
            items:[
                {label:"Article",to:{name:'stock-fiche'}},
                {label:"Mouvements",to:{name:'stock-mvmt'}},
                {label:"Fournisseurs",to:{name:'stock-tiers'}},
                {label:"Catégories",to:{name:'stock-cat'}},
            ],
        }
    },
    methods:{
        async init(){
            await this.statusConnection()
            if(!this.$store.state.user.util_login){
                this.$router.push(`/login?module=${this.module_name}`)
            }else{
                this.on_show = true
            }
        }
    },
    beforeMount(){

    },
    mounted(){
        this.init()
    }
}
</script>