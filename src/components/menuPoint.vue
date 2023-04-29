<template>
<div  style="z-index: 1011" class="px-2" tabindex="0"  >
    <button class="bt-prev-next" @click=" toggleOpen " @blur="delOnBlur">
        <span class="material-icons">more_vert</span>
    </button>
    <div :style="style" :class="{'bottom-12':is_top}" style="z-index: 1011"  v-if="open" class="absolute text-xs rounded mt-2 w-48 flex py-1 flex-col border right-0 bg-white shadow-lg">
        <slot></slot>
    </div>
</div>
</template>

<script>
export default {
    props:['is_top'],
    data(){
        return{
            open:false,
            style:{}
        }
    },
    methods:{
        delOnBlur(){
            this.style.opacity = 0
            setTimeout(()=>{
                this.open = false
                this.style.opacity = 100
            },300)
        },
        toggleOpen(){
            if(this.open){
                this.open = false
            }else{
                this.open = true
            }
        },
        init(){
            this.style = {
                opacity:100
            }
        }
    },
    mounted(){
        this.init()
    }
}
</script>