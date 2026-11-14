const Razorpay = require("razorpay");
// Load environment variables
const dotenv = require('dotenv');
const path = require('path');

// Always load .env from the server folder
dotenv.config({ path: path.join(__dirname, '../.env') });

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = razorpay;