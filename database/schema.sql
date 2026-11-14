-- Smart Worker Hiring & Service Booking  |  MySQL 8
CREATE DATABASE IF NOT EXISTS smart_worker CHARACTER SET utf8mb4;
USE smart_worker;

DROP TABLE IF EXISTS complaints, reviews, payments, bookings, worker_profiles, categories, users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address VARCHAR(255),
  photo VARCHAR(255),
  role ENUM('customer','worker','admin') NOT NULL DEFAULT 'customer',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL UNIQUE,
  icon VARCHAR(10) DEFAULT '🛠️'
);

CREATE TABLE worker_profiles (
  user_id INT PRIMARY KEY,
  category_id INT NOT NULL,
  skills VARCHAR(255),
  bio TEXT,
  experience_years INT DEFAULT 0,
  service_info VARCHAR(255),
  availability VARCHAR(120) DEFAULT 'Mon-Sat, 9am-6pm',
  is_available TINYINT(1) DEFAULT 1,
  is_verified TINYINT(1) DEFAULT 0,
  lat DECIMAL(10,7) NULL,
  lng DECIMAL(10,7) NULL,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  worker_id INT NOT NULL,
  service_date DATE,
  description VARCHAR(500),
  contact_phone VARCHAR(20) NOT NULL,
  house_address VARCHAR(255) NOT NULL,
  lat DECIMAL(10,7) NULL,
  lng DECIMAL(10,7) NULL,
  -- pending -> accepted -> confirmed(paid) -> in_progress -> completed
  -- pending -> rejected | expired ; early stages -> cancelled
  status ENUM('pending','accepted','confirmed','in_progress','completed','rejected','expired','cancelled') DEFAULT 'pending',
  response_deadline DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (worker_id) REFERENCES users(id)
);

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL UNIQUE,
  amount DECIMAL(8,2) NOT NULL DEFAULT 100.00,
  method VARCHAR(30) DEFAULT 'demo',
  reference VARCHAR(60),
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL UNIQUE,
  customer_id INT NOT NULL,
  worker_id INT NOT NULL,
  rating TINYINT NOT NULL,
  comment VARCHAR(500),
  is_hidden TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (worker_id) REFERENCES users(id)
);

CREATE TABLE complaints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT,
  from_user INT NOT NULL,
  against_user INT,
  message VARCHAR(800) NOT NULL,
  status ENUM('open','resolved') DEFAULT 'open',
  admin_note VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_user) REFERENCES users(id)
);

INSERT INTO categories (name, icon) VALUES
 ('Electrician','⚡'),('Plumber','🚰'),('Carpenter','🪚'),('Painter','🎨'),
 ('AC Repair','❄️'),('Cleaner','🧹'),('Mechanic','🔧');
-- Default admin is created by:  npm run seed   (see README)
