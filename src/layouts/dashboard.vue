<template>  
    <div class="flex bg-white relative " v-if="on_show">
        <sidebar />
        <transition name="fade">
            <router-view class=""></router-view>
        </transition>
        <!-- Notification -->
        <Toast />
        <!-- Pour les confirmations -->
        <ConfirmDialog >
            <template #message="slotProps">
                <div class="flex" style="width:400px">
                    <i :class="slotProps.message.icon" style="font-size: 1.5rem"></i>
                    <p class="pl-2" v-html="slotProps.message.message"></p>
                </div>
            </template>
        </ConfirmDialog>
    </div>
    <div v-else class="w-screen h-screen flex justify-content-center align-items-center">
        <ProgressSpinner />
    </div>

</template>

<script>
export default {
    data(){
        return{
            on_show:false
        }
    },
    methods:{
        async init(){
            // this.showNotif(this.$route.name)
            await this.statusConnection()
            if(!this.$store.state.user.util_login){
                if(this.$route.name){
                    this.$router.push(`/login`)
                }
            }else{
                this.on_show = true
            }
        }
    },
    mounted(){
        // console.log(this.$store.state)
        this.init()
    }
}
</script>