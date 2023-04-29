<template>
    <transition name="fade1">
        <div class="duration-300 fixed top-20 right-5  bg-gray-900 shadow-lg text-white rounded-lg" 
        :class="class_style" v-if="this.$store.state.notif_pop.show"
        style="width:300px;z-index:1070;">
            <div class="text-sm w-full  rounded-t-lg px-3 py-2" :class="($store.state.notif_pop.error)?'bg-red-500':'bg-gray-700'">
                <span class=""> {{ $store.state.notif_pop.title }} </span>
            </div>
            <div class="flex px-3 py-2 items-center">
                <span class=""> {{ $store.state.notif_pop.content }} </span>
            </div>
        </div>
    </transition>
</template>
<script>
export default {
    watch:{
        '$store.state.notif_pop.show'(a){
            if(a){
                clearTimeout(this.id_timeout)
                this.id_timeout = setTimeout(() => {
                    this.$store.commit('hide_notif')
                }, 5000);
            }
        }
    },
    data(){
        return{
            id_timeout:-1
        }
    },
    methods:{
        class_style(){
            // alert('salut')
            return{
                'h-0 hidden':!this.$store.state.notif_pop.show,
                'h-32 flex flex-col':this.$store.state.notif_pop.show
            }
        }
    },
    mounted(){
        
    }

}
</script>

<style scoped>
.fade1-enter-active, .fade1-leave-active {
  transition: all .3s;
}
.fade1-enter, .fade1-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
  transform: translateX(100px);
}
</style>