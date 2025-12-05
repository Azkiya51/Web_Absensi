const MOCK_USER = {
  username: 'admin',
  password: 'admin123',
  name: 'Admin SAKTI',
  nim: '123456789'
};

const MOCK_SCHEDULE = [
  // 3 Mata Kuliah Awal
  { title: 'Algoritma dan Struktur Data', start: '08:00', end: '09:40', room: 'B-203', code: 'WIR554221', lecturer: 'Dr. Andi', materialUrl: '#', pin: '1234' },
  { title: 'Algoritma dan Struktur Data', start: '09:40', end: '11:20', room: 'B-203', code: 'WIR554222', lecturer: 'Dr. Andi', materialUrl: '#', pin: '5678' },
  { title: 'Algoritma dan Struktur Data', start: '13:00', end: '14:40', room: 'B-203', code: 'WIR554223', lecturer: 'Dr. Andi', materialUrl: '#', pin: '9012' },
  
  // 3 Mata Kuliah Tambahan
  { title: 'Jaringan Komputer', start: '14:40', end: '16:20', room: 'C-301', code: 'TIK611001', lecturer: 'Prof. Budi', materialUrl: '#', pin: '1122' },
  { title: 'Pemrograman Web Lanjut', start: '16:20', end: '18:00', code: 'TIK611002', lecturer: 'Ibu Citra', materialUrl: '#', pin: '3344' },
  { title: 'Basis Data', start: '18:30', end: '20:00', room: 'D-402', code: 'TIK611003', lecturer: 'Dr. Dedi', materialUrl: '#', pin: '5566' }
];

// DATA MOCK UNTUK STATISTIK DASHBOARD
const MOCK_STATS = [
  { label: 'Total Mahasiswa Jurusan', value: 850 },
  { label: 'Total Mahasiswa Semester Ini', value: 245 },
  { label: 'Total Kelas Hari Ini', value: MOCK_SCHEDULE.length }
];

// DATA MOCK UNTUK KARTU INVALID
const MOCK_INVALID_CARDS = [
  { date: '2025-12-01', time: '10:05', uid: '0A1B2C3D', status: 'Tidak Terdaftar', action: 'Hapus' },
  { date: '2025-12-01', time: '11:30', uid: 'F4E5D6C7', status: 'Tidak Terdaftar', action: 'Daftarkan' },
  { date: '2025-12-02', time: '15:20', uid: '99887766', status: 'Sesi Kadaluarsa', action: 'Hapus' },
  { date: '2025-12-03', time: '18:10', uid: '11223344', status: 'Tidak Terdaftar', action: 'Daftarkan' },
  { date: '2025-12-04', time: '09:00', uid: 'AABBCCDD', status: 'Tidak Terdaftar', action: 'Daftarkan' },
  { date: '2025-12-04', time: '14:15', uid: '1A2B3C4D', status: 'Tidak Terdaftar', action: 'Daftarkan' },
];

// DATA MOCK: Mahasiswa yang Sudah Absen Hari Ini (Digunakan di Dashboard)
const MOCK_ATTENDED_STUDENTS = [
    { nim: '2101001', name: 'Budi Santoso', course: 'Algoritma dan Struktur Data', time: '08:05' },
    { nim: '2101005', name: 'Siti Aminah', course: 'Algoritma dan Struktur Data', time: '09:50' },
    { nim: '2101010', name: 'Joko Susilo', course: 'Jaringan Komputer', time: '15:00' },
    { nim: '2101015', name: 'Dewi Lestari', course: 'Pemrograman Web Lanjut', time: '16:35' },
];

// DATA MOCK: Absensi berdasarkan Kode Mata Kuliah
const MOCK_SESSION_ATTENDANCE = {
    'WIR554221': [
        { nim: '2101001', name: 'Budi Santoso', time: '08:05' },
        { nim: '2101002', name: 'Citra Dewi', time: '08:08' },
        { nim: '2101003', name: 'Eko Handoko', time: '08:15' },
    ],
    'WIR554222': [
        { nim: '2101005', name: 'Siti Aminah', time: '09:50' },
        { nim: '2101006', name: 'Fandi Kurniawan', time: '09:55' },
    ],
    'TIK611001': [
        { nim: '2101010', name: 'Joko Susilo', time: '15:00' },
    ],
    // Lainnya kosong untuk simulasi
};

