<template>  
    <div class="flex align-items-center justify-content-center h-screen w-screen text-gray-600 ">

        <!-- Container de login principale -->
        <div class="flex align-items-center justify-content-center flex-column"> 
            <img src="../assets/images/logo.jpg" class="mb-5 border-circle" alt="" width="200" height="200" srcset="">

            <form action="/" @submit.prevent="setAuth" method="post">
                <!-- <custom-input class="mb-2 w-56" v-model="auth.id" label="Identifiant" /> -->
                <div class="flex flex-column mt-2">
                    <span class="font-bold text-sm"> Identifiant </span>
                    <span class="p-input-icon-right">
                        <i class="pi pi-user" />
                        <InputText type="text" v-model="auth.id" placeholder="Identifiant"/>
                    </span>
                </div>
                <div class="flex flex-column mt-2">
                    <span class="font-bold text-sm"> Mot de passe </span>
                    <Password v-model="auth.pass" :feedback="false" placeholder="Mot de passe" toggleMask></Password>
                </div>
            
                <div class="flex justify-content-end mt-5">
                    <Button type="submit" icon="pi pi-sign-in" label="Se Connecter" class="p-button-sm" :loading="isLoading" />
                </div>
            </form>
        </div>

        <!-- Toast pour l'Erreur -->
        <Toast position="bottom-right" group="br" />
    </div>
</template>

<script>


export default {
    data(){
        return{
            auth:{
                id:'',
                pass:''
            },
            isLoading:false
        }
    },
    methods:{
        async setAuth(){
            this.isLoading = true
            if(this.$route.query.module){
                this.auth.module = this.$route.query.module
            }
            try {
                const _r = await this.$http.post('api/auth',this.auth)

                let _d = _r.data
                if(_d.status){
                    this.$store.commit('setUa',(_d.ua)?_d.ua:[])
                    this.$store.commit('setUser',_d.u)
                    this.$router.push('/')
                }else{
                    this.showError('Erreur de formulaire',_d.message)
                }
            } catch (e) {
                this.showError('Erreur de connexion',`Impossible d'établir une connexion avec le serveur`)
            }
            
            //Averina ho normal ny bouton
            this.isLoading = false
        },
        showError(s,message) {
            this.$toast.add({severity:'error', summary: s, detail:message, group: 'br', life: 3000});
        },
    }
}
</script>