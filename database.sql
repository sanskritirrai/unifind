USE unifind;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lost_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    item_name VARCHAR(100),
    category VARCHAR(50),
    description TEXT,
    location VARCHAR(100),
    date_lost DATE,
    status VARCHAR(20) DEFAULT 'lost',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE found_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    item_name VARCHAR(100),
    category VARCHAR(50),
    description TEXT,
    location VARCHAR(100),
    date_found DATE,
    status VARCHAR(20) DEFAULT 'found',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE claims (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lost_item_id INT,
    claimer_id INT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
MODIFY name VARCHAR(100) NOT NULL,
MODIFY email VARCHAR(100) NOT NULL
UNIQUE,
MODIFY password VARCHAR(255) NOT NULL;
-- add updated_at ONLY if missing
SET @col_exists = ( 
SELECT COUNT(*) FROM 
INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME='users' 
AND TABLE_SCHEMA='unifind' 
AND COLUMN_NAME='updated_at' ); 

SET @sql = IF(@col_exists = 0, 
'ALTER TABLE users ADD updated_at 
TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
ON UPDATE CURRENT_TIMESTAMP;',
'SELECT "updated_at already exists in users";' 
); 

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt; 

/* ================= LOST ITEMS ================= */ 
ALTER TABLE lost_items 
MODIFY user_id INT NOT NULL, 
MODIFY item_name VARCHAR(100) NOT NULL; 

SET @col_exists = ( 
SELECT COUNT(*) FROM 
INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME='lost_items' 
AND TABLE_SCHEMA='unifind' 
AND COLUMN_NAME='updated_at' 
); 

SET @sql = IF(@col_exists = 0, 
'ALTER TABLE lost_items ADD updated_at 
TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
ON UPDATE CURRENT_TIMESTAMP;', 
'SELECT "updated_at already exists in lost_items";' 
); 

PREPARE stmt FROM @sql; 
EXECUTE stmt; 
DEALLOCATE PREPARE stmt; 

ALTER TABLE lost_items ADD INDEX (user_id); 

/* ================= FOUND ITEMS ================= */ 

ALTER TABLE found_items 
MODIFY user_id INT NOT NULL, 
MODIFY item_name VARCHAR(100) NOT NULL; 

SET @col_exists = ( 
SELECT COUNT(*) FROM 
INFORMATION_SCHEMA.COLUMNS WHERE 
TABLE_NAME='found_items' 
AND TABLE_SCHEMA='unifind' 
AND COLUMN_NAME='updated_at' 
); 

SET @sql = IF(@col_exists = 0, 
'ALTER TABLE found_items ADD updated_at 
TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
ON UPDATE CURRENT_TIMESTAMP;', 
'SELECT "updated_at already exists in found_items";' 
); 

PREPARE stmt FROM @sql; 
EXECUTE stmt; 
DEALLOCATE PREPARE stmt; 
ALTER TABLE found_items ADD INDEX (user_id); 

/* ================= CLAIMS TABLE ================= */ 

ALTER TABLE claims 
MODIFY lost_item_id INT NOT NULL, 
MODIFY claimer_id INT NOT NULL; 

SET @col_exists = ( 
SELECT COUNT(*) FROM 
INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME='claims' 
AND TABLE_SCHEMA='unifind' 
AND COLUMN_NAME='updated_at' 
); 

SET @sql = IF(@col_exists = 0, 
'ALTER TABLE claims ADD updated_at 
TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
ON UPDATE CURRENT_TIMESTAMP;', 
'SELECT "updated_at already exists in claims";' 
); 

PREPARE stmt FROM @sql; 
EXECUTE stmt; 
DEALLOCATE PREPARE stmt; 
ALTER TABLE claims ADD INDEX (lost_item_id); 
ALTER TABLE claims ADD INDEX (claimer_id);