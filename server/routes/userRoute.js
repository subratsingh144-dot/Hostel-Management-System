const express = require("express");
const router = express.Router();
const connection = require("../config/db");
const { handleUserDashboard,
  handleUserPaymentGET,
  handleUsercomplaintGET,
  handleAddComplaints,
  handleUserNoticeGET,
  
} = require("../controller/userController");

const { checkForAuthentication } = require("../middleware/auth");
 router.use(checkForAuthentication);


router.get("/UserDashboard", handleUserDashboard);

//payment get
router.get("/payments", handleUserPaymentGET);

router.get("/complaints", handleUsercomplaintGET)
router.post("/complaints",handleAddComplaints);

router.get("/notices",handleUserNoticeGET);







module.exports = router;