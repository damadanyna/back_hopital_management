<template>
    <Dialog :maximizable="true" :visible="visible" @update:visible=" ()=>{
            $emit('close') 
        } "  :modal="true" class="p-fluid p-dialog-sm">
        <template #header>
            <span class="text-sm font-bold">Versement de l'encaissement</span>
        </template>
        <div class="flex flex-column ">
            <div class="flex">

                <div class="p-2 border-1 border-round border-200 flex flex-column" style="width: 70%;">
                    <div class="flex flex-column border-bottom-1 border-200">
                        <div class="">
                            <span class="text-sm font-bold"> Date de Versement </span>
                            <Calendar :disabled="!inTypeUser(['m','a','g'])" placeholder="ex : 09/09/1998" v-model="date_verse"  dateFormat="dd/mm/yy" class="p-inputtext-sm"/>  
                        </div>

                        <div class="text-xs">
                            <p> Du <strong> {{ dateToText(date_verse) }} </strong> à 7H du matin jusqu'à <strong> {{ dateToText(date_verse2) }} à 7H du matin </strong> </p>
                            <p> Seul les encaissements validé (encaissé) entre les dates seront récupérés </p>
                            
                        </div>

                    </div>

                    <!-- Détails des encaissements -->
                    <div class="flex border-bottom-1 border-200 py-2">

                        <div class="mr-2 border-1 border-round border-200 p-2 flex flex-column">
                            <span class="text-xs font-bold" > Total encaissements </span>
                            <span class=""> {{ list_enc.length }} </span>
                        </div>

                        <div class="mr-2 border-1 border-round border-200 p-2 flex flex-column">
                            <span class="text-xs font-bold" > Somme Totale </span>
                            <span class=""> {{ somme_total.toLocaleString('fr-CA') }} </span>
                        </div>
                        <div class="mr-2 border-1 border-round border-200 p-2 flex flex-column">
                            <span class="text-xs font-bold" > Total Chèque </span>
                            <span class=""> {{ somme_chq.toLocaleString('fr-CA') }} </span>
                        </div>
                        <div class="mr-2 border-1 border-round border-200 p-2 flex flex-column">
                            <span class="text-xs font-bold" > Total <span class="capitalize">éspèce</span> </span>
                            <span class=""> {{ somme_esp.toLocaleString('fr-CA') }} </span>
                        </div>
                    </div>
                    
                    <div class="flex border-bottom-1 border-200 py-2">
                        <div class="p-2 border-1 border-red-500 border-round flex flex-column" v-if="!versed">
                            <span class=""> Le versement n'a pas encore été fait pour cette date </span>
                            <p class="text-xs"> Vous ne pourrez le faire que le <strong> {{ dateToText(date_verse2) }} </strong> après <strong> 7H du matin </strong>,<br>
                                ET Vous ne pourrez plus faire un versement après avoir validé </p>
                            
                        </div>
                        <div class="p-2 border-1 border-green-500 border-round flex flex-column" v-else>
                            <span class=""> Le versement a déjà été effectué pour cette date </span>
                            <p class="text-xs"> Le versement ne peut plus être modifié,  <br>
                            Le prochain versement sera le {{ dateToText( addDaysDate(date_verse2,1) ) }} après 7H du matin </p>

                        </div>
                    </div>

                    <div class="flex border-bottom-1 border-200 py-2">
                        <div class="flex flex-column">
                            <span class="text-xs font-bold"> Premier Fond de Caisse </span>
                            <InputNumber type="number" class="p-inputtext-sm " disabled v-model="vt.vt_remise" />
                        </div>
                    </div>

                    <div v-if="!versed && can_verse" class="p-2 border-1 border-green-500 border-round flex flex-column">
                        <p class="text-xs flex flex-column">
                            <span class=""> Vous pouvez faire un versement actuellement </span>
                            <span class="" v-if="list_enc.length <= 0"> Mais la liste des encaissement est vide, donc pas besoin de faire un versement. <br>
                            Le prochain versement sera le <strong>{{ dateToText( addDaysDate(date_verse2,1) ) }}</strong> après 7H du matin </span>

                        </p>
                    </div>


                </div>
                <Divider layout="vertical" style="width: 5%;"/>
                <div class="flex flex-column text-sm" style="width: 25%;">
                    <div class="flex mb-1" v-for="b in billets" :key="b">
                        <span style="width:80px" class="p-2 border-1 border-round border-200 text-right"> {{ b.toLocaleString('fr-CA') }} </span>
                        <InputText @change=" calculMontant " v-model="vt.vt_det[b]" class="p-inputtext-sm mx-1" type="number" style="width:60px" />
                        <span style="width:80px" class="p-2 border-1 border-round border-200 text-right"> {{ (b * vt.vt_det[b]).toLocaleString('fr-CA') }} </span>
                    </div>
                    <div class="flex mt-2">
                        <span style="width:140px" class="p-2 border-1 border-round border-200 mr-2"> Réçu </span>
                        <span style="width:80px" class="p-2 border-1 border-round border-200 text-right"> {{ vt.vt_total.toLocaleString('fr-CA') }} </span>
                    </div>
                    <div class="flex mt-2">
                        <span style="width:140px" class="p-2 border-1 border-round border-200 mr-2"> Fond de caisse </span>
                        <span style="width:80px" class="p-2 border-1 border-round border-200 text-right"> {{ vt.vt_remise.toLocaleString('fr-CA') }} </span>
                    </div>
                </div>
            </div>
        </div>
        <template #footer>


            <Button :loading="loading" label="Rapport" class="mr-2 p-button-sm p-button-text p-button-help p-button-raised" icon="pi pi-print" :disabled="!versed" @click="setRapportVersement" />

            <Button label="Valider le versement" class="p-button-sm" icon="pi pi-check" 
            :disabled="versed || list_enc.length <= 0 || !can_verse || vt.vt_total <= 0" @click="postOrUpdate"/>
        </template>
    </Dialog>
