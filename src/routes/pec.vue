<template>
    <div class="text-gray-600 relative w-full">

        <div class="p-2">
            <span class="text-2xl font-bold"> Prise en Charge </span>
        </div>
        <TabMenu :model="items" class="sticky top-0 " style="z-index:100">
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
            module_name:"prise-en-charge",
            items:[
                {label:"Consultation",to:{name:'pec-consultation'}},
                {label:"Hospitalisation",to:{name:'pec-index'}},
                {label:"Sociétés",to:{name:'pec-soc'}},
            ],
        }
    }
}
</script>

<style>

</style>