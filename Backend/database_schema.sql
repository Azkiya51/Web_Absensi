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
('Aditya Rahmman Syach', '1247050069', 2024, 'ABC123'),
('Azkiya Fauzan Sri Hidayat', '12470500', 2024, 'DEF456'),
('Faiz Abdullah Fawwaz', '12470500', 2024, 'GHI789');
('Ardyan Fauzi Syakir', '12470500', 2024, 'GHI789');

-- Menggunakan nama hari dalam Bahasa Inggris (sesuai setting 'en-US' di server.js)
-- Ubah 'SATURDAY' ke hari saat ini jika Anda menguji hari ini!
INSERT INTO schedules (title, lecturer, room, code, start_time, end_time, day_of_week) VALUES
('Teori Bahasa dan Otomata', 'Undang Syaripudin M.Kom.', 'R.4.10', 'WIR554221', '12:40:00', '15:10:00', 'THURSDAY'),
('Ulumul Hadits', 'Dr. Deden Suparman S.Ag., M.A.', 'Gedung R.3.9', 'TIK611001', '08:40:00', '10:20:00', 'THURSDAY'),
('Algoritm dan Struktur Data', 'Ichsan Taufik ST., M.T', 'R.4.10', 'TIK611001', '14:40:00', '16:20:00', 'MONDAY'),
('Organisasi dan Arsitektur Komputer ', 'Jumadi ST., M.Cs.', 'R.4.12', 'TIK611001', '15:30:00', '18:00:00', 'MONDAY'),
('Ilmu Tauhid ', 'Drs TAMAMI M.Ag', 'R.4.10', 'TIK611001', '08:40:00 ', '110:20:00', 'MONDAY'),
('Aljabar linear', 'Fahrudin Muhtarulloh S.Si., M.Sc', 'R.3.09', 'TIK611001', '07:00', '09:30', 'MONDAY'),
('Logika Komputasional', 'Eva Nurlatifah M.Sc.', 'R.4.01', 'IK611001', '12:40:00', '12:40:00', 'MONDAY'),
('Intelegensia Buatan', 'Jumadi ST., M.Cs', 'R.4.10', 'TIK611001', '12:40:00 ', '15:10:00', 'MONDAY'),
('Sejarah Peradaban Islam', 'Dr. Gina Giftia Azmiana Delilah', 'R.3.09', 'TIK611001', '08:40:00 ', '10:20:00', 'MONDAY');

INSERT INTO invalid_scans (card_id, status) VALUES
('XYZ999', 'Tidak Terdaftar'),
('AAA111', 'Sesi Tidak Aktif');