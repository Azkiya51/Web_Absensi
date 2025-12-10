// app.js

const API_BASE_URL = "http://localhost:3000/api";
const STATIC_USERNAME = "admin";
const STATIC_PASSWORD = "admin123";
const STATIC_NAME = "Admin SAKTI";

// --- Helper Functions ---

function toMinutes(hm) {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

function getSessionStatus(start, end) {
  const d = new Date();
  const nowMinutes = d.getHours() * 60 + d.getMinutes();
  const s = toMinutes(start),
    e = toMinutes(end);
  if (nowMinutes < s) return "soon";
  if (nowMinutes >= s && nowMinutes <= e) return "live";
  return "done";
}

async function login(username, password) {
  // 1. Cek Kredensial secara lokal
  const usernameMatch = username === STATIC_USERNAME;
  const passwordMatch = password === STATIC_PASSWORD;

  if (usernameMatch && passwordMatch) {
    // 2. Jika cocok, buat 'token' mock dan simpan data
    const token = "mock-client-token-" + new Date().getTime();

    const userData = {
      token,
      name: STATIC_NAME,
      username: STATIC_USERNAME,
    };

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));

    return true; // Login Berhasil
  }

  // 3. Jika tidak cocok
  return false; // Login Gagal
}

async function handleNewStudentRegistration(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  data.angkatan = parseInt(data.angkatan, 10);

  try {
    const response = await fetch(`${API_BASE_URL}/students/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      alert(
        `Pendaftaran ${data.name} berhasil! Log invalid kartu ini telah dihapus.`
      );
      document.body.removeChild(document.getElementById("registrationOverlay"));
      renderKartuInvalid();
    } else {
      alert(`Gagal mendaftar: ${result.message}`);
    }
  } catch (error) {
    console.error("Error submitting student data:", error);
    alert("Terjadi kesalahan jaringan saat menyimpan data.");
  }
}

/**
 * Menampilkan form input untuk mendaftarkan kartu ID baru
 * JARVIS MODIFICATION: Menggunakan class CSS untuk modal content dan input fields.
 */
function showRegistrationForm(cardId) {
  let overlay = document.getElementById("registrationOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "registrationOverlay";
    overlay.className = "modal-overlay";
    document.body.appendChild(overlay);
  }

  // Menerapkan class baru untuk modal content
  overlay.innerHTML = `
        <div class="modal-content registration-modal" style="padding: 25px; border-radius: 8px; max-width: 400px; width: 90%;">
            <h3>Pendaftaran Mahasiswa Baru</h3>
            <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #ddd;">ID Kartu RFID: <strong style="color: #333;">${cardId}</strong></div>
            <form id="newStudentForm">
                <input type="hidden" name="rfid_card_id" value="${cardId}">
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: 600; margin-bottom: 5px;">Nama Mahasiswa:</label>
                    <input type="text" name="name" required class="form-input" placeholder="Masukkan Nama Lengkap">
                </div>
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: 600; margin-bottom: 5px;">NIM:</label>
                    <input type="text" name="nim" required class="form-input" placeholder="Masukkan Nomor Induk Mahasiswa">
                </div>
                
                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 600; margin-bottom: 5px;">Angkatan (Tahun):</label>
                    <input type="number" name="angkatan" min="2000" max="${new Date().getFullYear()}" required class="form-input" placeholder="${new Date().getFullYear()}">
                </div>

                <div class="modal-actions" style="display: flex; justify-content: space-between; align-items: center;">
                    <button type="submit" class="btn purple" style="padding: 10px 15px;">SIMPAN DATA</button>
                    <button type="button" class="btn danger" id="closeModal" style="padding: 10px 15px; margin-left: 10px;">Batal</button>
                </div>
            </form>
        </div>
    `;

  document.getElementById("closeModal").addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  document
    .getElementById("newStudentForm")
    .addEventListener("submit", handleNewStudentRegistration);

  // Gaya Overlay (dipertahankan di JS agar modal berfungsi, namun bisa dipindahkan ke CSS)
  if (overlay.style) {
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0,0,0,0.6)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = 1000;
  }
}

/**
 * Menghapus log invalid dari database
 */
async function deleteInvalidScan(id) {
  if (
    !confirm(
      `Apakah Anda yakin ingin menghapus log invalid ID ${id}? Aksi ini permanen.`
    )
  ) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/invalid-scans/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (result.success) {
      alert(result.message);
      renderKartuInvalid();
    } else {
      alert(`Gagal menghapus: ${result.message}`);
    }
  } catch (error) {
    console.error("Error deleting scan:", error);
    alert("Terjadi kesalahan jaringan saat menghapus data.");
  }
}

// --- Auth Functions ---

function isLoggedIn() {
  return !!localStorage.getItem("token");
}

// Fungsi login(username, password) berada di atas dan sudah dimodifikasi

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  location.hash = "#login";
  render();
}

// --- Rendering Functions ---

function renderHeader() {
  if (!isLoggedIn()) return;
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const nameEl = document.getElementById("profileNameHeader");
  const avatarEl = document.getElementById("avatarHeader");
  if (nameEl) nameEl.textContent = user.name || "Admin SAKTI";
  if (avatarEl)
    avatarEl.textContent = (
      user.name
        ?.split(" ")
        .map((w) => w[0])
        .join("") || "AM"
    )
      .slice(0, 2)
      .toUpperCase();
}

function renderAppShell() {
  const appView = document.getElementById("appView");
  const loginView = document.getElementById("loginView");
  if (!appView || !loginView) return;

  if (isLoggedIn()) {
    appView.style.display = "grid";
    loginView.style.display = "none";
  } else {
    appView.style.display = "none";
    loginView.style.display = "flex";
  }
}

// --- Dashboard Functions ---

async function renderDashboard() {
  const statsTableBody = document.getElementById("statsTableBody");
  const attendedTableBody = document.getElementById("attendedTableBody");
  const invalidSummaryTableBody = document.getElementById(
    "invalidSummaryTableBody"
  );
  if (statsTableBody)
    statsTableBody.innerHTML =
      '<tr><td colspan="2">Loading Statistik...</td></tr>';
  if (attendedTableBody)
    attendedTableBody.innerHTML =
      '<tr><td colspan="4">Loading Absensi...</td></tr>';
  if (invalidSummaryTableBody)
    invalidSummaryTableBody.innerHTML =
      '<tr><td colspan="3">Loading Log Invalid...</td></tr>';
  try {
    const [statsResponse, attendedResponse, invalidResponse] =
      await Promise.all([
        fetch(`${API_BASE_URL}/statistics`),
        fetch(`${API_BASE_URL}/attendances/today`),
        fetch(`${API_BASE_URL}/invalid-scans`),
      ]);

    if (!statsResponse.ok || !attendedResponse.ok || !invalidResponse.ok) {
      throw new Error("Respon API tidak sukses: " + statsResponse.status);
    }

    const statsData = await statsResponse.json();
    const attendedData = await attendedResponse.json();
    const invalidData = await invalidResponse.json();

    renderStatsTable(statsData.data);
    renderAttendedStudents(attendedData.data);
    renderInvalidSummary(invalidData.data);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    if (statsTableBody)
      statsTableBody.innerHTML =
        '<tr><td colspan="2" style="color:red;">Gagal memuat data! (Cek server/DB)</td></tr>';
  }
}

function renderStatsTable(stats) {
  const statsTableBody = document.getElementById("statsTableBody");
  if (!statsTableBody) return;
  statsTableBody.innerHTML = "";
  const formattedStats = [
    { label: "Total Mahasiswa Terdaftar", value: stats.totalStudents },
    { label: "Total Kelas Hari Ini", value: stats.totalSchedules },
    { label: "Mahasiswa Absen Hari Ini (Unik)", value: stats.todayAttendance },
    {
      label: "Persentase Kehadiran (Unik)",
      value: `${stats.attendancePercentage}%`,
    },
  ];
  formattedStats.forEach((stat) => {
    const row = document.createElement("tr");
    row.innerHTML = `
                <td>${stat.label}</td>
                <td style="font-weight:700; text-align:right;">${stat.value}</td>
            `;
    statsTableBody.appendChild(row);
  });
}

function renderAttendedStudents(attendedList) {
  const tableBody = document.getElementById("attendedTableBody");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  if (attendedList.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="4" style="text-align:center; color:#777;">Belum ada absensi tercatat hari ini.</td></tr>';
    return;
  }

  attendedList.slice(0, 5).forEach((student) => {
    const scanTime = new Date(student.scan_time).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const row = document.createElement("tr");
    row.innerHTML = `
                <td>${student.nim}</td>
                <td>${student.name}</td>
                <td style="color:#555;">${student.course_title || "N/A"}</td>
                <td style="text-align:right;">${scanTime}</td>
            `;
    tableBody.appendChild(row);
  });
}

function renderInvalidSummary(invalidList) {
  const tableBody = document.getElementById("invalidSummaryTableBody");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  if (!Array.isArray(invalidList) || invalidList.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="5" style="text-align:center; color:#777;">Tidak ada log kartu invalid terbaru.</td></tr>';
    return;
  }

  // Batasi misalnya 4 data terbaru di dashboard
  const summaryData = invalidList.slice(0, 4);

  summaryData.forEach((card) => {
    const scanTime = new Date(card.scan_time);

    // Tanggal & jam
    const datePart = scanTime.toLocaleDateString("id-ID");
    const timePart = scanTime.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    // Kalau UID / status kosong, pakai '-'
    const uidText =
      card.card_id && card.card_id.trim() !== "" ? card.card_id : "-";
    const statusText =
      card.status && card.status.trim() !== "" ? card.status : "-";

    const isUnregistered = statusText === "Tidak Terdaftar";
    const actionText = isUnregistered ? "Daftarkan" : "Hapus";
    const buttonClass = isUnregistered ? "purple" : "danger";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${datePart}</td>
      <td>${timePart}</td>
      <td style="font-weight:600;">${uidText}</td>
      <td>${statusText}</td>
      <td style="text-align:center;">
        <button
          class="btn-action-summary ${buttonClass}"
          data-action="${actionText.toLowerCase()}"
          data-uid="${uidText}"
          data-id="${card.id}"
        >
          ${actionText}
        </button>
      </td>
    `;

    tableBody.appendChild(row);
  });

  // Re-use logika tombol dari tabel Kartu Invalid
  tableBody.querySelectorAll(".btn-action-summary").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const uid = e.currentTarget.dataset.uid;
      const action = e.currentTarget.dataset.action;
      const id = e.currentTarget.dataset.id;

      if (action === "daftarkan") {
        showRegistrationForm(uid);
        return;
      }

      if (action === "hapus") {
        deleteInvalidScan(id);
        return;
      }
    });
  });
}