// DATA MOCK: Daftar Mahasiswa Penuh (Hanya untuk simulasi, ini akan menentukan siapa yang "Belum Absen")
const MOCK_ALL_STUDENTS = [
    { nim: '2101001', name: 'Budi Santoso' },
    { nim: '2101002', name: 'Citra Dewi' },
    { nim: '2101003', name: 'Eko Handoko' },
    { nim: '2101004', name: 'Fajar Maulana' },
    { nim: '2101005', name: 'Siti Aminah' },
    { nim: '2101006', name: 'Fandi Kurniawan' },
    { nim: '2101007', name: 'Gita Pratiwi' },
    { nim: '2101008', name: 'Hadi Wijaya' },
    { nim: '2101009', name: 'Indah Permata' },
    { nim: '2101010', name: 'Joko Susilo' },
    { nim: '2101011', name: 'Kiki Amelia' },
    { nim: '2101012', name: 'Lia Fitriani' },
    { nim: '2101013', name: 'Maya Sari' },
    { nim: '2101014', name: 'Naufal Rizki' },
    { nim: '2101015', name: 'Dewi Lestari' },
];


function toMinutes(hm){
  const [h,m] = hm.split(':').map(Number);
  return h*60 + m;
}

function getSessionStatus(start, end, nowMinutes = null){
  const now = nowMinutes ?? (()=>{const d=new Date(); return d.getHours()*60 + d.getMinutes()})();
  const s = toMinutes(start), e = toMinutes(end);
  if (now < s) return 'soon';
  if (now >= s && now <= e) return 'live';
  return 'done';
}

function getCurrentSession(){
  const now = new Date();
  const nowMin = now.getHours()*60 + now.getMinutes();
  return MOCK_SCHEDULE.find(s => {
    const st = toMinutes(s.start), en = toMinutes(s.end);
    return nowMin >= st && nowMin <= en;
  }) || null;
}


function isLoggedIn(){
  return !!localStorage.getItem('session');
}
function login(username, password){
  if (username === MOCK_USER.username && password === MOCK_USER.password){
    localStorage.setItem('session', JSON.stringify(MOCK_USER));
    return true;
  }
  return false;
}
function logout(){
  localStorage.removeItem('session');
  location.hash = '#login';
  render();
}

function renderHeader(){
  if (!isLoggedIn()) return;
  const user = JSON.parse(localStorage.getItem('session'));
  const nameEl = document.getElementById('profileNameHeader');
  const avatarEl = document.getElementById('avatarHeader');
  if (nameEl) nameEl.textContent = user.name;
  if (avatarEl) avatarEl.textContent = (user.name.split(' ').map(w=>w[0]).join('')).slice(0,2).toUpperCase();
}

function renderAppShell(){
  const appView = document.getElementById('appView');
  const loginView = document.getElementById('loginView');
  if (!appView || !loginView) return;

  if (isLoggedIn()){
    appView.style.display = 'grid'; // Mengubah dari flex ke grid
    loginView.style.display = 'none';
  } else {
    appView.style.display = 'none';
    loginView.style.display = 'flex';
  }
}

// FUNGSI UNTUK MERENDER DASHBOARD
function renderDashboard(){
    const statsTableBody = document.getElementById('statsTableBody');
    if (statsTableBody) {
        statsTableBody.innerHTML = '';
        
        MOCK_STATS.forEach(stat => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${stat.label}</td>
                <td style="font-weight:700; text-align:right;">${stat.value}</td>
            `;
            statsTableBody.appendChild(row);
        });
    }

    renderAttendedStudents();
    renderInvalidSummary();
}

// FUNGSI UNTUK MERENDER TABEL MAHASISWA YANG SUDAH ABSEN (Dashboard)
function renderAttendedStudents() {
    const tableBody = document.getElementById('attendedTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    MOCK_ATTENDED_STUDENTS.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.nim}</td>
            <td>${student.name}</td>
            <td style="color:#555;">${student.course}</td>
            <td style="text-align:right;">${student.time}</td>
        `;
        tableBody.appendChild(row);
    });
}

