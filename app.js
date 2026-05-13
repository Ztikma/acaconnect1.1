// ═══════════════════════════════════════════════
//  FUNCIONES CORE & SEGURIDAD
// ═══════════════════════════════════════════════
function escaparHTML(texto) {
  if (!texto) return '';
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

async function comprimirImagen(archivo, calidad = 0.7) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(archivo);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          const archivoComprimido = new File([blob], archivo.name, { type: 'image/jpeg' });
          resolve(archivoComprimido);
        }, 'image/jpeg', calidad);
      };
    };
  });
}

// ═══════════════════════════════════════════════
//  SUPABASE CONFIG
// ═══════════════════════════════════════════════
const SUPA_URL = 'https://tjfpwsnshkuotrimlzgg.supabase.co';
const SUPA_KEY = 'sb_publishable_PuAd91zK6iu3HPywDEaJfQ_YETFwkCd';

async function supaFetch(endpoint, options = {}) {
  const res = await fetch(SUPA_URL + endpoint, {
    ...options,
    headers: {
      'apikey': SUPA_KEY,
      'Authorization': 'Bearer ' + SUPA_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers || {})
    }
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Error ' + res.status);
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

// ═══════════════════════════════════════════════
//  STATE & NAVEGACIÓN
// ═══════════════════════════════════════════════
let currentUser = null;
let selectedCat = null;
let activePill  = 'todos';
let allServices = [];
const PLACEHOLDER_IMGS = { gastronomia: 'https://images.unsplash.com/photo-1504544750208-dc0358e411f5?w=600', hospedaje: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600', servicios: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600', experiencias: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=600' };

function showPage(name, pushState = true) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + name);
  if (!target) return;
  target.classList.add('active');
  document.documentElement.scrollTop = 0;
  
  const navMenu = document.getElementById('nav-menu');
  if(navMenu) navMenu.classList.remove('open');

  const nav = document.getElementById('main-nav');
  if (name === 'home') nav.classList.remove('scrolled');
  else nav.classList.add('scrolled');

  if (name === 'marketplace') loadServices();
  if (name === 'about') {
    fetchAcapulcoWeather();
    const container = document.getElementById('stats-grid-container');
    if (container) {
      container.classList.remove('animated');
      document.querySelectorAll('.count-up').forEach(c => c.innerText = '0');
    }
  }
  
  if (pushState) window.history.pushState({ page: name }, '', `#${name}`);
}

window.onpopstate = (e) => { if (e.state && e.state.page) showPage(e.state.page, false); };
window.addEventListener('scroll', () => {
  if (document.getElementById('page-home').classList.contains('active')) {
    document.getElementById('main-nav').classList.toggle('scrolled', window.scrollY > 80);
  }
});
document.getElementById('nav-toggle').addEventListener('click', () => document.getElementById('nav-menu').classList.toggle('open'));

// ═══════════════════════════════════════════════
//  MARKETPLACE
// ═══════════════════════════════════════════════
async function loadServices() {
  const grid = document.getElementById('cards-grid');
  grid.innerHTML = Array(6).fill('<div class="skeleton"></div>').join('');
  try {
    const data = await supaFetch('/rest/v1/servicios?select=*,usuarios(nombre,telefono)&estado=eq.activo&order=creado_en.desc');
    allServices = data;
    renderCards();
  } catch(e) { grid.innerHTML = '<div class="empty-state">⚠️ Error cargando servicios</div>'; }
}

function renderCards() {
  const query = (document.getElementById('search-input').value || '').toLowerCase();
  const grid = document.getElementById('cards-grid');
  let filtered = allServices.filter(s => (activePill === 'todos' || s.categoria === activePill) && (!query || s.titulo.toLowerCase().includes(query)));
  document.getElementById('mkt-count').textContent = filtered.length + ' resultados';
  
  if (!filtered.length) { grid.innerHTML = '<div class="empty-state">🔍 No se encontraron servicios.</div>'; return; }
  
  window.filteredServices = filtered;
  grid.innerHTML = filtered.map((s, idx) => `
    <div class="card" onclick="openDetailByIdx(${idx})">
      <div class="card-img">
        <img src="${s.imagen_url || PLACEHOLDER_IMGS[s.categoria]}" alt="${escaparHTML(s.titulo)}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMGS.servicios}'"/>
        <div class="card-badge">${s.categoria}</div>
        <div class="card-price"><strong>$${Number(s.precio).toLocaleString('es-MX')}</strong>/${escaparHTML(s.precio_tipo)}</div>
      </div>
      <div class="card-body">
        <h3>${escaparHTML(s.titulo)}</h3>
        <div class="card-loc">📍 ${escaparHTML(s.ubicacion)}</div>
      </div>
    </div>`).join('');
}
function filterPill(el) { document.querySelectorAll('.pill').forEach(p => p.classList.remove('active')); el.classList.add('active'); activePill = el.dataset.cat; renderCards(); }
function filterCards() { renderCards(); }
function sortCards(val) {
  if (val === 'precio-asc') allServices.sort((a,b) => a.precio - b.precio);
  else if (val === 'precio-desc') allServices.sort((a,b) => b.precio - a.precio);
  else allServices.sort((a,b) => new Date(b.creado_en) - new Date(a.creado_en));
  renderCards();
}

// ═══════════════════════════════════════════════
//  PUBLICAR & UPLOAD
// ═══════════════════════════════════════════════
let mainPhotoFile = null; let extraPhotoFiles = [null, null, null, null];
function selectCat(btn) { document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); selectedCat = btn.dataset.cat; }
function updateCount() { document.getElementById('char-count').textContent = document.getElementById('pub-desc').value.length + '/500'; }
function handleDrag(e, id) { e.preventDefault(); } function handleDragLeave(e, id) {} 
function handleDrop(e, type, idx) { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f) processFile(f, type, idx); }
function handleFileSelect(input, type, idx) { const f = input.files[0]; if(f) processFile(f, type, idx); }

