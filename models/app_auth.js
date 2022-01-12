let connection = require('../config/db')

class AuthApp{
    static check_token(tk,cb){
        let sql = "SELECT * FROM app_token INNER JOIN user ON app_token.user_id= user.id WHERE app_token.token=?"
        connection.query(sql,tk,(err,result) =>{
            cb(err,result)
        })
    }

    static check_token_by_user_id(id,cb){
        let sql = "SELECT * FROM app_token WHERE user_id=?"
        connection.query(sql,id,(err,result) =>{
            cb(err,result)
        })
    }

    static add_token(p,cb){
        connection.query("insert into app_token set ?",p,(e,r) =>{
            cb(e,r)
        })
    }
}

module.exports = AuthApp