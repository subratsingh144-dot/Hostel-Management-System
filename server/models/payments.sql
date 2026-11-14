CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id VARCHAR(50) NOT NULL,

    amount DECIMAL(10,2) NOT NULL,      -- base rent (e.g. 5000)
    due_date DATE NOT NULL,             -- always 1st of month

    late_fee DECIMAL(10,2) DEFAULT 0,   -- calculated based on rule

    status ENUM('pending', 'paid', 'late') DEFAULT 'pending',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
