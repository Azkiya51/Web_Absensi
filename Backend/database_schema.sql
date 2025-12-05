-- Buat database
CREATE DATABASE IF NOT EXISTS attendance_db;
USE attendance_db;

-- Tabel students (data mahasiswa terdaftar)
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  nim VARCHAR(20) NOT NULL UNIQUE,
  angkatan YEAR NOT NULL,
  rfid_card_id VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rfid (rfid_card_id),
  INDEX idx_nim (nim),
  INDEX idx_angkatan (angkatan)
);

-- Tabel attendances (riwayat absensi)
CREATE TABLE attendances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_-- Buat database
CREATE DATABASE IF NOT EXISTS attendance_db;
USE attendance_db;

-- Tabel students (data mahasiswa terdaftar)
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  nim VARCHAR(20) NOT NULL UNIQUE,
  angkatan YEAR NOT NULL,
  rfid_card_id VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rfid (rfid_card_id),
  INDEX idx_nim (nim),
  INDEX idx_angkatan (angkatan)
);

-- Tabel attendances (riwayat absensi)
CREATE TABLE attendances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_student_date (student_id, scan_time),
  INDEX idx_scan_time (scan_time)
);

-- Tabel invalid_scans (kartu tidak terdaftar)
CREATE TABLE invalid_scans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  card_id VARCHAR(50) NOT NULL,
  scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_card_id (card_id),
  INDEX idx_scan_time (scan_time)
);

-- Insert data contoh mahasiswa untuk testing
INSERT INTO students (name, nim, angkatan, rfid_card_id) VALUES
('Budi Santoso', '20210001', 2021, 'ABC123'),
('Siti Nurhaliza', '20210002', 2021, 'DEF456'),
('Ahmad Wijaya', '20220001', 2022, 'GHI789'),
('Rina Kusuma', '20220002', 2022, 'JKL012'),
('Doni Prasetyo', '20230001', 2023, 'MNO345');

-- Insert beberapa data invalid scan untuk testing
INSERT INTO invalid_scans (card_id) VALUES
('XYZ999'),
('AAA111'),
('BBB222');

-- Query untuk melihat data
SELECT * FROM students ORDER BY angkatan DESC, name;
SELECT * FROM attendances;
SELECT * FROM invalid_scans ORDER BY scan_time DESC;student_date (student_id, scan_time),
  INDEX idx_scan_time (scan_time)
);

