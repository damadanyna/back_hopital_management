<template>
    <!-- <div class="bg-dialog-box">
        Content Overlay
        <div class="border rounded-sm shadow-sm bg-white" >
            <div class="p-2 flex items-center">
                <span class="text-sm"> Ajout utilisateur </span>
                <span class="flex-grow"></span>
                <button class="bt-s w-8 h-8 flex justify-center items-center" @click="$emit('close')"> <span class="material-icons"> clear </span> </button>
            </div>

            <div class="p-2">
                <div class="flex flex-col mb-2">
                    <div class="mb-2 flex">
                        <custom-input class="mr-2" v-model="user.util_login" label="Identifiant "/>
                        <custom-input class="mr-2" v-model="user.util_mdp" label="Mot de passe "/>
                    </div>
                    <div class="mb-2 flex">
                        <custom-input class="mr-2" v-model="user.util_label" label="Libellé "/>
                        <c-select class="mr-2" :datas="type_user" label="label" code="code" placeholder="Type"  v-model="user.util_type"/>
                    </div>
                </div>
                <div class="p-2 flex justify-end">
                    <button class="bt-p-s" @click="postUser"> Enregistrer </button>
                </div>
            </div>
        </div>
    </div> -->
    <Dialog :maximizable="true" :visible="visible" @update:visible=" ()=>{
            $emit('close') 
        } " :style="{width: '450px'}"  :modal="true" class="p-fluid p-dialog-sm">
        <template #header>
            <span class="text-sm font-bold">AJOUT UTILISATEUR</span>
        </template>
        <div class="">
            <div class="flex flex-column mb-2">

                <div class="flex flex-column mt-2">
                    <span class="font-bold text-sm"> Identifiant </span>
                    <InputText autofocus type="text" v-model="user.util_login" placeholder="Identifiant" :class="{'p-invalid':submitted && !user.util_login}" />
                </div>

                <div class="flex flex-column mt-2">
                    <span class="font-bold text-sm"> Mot de passe </span>
                    <InputText type="text" v-model="user.util_mdp" placeholder="Mot de passe" :class="{'p-invalid':submitted && !user.util_mdp}"/>
                </div>

                <div class="flex flex-column mt-2">
                    <span class="font-bold text-sm"> Libellé </span>
                    <InputText type="text" v-model="user.util_label" placeholder="Libellé" :class="{'p-invalid':submitted && !user.util_label}"/>
                </div>

                <!-- <div class="mb-2 flex">
                    <c-select class="mr-2" :datas="type_user" label="label" code="code" placeholder="Type"  v-model="user.util_type"/>
                    <Dropdown v-model="user.util_type" :options="type_user" optionLabel="label" optionValue="code" placeholder="Choisissez un type" />
                </div> -->

                <div class="flex flex-column mt-2">
                    <span class="font-bold text-sm"> Type d'utilisateur </span>
                    <Dropdown v-model="user.util_type" :options="type_user" optionLabel="label" optionValue="code" placeholder="Type d'utilisateur" />
                </div>
            </div>
        </div>
        <template #footer>
            <Button label="Enregistrer" class="p-button-sm" icon="pi pi-check" @click="postUser"  :loading="isLoading" />
        </template>
    </Dialog>
</template>
<script>
export default {
    props:['visible'],
    data(){
        return{
            user:{
                util_type:"a"
            },
            user_access:[],
            submitted:false,
            isLoading:false,
        }
    },
    methods:{
        async postUser(){
            try {
                this.submitted = true
                this.isLoading = true

                const _r = await this.$http.post('api/users',this.user)
                let _d = _r.data

                if(_d.status){
                    this.$emit('validate')
                    this.showNotif('success','Ajout Utilisateur',`L'Utilisateur a bien été ajouté`)

                    this.reinit()
                    
                }else{
                    this.showNotif('error','Ajout Utilisateur',_d.message)
                }
            } catch (e) {
                this.showNotifServerError()
            }

            this.isLoading = false
        },
        reinit(){
            //réinitialisation
            this.user = {
                util_type:"a"
            }
            this.submitted = false
        }
    },
    mounted(){
        
    }
}
</script> 