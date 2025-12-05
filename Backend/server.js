// server.js
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "attendance_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test database connection
pool
  .getConnection()
  .then((connection) => {
    console.log("Database connected successfully");
    connection.release();
  })
  .catch((err) => {
    console.error("Database connection failed:", err.message);
  });

// ==================== SCAN ENDPOINT ====================
// Endpoint untuk menerima scan dari Arduino
app.post("/api/scan", async (req, res) => {
  try {
    const { cardId } = req.body;

    // Validasi input
    if (!cardId) {
      return res.status(400).json({
        success: false,
        message: "Card ID tidak boleh kosong",
      });
    }

    // Cari mahasiswa berdasarkan RFID card ID
    const [students] = await pool.query(
      "SELECT id, name, nim, angkatan, rfid_card_id FROM students WHERE rfid_card_id = ?",
      [cardId]
    );

    // Jika kartu ditemukan di database
    if (students.length > 0) {
      const student = students[0];

      // Cek apakah sudah absen hari ini
      const today = new Date().toISOString().split("T")[0];
      const [existingAttendance] = await pool.query(
        "SELECT id FROM attendances WHERE student_id = ? AND DATE(scan_time) = ?",
        [student.id, today]
      );

      // Jika sudah absen hari ini
      if (existingAttendance.length > 0) {
        return res.status(200).json({
          success: true,
          alreadyScanned: true,
          message: `${student.name} sudah absen hari ini`,
          data: {
            studentId: student.id,
            name: student.name,
            nim: student.nim,
            angkatan: student.angkatan,
            cardId: student.rfid_card_id,
          },
        });
      }

      // Simpan data absensi
      const [result] = await pool.query(
        "INSERT INTO attendances (student_id, scan_time) VALUES (?, NOW())",
        [student.id]
      );

      return res.status(200).json({
        success: true,
        message: `Absensi berhasil! Selamat datang ${student.name}`,
        data: {
          attendanceId: result.insertId,
          studentId: student.id,
          name: student.name,
          nim: student.nim,
          angkatan: student.angkatan,
          cardId: student.rfid_card_id,
          scanTime: new Date().toISOString(),
        },
      });
    }
    // Jika kartu TIDAK ditemukan
    else {
      // Cek apakah card_id ini sudah ada di invalid_scans (untuk menghindari duplikat)
      const [existing] = await pool.query(
        "SELECT id FROM invalid_scans WHERE card_id = ? AND DATE(scan_time) = CURDATE()",
        [cardId]
      );

      // Jika belum ada record hari ini, baru insert
      if (existing.length === 0) {
        const [result] = await pool.query(
          "INSERT INTO invalid_scans (card_id, scan_time) VALUES (?, NOW())",
          [cardId]
        );

        return res.status(404).json({
          success: false,
          message: "Kartu tidak terdaftar!",
          data: {
            invalidScanId: result.insertId,
            cardId: cardId,
            scanTime: new Date().toISOString(),
          },
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "Kartu tidak terdaftar!",
          data: {
            cardId: cardId,
            scanTime: new Date().toISOString(),
          },
        });
      }
    }
  } catch (error) {
    console.error("Error processing scan:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
      error: error.message,
    });
  }
});

// ==================== STUDENTS ENDPOINTS ====================

// Get semua mahasiswa
app.get("/api/students", async (req, res) => {
  try {
    const [students] = await pool.query(
      "SELECT id, name, nim, angkatan, rfid_card_id, created_at FROM students ORDER BY angkatan DESC, name ASC"
    );

    res.json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data mahasiswa",
      error: error.message,
    });
  }
});

// Get mahasiswa by ID
app.get("/api/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [students] = await pool.query(
      "SELECT id, name, nim, angkatan, rfid_card_id, created_at FROM students WHERE id = ?",
      [id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Mahasiswa tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: students[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data mahasiswa",
      error: error.message,
    });
  }
});

