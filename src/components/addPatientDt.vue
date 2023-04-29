<template>
    <!-- <div class="bg-dialog-box">
        <div class="bg-white rounded border" style="width:600px">
            <div class="flex items-center border-b p-1 px-2 bg-gray-50 rounded-t">
                <span class="text-sm font-bold"> Ajout d'un patient </span>
                <span class="flex-grow"></span>
                <button @click="$emit('close')" class="bt-icon"> <span class="material-icons text-sm"> clear </span> </button>
            </div>
            <div class="p-2 flex flex-col">
                <div class="flex items-end mb-2">
                    <custom-input  label="Numéro ..." class="mx-2 w-56" v-model="p.pat_numero" />
                    <custom-input  label="Profession ..." class="mx-2 w-56" v-model="p.pat_profession" />
                </div>

                <div class="flex mb-2">
                    <custom-input  label="Nom et prénom ..." class="mx-2 w-96" v-model="p.pat_nom_et_prenom" />
                </div>

                <div class="flex items-end mb-2">
                    <custom-input type="date"  label="Date de naissance" class="mx-2 w-56" v-model="p.pat_date_naiss" />
                    <custom-input :disable="true" v-model="getAge" label="Age ..." class="mx-2"  />
                </div>

                <div class="flex items-end mb-2">
                    <c-select :datas="sex_list" class="mx-2 w-56" placeholder="Sexe ..." label="label" code="code" v-model="p.pat_sexe"  />
                </div>

                <div class="flex items-end mb-2">
                    <custom-input label="Adresse ..." class="mx-2 w-56" v-model="p.pat_adresse" />
                </div>

            </div>

            <div class="flex justify-end p-2 border-t bg-gray-50 rounded-b">
                <button class="bt-p-s" @click="addPatient">
                    <span class="material-icons text-sm"> check </span>
                    <span class="mx-2"> Valider </span>
                </button>
            </div>
        </div>
    </div> -->

    <Dialog :maximizable="true" :visible="visible" @update:visible=" ()=>{
            $emit('close') 
        } "  :modal="true" class="p-fluid p-dialog-sm">
        <template #header>
            <span class="text-sm font-bold">AJOUT D'UN PATIENT</span>
        </template>
        <div class="">
            <div class="flex flex-column mb-2">

                <div class="flex mb-2">
                    <div class="flex flex-column mt-2" style="width:30%">
                        <span class="font-bold text-sm"> Numéro </span>
                        <InputText class="p-inputtext-sm" autofocus type="text" v-model="p.pat_numero" placeholder="ex : D34ER567" 
                        :class="{'p-invalid':submitted && !p.pat_numero}" />
                    </div>
                    <Divider layout="vertical" style="width:5%"/>
                    <div class="flex flex-column mt-2" style="width:65%">
                        <span class="font-bold text-sm"> Profession </span>
                        <InputText type="text" v-model="p.pat_profession" placeholder="ex : POMPISTE" class="p-inputtext-sm" />
                    </div>
                </div>

                <div class="flex mb-2">
                    <!-- <custom-input  label="Nom et prénom ..." class="mx-2 w-96" v-model="p.pat_nom_et_prenom" /> -->
                    <div class="flex flex-column mt-2" style="width:100%">
                        <span class="font-bold text-sm"> Nom et prenom </span>
                        <InputText type="text" v-model="p.pat_nom_et_prenom" placeholder="ex : Ralaivao Adonis" class="p-inputtext-sm" 
                        :class="{'p-invalid':submitted && !p.pat_nom_et_prenom}" />
                    </div>
                </div>

                <div class="flex mb-2">
                    <!-- <custom-input type="date"  label="Date de naissance" class="mx-2 w-56" v-model="p.pat_date_naiss" /> -->
                    <div class="flex flex-column mt-2" style="width:65%">
                        <span class="font-bold text-sm"> Date de naissance </span>
                        <Calendar placeholder="ex : 09/09/1998" v-model="p.pat_date_naiss"  dateFormat="dd/mm/yy" class="p-inputtext-sm"  
                        :class="{'p-invalid':submitted && !p.pat_date_naiss}"/>    
                    </div>
                    <!-- <custom-input :disable="true" v-model="getAge" label="Age ..." class="mx-2"  /> -->
                    <Divider layout="vertical" style="width:5%"/>
                    <div class="flex flex-column mt-2" style="width:30%">
                        <span class="font-bold text-sm"> Age </span>
                        <InputText type="text" v-model="getAge" class="p-inputtext-sm" disabled />
                    </div>
                </div>

                <div class="flex flex-column mb-2">
                    <!-- <c-select :datas="sex_list" class="mx-2 w-56" placeholder="Sexe ..." label="label" code="code" v-model="p.pat_sexe"  /> -->
                    <span class="font-bold text-sm"> Sexe </span>
                    <Dropdown v-model="p.pat_sexe" :options="sex_list" optionLabel="label" optionValue="code" placeholder="sexe" class="p-inputtext-sm" />
                </div>

                <div class="flex items-end mb-2">
                    <!-- <custom-input label="Adresse ..." class="mx-2 w-56" v-model="p.pat_adresse" /> -->
                    <div class="flex flex-column mt-2" style="width:100%">
                        <span class="font-bold text-sm"> Adresse </span>
                        <InputText type="text" v-model="p.pat_adresse" placeholder="ex : AMBOHIMENA NORD" class="p-inputtext-sm" />
                    </div>
                </div>
            </div>
        </div>
        <template #footer>
            <Button label="Enregistrer" class="p-button-sm" icon="pi pi-check" @click="addPatient"  :loading="isLoading" />
        </template>
    </Dialog>
