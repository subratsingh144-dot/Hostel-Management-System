CREATE TABLE complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id VARCHAR(50) NOT NULL,

    

    category ENUM(
    'electricity',
    'furniture',
    'water',
    'wifi',
    'noise',
    'cleaning',
    'other'
) NOT NULL;

    description TEXT,

    status ENUM('pending', 'in_progress', 'resolved') DEFAULT 'pending',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_complaint_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);