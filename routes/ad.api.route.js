let router = require('express').Router()
const bcrypt = require('bcrypt')


//midlware spécifique pour la route
router.use((req, res, next) => {
    if(req.user.pr_type  != 'a'){
        return res.send({status:false,mesasge:"Autorisation non suffisante"})
    }
    next();
});

module.exports = router