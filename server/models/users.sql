

CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,

    
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',


    floor_id INT NULL,
    room_id INT NULL,
    bed_no INT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_floor
       FOREIGN KEY (floor_id)
       REFERENCES floors(id)
       ON DELETE SET NULL,

    CONSTRAINT fk_user_room
       FOREIGN KEY (room_id)
       REFERENCES rooms(id)
       ON DELETE SET NULL

       CONSTRAINT unique_room_bed
       UNIQUE (room_id, bed_no)
);
