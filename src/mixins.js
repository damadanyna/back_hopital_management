export default {
    data(){
        return {
            list_jour:['Dimanche','Lundi','Mardi','Mecredi','Jeudi','Vendredi','Samedi'],
            list_mois:['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],

            type_user:[
                {label:"Admin",code:"a"},
                {label:"Personnel",code:"p"},
                {label:"Gestionnaire",code:"g"},
                {label:"Pharmacien",code:"ph"},
                {label:"Magasin",code:"mg"},
            ],
            resultat_final:[
                {label:'Guérison définitive',code:0},
                {label:'Evacuation Sanitaire',code:1},
                {label:'Sotie provisoire',code:2},
                {label:'Décès du patient',code:3}
            ],
            billets:[
                20000,10000,5000,2000,1000,500,200,100,50
            ],
            stock:{
                mvmt_action:[
                    {l:'Entrée',k:'entre'},
                    {l:'Sortie',k:'sortie'},
                ],
                mvmt_type_entre:[
                    {l:'Achat',k:'achat'},
                ],
                mvmt_type_sortie:[
                    {l:'Sortie Interne',k:'sortie-interne'},
                    {l:'Transfert',k:'transfert'},
                    {l:'Vente',k:'vente'},
                    {l:'Produits périmés',k:'produits-perimes'},
                    {l:'Accord',k:'don'},
                ],
                prefix_num:{
                    'achat':'AC',
                    'sortie-interne':'SI',
                    'transfert':'TR',
                    'vente':'VE',
                    'produits-perimes':'PP',
                    'don':'DO'
                }
            },
            mode_paiement:{
                chq:'Chèque',
                esp:'Espèce'
            }
        }
    },
    methods:{
        dateToText(d){
            let t = new Date(d)

            let date = t.getDate()
            let j = this.list_jour[t.getDay()]
            let m = this.list_mois[t.getMonth()]
            let y = t.getFullYear()

            return j+" "+date+" "+m+" "+y
        },
        getTimeDate(d){
            let _d = new Date(d)
            return _d.toLocaleTimeString().substr(0,5)
        },
        async statusConnection(){
            try {
                const _r = await this.$http.get('api/status-connexion')
                let _d = _r.data
                if(_d.status){
                    // this.$store.commit('setUa',_d.ua)
                    this.$store.commit('setUser',_d.u)
                }
            } catch (e) {
                this.showNotif('Erreur de connexion')
            }
        },

        getAgeByDate(d){
            var today = new Date();
            var birthDate = new Date(d);
            var age = today.getFullYear() - birthDate.getFullYear();
            var m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) 
            {
                age--;
            }
            return age;
        },
        hideNotif(){
            this.$store.commit('hide_notif')
        },
        //Notification ...
        showNotif(s,t,m){
            this.$toast.add({severity:s, summary:t, detail:m, life: 3000});
        },
        showNotifServerError(){
            this.showNotif('error','Erreur de connexion','Impossible d\'établir une connexion avec le serveur')  
        },
        dateToInput(d){
           return (new Date(d)).toLocaleString().split(',')[0]
        },
        setListToObjlist(l){
            let obj = []
            for (let i = 0; i < l.length; i++) {
                const e = l[i];
                obj.push({label:e,code:i})
            }
        },
        getTypeEntre(t){
            for (let i = 0; i < this.stock.mvmt_type_entre.length; i++) {
                const e = this.stock.mvmt_type_entre[i];
                if(e.k == t){
                    return e.l
                }
            }
        },
        getTypeSortie(t){
            for (let i = 0; i < this.stock.mvmt_type_sortie.length; i++) {
                const e = this.stock.mvmt_type_sortie[i];
                if(e.k == t){
                    return e.l
                }
            }
        },

        getUserId(){
            return this.$store.state.user.util_id
        },

        addDaysDate(date, days) {
            let result = new Date(date);
            result.setDate(result.getDate() + days);
            return result;
        },
        subDaysDate(date, days) {
            let result = new Date(date);
            result.setDate(result.getDate() - days);
            return result;
        },
        inTypeUser(a){
            return (a.indexOf(this.$store.state.user.util_type) != -1)?true:false
        },
        checkModule(p){
			
			//if(this.inTypeUser(['m','a','g'])) return true
			// alert('sdfgsdf')
			return (this.$store.state.ua.indexOf(p) == -1)?false:true
		}
    },
    filters: {
        lowercase(value) {
            return value.toLowerCase()
        },
        uppercase(v){
            return v.toUpperCase()
        }
    }
}