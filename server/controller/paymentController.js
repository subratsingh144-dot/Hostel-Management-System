const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const connection = require("../config/db");

const handleCreateOrder = async (req, res) => {

    const userId = req.user.id;

    const paymentId = req.body.payment_id;

    const paymentQuery = `
        SELECT *
        FROM payments
        WHERE id = ?
        AND user_id = ?
        AND status != 'paid'
    `;

    connection.query(
        paymentQuery,
        [paymentId, userId],
        async (err, results) => {

            if (err) {
                return res.status(500).send("Database Error");
            }


            if (!results || results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "No payment found for this month"
                });
            }
            const payment = results[0];

            const totalAmount =
                Number(payment.amount) +
                Number(payment.late_fee);

            try {

                const order = await razorpay.orders.create({

                    amount: totalAmount * 100,

                    currency: "INR",

                    receipt: `receipt_${payment.id}`,

                    notes: {
                        payment_id: payment.id,
                        user_id: userId
                    }

                });

                res.json({
                    order,
                    key: process.env.RAZORPAY_KEY_ID
                });

            } catch (error) {

                console.log(error);

                return res.status(500).send("Order creation failed");
            }
        }
    );
};



const handleVerifyPayment = (req, res) => {

    const userId = req.user.id;

    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        payment_id,
        payment_method
    } = req.body;

    const generated_signature = crypto
        .createHmac(
            "sha256",
            process.env.RAZORPAY_KEY_SECRET
        )
        .update(
            razorpay_order_id + "|" + razorpay_payment_id
        )
        .digest("hex");

    if (generated_signature !== razorpay_signature) {

        return res.status(400).json({
            success: false
        });
    }

    const getPaymentQuery = `
        SELECT *
        FROM payments
        WHERE id = ?
        AND user_id = ?
    `;

    connection.query(
        getPaymentQuery,
        [payment_id, userId],
        (err, results) => {

            if (err) {
                return res.status(500).send("Database Error");
            }

            const payment = results[0];

            const totalAmount =
                Number(payment.amount) +
                Number(payment.late_fee);

            const insertTransaction = `
                INSERT INTO payment_transactions (
                    payment_id,
                    paid_amount,
                    payment_method,
                    paid_date,
                    razorpay_order_id,
                    razorpay_payment_id,
                    razorpay_signature
                )
                VALUES (?, ?, ?, CURDATE(), ?, ?, ?)
            `;

            connection.query(
                insertTransaction,
                [
                    payment_id,
                    totalAmount,
                    payment_method,
                    razorpay_order_id,
                    razorpay_payment_id,
                    razorpay_signature
                ],
                (err) => {

                    if (err) {
                        return res.status(500).send("Database Error");
                    }

                    const updatePayment = `
                        UPDATE payments
                        SET status='paid'
                        WHERE id=?
                    `;

                    connection.query(
                        updatePayment,
                        [payment_id],
                        (err) => {

                            if (err) {
                                return res.status(500).send("Database Error");
                            }

                            return res.json({
                                success: true
                            });
                        }
                    );
                }
            );
        }
    );
};

module.exports = {
    handleCreateOrder,
    handleVerifyPayment
};