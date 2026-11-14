var jwt = require('jsonwebtoken');

// Load environment variables
const dotenv = require('dotenv');
const path = require('path');

// Always load .env from the server folder
dotenv.config({ path: path.join(__dirname, '../.env') });

const secret =process.env.JWT_SECRET_KEY;


function setUser(user){
   
   return jwt.sign({
    id:user.id,
    username:user.username,
    role:user.role
   },secret) 
   
};

function getUser(token){
    if(!token) return null;
    try{
       return jwt.verify(token,secret);

    }catch(err){
       return null;
    }
    
    
};

module.exports= {
    setUser,
    getUser,
}