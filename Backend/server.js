// server.js
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

// KREDENSIAL ADMIN STATIS (Hanya digunakan untuk LOGIN endpoint)
const STATIC_USERNAME = "admin";
const STATIC_PASSWORD = "informatikasakti";
const STATIC_NAME = "Admin SAKTI";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection Pool
const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
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
    console.error(
      "Database connection failed. Check your .env file:",
      err.message
    );
    process.exit(1);
  });

// ==================== AUTH ENDPOINT (TETAP DIPERLUKAN UNTUK LOGIN) ====================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Username dan password diperlukan." });
    }

    const usernameMatch = username === STATIC_USERNAME;
    const passwordMatch = password === STATIC_PASSWORD;

    if (usernameMatch && passwordMatch) {
      // Buat Mock Token (Token tetap dibuat, tapi API lain tidak memerlukannya)
      const token = "mock-jwt-token-1-" + new Date().getTime();
      return res.json({
        success: true,
        message: "Login Berhasil",
        data: {
          token,
          name: STATIC_NAME,
          username: STATIC_USERNAME,
        },
      });
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Username atau Password salah." });
    }
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat login.",
    });
  }
});

// ==================== SCAN ENDPOINT ====================
app.post("/api/scan", async (req, res) => {
  // KODE SAMA DENGAN VERSI SEBELUMNYA
  try {
    const { cardId, scheduleCode } = req.body;

    if (!cardId || !scheduleCode) {
      return res.status(400).json({
        success: false,
        message: "Card ID dan Schedule Code tidak boleh kosong.",
      });
    }

    const [schedule] = await pool.query(
      "SELECT id, title, start_time, end_time FROM schedules WHERE code = ?",
      [scheduleCode]
    );
    if (schedule.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Kode sesi tidak valid." });
    }
    const session = schedule[0];
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = session.start_time.split(":").map(Number);
    const [endH, endM] = session.end_time.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (nowMinutes < startMinutes || nowMinutes > endMinutes) {
      await pool.query(
        "INSERT INTO invalid_scans (card_id, scan_time, status) VALUES (?, NOW(), 'Sesi Tidak Aktif')",
        [cardId]
      );
      return res.status(400).json({
        success: false,
        message: `Sesi ${session.title} tidak aktif saat ini (${session.start_time}-${session.end_time}).`,
      });
    }

    const [students] = await pool.query(
      "SELECT id, name, nim, rfid_card_id FROM students WHERE rfid_card_id = ?",
      [cardId]
    );

    if (students.length > 0) {
      const student = students[0];

      const today = new Date().toISOString().split("T")[0];
      const [existingAttendance] = await pool.query(
        "SELECT id FROM attendances WHERE student_id = ? AND schedule_code = ? AND DATE(scan_time) = ?",
        [student.id, scheduleCode, today]
      );

      if (existingAttendance.length > 0) {
        return res.status(200).json({
          success: true,
          alreadyScanned: true,
          message: `${student.name} sudah absen untuk sesi ini.`,
          data: student,
        });
      }

      const [result] = await pool.query(
        "INSERT INTO attendances (student_id, schedule_code, scan_time) VALUES (?, ?, NOW())",
        [student.id, scheduleCode]
      );

      return res.status(200).json({
        success: true,
        message: `Absensi berhasil! Selamat datang ${student.name} di ${session.title}`,
        data: {
          attendanceId: result.insertId,
          ...student,
          scanTime: new Date().toISOString(),
        },
      });
    } else {
      const [result] = await pool.query(
        "INSERT INTO invalid_scans (card_id, scan_time, status) VALUES (?, NOW(), 'Tidak Terdaftar')",
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

// ==================== SCHEDULES ENDPOINTS ====================
// JARVIS MODIFICATION: requireAuth DIHAPUS
app.get("/api/schedules/today", async (req, res) => {
  try {
    const todayEng = new Date()
      .toLocaleDateString("en-US", { weekday: "long" })
      .toUpperCase();

    const [schedules] = await pool.query(
      "SELECT title, lecturer, room, code, TIME_FORMAT(start_time, '%H:%i') as start_time, TIME_FORMAT(end_time, '%H:%i') as end_time, day_of_week FROM schedules WHERE day_of_week = ? ORDER BY start_time ASC",
      [todayEng]
    );

    res.json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil jadwal hari ini",
      error: error.message,
    });
  }
});

// ==================== ATTENDANCES ENDPOINTS ====================
// JARVIS MODIFICATION: requireAuth DIHAPUS
app.get("/api/attendances/today", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const [attendances] = await pool.query(
      `SELECT 
            a.id, 
            a.scan_time, 
            s.name, 
            s.nim, 
            s.angkatan,
            sc.title as course_title
            FROM attendances a
            JOIN students s ON a.student_id = s.id
            LEFT JOIN schedules sc ON a.schedule_code = sc.code
            WHERE DATE(a.scan_time) = ?
            ORDER BY a.scan_time DESC`,
      [today]
    );

    res.json({ success: true, count: attendances.length, data: attendances });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data absensi",
      error: error.message,
    });
  }
});

