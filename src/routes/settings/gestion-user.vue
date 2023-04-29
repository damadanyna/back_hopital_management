<template>
    <div class="list-user-content p-2 w-full flex flex-column">
        <DataTable :scrollable="true" scrollHeight="500px" class="border-round p-datatable-sm" :value="list_users" showGridlines stripedRows  responsiveLayout="scroll"
            v-model:selection="selectedUser" >
            <template #header>
                <div class="flex align-items-center">
                    <span class="text-sm">LISTE DES UTILISATEURS</span>
                    <span class="flex-grow-1"></span>
                    <div class="flex align-items-center">
                        <Button v-if="selectedUser" @click="  on_view_user = true " icon="pi pi-pencil" class="mr-2 p-button-outlined  p-button-sm" />
                        <Button v-if="selectedUser" @click="confirmDeleteUser($event)"  icon="pi pi-times" class="mr-2 p-button-danger p-button-sm" />
                        <Button @click="  on_add_user = true " icon="pi pi-plus" label="AJOUTER" class="p-button-sm" />
                    </div>
                </div>
            </template>

            <Column selectionMode="single" style="width:50px;max-width:50px"></Column>
            <Column v-for="l in list_label" :field="l.key" :header="l.label" :key="l.key">
                <template #body="slotProps">
                    <span v-if="l.key == 'util_type'" class=""> {{ getTypeUser(slotProps.data[l.key]) }} </span>
                    <span v-else > {{  slotProps.data[l.key] }} </span>
                </template>
            </Column>
            <template #footer>
                <div class="flex align-items-center">
                    <Button v-if="selectedUser" @click="deleteSelection" icon="pi pi-times" label="Annuler la sélection" class="p-button-sm p-button-text" />
                    <span class="flex-grow-1"></span>
                    <span class="p-2 text-primary text-sm  ">
                        <strong> {{ list_users.length }}  utilisateurs</strong>
                    </span>
                </div>
            </template>
        </DataTable>

        <!-- Détails utilisateur si click sur l'utilisateur -->
        <detail-user :visible="on_view_user" @validate="getListUser" :u="selectedUser" @close="on_view_user = false"  />

        <!-- Ajout utilisateur -->
        <add-user @validate=" ()=>{
            on_add_user = false
            getListUser()
        } " :visible="on_add_user" @close="on_add_user = false" />
    </div>
</template>

<script>
export default {
    watch:{
    },
    data(){
        return{
            list_label:[
                {label:"LIBELLE",key:"util_label"},
                {label:"IDENTIFIANT",key:"util_login"},
                {label:"TYPE",key:"util_type"},
            ],
            list_users:[],

            u_selected:{},
            on_view_user:false,
            on_add_user:false,

            selectedUser:null,
            lockRows:[]

        }
    },
    methods:{
        async getListUser(){
            try {
                const _r = await this.$http.get('api/users')

                let _d = _r.data

                if(_d.status){
                    this.list_users = _d.reponse
                }else{
                    this.showNotif(_d.message)
                }
            } catch (e) {
                this.showNotif('Erreur dans la base de donnée')
                console.log(e)
            }
        },
        getTypeUser(t){
            for (let i = 0; i < this.type_user.length; i++) {
                const e = this.type_user[i]
                if(e.code == t){
                    return e.label
                }
            }
        },
        deleteSelection(){
            this.selectedUser = null
            this.lockRows = []
        },

        confirmDeleteUser(event) {
            this.$confirm.require({
                target: event.currentTarget,
                message: 'Voulez vous vraiment supprimer cet utilisateur?',
                icon: 'pi pi-info-circle',
                acceptClass: 'p-button-danger',
                acceptLabel:"Oui",
                rejectLabel:"Non",
                header:`Suppresion d'un utilisateur`,
                accept: () => {
                    this.deleteUser()
                },
                reject: () => {
                    
                }
            });
        },

        async deleteUser(){
            try {
                const r = await this.$http.delete(`api/user/${this.selectedUser.util_id}`,{params:{user_id:this.$store.state.user.util_id}})
                let d = r.data
                if(d.status){
                    this.showNotif('success',`Suppression d'un utilisateur`,`L'utilisateur a bien été supprimé`)
                    this.deleteSelection()
                    this.getListUser()
                }else{
                    this.showNotif('error',`Suppression d'un utilisateur`,d.message)
                }
            } catch (e) {
                this.showNotifServerError()
            }
        }
    },
    mounted(){
        this.getListUser()


        //detection de liste user content
        // let lu = document.querySelector('.list-user-content')
        // console.log(lu)
    }
}
</script>

<style>

</style>