function processFile(file, type, idx) {
  if (!file.type.startsWith('image/')) return showToast('⚠️ Solo imágenes');
  const reader = new FileReader();
  reader.onload = e => {
    if (type === 'main') {
      mainPhotoFile = file;
      document.getElementById('preview-main').innerHTML = `<img src="${e.target.result}" style="width:100px; height:100px; object-fit:cover; border-radius:10px; margin-top:10px;"/><button onclick="removeMain()" style="margin-left:10px; color:red; cursor:pointer; background:none; border:none;">X Quitar</button>`;
      document.getElementById('main-drop').style.display = 'none';
    } else {
      extraPhotoFiles[idx] = file;
      document.getElementById('slot-'+idx).innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;"/><button onclick="removeExtra(${idx})" style="position:absolute;top:0;right:0;background:red;color:#fff;border:none;cursor:pointer;">X</button>`;
    }
  };
  reader.readAsDataURL(file);
}
function removeMain() { mainPhotoFile = null; document.getElementById('preview-main').innerHTML = ''; document.getElementById('main-drop').style.display = 'block'; }
function removeExtra(idx) { extraPhotoFiles[idx] = null; document.getElementById('slot-'+idx).innerHTML = `<input type="file" onchange="handleFileSelect(this,'extra',${idx})"/><span>+</span>`; }

async function uploadToStorage(file, folder) {
  const name = folder + '/' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.jpg';
  const res = await fetch(SUPA_URL + '/storage/v1/object/servicios/' + name, { method: 'POST', headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY, 'Content-Type': file.type }, body: file });
  if (!res.ok) throw new Error('Error subiendo imagen');
  return SUPA_URL + '/storage/v1/object/public/servicios/' + name;
}

