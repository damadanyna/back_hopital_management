<template>
    <Dialog :visible="visible" @update:visible ="$emit('close')" :maximizable="true" :style="{width: '800px'}"  :modal="true" class="p-fluid p-dialog-sm">

        <template #header>
            <span class="text-sm font-bold">MODIFICATION UTILISATEUR</span>
        </template>

        <div class="flex"  >
            <div class="flex flex-column" :style="{width: '50%'}">
                <div class="flex flex-column mt-2">
                    <span class="font-bold text-sm"> Identifiant </span>
                    <InputText type="text" v-model="user.util_login" placeholder="Identifiant" :class="{'p-invalid':submitted && !user.util_login}" />
                </div>
                <div class="flex flex-column mt-2">
                    <span class="font-bold text-sm"> Libellé </span>
                    <InputText type="text" v-model="user.util_label" placeholder="Libellé" :class="{'p-invalid':submitted && !user.util_label}"/>
                </div>

                <div class="flex flex-column mt-2">
                    <span class="font-bold text-sm"> Type </span>
                     <!-- <c-select class="mr-2" :datas="type_user" label="label" code="code" placeholder="Type"  v-model="user.util_type"/> -->
                    <Dropdown :options="type_user" optionLabel="label" optionValue="code" v-model="user.util_type" placeholder="Type"/>
                </div>

                <Divider  type="dashed"/>

                <div class="">
                    <div class="field-checkbox text-sm">
                        <Checkbox inputId="binary" v-model="mng_pass.change" :binary="true" />
                        <label for="binary">Changer le mot de passe</label>
                    </div>
                    <div class="" v-if="mng_pass.change" >
                        <!-- <custom-input type="password" v-model="mng_pass.pass" label="Nouveau mot de passe" /> -->
                        <div class="flex flex-column mt-2">
                            <span class="font-bold text-sm"> Nouveau mot de passe </span>
                            <InputText type="text" v-model="mng_pass.pass" placeholder="Mot de passe"/>
                        </div>
                    </div>
                </div>
            </div>
            <Divider layout="vertical" />
            <div class="flex flex-column" :style="{width: '50%'}">
                <div class="">
                    <div class="p-2 border">
                        <span class="text-sm font-bold"> Liste des accès de l'utilisateur </span>
                    </div>

                    <div class="p-2 flex text-xs justify-center items-center" v-if="user_access.length <= 0 ">
                        <i class="pi pi-info"></i>
                        <span v-if="u.util_type == 'm' || u.util_type == 'a'" class=" mx-2 italic"> L'utilisateur a accès à tous les modules </span>
                    </div>
                    <div class="flex flex-column">
                        <div class=" p-2 py-2 field-checkbox text-sm " v-for="m in module_list" :key="m.module_id">
                            <!-- <input @click="updateAccess(m.module_id)" type="checkbox" :checked=" m.in_user" :id="m.module_id" >
                            <label class="mx-2" :for="m.module_id"> {{ m.module_label }} </label> -->

                            <Checkbox @click="updateAccess(m.module_id)" :inputId="m.module_id.toString()" :modelValue="(m.in_user)?true:false" :binary="true" />
                            <label :for="m.module_id">{{ m.module_label }}</label>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Enregistrer" class="p-button-sm" icon="pi pi-check" @click="updateUser"  :loading="isLoading" />
        </template>

    </Dialog>   
</template>

<script>
export default {
    props:['u','visible'],
    watch:{
        visible(a){
            if(a) this.getDetailUser()
        }
    },
    data(){
        return{
            user:{},
            user_access:[],
            module_list:[],
            mng_pass:{
                change:false,
                pass:''
            },
            submitted:false,
            isLoading:false
        }
    },
    methods:{
        async getDetailUser(){
            try {
                const _r = await this.$http.get(`api/user/${this.u.util_id}`)

                let _d = _r.data

                if(_d.status) {
                    this.user = _d.user
                    this.user_access = _d.user_access
                    this.module_list = _d.module_list
                }else{
                    this.showNotif(_d.message)
                }

            } catch (e) {
                console.log(e)
            }
        },
        async updateUser(){
            this.submitted = true

            this.isLoading = true
            try {
                delete this.user.util_mdp
                delete this.user.util_date_enreg

                const _r = await this.$http.put(`api/user`,{user:this.user,mng_pass:this.mng_pass})

                let _d = _r.data

                if(_d.status) {
                    this.getDetailUser()
                    this.$emit('validate')

                    this.showNotif('success',`Modification d'utilisateur`,'Utilisateur bien modifié')
                    this.submitted = false
                }else{
                    this.showNotif('error',`Modification d'utilisateur`,_d.message)
                }

            } catch (e) {
                console.log(e)
                this.showNotifServerError()
            }

            this.isLoading = false
        },
        async updateAccess(id_module){
            try {

                const _r = await this.$http.put(`api/user/access/${this.user.util_id}`,{id_module})
                let _d = _r.data

                if(_d.status) {
                    this.getDetailUser()
                }else{
                    this.showNotif(_d.message)
                }

            } catch (e) {
                console.log(e)
            }
        }
    },
    mounted(){
        // this.getDetailUser()
    }
}
</script> 