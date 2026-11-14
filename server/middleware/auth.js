const { getUser } = require("../service/auth");

const checkForAuthentication = (req, res, next) => {
    const token = req.cookies?.token;

   
    
    
    req.user = null;
    if (!token) {
        return next()
    }

    const user = getUser(token);
    
    req.user = user;
    next();


}


// function restrictTo(roles) {
//     return function (req,res,next){
//         if(!req.user){
//             return res.render("login required");

//         }

//         if(!roles.includes(req.user.role)){
//             return res.end("UnAuthorized");
//         }
//         return next();
//     }



// }

function restrictTo(roles) {
    return function (req, res, next) {

        if (!req.user) {
            return res.send("Login required");
        }

        if (!roles.includes(req.user.role)) {
            return res.send("Unauthorized");
        }

        next();
    }
}


module.exports={
    checkForAuthentication,
    restrictTo

}

