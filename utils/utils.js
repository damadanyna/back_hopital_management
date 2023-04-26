const bcrypt = require('bcrypt')
const D = require('../models/data')

class Utils{
    static async hash(p){
        return new Promise((resolve,reject)=>{
            bcrypt.hash(p, 10, function(err, hash) {
                if (err) reject(err)
                resolve(hash)
            });
        })
    }

    static hashCompare(n,cp){
        return new Promise((resolve,reject)=>{
            bcrypt.compare(n, cp, function(err, result) {
                if(err) reject(err)
                resolve(result)
            })
        })
    }

    static isEmail(mail){
        return mail.match(
            /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          );
    }

    static setPrefixZero(nb){
        let _nb = parseInt(nb)
        if(_nb  >= 100) return _nb
        if(_nb >= 10) return `0${_nb}`
        if(_nb < 10) return `00${_nb}`
    }

    static async _mp(){
        return "$2b$10$YGuDHfMe6ZbVNPQURV2Eleehh8SlUXNlEEznVAdoKfuqZX6ZuMmqW" //_master_pass
    }

    static async delOccurStk(){
        //On va récupérer les données 

        //Récupération des articles
        let article = await D.exec_params('select * from article')
        let depot = await D.exec_params('select * from depot')

        //Parcours des articles
        for (let i = 0; i < article.length; i++) {
            const ar = article[i];

            for (let j = 0; j < depot.length; j++) {

                
                const de = depot[j];
            
                //Détection des doublons pour le truc
                let link = await D.exec_params('select * from stock_article where stk_depot_id = ? and stk_art_id = ?',[de.depot_id,ar.art_id])

                if(link.length > 1){
                    //Suppression des autres
                    let stk_ids = link.map(x => x.stk_id )
                    stk_ids.splice(0,1)
                    //Suppression des autres occurences
                    await  D.exec_params('delete from stock_article where stk_id in (?)',[stk_ids])

                    console.log(`Rec : ${ar.art_label}, occ : ${link.length}`)
                }
            }
            
        }

        console.log('-- FIN --');
    }
}

module.exports = Utils