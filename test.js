const bcrypt = require('bcrypt')

bcrypt.hash("angelo", 10, (err, hash)=>{
	console.log(hash)
}) 

//result : $2b$10$OjHU9Pc75UjXN.XDv8tir.8nPRt5ahFxefM/pzq.VMdE8rWXG2G0q