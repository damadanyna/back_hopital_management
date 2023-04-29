<template>
    <div class="" :style="input.style">
        <div v-if="label" class="text-xs duration-300 flex items-center font-bold h-4">
            <label :for="id" class="z-10 px-1 text-indigo-600"> {{label}} </label>
        </div>
        <div class="flex relative">
            <input :disabled="(disable)?true:false" :autofocus="autofocus" :id="id"    @input="updateInput" ref="cinput"
            :value="modelValue" :type="type"
            class="input-alt w-full duration-300 text-xs" :placeholder="(ex)?ex:label">
            <span  class="material-icons text-sm  rounded-r p-1 absolute right-0 top-1" v-if="icon"> {{ icon }} </span>
        </div>
    </div>
</template>

<script>
export default {
    props:['label','type','id','autofocus','width','modelValue','ex','disable','icon'],
    data(){

        return{
            on_focus:false,
            style:{
                height:40
            },
            input:{
                style:{},
                model:''
            },

        }
    },
    methods:{
        updateInput(e){
            this.$emit('update:modelValue',e.target.value)
        },
        focusInput(){
            this.$refs.cinput.focus()
        }
    },
    mounted(){
        // if(this.type == 'date'){
        //     console.log(this.modelValue)
        // }
    },
    created(){

    }
}
</script>

<style scoped>

</style>
