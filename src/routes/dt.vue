<template>
    <div class="text-gray-600 relative w-full">
        <div class="p-2">
            <span class="text-2xl font-bold"> Dentisterie </span>
        </div>

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
            items: [
                {label:"Liste des patients",to:{name:'dt-patient'}},
                {label:"Rendez-vous",to:{name:'dt-rdv'}}
            ]
        }
    }
}
</script>

<style>

</style>