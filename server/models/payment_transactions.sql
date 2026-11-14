
CREATE TABLE payment_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,

    payment_id INT NOT NULL,
    paid_amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('upi', 'card', 'cash') NOT NULL,
    paid_date DATE NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    razorpay_signature VARCHAR(255),

    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
);