// Register mahasiswa baru
app.post("/api/students/register", async (req, res) => {
  try {
    const { name, nim, angkatan, cardId } = req.body;

    // Validasi input
    if (!name || !nim || !angkatan || !cardId) {
      return res.status(400).json({
        success: false,
        message: "Semua field harus diisi (name, nim, angkatan, cardId)",
      });
    }

    // Cek apakah NIM sudah terdaftar
    const [existingNim] = await pool.query(
      "SELECT id FROM students WHERE nim = ?",
      [nim]
    );

    if (existingNim.length > 0) {
      return res.status(400).json({
        success: false,
        message: "NIM sudah terdaftar",
      });
    }

    // Cek apakah card ID sudah terdaftar
    const [existingCard] = await pool.query(
      "SELECT id FROM students WHERE rfid_card_id = ?",
      [cardId]
    );

    if (existingCard.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Card ID sudah terdaftar",
      });
    }

    // Insert mahasiswa baru
    const [result] = await pool.query(
      "INSERT INTO students (name, nim, angkatan, rfid_card_id) VALUES (?, ?, ?, ?)",
      [name, nim, angkatan, cardId]
    );

    // Hapus dari invalid_scans jika ada
    await pool.query("DELETE FROM invalid_scans WHERE card_id = ?", [cardId]);

    res.status(201).json({
      success: true,
      message: "Mahasiswa berhasil didaftarkan",
      data: {
        id: result.insertId,
        name,
        nim,
        angkatan,
        cardId,
      },
    });
  } catch (error) {
    console.error("Error registering student:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mendaftarkan mahasiswa",
      error: error.message,
    });
  }
});

// Update mahasiswa
app.put("/api/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, nim, angkatan, cardId } = req.body;

    // Validasi input
    if (!name || !nim || !angkatan || !cardId) {
      return res.status(400).json({
        success: false,
        message: "Semua field harus diisi (name, nim, angkatan, cardId)",
      });
    }

    // Cek apakah mahasiswa exist
    const [students] = await pool.query(
      "SELECT id FROM students WHERE id = ?",
      [id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Mahasiswa tidak ditemukan",
      });
    }

    // Cek apakah NIM sudah dipakai oleh mahasiswa lain
    const [existingNim] = await pool.query(
      "SELECT id FROM students WHERE nim = ? AND id != ?",
      [nim, id]
    );

    if (existingNim.length > 0) {
      return res.status(400).json({
        success: false,
        message: "NIM sudah digunakan oleh mahasiswa lain",
      });
    }

    // Cek apakah card ID sudah dipakai oleh mahasiswa lain
    const [existingCard] = await pool.query(
      "SELECT id FROM students WHERE rfid_card_id = ? AND id != ?",
      [cardId, id]
    );

    if (existingCard.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Card ID sudah digunakan oleh mahasiswa lain",
      });
    }

    // Update data
    await pool.query(
      "UPDATE students SET name = ?, nim = ?, angkatan = ?, rfid_card_id = ? WHERE id = ?",
      [name, nim, angkatan, cardId, id]
    );

    res.json({
      success: true,
      message: "Data mahasiswa berhasil diupdate",
      data: {
        id,
        name,
        nim,
        angkatan,
        cardId,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengupdate data mahasiswa",
      error: error.message,
    });
  }
});

// Delete mahasiswa
app.delete("/api/students/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah mahasiswa exist
    const [students] = await pool.query(
      "SELECT id, name FROM students WHERE id = ?",
      [id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Mahasiswa tidak ditemukan",
      });
    }

    // Hapus mahasiswa (attendances akan terhapus otomatis karena ON DELETE CASCADE)
    await pool.query("DELETE FROM students WHERE id = ?", [id]);

    res.json({
      success: true,
      message: `Mahasiswa ${students[0].name} berhasil dihapus`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal menghapus mahasiswa",
      error: error.message,
    });
  }
});

// ==================== ATTENDANCES ENDPOINTS ====================