// --- Masuk Kelas Functions ---

let currentScheduleList = [];

async function fetchSchedule() {
  try {
    const response = await fetch(`${API_BASE_URL}/schedules/today`);

    if (!response.ok) return [];

    const data = await response.json();
    if (data.success) {
      currentScheduleList = data.data;
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return [];
  }
}

function getCurrentSession(scheduleList) {
  const selectedIdx = localStorage.getItem("currentSessionIdx");
  if (selectedIdx !== null && scheduleList[parseInt(selectedIdx, 10)]) {
    return scheduleList[parseInt(selectedIdx, 10)];
  }
  const liveSession = scheduleList.find(
    (s) => getSessionStatus(s.start_time, s.end_time) === "live"
  );
  if (liveSession) return liveSession;

  return scheduleList[0] || null;
}

async function renderScheduleGrid() {
  const grid = document.getElementById("scheduleGrid");
  if (!grid) return;
  grid.innerHTML = "Loading jadwal...";
  const scheduleList = await fetchSchedule();
  grid.innerHTML = "";
  if (scheduleList.length === 0) {
    grid.innerHTML =
      '<div style="color:#777; text-align:center; padding: 20px;">Tidak ada jadwal hari ini.</div>';
    return;
  }
  scheduleList.forEach((s, idx) => {
    const status = getSessionStatus(s.start_time, s.end_time);
    const chipClass =
      status === "live" ? "success" : status === "soon" ? "soon" : "done";
    const chipText =
      status === "live"
        ? "Berlangsung"
        : status === "soon"
        ? "Belum Mulai"
        : "Selesai";
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
            <div>
              <div style="font-weight:800">${s.title}</div>
              <div class="small">Dosen: ${s.lecturer}</div>
            </div>
            <div class="chip ${chipClass}">• ${chipText}</div>
          </div>
          <div class="meta-row">
            <div>🕒 ${s.start_time} - ${s.end_time}</div>
            <div>📍 ${s.room || "N/A"}</div>
            <div>🏷️ ${s.code}</div>
          </div>
          <div class="actions">
            <button class="btn purple" data-idx="${idx}" data-action="pilih">PILIH SESI</button>
          </div>
        `;
    grid.appendChild(card);
  });

  grid.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.currentTarget.dataset.idx, 10);
      localStorage.setItem("currentSessionIdx", String(idx));
      renderMasukKelas();
    });
  });
}

async function renderAttendanceList(sessionCode) {
  const tableContainer = document.getElementById("sessionAttendanceContainer");
  if (!tableContainer) return;
  tableContainer.innerHTML =
    '<div style="text-align:center; padding: 20px;">Memuat daftar kehadiran...</div>';
  try {
    // **********************************************
    // JARVIS MODIFICATION: MENGGANTI MOCK DENGAN FETCH API
    // **********************************************

    const response = await fetch(
      `${API_BASE_URL}/attendances/session/${sessionCode}`
    );

    if (!response.ok) {
      throw new Error(`Gagal mengambil data dari API: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Gagal mengambil data absensi sesi.");
    }

    // Ambil data nyata dari backend
    const attendedList = data.data.attended;
    const unattendedList = data.data.unattended;

    // **********************************************
    // AKHIR MODIFIKASI FETCH API
    // **********************************************

    let tableHtml = `
            <div class="card" style="margin-top: 20px;">
                <h3>Daftar Kehadiran Sesi (${attendedList.length} Hadir / ${unattendedList.length} Belum Hadir)</h3>
                
                <table class="data-table" style="width:100%; margin-top: 15px;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--border)">
                            <th style="padding: 10px 0; text-align: left;">NIM</th>
                            <th style="padding: 10px 0; text-align: left;">Nama Mahasiswa</th>
                            <th style="padding: 10px 0; text-align: right;">Status</th>
                            <th style="padding: 10px 0; text-align: right;">Waktu Absen</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
    const combinedList = [
      ...attendedList.map((s) => ({
        ...s,
        status: "Hadir",
        time: new Date(s.scan_time).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        style: "color: #1d7a32; font-weight: 600;",
      })),
      ...unattendedList.map((s) => ({
        ...s,
        status: "Belum Hadir",
        time: "-",
        style: "color: #9b1c1c;",
      })),
    ];

    if (combinedList.length === 0) {
      tableHtml += `<tr><td colspan="4" style="text-align: center; color: #777;">Tidak ada mahasiswa terdaftar untuk sesi ini.</td></tr>`;
    } else {
      // Sorting list agar yang Hadir muncul di atas yang Belum Hadir
      combinedList.sort((a, b) => a.status.localeCompare(b.status));
      combinedList.forEach((student) => {
        tableHtml += `
                            <tr style="${student.style}">
                                <td>${student.nim}</td>
                                    <td>${student.name}</td>
                                    <td style="text-align:right;">${student.status}</td>
                                <td style="text-align:right;">${student.time}</td>
                            </tr>
                        `;
      });
    }

    tableHtml += `
                    </tbody>
                </table>
            </div>
        `;
    tableContainer.innerHTML = tableHtml;
  } catch (error) {
    console.error("Error fetching attendance list:", error);
    tableContainer.innerHTML =
      '<div style="text-align:center; padding: 20px; color:red;">Gagal memuat daftar kehadiran. (Cek koneksi/DB)</div>';
  }
}

async function renderMasukKelas() {
  const scheduleList =
    currentScheduleList.length > 0
      ? currentScheduleList
      : await fetchSchedule(); // 1. Tentukan sesi yang sedang dipilih/live
  const session = getCurrentSession(scheduleList);

  const titleEl = document.getElementById("mkTitle");
  const subEl = document.getElementById("mkSubtitle");
  const timeEl = document.getElementById("mkTime");
  const roomEl = document.getElementById("mkRoom");
  const codeEl = document.getElementById("mkCode");
  const attEl = document.getElementById("mkAttendance");
  const btn = document.getElementById("btnMasukKelas");
  const container = document.getElementById("sessionAttendanceContainer");
  const ok = document.getElementById("mkStatusBanner");
  const err = document.getElementById("mkErrorBanner"); // Reset

  if (ok) ok.style.display = "none";
  if (err) err.style.display = "none";
  if (container) container.innerHTML = "";
  if (btn) btn.disabled = true;

  if (!session) {
    if (titleEl) titleEl.textContent = "Tidak Ada Sesi Terpilih";
    if (subEl) subEl.textContent = "Silakan pilih sesi dari daftar di bawah.";
    if (timeEl) timeEl.textContent = "N/A";
    if (roomEl) roomEl.textContent = "N/A";
    if (codeEl) codeEl.textContent = "N/A";
    if (attEl) attEl.textContent = "Status Sesi: Idle";
    renderScheduleGrid(); // Pastikan jadwal dirender
    return;
  } // 2. Isi detail sesi

  if (titleEl) titleEl.textContent = session.title;
  if (subEl) subEl.textContent = `Dosen: ${session.lecturer}`;
  if (timeEl)
    timeEl.textContent = `${session.start_time} - ${session.end_time}`;
  if (roomEl) roomEl.textContent = `Ruang ${session.room || "N/A"}`;
  if (codeEl) codeEl.textContent = session.code; // 3. Tentukan status sesi dan tampilkan banner

  const statusClass = getSessionStatus(session.start_time, session.end_time);
  const isListOpen = btn?.textContent === "SEMBUNYIKAN DAFTAR HADIR";
  if (attEl)
    attEl.textContent = `Status Sesi: ${
      statusClass === "live"
        ? "Berlangsung"
        : statusClass === "soon"
        ? "Belum Mulai"
        : "Selesai"
    }`;

  if (btn) {
    btn.disabled = false;
    btn.textContent = isListOpen
      ? "SEMBUNYIKAN DAFTAR HADIR"
      : "LIHAT DAFTAR HADIR";
  } // 4. Logika tombol Lihat/Sembunyikan
  if (isListOpen) {
    // Jika sudah terbuka, render ulang daftar hadir (untuk refresh data)
    renderAttendanceList(session.code);
    if (statusClass !== "live") {
      if (err) {
        err.textContent =
          "Perhatian: Sesi sedang tidak berlangsung. Absensi via kartu RFID tidak aktif.";
        err.style.display = "block";
      }
    } else {
      if (ok) {
        ok.textContent =
          "Sesi sedang berlangsung. Kartu RFID aktif untuk absensi. Data daftar hadir akan diperbarui setiap 10 detik.";
        ok.style.display = "block";
      }
    }
  }

  if (btn) {
    btn.onclick = () => {
      if (btn.textContent === "SEMBUNYIKAN DAFTAR HADIR") {
        container.innerHTML = "";
        btn.textContent = "LIHAT DAFTAR HADIR";
        if (ok) ok.style.display = "none";
        if (err) err.style.display = "none";
        return;
      }

      renderAttendanceList(session.code);
      btn.textContent = "SEMBUNYIKAN DAFTAR HADIR";
    };
  }

  renderScheduleGrid();
}

// --- Kartu Invalid Functions ---

async function renderKartuInvalid() {
  const tableBody = document.getElementById("invalidTableBody");
  if (!tableBody) return;
  tableBody.innerHTML =
    '<tr><td colspan="5" style="text-align:center;">Loading Data...</td></tr>';
  try {
    const response = await fetch(`${API_BASE_URL}/invalid-scans`);

    if (!response.ok) return;

    const data = await response.json();
    if (data.success && data.data.length > 0) {
      tableBody.innerHTML = "";

      data.data.forEach((card) => {
        const scanTime = new Date(card.scan_time);

        // Tanggal & jam
        const datePart = scanTime.toLocaleDateString("id-ID");
        const timePart = scanTime.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });

        // Kalau UID / status kosong, pakai '-'
        const uidText =
          card.card_id && card.card_id.trim() !== "" ? card.card_id : "-";
        const statusText =
          card.status && card.status.trim() !== "" ? card.status : "-";

        const isUnregistered = statusText === "Tidak Terdaftar";
        const actionText = isUnregistered ? "Daftarkan" : "Hapus";
        const buttonClass = isUnregistered ? "purple" : "danger";

        const row = document.createElement("tr");

        // URUTAN: Tanggal | Jam | UID | Status | Action
        row.innerHTML = `
  <td>${datePart}</td>
  <td>${timePart}</td>
  <td style="font-weight:600;">${uidText}</td>
  <td>${statusText}</td>
  <td style="text-align:center;">
    <button
      class="btn-action ${buttonClass}"
      data-action="${actionText.toLowerCase()}"
      data-uid="${uidText}"
      data-id="${card.id}"
    >
      ${actionText}
    </button>
  </td>
`;

        tableBody.appendChild(row);
      });

      // JARVIS MODIFICATION: MENGAKTIFKAN LOGIKA PENDAFTARAN/HAPUS
      tableBody.querySelectorAll(".btn-action").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const uid = e.currentTarget.dataset.uid;
          const action = e.currentTarget.dataset.action;
          const id = e.currentTarget.dataset.id; // Ambil ID log invalid

          if (action === "daftarkan") {
            // Membuka modal pendaftaran dengan ID kartu yang dibawa
            showRegistrationForm(uid);
            return;
          }

          if (action === "hapus") {
            // Panggil fungsi delete
            deleteInvalidScan(id);
            return;
          }

          alert(`Action: ${action.toUpperCase()} UID ${uid}.`);
        });
      });
    } else {
      tableBody.innerHTML =
        '<tr><td colspan="5" style="text-align:center; color:#777;">Tidak ada log kartu invalid.</td></tr>';
    }
  } catch (error) {
    console.error("Error fetching invalid scans:", error);
    tableBody.innerHTML =
      '<tr><td colspan="5" style="text-align:center; color:red;">Gagal memuat data invalid scans.</td></tr>';
  }
}

// --- Init and Router ---

/**
 * JARVIS MODIFICATION: Menerapkan try/finally untuk memastikan tombol login di-reset
 */
function wireLogin() {
  const loginBtn = document.getElementById("loginBtn");
  if (!loginBtn) return;
  loginBtn.addEventListener("click", async () => {
    const uEl = document.getElementById("username");
    const pEl = document.getElementById("password");
    const u = (uEl?.value || "").trim();
    const p = (pEl?.value || "").trim();

    loginBtn.textContent = "Memproses...";
    loginBtn.disabled = true;

    try {
      // Panggilan ke fungsi login yang kini berjalan secara statis/cepat
      if (await login(u, p)) {
        location.hash = "#dashboard";
        render();
      } else {
        alert("Login gagal. Periksa username dan password.");
      }
    } catch (error) {
      console.error("Login Handler Error:", error);
      alert("Terjadi kesalahan tak terduga saat login.");
    } finally {
      // Reset tombol dalam semua kasus (sukses, gagal kredensial, gagal jaringan/kesalahan tak terduga)
      loginBtn.textContent = "Login";
      loginBtn.disabled = false;
    }
  });
}

function wireNav() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  window.addEventListener("hashchange", render);
}

function renderRoute() {
  const route = location.hash || (isLoggedIn() ? "#dashboard" : "#login");

  const dash = document.getElementById("dashboardPage");
  const mk = document.getElementById("masukKelasPage");
  const ki = document.getElementById("kartuInvalidPage");
  [dash, mk, ki].forEach((el) => (el ? (el.style.display = "none") : null));

  document
    .querySelectorAll(".nav-btn")
    .forEach((btn) => btn.classList.remove("active"));

  if (route.startsWith("#dashboard")) {
    if (dash) {
      dash.style.display = "block";
      renderDashboard();
      document.getElementById("navDashboard")?.classList.add("active");
    }
  } else if (route.startsWith("#masuk-kelas")) {
    if (mk) {
      mk.style.display = "block";
      renderMasukKelas();
      document.getElementById("navMasukKelas")?.classList.add("active");
    }
  } else if (route.startsWith("#kartu-invalid")) {
    if (ki) {
      ki.style.display = "block";
      renderKartuInvalid();
      document.getElementById("navKartuInvalid")?.classList.add("active");
    }
  }
}

function render() {
  renderHeader();
  renderAppShell();
  if (isLoggedIn()) {
    renderRoute();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  wireLogin();
  wireNav();
  if (!location.hash) {
    location.hash = isLoggedIn() ? "#dashboard" : "#login";
  }
  render();
});
