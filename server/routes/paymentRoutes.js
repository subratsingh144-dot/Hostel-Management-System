const express = require("express");

const router = express.Router();



const {
    handleCreateOrder,
    handleVerifyPayment
} = require("../controller/paymentController");

const { checkForAuthentication } = require("../middleware/auth");
 router.use(checkForAuthentication);

router.post("/create-order", handleCreateOrder);

router.post("/verify-payment", handleVerifyPayment);

module.exports = router;