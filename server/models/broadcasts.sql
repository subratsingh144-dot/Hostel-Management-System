CREATE TABLE broadcast_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,

    created_by VARCHAR(50) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by)
    REFERENCES users(id)
    ON DELETE CASCADE
);