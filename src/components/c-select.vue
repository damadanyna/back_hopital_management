<template>
    <div class="relative flex flex-col">
        <div v-if="placeholder" class="text-xs duration-300 flex items-center font-bold" :class="(datas.length > 0 )?' h-4':'h-0'">
            <label v-if="(datas.length > 0)" class="z-10 px-1 text-indigo-600"> {{ placeholder }} </label>
        </div>
        <div>
            <select :disabled="(disable)?true:false" @change="updateInput" ref="cinput" class="input-alt w-full duration-300 text-xs" >
                <!-- <option value="-1" selected hidden> {{ placeholder }} </option> -->
                <option :value="d[code]" :selected="modelValue == d[(code === undefined)?'code':code]" v-for="d in datas" :key="d[code]"> {{ d[(label === undefined)?'label':label] }} </option>
            </select>
        </div>
    </div>
</template>


<script>
export default {
    props:['modelValue','datas','label','code','placeholder','padding','width','disable'],
    watch:{
        datas(a){
            this.$emit('input',(a[0] === undefined)?null:a[0][this.code])
        }
    },
    data(){
        return{
        }
    },

    methods:{
        updateInput(e){
            this.$emit('update:modelValue',e.target.value)
        }
    },
    mounted(){
        //this.updateInput()
    }

}
</script>

<style >
.fade-enter-active, .fade-leave-active {
  transition: opacity .3s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>