// JARVIS MODIFICATION: requireAuth DIHAPUS
app.get("/api/attendances/session/:scheduleCode", async (req, res) => {
  try {
    const { scheduleCode } = req.params;
    const today = new Date().toISOString().split("T")[0];

    const [attended] = await pool.query(
      `SELECT 
            a.scan_time, 
            s.name, 
            s.nim 
            FROM attendances a
            JOIN students s ON a.student_id = s.id
            WHERE a.schedule_code = ? AND DATE(a.scan_time) = ?
            ORDER BY a.scan_time ASC`,
      [scheduleCode, today]
    );

    const [unattended] = await pool.query(
      `SELECT
                name,
                nim
            FROM
                students s
            WHERE
                NOT EXISTS (
                    SELECT 1
                    FROM attendances a
                    WHERE a.student_id = s.id
                      AND a.schedule_code = ?
                      AND DATE(a.scan_time) = ?
                )
            ORDER BY name ASC`,
      [scheduleCode, today]
    );

    res.json({
      success: true,
      data: { attended, unattended },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data absensi sesi",
      error: error.message,
    });
  }
});

// ==================== INVALID SCANS ENDPOINTS ====================
// JARVIS MODIFICATION: requireAuth DIHAPUS
app.get("/api/invalid-scans", async (req, res) => {
  try {
    const [invalidScans] = await pool.query(
      "SELECT id, card_id, scan_time, status FROM invalid_scans ORDER BY scan_time DESC LIMIT 100"
    );

    res.json({ success: true, count: invalidScans.length, data: invalidScans });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data invalid scans",
      error: error.message,
    });
  }
});

// ==================== STATISTICS ENDPOINTS ====================
// JARVIS MODIFICATION: requireAuth DIHAPUS
app.get("/api/statistics", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const todayEng = new Date()
      .toLocaleDateString("en-US", { weekday: "long" })
      .toUpperCase();

    const [totalStudents] = await pool.query(
      "SELECT COUNT(*) as count FROM students"
    );
    const [todayAttendance] = await pool.query(
      "SELECT COUNT(DISTINCT student_id) as count FROM attendances WHERE DATE(scan_time) = ?",
      [today]
    );
    const [todayInvalidScans] = await pool.query(
      "SELECT COUNT(*) as count FROM invalid_scans WHERE DATE(scan_time) = ?",
      [today]
    );
    const [totalSchedules] = await pool.query(
      "SELECT COUNT(*) as count FROM schedules WHERE day_of_week = ?",
      [todayEng]
    );

    const totalStudentsCount = totalStudents[0].count;
    const todayAttendanceCount = todayAttendance[0].count;

    const attendancePercentage =
      totalStudentsCount > 0
        ? ((todayAttendanceCount / totalStudentsCount) * 100).toFixed(2)
        : 0;

    res.json({
      success: true,
      data: {
        totalStudents: totalStudentsCount,
        totalSchedules: totalSchedules[0].count,
        todayAttendance: todayAttendanceCount,
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
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Endpoint tidak ditemukan" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