async function publishService() {
  if (!currentUser) return showToast('Inicia sesión para publicar');
  const titulo = document.getElementById('pub-title').value; const precio = document.getElementById('pub-price').value; const desc = document.getElementById('pub-desc').value;
  if (!titulo || !selectedCat || !precio || !desc || !mainPhotoFile) return showToast('⚠️ Completa los campos y sube foto');
  
  const btn = document.querySelector('.btn-publish'); btn.textContent = 'Subiendo...'; btn.disabled = true;
  try {
    const mainComp = await comprimirImagen(mainPhotoFile);
    const mainURL = await uploadToStorage(mainComp, 'servicios/' + currentUser.id);
    
    await supaFetch('/rest/v1/servicios', {
      method: 'POST',
      body: JSON.stringify({ usuario_id: currentUser.id, titulo, descripcion: desc, categoria: selectedCat, precio: parseFloat(precio), precio_tipo: document.getElementById('pub-price-type').value, ubicacion: document.getElementById('pub-location').value, imagen_url: mainURL, estado: 'pendiente', activo: true })
    });
    showToast('✅ Servicio enviado a revisión');
    showPage('marketplace');
  } catch(e) { showToast('❌ Error: ' + e.message); } finally { btn.textContent = 'Publicar Servicio'; btn.disabled = false; }
}

// ═══════════════════════════════════════════════
//  ACAPULCO EDITORIAL (CLIMA Y ANIMACIÓN)
// ═══════════════════════════════════════════════
async function fetchAcapulcoWeather() {
  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=16.8531&longitude=-99.8237&current_weather=true');
    const data = await res.json();
    document.getElementById('weather-temp').textContent = Math.round(data.current_weather.temperature) + '°';
  } catch (e) { document.getElementById('weather-temp').textContent = '29°'; }
}

function animateCounters() {
  document.querySelectorAll('.count-up').forEach(counter => {
    const target = +counter.getAttribute('data-target');
    const start = performance.now();
    const update = (time) => {
      const prog = Math.min((time - start) / 2000, 1);
      const ease = 1 - Math.pow(1 - prog, 4);
      counter.innerText = Math.floor(target * ease).toLocaleString('en-US');
      if (prog < 1) requestAnimationFrame(update);
      else counter.innerText = target.toLocaleString('en-US');
    };
    requestAnimationFrame(update);
  });
}

function initStatsObserver() {
  const container = document.getElementById('stats-grid-container');
  if (!container) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !container.classList.contains('animated')) {
        container.classList.add('animated'); animateCounters();
      }
    });
  }, { threshold: 0.3 });
  observer.observe(container);
}

// ═══════════════════════════════════════════════
//  MODALES, AUTH Y TEMA OSCURO
// ═══════════════════════════════════════════════
function openModal(tab) { document.getElementById('auth-modal').classList.add('open'); switchTab(tab); }
function closeModal() { document.getElementById('auth-modal').classList.remove('open'); }
function closeModalOutside(e) { if(e.target.classList.contains('modal-overlay')) e.target.classList.remove('open'); }
function switchTab(tab) { document.querySelectorAll('.modal-tab').forEach((t,i) => t.classList.toggle('active', (i===0&&tab==='login')||(i===1&&tab==='register'))); document.getElementById('tab-login').style.display = tab==='login'?'block':'none'; document.getElementById('tab-register').style.display = tab==='register'?'block':'none'; }
function togglePass(id, btn) { const i = document.getElementById(id); i.type = i.type==='password'?'text':'password'; btn.textContent = i.type==='password'?'👁':'🙈'; }

async function doLogin() {
  const email = document.getElementById('login-email').value; const pass = document.getElementById('login-pass').value;
  if(!email || !pass) return showToast('Ingresa datos');
  try {
    const users = await supaFetch('/rest/v1/usuarios?email=eq.'+encodeURIComponent(email)+'&activo=eq.true&select=*');
    if(!users.length) return showToast('❌ Correo no registrado');
    setUser(users[0]); closeModal(); showToast('¡Bienvenido!');
  } catch(e) { showToast('❌ Error'); }
}

