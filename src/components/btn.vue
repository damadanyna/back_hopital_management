<template>
    <button class="bt text-sm flex justify-center items-center">
        <i :class="`i ic:${ (icon)?icon:'baseline-check' } icon-s`"></i>
        <span class="mx-2"> {{ text }} </span>
    </button>
</template>

<script>
export default {
    props:['icon','text'],
    data() {return{}}
}
</script>