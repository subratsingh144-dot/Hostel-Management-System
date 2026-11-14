
//.env file config
const dotenv = require('dotenv');
dotenv.config();

const express = require("express");
const app = express();
// const bcrypt = require('bcrypt');

const ejs = require('ejs');
const path=require('path');

const cookieParser = require('cookie-parser');



//databse config
const connection = require("./config/db");
const PORT = process.env.PORT || 3000;



//require user-controler
const{handleUserSignup} = require("./controller/adminController")
const {handleUserLogin} = require("./controller/userController");
const {checkForAuthentication,restrictTo} =require("./middleware/auth")

const staticRoute = require('./routes/staticRoute');
  const paymentRoutes = require("./routes/paymentRoutes");


//use for delete and path like api request
const methodOverride = require('method-override');

//set view engine
app.set("view engine","ejs");
app.set("views", path.resolve("./views"))


//inbuilt middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
//authentication miidleware
// app.use(checkForAuthentication);

app.use(methodOverride('_method'));

app.use(express.static("assets"));


// Create the connection to database
  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL:', err.message);
      return;
    }
    console.log('Connected to MySQL');
  });

//signup
  app.post("/api/auth/signup",restrictTo(['admin']),handleUserSignup);

//login
  app.post("/api/auth/login",handleUserLogin);



  app.use('/',checkForAuthentication, staticRoute);
  app.use("/payment",checkForAuthentication, paymentRoutes);



//home
//  // home
// app.get("/", checkForAuthentication, (req, res) => {
//   //getUserDashboard
//   if (!req.user) {
//     return res.redirect("/api/auth/login");
//   }

//   const username = req.user.username;
//  console.log(username);
//   // Use '?' as a placeholder to prevent SQL Injection
 
//     let q = `SELECT username, email, floor_id, room_id, bed_no FROM users WHERE username = ?`;
  
  

//   connection.query(q, [username], (err, results) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).send("Database Error");
//     }
//     console.log(results);
//     console.log(results[0]);
//     // The render MUST happen inside the callback
//     // results is usually an array, so we take the first element [0]
//     res.render("userDashboard", { 
//       user: results[0] 
//     });
//   });
// });



 

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});

