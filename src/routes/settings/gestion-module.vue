<template>
    <div class="w-full flex flex-col justify-center items-center ">
        <div class="text-sm flex">
            <span class="p-2 border-l-2 border-indigo-600 italic"> Ici on va gérer les modules (dev uniquement) </span>
            <btn icon="baseline-add" text="Ajouter" class="mx-2" />
        </div>
    </div>
</template>

<script>
export default {
    data(){
        return{
            list_label:[
                {label:"Libellé",key:"module_label"},
                {label:"Code",key:"module_code"},
                {label:"Nb. Utilisateur",key:"nb_util"},
            ],

            modules:[]
        }

    },
    methods:{
        async getModule(){
            try {
                const _r = await this.$http.get('api/modules')
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        }
    }
}
</script>