// Get semua data absensi hari ini
app.get("/api/attendances/today", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const [attendances] = await pool.query(
      `SELECT 
        a.id, 
        a.scan_time, 
        s.id as student_id,
        s.name, 
        s.nim, 
        s.angkatan,
        s.rfid_card_id
       FROM attendances a
       JOIN students s ON a.student_id = s.id
       WHERE DATE(a.scan_time) = ?
       ORDER BY a.scan_time DESC`,
      [today]
    );

    res.json({
      success: true,
      count: attendances.length,
      data: attendances,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data absensi",
      error: error.message,
    });
  }
});

// Get absensi by date range
app.get("/api/attendances", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        a.id, 
        a.scan_time, 
        s.id as student_id,
        s.name, 
        s.nim, 
        s.angkatan,
        s.rfid_card_id
      FROM attendances a
      JOIN students s ON a.student_id = s.id
    `;

    const params = [];

    if (startDate && endDate) {
      query += " WHERE DATE(a.scan_time) BETWEEN ? AND ?";
      params.push(startDate, endDate);
    } else if (startDate) {
      query += " WHERE DATE(a.scan_time) >= ?";
      params.push(startDate);
    } else if (endDate) {
      query += " WHERE DATE(a.scan_time) <= ?";
      params.push(endDate);
    }

    query += " ORDER BY a.scan_time DESC";

    const [attendances] = await pool.query(query, params);

    res.json({
      success: true,
      count: attendances.length,
      data: attendances,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data absensi",
      error: error.message,
    });
  }
});

// Get absensi by student ID
app.get("/api/attendances/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const [attendances] = await pool.query(
      `SELECT 
        a.id, 
        a.scan_time, 
        s.name, 
        s.nim, 
        s.angkatan
       FROM attendances a
       JOIN students s ON a.student_id = s.id
       WHERE a.student_id = ?
       ORDER BY a.scan_time DESC`,
      [studentId]
    );

    res.json({
      success: true,
      count: attendances.length,
      data: attendances,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data absensi mahasiswa",
      error: error.message,
    });
  }
});

// ==================== INVALID SCANS ENDPOINTS ====================

// Get data kartu invalid
app.get("/api/invalid-scans", async (req, res) => {
  try {
    const [invalidScans] = await pool.query(
      "SELECT id, card_id, scan_time FROM invalid_scans ORDER BY scan_time DESC LIMIT 100"
    );

    res.json({
      success: true,
      count: invalidScans.length,
      data: invalidScans,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data invalid scans",
      error: error.message,
    });
  }
});

// Delete invalid scan by ID
app.delete("/api/invalid-scans/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      "DELETE FROM invalid_scans WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Data tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "Data invalid scan berhasil dihapus",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal menghapus data invalid scan",
      error: error.message,
    });
  }
});

// Clear all invalid scans
app.delete("/api/invalid-scans", async (req, res) => {
  try {
    await pool.query("DELETE FROM invalid_scans");

    res.json({
      success: true,
      message: "Semua data invalid scans berhasil dihapus",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal menghapus data invalid scans",
      error: error.message,
    });
  }
});

// ==================== STATISTICS ENDPOINTS ====================

// Get statistik umum
app.get("/api/statistics", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Total mahasiswa
    const [totalStudents] = await pool.query(
      "SELECT COUNT(*) as count FROM students"
    );

    // Total absensi hari ini
    const [todayAttendance] = await pool.query(
      "SELECT COUNT(*) as count FROM attendances WHERE DATE(scan_time) = ?",
      [today]
    );

    // Total invalid scans hari ini
    const [todayInvalidScans] = await pool.query(
      "SELECT COUNT(*) as count FROM invalid_scans WHERE DATE(scan_time) = ?",
      [today]
    );

    // Persentase kehadiran hari ini
    const attendancePercentage =
      totalStudents[0].count > 0
        ? ((todayAttendance[0].count / totalStudents[0].count) * 100).toFixed(2)
        : 0;

    res.json({
      success: true,
      data: {
        totalStudents: totalStudents[0].count,
        todayAttendance: todayAttendance[0].count,
        todayInvalidScans: todayInvalidScans[0].count,
        attendancePercentage: parseFloat(attendancePercentage),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil statistik",
      error: error.message,
    });
  }
});

// ==================== UTILITY ENDPOINTS ====================

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint tidak ditemukan",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
