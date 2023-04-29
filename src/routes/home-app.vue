<template>
	<div class="w-full text-gray-600 flex flex-column items-center justify-center bg-white">
		<Divider  align="left">
			<div class="inline-flex align-items-center">
				<i class="pi pi-users mr-2"></i>
				<b>Applications</b>
			</div>
		</Divider>
		<div class="flex flex-column w-full p-2">
			<div class="flex flex-wrap justify-content-center align-items-center">

				<!-- Pour le patient -->
				<div @click="$router.push({name:'patients'}) " style="width: 15em" v-if="checkModule('fiche-patient') || this.inTypeUser(['a','g','m']) " 
				 class="card m-2 appearance-none cursor-pointer  transition-colors transition-duration-300">
					<div class="header  flex justify-content-center align-items-center">
						<img src="../assets/icons/patient/p1.svg" />
					</div>
					<div class="footer flex align-items-center justify-content-center">
						<span class="font-bold text-xl m-2"> PATIENTS </span> 
					</div>
				</div>

				<!-- CAISSE -->
				<div @click="$router.push({name:((checkModule('caisse-main') || inTypeUser(['a','g','m']) )?'caisse-main':'caisse-disp')}) " style="width: 15em"
				v-if="checkModule('caisse-main') || checkModule('caisse-disp') || this.inTypeUser(['a','g','m'])"
				 class="card m-2 appearance-none cursor-pointer  transition-colors transition-duration-300">
					<div class="header  flex justify-content-center align-items-center">
						<img src="../assets/icons/caisse/caisse.svg" />
					</div>
					<div class="footer flex align-items-center justify-content-center">
						<span class="font-bold text-xl m-2"> CAISSES </span> 
					</div>
				</div>
				
				<!-- STOCK -->
				<div @click="$router.push({name:'stock-fiche'}) " style="width: 15em"
				v-if="checkModule('stock') || this.inTypeUser(['a','g','m'])"
				 class="card m-2 appearance-none cursor-pointer  transition-colors transition-duration-300">
					<div class="header  flex justify-content-center align-items-center">
						<img src="../assets/icons/stock/s1.svg" />
					</div>
					<div class="footer flex align-items-center justify-content-center">
						<span class="font-bold text-xl m-2"> STOCK </span> 
					</div>
				</div>

				<!-- PEC -->
				<div @click="$router.push({name:'pec-index'}) " style="width: 15em"
				v-if="checkModule('prise-en-charge') || this.inTypeUser(['a','g','m'])"
				 class="card m-2 appearance-none cursor-pointer  transition-colors transition-duration-300">
					<div class="header flex justify-content-center align-items-center">
						<img src="../assets/icons/pec/pec.svg" />
					</div>
					<div class="footer flex align-items-center justify-content-center">
						<span class="font-bold text-xl m-2"> PRISE EN CHARGE </span> 
					</div>
				</div>

				<!-- FACTURATION -->
				<div @click="$router.push({name:'hosp'}) " style="width: 15em"
				v-if="inTypeUser(['g','a','m']) || checkModule('facturation')"
				 class="card m-2 appearance-none cursor-pointer  transition-colors transition-duration-300">
					<div class="header flex justify-content-center align-items-center">
						<img src="../assets/icons/facturation/f4.svg" />
					</div>
					<div class="footer flex align-items-center justify-content-center">
						<span class="font-bold text-xl m-2"> FACTURATION </span> 
					</div>
				</div>

				<!-- DENTISTERIE -->
				<div @click="$router.push({name:'dt-patient'}) " style="width: 15em"
				v-if="inTypeUser(['g','a','m']) || checkModule('dentisterie')"
				 class="card m-2 appearance-none cursor-pointer  transition-colors transition-duration-300">
					<div class="header flex justify-content-center align-items-center">
						<img src="../assets/icons/dentisterie/d1.svg" />
					</div>
					<div class="footer flex align-items-center justify-content-center">
						<span class="font-bold text-xl m-2"> DENTISTERIE </span> 
					</div>
				</div>
			</div>	
		</div>
		<Divider v-if="inTypeUser(['g','a','m'])" align="left">
			<div class="inline-flex align-items-center">
				<i class="pi pi-cog mr-2"></i>
				<b>Admin</b>
			</div>
		</Divider>
		<div class="flex justify-content-center align-items_center">
			<!-- TARIFICATION -->
				<div @click="$router.push({name:'tarif-service'}) " style="width: 15em"
				v-if="inTypeUser(['g','a','m'])"
				 class="card m-2 appearance-none cursor-pointer  transition-colors transition-duration-300">
					<div class="header flex justify-content-center align-items-center">
						<img src="../assets/icons/tarification/t0.svg" />
					</div>
					<div class="footer flex align-items-center justify-content-center">
						<span class="font-bold text-xl m-2"> TARIFICATION </span> 
					</div>
				</div>
		</div>
	</div>
</template>

<script>
export default {
	name:"home",
	data(){
		return{
		}
	},
	methods:{
		hoverCard(event){
			console.log(event)
		}
	},

	mounted(){
		// alert('Salut')
		console.log(this.$http.defaults.baseURL)

		window.electronAPI.setTitle("APPlications - MED HLA")

		console.log(this.$store.state)

		// console.log(this.$store.state.ua);
	}
}
</script>

<style scoped>
.card{
	border-radius: 5px;
	height: 300px;
	border:1px solid var(--border-color);
	transition: all 0.3s;

}
.card:hover{
	border:2px solid var(--main-color);
	/* box-shadow: 0 2px 10px; */
}
.card:hover .header{
	background-color: var(--main-color-lite);
	/* box-shadow: 0 2px 10px; */
}
.card .header{
	height: 70%;
	border-top-right-radius: 5px;
	border-top-left-radius: 5px;
	transition: background-color 0.3s;
}
.card .header img{
	height: 70%;
}
.card .footer{
	height: 30%;
}
</style>