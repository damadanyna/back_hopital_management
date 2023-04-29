<template>
    <div class="text-gray-600 relative w-full">
        <div class="p-2">
            <span class="text-2xl font-bold"> Tarification </span>
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
        return{
            on_add_patient:false,
            module_name:"fiche-patient",
            items:[
                {label:"Services",to:{name:'tarif-service'}},
                {label:"Médicaments",to:{name:'tarif-med'}},
            ],
        }
    }
}
</script>

<style>

</style>