</template>

<script>
export default {
    props:['visible'],
    watch:{
        'p.pat_nom_et_prenom'(a){
            this.p.pat_nom_et_prenom = a.toUpperCase()

        },
        'p.pat_adresse'(a){
            this.p.pat_adresse = a.toUpperCase()
        },
        'p.pat_numero'(a){
            this.p.pat_numero = a.toUpperCase()
        },
        'p.pat_profession'(a){
            this.p.pat_profession = a.toUpperCase()
        }
    },
    data(){
        return{
            p:{
                pat_sexe:'M',
                pat_numero:'',
                pat_date_naiss:'',
                pat_adresse:'',
                pat_profession:'',
                pat_nom_et_prenom:''
            },
            sex_list:[
                {label:"Masculin",code:'M'},
                {label:"Féminin",code:'F'}
            ],
            isLoading:false,
            submitted:false,
        }
    },
    computed:{
        getAge(){
            if(!this.p.pat_date_naiss){
                return 0
            }else{

                //Calcul d'age par internet
                //https://www.folkstalk.com/2022/07/calculate-age-from-date-of-birth-javascript-with-code-examples.html
                
                var today = new Date();
                var birthDate = new Date(this.p.pat_date_naiss);
                var age = today.getFullYear() - birthDate.getFullYear();
                var m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) 
                {
                    age--;
                }
                return age;
            }
        }
    },
    methods:{
        async addPatient(){
            this.submitted = true
            this.isLoading = true

            //Mise en majuscule du nom et prenom du patient
            
            try {
                const _r = await this.$http.post('api/dt/patient',this.p)
                let _d = _r.data
                console.log(_d)
                if(_d.status){
                    this.$emit('validate')
                    this.showNotif('success',`Ajout d'un patient`,_d.message)
                }else{
                    this.showNotif('error',`Ajout d'un patient`,_d.message)
                }

            } catch (e) {
                this.showNotifServerError()
                console.log(e)
            }

            this.isLoading = false
        },
        reinit(){
            this.submitted = false

            this.p = {
                pat_sexe:'M',
                pat_numero:'',
                pat_date_naiss:'',
                pat_adresse:'',
                pat_profession:'',
                pat_nom_et_prenom:''
            }
        }
    }
}
</script>