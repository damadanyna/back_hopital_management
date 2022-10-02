let utils = require('../utils/utils')

class User{
    static setLogin(req,res){
        //
        return res.send("T'es dans le login")
    }

    static setRegister(req,res){

        //Ici la liste des champs qu'on a besoin pour l'inscription d'un utilisateur

        //Afaka misafidy entre email na num tel


        let _list = ['email','num','pass','c_pass','type_id','name','last_name']

        // type_id => type de login email sa mot de passe

        //De base tonga dia sady vendeurs no acheteurs  ny utilisateurs enregistré

        //Insertion ana profil alony
        let _pr_user = {

        }


        //Ici c'est le centre d'enregistrement des utilisateurs
        return res.send("T'es dans l'inscription")


    }
}

module.exports = User