</template>

<script>

/*
    Info : 
    - pour la date d'initialisation, on prendra la date d'hier,
    - puis on recupère la liste des encaissement depuis cette  date jusqu'à aujourd'hui à 7H
    - et on fait le somme et tout ça tout ça 

*/
export default {
    props:['visible'],
    watch:{
        visible(a){
            if(a){
                this.init()
                this.getVersement()
            }
        },
        'vt.vt_total'(a){
            this.vt.vt_remise = Math.abs(parseInt(a) - this.somme_total)
        },
        date_verse(a){
            this.init()
            this.getVersement()

            this.date_verse2 = this.addDaysDate(a,1)

            this.calcCanVerse()
        }

    },
    data(){
        return{
            b:[],
            total_perc:0,
            vt:{
                vt_det:{},
                vt_total:0,
                vt_remise:0,
                vt_fond_caisse_soir:0,
                vt_fond_caisse_matin:0
            },

            somme_total:0,
            somme_esp:0,
            somme_chq:0,

            list_enc:[],

            versed:false,

            date_verse:this.subDaysDate(new Date(),1),
            date_verse2:new Date(),

            can_verse:false,
            on_validate_fond:false,
            loading:false
        }
    },
    methods:{
        init(){
            //this.vt.vt_enc_id = e.vt_enc_id
            this.b = []
            this.vt = {
                vt_det:{},
                vt_total:0,
                vt_remise:0,
                vt_fond_caisse_soir:0,
                vt_fond_caisse_matin:0
            }

            // this.date_verse = this.subDaysDate(new Date(),1)
            
            this.somme_total = 0
            this.somme_esp = 0
            this.somme_chq = 0

            this.list_enc = []
            this.setBillets()

            this.versed = false,

            this.can_verse = false

            this.calcCanVerse()

            this.on_validate_fond = false

            this.loading = false
        },
        setBillets(){
            for (let i = 0; i < this.billets.length; i++) {
                const e = this.billets[i];
                this.vt.vt_det[e] = 0
            }
        },
        calcCanVerse(){
            let n = new Date(this.date_verse2)
            n.setHours(7)
            n.setMinutes(0)
            n.setSeconds(0)

            if(new Date() > n){
                this.can_verse = true
            }

            console.log(new Date(),n)
        },
        calculMontant(){
            this.vt.vt_total = 0
            for (let i = 0; i < this.billets.length; i++) {
                const e = this.billets[i];
                this.vt.vt_total += e * this.vt.vt_det[e]
            }
        },
        async getVersement(){
            try {
                const r = await this.$http.get(`api/encaissement/vt`,{params:{date_verse:this.date_verse}})
                let d = r.data

                if(d.status){
                    if(d.vt){
                        this.vt = d.vt
                        this.vt.vt_det = JSON.parse(this.vt.vt_det)
                        this.versed = true
                    }else{
                        this.setBillets()
                        this.versed = false
                    }


                    this.somme_total = d.somme_total
                    this.somme_esp = d.somme_esp
                    this.somme_chq = d.somme_chq

                    this.list_enc = d.enc_list
                }else{
                    this.showNotif('error','Versement Encaissement',d.message)
                }
            } catch (e) {
                console.log(e)
                this.showNotifServerError()
            }
        },

        async postOrUpdate(){
            try {
                this.vt.vt_det = JSON.stringify(this.vt.vt_det)

                let ids_enc = this.list_enc.map(x => parseInt(x.enc_id))

                const r = await this.$http.post(`api/encaissement/vt`,{
                    vt:this.vt,
                    date_verse:this.date_verse,
                    ids_enc
                })
                let d = r.data

                if(d.status){
                    this.getVersement()
                    this.$emit('validate')
                    this.showNotif('success','Versement Encaissement',"Versement bien enregistrer")
                }else{
                    this.showNotif('error','Versement Encaissement',d.message)
                }
            } catch (e) {
                console.log(e)
                this.showNotifServerError()
            }
        },

        async setRapportVersement(){
            this.loading = true
            try {

                const r = await this.$http.get(`api/encaissement/vt/rapport`,{params:{
                    vt_id:this.vt.vt_id,
                }})
                let d = r.data

                if(d.status){
                    this.showNotif('success','Rapport de Versement Journalier','Genéré')
                    window.electronAPI.downFact(`${this.$http.defaults.baseURL}/api/encaissement/vt/rapport/down`)

                    this.loading = false

                }else{
                    this.showNotif('error','Versement Encaissement',d.message)
                }
            } catch (e) {
                console.log(e)
                this.showNotifServerError()
            }
        }
    },
    mounted(){
        
    }
}
</script>