async function doRegister() {
  const nombre = document.getElementById('reg-name').value; const email = document.getElementById('reg-email').value; const pass = document.getElementById('reg-pass').value;
  if(!nombre || !email || pass.length<6) return showToast('Completa los campos');
  try {
    const u = await supaFetch('/rest/v1/usuarios', { method:'POST', body:JSON.stringify({nombre, email, password_hash:pass, tipo:'cliente'}) });
    setUser(Array.isArray(u)?u[0]:u); closeModal(); showToast('✅ Cuenta creada');
  } catch(e) { showToast('❌ Correo ya en uso o error'); }
}

function setUser(user) {
  currentUser = user; localStorage.setItem('aca_user', JSON.stringify(user));
  const themeIcon = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
  const adminBtn = user.tipo === 'admin' ? `<button onclick="openAdmin()" style="background:var(--orange);border:none;color:#fff;padding:7px 16px;border-radius:100px;font-size:13px;cursor:pointer;margin-right:4px;">⚙️ Admin</button>` : '';
  const avatar = user.foto_perfil ? `<img src="${user.foto_perfil}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;"/>` : `<span style="color:#fff;">${user.nombre[0].toUpperCase()}</span>`;
  
  document.getElementById('nav-actions').innerHTML = `
    <button id="theme-toggle" class="theme-toggle" aria-label="Cambiar tema">${themeIcon}</button>
    ${adminBtn}
    <div class="profile-dropdown">
      <div class="profile-trigger" onclick="toggleDropdown()">
        <div class="profile-avatar">${avatar}</div>
        <span class="profile-name" style="color:#fff">${user.nombre}</span>
      </div>
      <div class="dropdown-menu" id="profile-dropdown-menu">
        <button class="dropdown-item" onclick="logout()">🚪 Cerrar sesión</button>
      </div>
    </div>`;
}

function logout() {
  currentUser = null; localStorage.removeItem('aca_user');
  const themeIcon = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
  document.getElementById('nav-actions').innerHTML = `<button id="theme-toggle" class="theme-toggle">${themeIcon}</button><button class="btn-login" onclick="openModal('login')">Iniciar Sesión</button><button class="btn-register" onclick="openModal('register')">Registrarse</button>`;
  showToast('Sesión cerrada');
}

function toggleDropdown() { document.getElementById('profile-dropdown-menu').classList.toggle('open'); }

// DETALLES MODAL
let currentDetail = null;
function openDetailByIdx(idx) {
  const s = filteredServices[idx]; currentDetail = s;
  document.getElementById('detail-main-img').src = s.imagen_url || PLACEHOLDER_IMGS[s.categoria];
  document.getElementById('detail-title').textContent = s.titulo;
  document.getElementById('detail-desc').textContent = s.descripcion;
  document.getElementById('detail-loc-text').textContent = s.ubicacion;
  document.getElementById('detail-price').textContent = '$' + Number(s.precio).toLocaleString('es-MX');
  document.getElementById('detail-price-type').textContent = s.precio_tipo;
  document.getElementById('detail-overlay').classList.add('open');
}
function closeDetail() { document.getElementById('detail-overlay').classList.remove('open'); }
function closeDetailOutside(e) { if(e.target.id === 'detail-overlay') closeDetail(); }
function contactProvider() { showToast('Abriendo WhatsApp...'); }

// TEMA OSCURO EVENT DELEGATION
document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'theme-toggle') {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) { document.documentElement.removeAttribute('data-theme'); localStorage.setItem('aca_theme', 'light'); e.target.textContent = '🌙'; } 
    else { document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem('aca_theme', 'dark'); e.target.textContent = '☀️'; }
  }
});

function showToast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); }

// INIT
window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('aca_theme') === 'dark') { document.documentElement.setAttribute('data-theme', 'dark'); const b = document.getElementById('theme-toggle'); if(b) b.textContent = '☀️'; }
  const saved = localStorage.getItem('aca_user'); if (saved) { try { setUser(JSON.parse(saved)); } catch(e){} }
  const hash = window.location.hash.replace('#', '') || 'home'; showPage(hash, false);
  initStatsObserver();
});