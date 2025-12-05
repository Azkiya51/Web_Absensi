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
  { title: 'Pemrograman Web Lanjut', start: '16:20', end: '18:00', room: 'A-105', code: 'TIK611002', lecturer: 'Ibu Citra', materialUrl: '#', pin: '3344' },
  { title: 'Basis Data', start: '18:30', end: '20:00', room: 'D-402', code: 'TIK611003', lecturer: 'Dr. Dedi', materialUrl: '#', pin: '5566' }
];

// DATA MOCK BARU UNTUK STATISTIK DASHBOARD
const MOCK_STATS = [
  { label: 'Total Mahasiswa Jurusan', value: 850 },
  { label: 'Total Mahasiswa Semester Ini', value: 245 },
  { label: 'Total Kelas Hari Ini', value: MOCK_SCHEDULE.length }
];

// DATA MOCK BARU UNTUK KARTU INVALID
const MOCK_INVALID_CARDS = [
  { date: '2025-12-01', time: '10:05', uid: '0A1B2C3D', status: 'Tidak Terdaftar', action: 'Hapus' },
  { date: '2025-12-01', time: '11:30', uid: 'F4E5D6C7', status: 'Tidak Terdaftar', action: 'Daftarkan' },
  { date: '2025-12-02', time: '15:20', uid: '99887766', status: 'Sesi Kadaluarsa', action: 'Hapus' },
  { date: '2025-12-03', time: '18:10', uid: '11223344', status: 'Tidak Terdaftar', action: 'Daftarkan' },
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
    const tableBody = document.getElementById('statsTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    
    MOCK_STATS.forEach(stat => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${stat.label}</td>
            <td style="font-weight:700; text-align:right;">${stat.value}</td>
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

// FUNGSI BARU UNTUK MERENDER KARTU INVALID
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
  const ki = document.getElementById('kartuInvalidPage'); // Elemen baru
  if (dash) dash.style.display = 'none';
  if (mk) mk.style.display = 'none';
  if (ki) ki.style.display = 'none'; // Sembunyikan elemen baru

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
  } else if (route.startsWith('#kartu-invalid')){ // Tambahkan rute baru
    if (ki){
        ki.style.display = 'block';
        renderKartuInvalid(); // Panggil fungsi rendering
        document.getElementById('navKartuInvalid')?.classList.add('active');
    }
  }
}

function renderMasukKelas(){
  const selectedIdx = localStorage.getItem('currentSessionIdx');
  let session = null;
  if (selectedIdx !== null && MOCK_SCHEDULE[parseInt(selectedIdx,10)]){
    session = MOCK_SCHEDULE[parseInt(selectedIdx,10)];
  } else {
    // Jika tidak ada sesi yang dipilih, gunakan sesi yang sedang live atau sesi pertama
    session = getCurrentSession() || MOCK_SCHEDULE[0];
  }
  
  // Jika MOCK_SCHEDULE kosong, hentikan rendering
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

  const attendanceKey = `attendance:${session.code}`;
  const hasAttended = localStorage.getItem(attendanceKey) === 'true';
  const attEl = document.getElementById('mkAttendance');
  if (attEl) attEl.textContent = `Status: ${hasAttended ? 'Sudah Absen' : 'Belum Absen'}`;

  const ok = document.getElementById('mkStatusBanner');
  const err = document.getElementById('mkErrorBanner');
  if (ok) ok.style.display = 'none';
  if (err) err.style.display = 'none';

  const btn = document.getElementById('btnMasukKelas');
  if (!btn) return;
  btn.disabled = false;
  btn.textContent = 'MASUK KELAS';
  
  // Perbarui status tombol jika sudah absen
  if (hasAttended){
    btn.disabled = true;
    btn.textContent = 'SUDAH ABSEN';
    if (ok){
        ok.textContent = 'Anda sudah tercatat hadir untuk sesi ini.';
        ok.style.display = 'block';
    }
  }

  btn.onclick = ()=>{
    const status = getSessionStatus(session.start, session.end);
    if (status !== 'live'){
      if (err){
        err.textContent = 'Sesi belum berlangsung atau sudah selesai. Tidak dapat absen.';
        err.style.display = 'block';
      }
      return;
    }
    if (localStorage.getItem(attendanceKey) === 'true'){
      if (ok){
        ok.textContent = 'Anda sudah tercatat hadir untuk sesi ini.';
        ok.style.display = 'block';
      }
      return;
    }
    openPinModal(session.pin, ()=>{
      localStorage.setItem(attendanceKey, 'true');
      if (attEl) attEl.textContent = 'Status: Sudah Absen';
      if (ok){
        ok.textContent = 'Anda berhasil masuk kelas. Kehadiran tercatat.';
        ok.style.display = 'block';
      }
      if (err) err.style.display = 'none';
      btn.disabled = true;
      btn.textContent = 'SUDAH ABSEN';
    });
  };
  
  // Panggil fungsi rendering jadwal di sini
  renderScheduleGrid();
}

function openPinModal(correctPin, onSuccess){
  const backdrop = document.getElementById('modalBackdrop');
  const pinInput = document.getElementById('pinInput');
  const btnCancel = document.getElementById('cancelPin');
  const btnConfirm = document.getElementById('confirmPin');

  if (!backdrop || !pinInput || !btnCancel || !btnConfirm) return;

  backdrop.style.display = 'flex';
  pinInput.value = '';
  pinInput.style.borderColor = '#ddd';
  pinInput.style.background = '#fff';
  pinInput.placeholder = 'Masukkan PIN sesi';
  pinInput.focus();

  function close(){
    backdrop.style.display = 'none';
    btnCancel.removeEventListener('click', close);
    btnConfirm.removeEventListener('click', confirm);
    document.removeEventListener('keydown', escHandler);
  }
  function escHandler(e){ if (e.key === 'Escape') close(); }
  function confirm(){
    const pin = pinInput.value.trim();
    if (pin === correctPin){
      close();
      if (typeof onSuccess === 'function') onSuccess();
    } else {
      pinInput.style.borderColor = '#f1d2d2';
      pinInput.style.background = '#fff5f5';
      pinInput.value = '';
      pinInput.placeholder = 'PIN salah, coba lagi';
    }
  }

  btnCancel.addEventListener('click', close);
  btnConfirm.addEventListener('click', confirm);
  document.addEventListener('keydown', escHandler);
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
  const navKartuInvalid = document.getElementById('navKartuInvalid'); // Elemen baru
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
  if (navKartuInvalid){ // Tambahkan listener untuk menu baru
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