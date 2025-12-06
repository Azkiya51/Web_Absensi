-- SKRIP SQL LENGKAP OLEH JARVIS

-- Hapus database yang ada untuk memulai dari awal (opsional, tapi disarankan)
DROP DATABASE IF EXISTS attendance_db;
CREATE DATABASE IF NOT EXISTS attendance_db;
USE attendance_db;

-- 1. Tabel students (data mahasiswa terdaftar)
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  nim VARCHAR(20) NOT NULL UNIQUE,
  angkatan YEAR NOT NULL,
  rfid_card_id VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel attendances (riwayat absensi)
CREATE TABLE attendances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  schedule_code VARCHAR(20), 
  scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_student_date (student_id, scan_time), 
  INDEX idx_scan_time (scan_time)
);

-- 3. Tabel invalid_scans (log semua tap kartu tidak terdaftar)
CREATE TABLE invalid_scans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  card_id VARCHAR(50) NOT NULL, 
  scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'Tidak Terdaftar', -- Menambahkan kolom status sesuai kebutuhan backend
  INDEX idx_scan_time (scan_time)
);

-- 4. Tabel schedules (Jadwal Kelas yang berlaku)
CREATE TABLE schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    lecturer VARCHAR(100) NOT NULL,
    room VARCHAR(50),
    code VARCHAR(20) UNIQUE NOT NULL, 
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    day_of_week VARCHAR(10) NOT NULL -- Format nama hari: MONDAY, TUESDAY, etc.
);

-- **********************************************
-- DATA CONTOH
-- **********************************************

INSERT INTO students (name, nim, angkatan, rfid_card_id) VALUES
('Budi Santoso', '2101001', 2021, 'ABC123'),
('Siti Aminah', '2101005', 2021, 'DEF456'),
('Joko Susilo', '2101010', 2021, 'GHI789');

-- Menggunakan nama hari dalam Bahasa Inggris (sesuai setting 'en-US' di server.js)
-- Ubah 'SATURDAY' ke hari saat ini jika Anda menguji hari ini!
INSERT INTO schedules (title, lecturer, room, code, start_time, end_time, day_of_week) VALUES
('Algoritma dan Struktur Data', 'Dr. Andi', 'B-203', 'WIR554221', '08:00:00', '09:40:00', 'SATURDAY'),
('Jaringan Komputer', 'Prof. Budi', 'C-301', 'TIK611001', '14:40:00', '16:20:00', 'SATURDAY');

INSERT INTO invalid_scans (card_id, status) VALUES
('XYZ999', 'Tidak Terdaftar'),
('AAA111', 'Sesi Tidak Aktif');