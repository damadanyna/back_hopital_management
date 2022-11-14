const bcrypt = require('bcrypt')

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
}

module.exports = Utils