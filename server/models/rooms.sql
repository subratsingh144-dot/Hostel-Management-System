CREATE TABLE  rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    floor_id INT NOT NULL,
    room_number INT NOT NULL,
    total_beds INT NOT NULL,
    available_beds INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_room_floor FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE,
    CONSTRAINT unique_room_per_floor UNIQUE (floor_id, room_number)
);
