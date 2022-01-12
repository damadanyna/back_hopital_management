let router = require('express').Router()
const bcrypt = require('bcrypt')


//midlware spécifique pour la route
router.use((req, res, next) => {
    next();
});

//Users
router.get('/',(req,res)=>{
    let User = require('./../models/user')
    User.all(result=>{
        res.send({status:true,users:result})
    })
})

router.post('/',(req,res)=>{
    //liste des arguments qui devraient être reçu
    let d = ['login','type','pass']
    let error_champ_list = {
        vide:[],
        nulled:[]
    }
    d.forEach(e => {
        if(req.body[e] === undefined){
            error_champ_list.nulled.push(e)
        }else if(req.body[e] === ''){
            error_champ_list.vide.push(e)
        }
    })

    

    if(error_champ_list.nulled.length > 0){
        return res.send({status:false,message:"Erreur de donnée",})
    }else if(error_champ_list.vide.length > 0){
        return res.send({status:false,message:'Tous les champs sont obligatoire'})
    }else {

        if(req.user.type != 'admin' || req.body.type == 'admin'){
            return res.send({status:false,message:"Vous n'avez pas l'autorisation necessaire pour créer cet utilisateur"})
        }

        let User = require('./../models/user')
        bcrypt.hash(req.body.pass, 10, function(err, hash) {
            if(!err){
                req.body.pass = hash
                User.get_by_login(req.body.login,result=>{
                    if(result.length > 0){
                       return res.send({status:false,message:'Le login existe déja.'})
                    }else{
                        User.create_user(req.body,(result)=>{
                            return res.send({status:true,message:'Utilisateur bien ajouté'})
                        })
                    }
                })
            }else{
                return res.send({status:false,message:"Erreur dans le serveur"})
            }
        });
    }
})

router.delete('/:id',(req,res)=>{
    let User = require('./../models/user')

    if(req.user.type == 'admin'){
        User.delete(req.params.id,(err,result)=>{
            if(err){
                console.log(err);
                res.send({status:false,message:'Erreur de la base de donnée, Il est possible que cette donnée n\'existe plus.'})
            }else{
                res.send({status:true,message:'Utilisateur Bien supprimé.'})
            }
        })
    }else{
        res.send({status:false,message:'Vous n\'avez pas l\'autorisation de supprimé cet utilisateur.'})
    }
})

module.exports = router
