<template>
    <div class="text-gray-600 relative w-full">
        <div class="p-2">
            <span class="text-2xl font-bold"> Caisse </span>
        </div>
        <!-- <div class="menu--tab-container">
            
            
            <router-link v-if="checkModule('caisse-main') || inTypeUser(['a','g','m'])" :class="{'menu-tab-active':($route.name == 'caisse-main')}"  class="menu-tab" 
            :to="{name:'caisse-main'}">
                <span class="material-symbols-outlined mr-2">point_of_sale</span>
                <span class="text-sm"> Caisse Principale </span>
            </router-link>

            <router-link v-if="checkModule('caisse-disp') || inTypeUser(['a','g','m'])" :class="{'menu-tab-active':($route.name == 'caisse-disp')}"  class="menu-tab" 
            :to="{name:'caisse-disp'}">
                <span class="material-symbols-outlined mr-2">point_of_sale</span>
                <span class="text-sm"> Caisse Dispensaire </span>
            </router-link>
        </div> -->

        <TabMenu :model="items" style="z-index:50" class="sticky top-0 z-">
            <!-- <template #item="{item}">
                <span class="material-symbols-outlined mr-2"> {{ item.icon }} </span>
                <router-link :to="item.to">{{item.label}}</router-link>
            </template> -->
        </TabMenu>

        <router-view />
    </div>
</template>

<script>
export default {
    data(){
        return{
            items: []
        }
    },
    methods:{
        init(){
            if(this.checkModule('caisse-main') || this.inTypeUser(['a','g','m'])){
                this.items.push({label:"Caisse Principale",icon:"pi pi-wallet", to:{name:'caisse-main'}})
            }
            if(this.checkModule('caisse-disp') || this.inTypeUser(['a','g','m'])){
                this.items.push({label:"Caisse Dispensaire",icon:"pi pi-wallet", to:{name:'caisse-disp'}})
            }
            
        }
    },
    beforeMount(){
        this.init()
    }
}
</script>

<style>

</style>