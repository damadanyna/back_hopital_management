<template>
    <div class="text-gray-600 w-full flex flex-column">
        <div class="flex flex-column">
            <div class="p-2">
                <span class="text-2xl font-bold"> Paramètres </span>
            </div>
            <div class="p-2 flex">

                <!-- Liste des menus dans paramètre -->
                <!-- <router-link :class="{'menu-vert-active':($route.name == 'settings-user')}"  class="menu-vert mr-2" 
                :to="{name:'settings-user'}">


                    <i class="i ic:baseline-supervised-user-circle mx-2 text-2xl"></i>
                    <span class="text-sm"> Gestion Utilisateur </span>
                    <transition name="fade">
                        <span v-if="$route.name == 'settings-user'" class="left-1/4 bottom-1 rounded absolute block w-2/4 h-1 bg-blue-600"></span>
                    </transition>
                </router-link> -->

                <!-- Création de modules -->
                <!-- <router-link :class="{'menu-vert-active':($route.name == 'settings-module')}"  class="menu-vert mr-2" 
                :to="{name:'settings-module'}">


                    <i class="i ic:baseline-view-module mx-2 text-2xl"></i>
                    <span class="text-sm"> Module </span>
                    <transition name="fade">
                        <span v-if="$route.name == 'settings-module'" class="left-1/4 bottom-1 rounded absolute block w-2/4 h-1 bg-blue-600"></span>
                    </transition>
                </router-link> -->
            </div>
        </div>
        <router-view></router-view>
    </div>
</template>

<script>
export default {
    data(){
        return{
            items:[
				{
					label:"Applications",
					icon:"pi pi-fw pi-home",
					to:{name:'home-app'}
				}
			]
        }
    },
    mounted(){
        window.electronAPI.setTitle("Paramètres - MED HLA")
    }
}
</script>

<style>
/* Primevue Style */
.p-menubar-end{
  padding: 2px;
}
/*  */
</style>


