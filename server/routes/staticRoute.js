const express = require("express");
const router = express.Router();

const { checkForAuthentication,restrictTo } = require("../middleware/auth")
const connection = require("../config/db");

const userRoute = require('../routes/userRoute');
const adminRoutes = require('../routes/adminRoute');


router.use('/user', checkForAuthentication,restrictTo(['admin','user']), userRoute);
router.use('/admin',checkForAuthentication,restrictTo(['admin']), adminRoutes);


//signup
router.get("/signup",checkForAuthentication,restrictTo(['admin']), (req, res) => {
  return res.render("signup");
});

//login
router.get("/login", (req, res) => {
  return res.render("login");
})

//logout
router.get("/logout", (req, res) => {
  // 1. Clear the cookie by name (e.g., 'token')
  // 2. It's good practice to pass the same options (httpOnly, secure) used when creating it
  res.clearCookie("token");

  // 3. Redirect to login or home
  return res.redirect("/login");
});

// home
router.get("/", checkForAuthentication, (req, res) => {

  if (!req.user) {
    res.redirect("/login");
  };
  if (req.user.role === "admin") {
    return res.redirect("/admin/adminDashboard");

  }


  if (req.user.role === "user") {
    return res.redirect("/user/userDashboard");
  }
});


module.exports = router;