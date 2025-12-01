
const MOCK_USER = {
  username: 'admin',
  password: 'admin123',
  name: 'Admin SAKTI',
  nim: '123456789'
};

const MOCK_SCHEDULE = [
  { title: 'Algoritma dan Struktur Data', start: '08:00', end: '09:40', room: 'B-203', code: 'WIR554221', lecturer: 'Dr. Andi', materialUrl: '#', pin: '1234' },
  { title: 'Algoritma dan Struktur Data', start: '09:40', end: '11:20', room: 'B-203', code: 'WIR554222', lecturer: 'Dr. Andi', materialUrl: '#', pin: '5678' },
  { title: 'Algoritma dan Struktur Data', start: '13:00', end: '14:40', room: 'B-203', code: 'WIR554223', lecturer: 'Dr. Andi', materialUrl: '#', pin: '9012' }
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
  const headerAction = document.getElementById('headerAction');
  if (!headerAction) return;
  headerAction.style.display = isLoggedIn() ? 'block' : 'none';
}
function renderAppShell(){
  const appView = document.getElementById('appView');
  const loginView = document.getElementById('loginView');
  if (!appView || !loginView) return;

  if (isLoggedIn()){
    appView.style.display = 'flex';
    loginView.style.display = 'none';
    const user = JSON.parse(localStorage.getItem('session'));
    const nameEl = document.getElementById('profileName');
    const idEl = document.getElementById('profileId');
    const avatarEl = document.getElementById('avatar');
    if (nameEl) nameEl.textContent = user.name;
    if (idEl) idEl.textContent = user.nim;
    if (avatarEl) avatarEl.textContent = (user.name.split(' ').map(w=>w[0]).join('')).slice(0,2).toUpperCase();
  } else {
    appView.style.display = 'none';
    loginView.style.display = 'flex';
  }
}
function renderRoute(){
  const route = location.hash || (isLoggedIn() ? '#dashboard' : '#login');

  const dash = document.getElementById('dashboardPage');
  const mk = document.getElementById('masukKelasPage');
  if (dash) dash.style.display = 'none';
  if (mk) mk.style.display = 'none';

  if (route.startsWith('#dashboard')){
    if (dash){ dash.style.display = 'block'; renderDashboard(); }
  } else if (route.startsWith('#masuk-kelas')){
    if (mk){ mk.style.display = 'block'; renderMasukKelas(); }
  }
}
function renderDashboard(){
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
        <button class="btn purple" data-idx="${idx}" data-action="masuk">Masuk Kelas</button>
        <button class="btn" data-idx="${idx}" data-action="materi">Materi</button>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const idx = parseInt(e.currentTarget.dataset.idx,10);
      const action = e.currentTarget.dataset.action;
      const session = MOCK_SCHEDULE[idx];
      if (action === 'materi'){
        window.open(session.materialUrl, '_blank');
      } else if (action === 'masuk'){
        localStorage.setItem('currentSessionIdx', String(idx));
        location.hash = '#masuk-kelas';
        render();
      }
    });
  });
}
function renderMasukKelas(){
  const selectedIdx = localStorage.getItem('currentSessionIdx');
  let session = null;
  if (selectedIdx !== null){
    session = MOCK_SCHEDULE[parseInt(selectedIdx,10)];
  } else {
    session = getCurrentSession() || MOCK_SCHEDULE[0];
  }

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

  const matEl = document.getElementById('mkMaterial');
  if (matEl) matEl.setAttribute('href', session.materialUrl);

  const ok = document.getElementById('mkStatusBanner');
  const err = document.getElementById('mkErrorBanner');
  if (ok) ok.style.display = 'none';
  if (err) err.style.display = 'none';

  const btn = document.getElementById('btnMasukKelas');
  if (!btn) return;
  btn.disabled = false;
  btn.textContent = 'MASUK KELAS';

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