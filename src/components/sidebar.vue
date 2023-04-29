<template>
    <div class="sticky h-screen flex flex-column top-0 z-5 border-right-1 border-300" style="width:50px;min-with:50px;">
        <div class="p-2 flex flex-column w-full align-items-center justify-content-center">
            <router-link :to="{name:'home-app'}" class="menu-side relative" :class="{'menu-side-active':$route.name == 'home-app'}">
                <span class="material-symbols-outlined"> apps </span>
                <span class="bar-menu-side" v-if="$route.name == 'home-app'"></span>
            </router-link>
        </div>
        <div class="flex-grow-1"></div>
        <div v-if="inTypeUser(['a','m'])" class="p-2 flex flex-column w-full align-items-center justify-content-center">
            <router-link :to="{name:'settings-user'}" class="menu-side relative" :class="{'menu-side-active':/^settings/.test($route.name)}">
                <span class="material-symbols-outlined"> settings </span>
                <span class="bar-menu-side" v-if="/^settings/.test($route.name)"></span>
            </router-link>
        </div>
    </div>
</template>

<script>
export default {
    data(){
        return{
            style:{
                width:`5px`,
                minWidth:`50px`
            },
            items:[
				{
					label:"Applications",
					icon:"pi pi-fw pi-home",
					to:{name:'home-app'}
				}
			]
        }
    }
}
</script>

<style scoped>

 
/* STYLE POUR LES MENUS SIDE */

.menu-side{
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px;
  border-radius: 5px;
  appearance: none;
  text-decoration: none;
  color: rgb(100, 100, 100);
  background-color: rgba(200, 200, 200,0.3);
  transition: background-color 0.3s, border-color 0.3s;
}
.menu-side:hover{
  background-color: rgba(200, 200, 200,0.5);
}
.menu-side-active{
    color: var(--main-color);
}

.bar-menu-side{
    position: absolute;
    height: 40%;
    width: 3px;
    border-radius: 3px;
    display: block;
    left: 3px;
    background-color: var(--main-color);
}

</style>