// FUNGSI UNTUK MERENDER RINGKASAN KARTU INVALID (Dashboard)
function renderInvalidSummary() {
    const tableBody = document.getElementById('invalidSummaryTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    const summaryData = MOCK_INVALID_CARDS.slice(-4); 

    summaryData.forEach(card => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${card.date}</td>
            <td style="font-weight:600;">${card.uid}</td>
            <td>${card.status}</td>
        `;
        tableBody.appendChild(row);
    });
}


// FUNGSI UNTUK MERENDER JADWAL KE GRID (Digunakan di Masuk Kelas)
function renderScheduleGrid(){
  const grid = document.getElementById('scheduleGrid');
  if (!grid) return;
  grid.innerHTML = '';
  MOCK_SCHEDULE.forEach((s, idx) => {
    const status = getSessionStatus(s.start, s.end);
    const chipClass = status === 'live' ? 'success' : status === 'soon' ? 'soon' : 'done';
    const chipText = status === 'live' ? 'Berlangsung' : status === 'soon' ? 'Belum Mulai' : 'Selesai';

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
        <div>
          <div style="font-weight:800">${s.title}</div>
          <div class="small">Dosen: ${s.lecturer}</div>
        </div>
        <div class="chip ${chipClass}">• ${chipText}</div>
      </div>
      <div class="meta-row">
        <div>🕒 ${s.start} - ${s.end}</div>
        <div>📍 ${s.room}</div>
        <div>🏷️ ${s.code}</div>
      </div>
      <div class="actions">
        <button class="btn purple" data-idx="${idx}" data-action="pilih">PILIH SESI</button>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const idx = parseInt(e.currentTarget.dataset.idx,10);
      const action = e.currentTarget.dataset.action;
      if (action === 'pilih'){
        // Ketika tombol "PILIH SESI" diklik, ubah sesi yang sedang dilihat dan render ulang
        localStorage.setItem('currentSessionIdx', String(idx));
        renderMasukKelas(); 
      }
    });
  });
}

// FUNGSI BARU UNTUK MERENDER TABEL KEHADIRAN SESI (Sudah & Belum Absen)
function renderAttendanceList(sessionCode) {
    const tableContainer = document.getElementById('sessionAttendanceContainer');
    if (!tableContainer) return;
    
    // 1. Ambil data yang sudah absen (Attended)
    const attendedList = MOCK_SESSION_ATTENDANCE[sessionCode] || [];
    const attendedNims = new Set(attendedList.map(s => s.nim));

    // 2. Tentukan yang belum absen (Unattended)
    const unattendedList = MOCK_ALL_STUDENTS.filter(student => !attendedNims.has(student.nim));
    
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
    
    // 3. Gabungkan dan Render (Hadiri di atas, Belum Hadir di bawah)
    const combinedList = [
        ...attendedList.map(s => ({ ...s, status: 'Hadir', time: s.time, style: 'color: #1d7a32; font-weight: 600;' })),
        ...unattendedList.map(s => ({ ...s, status: 'Belum Hadir', time: '-', style: 'color: #9b1c1c;' }))
    ];

    if (combinedList.length === 0) {
        tableHtml += `<tr><td colspan="4" style="text-align: center; color: #777;">Tidak ada mahasiswa terdaftar untuk sesi ini.</td></tr>`;
    } else {
        combinedList.sort((a, b) => a.status.localeCompare(b.status)); // Urutkan Hadir/Belum Hadir
        combinedList.forEach(student => {
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
}


// FUNGSI UNTUK MERENDER KARTU INVALID
function renderKartuInvalid(){
  const tableBody = document.getElementById('invalidTableBody');
  if (!tableBody) return;
  tableBody.innerHTML = '';
  
  MOCK_INVALID_CARDS.forEach(card => {
      const isDaftarkan = card.action === 'Daftarkan';
      const buttonClass = isDaftarkan ? '' : 'danger';
      const row = document.createElement('tr');
      row.innerHTML = `
          <td style="color:#555;">${card.date}</td>
          <td>${card.time}</td>
          <td style="font-weight:600;">${card.uid}</td>
          <td>${card.status}</td>
          <td style="text-align: center;">
              <button class="btn-action ${buttonClass}" data-action="${card.action.toLowerCase()}" data-uid="${card.uid}">
                  ${card.action}
              </button>
          </td>
      `;
      tableBody.appendChild(row);
  });
  
  // Tambahkan listener untuk tombol Action
  tableBody.querySelectorAll('.btn-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
          const uid = e.currentTarget.dataset.uid;
          const action = e.currentTarget.dataset.action;
          alert(`Action: ${action.toUpperCase()} UID ${uid}`);
          // Di aplikasi nyata, ini akan memicu modal atau API call
      });
  });
}

function renderRoute(){
  const route = location.hash || (isLoggedIn() ? '#dashboard' : '#login');

  const dash = document.getElementById('dashboardPage');
  const mk = document.getElementById('masukKelasPage');
  const ki = document.getElementById('kartuInvalidPage');
  if (dash) dash.style.display = 'none';
  if (mk) mk.style.display = 'none';
  if (ki) ki.style.display = 'none';

  // Logika untuk menandai tombol navigasi yang aktif
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

  if (route.startsWith('#dashboard')){
    if (dash){ 
        dash.style.display = 'block'; 
        renderDashboard(); 
        document.getElementById('navDashboard')?.classList.add('active');
    }
  } else if (route.startsWith('#masuk-kelas')){
    if (mk){ 
        mk.style.display = 'block'; 
        renderMasukKelas(); 
        document.getElementById('navMasukKelas')?.classList.add('active');
    }
  } else if (route.startsWith('#kartu-invalid')){ 
    if (ki){
        ki.style.display = 'block';
        renderKartuInvalid(); 
        document.getElementById('navKartuInvalid')?.classList.add('active');
    }
  }
}

// FUNGSI UNTUK LOGIKA DOSEN (LIHAT DAFTAR HADIR)
function renderMasukKelas(){
  const selectedIdx = localStorage.getItem('currentSessionIdx');
  let session = null;
  if (selectedIdx !== null && MOCK_SCHEDULE[parseInt(selectedIdx,10)]){
    session = MOCK_SCHEDULE[parseInt(selectedIdx,10)];
  } else {
    session = getCurrentSession() || MOCK_SCHEDULE[0];
  }
  
  if (!session) return;


  const titleEl = document.getElementById('mkTitle');
  const subEl = document.getElementById('mkSubtitle');
  const timeEl = document.getElementById('mkTime');
  const roomEl = document.getElementById('mkRoom');
  const codeEl = document.getElementById('mkCode');
  
  if (titleEl) titleEl.textContent = session.title;
  if (subEl) subEl.textContent = `Dosen: ${session.lecturer}`;
  if (timeEl) timeEl.textContent = `${session.start} - ${session.end}`;
  if (roomEl) roomEl.textContent = `Ruang ${session.room}`;
  if (codeEl) codeEl.textContent = session.code;

  // Cek apakah daftar hadir sedang ditampilkan
  const isListOpen = document.getElementById('sessionAttendanceContainer')?.innerHTML.includes('Daftar Kehadiran Sesi');

  const attEl = document.getElementById('mkAttendance');
  // Atur status attendance menjadi status kelas (Live/Soon/Done)
  const statusClass = getSessionStatus(session.start, session.end);
  attEl.textContent = `Status Sesi: ${statusClass === 'live' ? 'Berlangsung' : statusClass === 'soon' ? 'Belum Mulai' : 'Selesai'}`;


  const ok = document.getElementById('mkStatusBanner');
  const err = document.getElementById('mkErrorBanner');
  if (ok) ok.style.display = 'none';
  if (err) err.style.display = 'none';

  const btn = document.getElementById('btnMasukKelas');
  if (!btn) return;
  
  // LOGIKA UNTUK DOSEN
  btn.disabled = false;
  btn.textContent = isListOpen ? 'SEMBUNYIKAN DAFTAR HADIR' : 'LIHAT DAFTAR HADIR';
  
  // Jika daftar hadir sudah terbuka, tampilkan ulang (untuk update konten)
  if (isListOpen){
      renderAttendanceList(session.code);
  } else {
      // Sembunyikan jika belum dibuka
      const container = document.getElementById('sessionAttendanceContainer');
      if (container) container.innerHTML = '';
  }

  // LOGIKA ONCLICK BARU
  btn.onclick = ()=>{
    const container = document.getElementById('sessionAttendanceContainer');
    
    // Jika daftar hadir sedang terbuka, sembunyikan
    if (btn.textContent === 'SEMBUNYIKAN DAFTAR HADIR'){
        container.innerHTML = '';
        btn.textContent = 'LIHAT DAFTAR HADIR';
        
        // Sembunyikan semua banner saat menyembunyikan daftar hadir
        if (ok) ok.style.display = 'none';
        if (err) err.style.display = 'none';
        return;
    }

    // Jika belum terbuka, tampilkan
    const status = getSessionStatus(session.start, session.end);
    if (status !== 'live'){
      if (err){
        err.textContent = 'Perhatian: Sesi sedang tidak berlangsung. Absensi via kartu RFID tidak aktif.';
        err.style.display = 'block';
      }
    } else {
        if (ok){
            ok.textContent = 'Sesi sedang berlangsung. Kartu RFID aktif untuk absensi.';
            ok.style.display = 'block';
        }
    }
    
    // Panggil fungsi rendering daftar hadir
    renderAttendanceList(session.code);
    btn.textContent = 'SEMBUNYIKAN DAFTAR HADIR';
  };
  
  // Panggil fungsi rendering jadwal di sini
  renderScheduleGrid();
}


function wireLogin(){
  const loginBtn = document.getElementById('loginBtn');
  if (!loginBtn) return;
  loginBtn.addEventListener('click', ()=>{
    const uEl = document.getElementById('username');
    const pEl = document.getElementById('password');
    const u = (uEl?.value || '').trim();
    const p = (pEl?.value || '').trim();
    if (login(u, p)){
      location.hash = '#dashboard';
      render();
    } else {
      alert('Login gagal. Periksa username dan password.');
    }
  });
}
function wireNav(){
  const navDashboard = document.getElementById('navDashboard');
  const navMasukKelas = document.getElementById('navMasukKelas');
  const navKartuInvalid = document.getElementById('navKartuInvalid');
  const logoutBtn = document.getElementById('logoutBtn');

  if (navDashboard){
    navDashboard.addEventListener('click', ()=>{
      location.hash = '#dashboard';
      render();
    });
  }
  if (navMasukKelas){
    navMasukKelas.addEventListener('click', ()=>{
      location.hash = '#masuk-kelas';
      render();
    });
  }
  if (navKartuInvalid){ 
    navKartuInvalid.addEventListener('click', ()=>{
      location.hash = '#kartu-invalid';
      render();
    });
  }
  if (logoutBtn){
    logoutBtn.addEventListener('click', logout);
  }

  window.addEventListener('hashchange', render);
}
function render(){
  renderHeader();
  renderAppShell();
  renderRoute();
}

document.addEventListener('DOMContentLoaded', ()=>{
  wireLogin();
  wireNav();
  if (!location.hash){
    location.hash = isLoggedIn() ? '#dashboard' : '#login';
  }
  render();
});