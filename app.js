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
  grid.innerHTML = filtered.map((s, idx) => {
    const isOwner = currentUser && String(currentUser.id) === String(s.usuario_id);
    const deleteBtn = isOwner ? `<button class="btn-delete" onclick="deleteService(event, ${s.id})">🗑 Eliminar</button>` : '';
    return `
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
      <div class="card-footer" style="padding-top:10px;">
        <div class="card-rating" style="padding:0;border:none;margin:0;"><div class="stars-row">${starsHTML(s.promedio_estrellas || 0)}</div><span class="rating-count">(${s.total_resenas || 0})</span></div>
        ${deleteBtn}
      </div>
    </div>`;
  }).join('');
}
function filterPill(el) { document.querySelectorAll('.pill').forEach(p => p.classList.remove('active')); el.classList.add('active'); activePill = el.dataset.cat; renderCards(); }
function filterCards() { renderCards(); }
function sortCards(val) {
  if (val === 'precio-asc') allServices.sort((a,b) => a.precio - b.precio);
  else if (val === 'precio-desc') allServices.sort((a,b) => b.precio - a.precio);
  else if (val === 'mejor-rating') allServices.sort((a,b) => (b.promedio_estrellas||0) - (a.promedio_estrellas||0));
  else allServices.sort((a,b) => new Date(b.creado_en) - new Date(a.creado_en));
  renderCards();
}
function starsHTML(r) { let h = ''; for (let i = 1; i <= 5; i++) h += `<span class="star ${r >= i ? 'filled' : ''}">★</span>`; return h; }

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
function setProgress(pct) { const prog = document.getElementById('prog-main'); const bar = document.getElementById('progbar-main'); if (!prog || !bar) return; prog.style.display = pct > 0 ? 'block' : 'none'; bar.style.width = pct + '%'; }

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
    setProgress(20);
    const mainComp = await comprimirImagen(mainPhotoFile);
    const mainURL = await uploadToStorage(mainComp, 'servicios/' + currentUser.id);
    setProgress(50);
    
    const extrasURLs = [];
    let done = 0;
    for (let i = 0; i < 4; i++) {
      if (extraPhotoFiles[i]) {
        const extraComp = await comprimirImagen(extraPhotoFiles[i]);
        const url = await uploadToStorage(extraComp, 'servicios/' + currentUser.id);
        extrasURLs.push(url);
      }
      done++; setProgress(50 + done * 10);
    }
    setProgress(90);

    await supaFetch('/rest/v1/servicios', {
      method: 'POST',
      body: JSON.stringify({ usuario_id: currentUser.id, titulo, descripcion: desc, categoria: selectedCat, precio: parseFloat(precio), precio_tipo: document.getElementById('pub-price-type').value, ubicacion: document.getElementById('pub-location').value, imagen_url: mainURL, fotos_extra: extrasURLs, estado: 'pendiente', activo: true })
    });
    setProgress(100);
    showToast('✅ Servicio enviado a revisión');
    
    document.getElementById('pub-title').value = ''; document.getElementById('pub-price').value = ''; document.getElementById('pub-desc').value = ''; document.getElementById('pub-location').value = '';
    removeMain(); for(let i=0; i<4; i++) removeExtra(i);
    setTimeout(() => { setProgress(0); showPage('marketplace'); }, 1200);
  } catch(e) { showToast('❌ Error: ' + e.message); setProgress(0); } finally { btn.textContent = 'Publicar Servicio'; btn.disabled = false; }
}

async function sendContact() {
  const nombre = document.getElementById('contact-nombre').value.trim(); const email = document.getElementById('contact-email').value.trim(); const mensaje = document.getElementById('contact-mensaje').value.trim();
  if (!nombre || !email || mensaje.length < 10) return showToast('⚠️ Completa todos los campos');
  try {
    await supaFetch('/rest/v1/mensajes_contacto', { method: 'POST', body: JSON.stringify({ nombre, email, mensaje }) });
    showToast('✅ Mensaje enviado'); document.getElementById('contact-nombre').value = ''; document.getElementById('contact-email').value = ''; document.getElementById('contact-mensaje').value = '';
  } catch(e) { showToast('❌ Error al enviar'); }
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
        <button class="dropdown-item" onclick="openProfileModal()">👤 Mi Perfil</button>
        <button class="dropdown-item" onclick="openMisPub()">📋 Mis Publicaciones</button>
        <div class="dropdown-divider"></div>
        <button class="dropdown-item danger" onclick="logout()">🚪 Cerrar sesión</button>
      </div>
    </div>`;

  const mobilePlaceholder = document.getElementById('mobile-auth-placeholder');
  if (mobilePlaceholder) {
    mobilePlaceholder.innerHTML = `<div style="padding-top: 15px; border-top: 1px solid var(--border); margin-top: 15px;"><p style="font-size: 14px; color: var(--text-mid); margin-bottom: 10px;">Hola, ${user.nombre}</p><button class="btn-hero-secondary" style="width:100%; margin-bottom: 8px; border-color: var(--teal); color: var(--teal);" onclick="openProfileModal(); document.getElementById('nav-menu').classList.remove('open');">Mi Perfil</button><button class="btn-hero-secondary" style="width:100%; margin-bottom: 8px; border-color: var(--teal); color: var(--teal);" onclick="openMisPub(); document.getElementById('nav-menu').classList.remove('open');">Mis Publicaciones</button><button class="btn-delete-user" style="width:100%; justify-content: center;" onclick="logout(); document.getElementById('nav-menu').classList.remove('open');">Cerrar Sesión</button></div>`;
  }
  if (user.tipo === 'admin') loadPendingCount();
}

function logout() {
  currentUser = null; localStorage.removeItem('aca_user');
  const themeIcon = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
  document.getElementById('nav-actions').innerHTML = `<button id="theme-toggle" class="theme-toggle">${themeIcon}</button><button class="btn-login" onclick="openModal('login')">Iniciar Sesión</button><button class="btn-register" onclick="openModal('register')">Registrarse</button>`;
  const mobilePlaceholder = document.getElementById('mobile-auth-placeholder');
  if (mobilePlaceholder) {
    mobilePlaceholder.innerHTML = `<button class="btn-login" style="background:var(--teal); color:#fff; border:none;" onclick="openModal('login'); document.getElementById('nav-menu').classList.remove('open');">Iniciar Sesión</button><button class="btn-register" onclick="openModal('register'); document.getElementById('nav-menu').classList.remove('open');">Registrarse</button>`;
  }
  showToast('Sesión cerrada');
}

function toggleDropdown() { document.getElementById('profile-dropdown-menu').classList.toggle('open'); }

// ═══════════════════════════════════════════════
//  DETALLES Y RESEÑAS
// ═══════════════════════════════════════════════
let currentDetail = null;
function openDetailByIdx(idx) {
  const s = filteredServices[idx]; currentDetail = s;
  const allImgs = [s.imagen_url || PLACEHOLDER_IMGS[s.categoria], ...(s.fotos_extra||[])].filter(Boolean);
  document.getElementById('detail-main-img').src = allImgs[0];
  const thumbsEl = document.getElementById('detail-thumbs');
  if (allImgs.length > 1) {
    thumbsEl.style.display = 'flex';
    thumbsEl.innerHTML = allImgs.map((u, i) => `<img class="detail-thumb ${i===0?'active':''}" src="${u}" onclick="switchDetailImg(this,'${u}')"/>`).join('');
  } else { thumbsEl.style.display = 'none'; }

  document.getElementById('detail-cat-badge').innerHTML = '🏷️ ' + s.categoria;
  document.getElementById('detail-title').textContent = s.titulo;
  document.getElementById('detail-stars').innerHTML = starsHTML(s.promedio_estrellas || 0);
  document.getElementById('detail-rating-num').textContent = s.promedio_estrellas ? Number(s.promedio_estrellas).toFixed(1) : '';
  document.getElementById('detail-reviews').textContent = s.total_resenas ? '(' + s.total_resenas + ')' : 'Sin reseñas';
  document.getElementById('detail-desc').textContent = s.descripcion;
  document.getElementById('detail-loc-text').textContent = s.ubicacion;
  document.getElementById('detail-price').textContent = '$' + Number(s.precio).toLocaleString('es-MX');
  document.getElementById('detail-price-type').textContent = s.precio_tipo;
  document.getElementById('detail-cat-label-sim').textContent = s.categoria;
  
  const prov = (s.usuarios && s.usuarios.nombre) || s.proveedor_nombre || 'Proveedor';
  document.getElementById('detail-provider').innerHTML = `<div class="detail-provider-avatar">${prov[0].toUpperCase()}</div><div class="detail-provider-info"><strong>${escaparHTML(prov)}</strong><span>Verificado</span></div>`;
  
  const similares = allServices.filter(x => x.categoria === s.categoria && x.id !== s.id).slice(0, 4);
  document.getElementById('similares-grid').innerHTML = similares.length ? similares.map((x, i) => `<div class="sim-card" onclick="openSimilar(${allServices.indexOf(x)})"><img src="${x.imagen_url || PLACEHOLDER_IMGS[x.categoria]}"/><div class="sim-card-body"><h4>${escaparHTML(x.titulo)}</h4><div class="sim-card-price">$${Number(x.precio).toLocaleString('es-MX')}</div></div></div>`).join('') : '<p>No hay más similares.</p>';

  document.getElementById('detail-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  loadResenas(s.id);
}
function openSimilar(idx) { closeDetail(); setTimeout(() => openDetailByIdx(idx), 300); }
function switchDetailImg(thumb, url) { document.getElementById('detail-main-img').src = url; document.querySelectorAll('.detail-thumb').forEach(t => t.classList.remove('active')); thumb.classList.add('active'); }
function closeDetail() { document.getElementById('detail-overlay').classList.remove('open'); document.body.style.overflow = ''; }
function closeDetailOutside(e) { if(e.target.id === 'detail-overlay') closeDetail(); }
function filterByCatAndClose() { if (!currentDetail) return; closeDetail(); activePill = currentDetail.categoria; document.querySelectorAll('.pill').forEach(p => p.classList.toggle('active', p.dataset.cat === activePill)); showPage('marketplace'); }
function contactProvider() { const tel = currentDetail.usuarios?.telefono?.replace(/\D/g,''); if(tel) window.open(`https://wa.me/${tel.length===10?'52'+tel:tel}`, '_blank'); else showToast('Sin WhatsApp registrado'); }
function shareService() { navigator.clipboard.writeText(window.location.href); showToast('Enlace copiado'); }

let selectedStars = 0;
async function loadResenas(servicioId) {
  const list = document.getElementById('resenas-list'); const formArea = document.getElementById('resena-form-area');
  list.innerHTML = '<div class="resenas-empty">Cargando...</div>';
  if (currentUser) {
    formArea.innerHTML = `<div class="write-resena"><h4>Escribe tu reseña</h4><div class="star-picker" id="star-picker">${[1,2,3,4,5].map(n=>`<span class="star-pick" data-val="${n}" onclick="pickStar(${n})">★</span>`).join('')}</div><textarea class="resena-textarea" id="resena-texto" placeholder="Cuéntanos..."></textarea><button class="btn-send-resena" id="btn-send-resena" onclick="submitResena(${servicioId})">Publicar</button></div>`;
    selectedStars = 0;
  } else { formArea.innerHTML = `<div class="login-prompt"><p>Inicia sesión para reseñar</p><button class="btn-login-resena" onclick="openModal('login')">Entrar</button></div>`; }
  try {
    const resenas = await supaFetch('/rest/v1/resenas?servicio_id=eq.'+servicioId+'&aprobada=eq.true&select=*,usuarios(nombre)&order=creado_en.desc');
    renderResenas(resenas, servicioId);
  } catch(e) { list.innerHTML = 'Error al cargar reseñas.'; }
}
function renderResenas(resenas, servicioId) {
  const list = document.getElementById('resenas-list'); const summary = document.getElementById('resenas-summary');
  if (!resenas.length) { summary.style.display = 'none'; list.innerHTML = '<div class="resenas-empty">Sin reseñas aún.</div>'; return; }
  const avg = resenas.reduce((a, r) => a + r.estrellas, 0) / resenas.length;
  summary.style.display = 'flex'; document.getElementById('resena-avg').textContent = avg.toFixed(1); document.getElementById('resena-avg-stars').innerHTML = starsHTML(avg); document.getElementById('resena-total').textContent = resenas.length + ' reseñas';
  const dist = [5,4,3,2,1].map(n => ({ n, count: resenas.filter(r => r.estrellas === n).length }));
  document.getElementById('resena-dist').innerHTML = dist.map(d => `<div class="dist-bar-row"><span class="dist-label">${d.n}</span><div class="dist-bar-bg"><div class="dist-bar-fill" style="width:${resenas.length?(d.count/resenas.length*100):0}%"></div></div><span class="dist-count">${d.count}</span></div>`).join('');
  list.innerHTML = resenas.map(r => `<div class="resena-item"><div class="resena-top"><div class="resena-avatar">${(r.usuarios?.nombre||'U')[0].toUpperCase()}</div><span class="resena-autor">${escaparHTML(r.usuarios?.nombre||'Usuario')}</span></div><div class="resena-stars">${starsHTML(r.estrellas)}</div><p class="resena-texto">${escaparHTML(r.comentario||'')}</p></div>`).join('');
}
function pickStar(n) { selectedStars = n; document.querySelectorAll('.star-pick').forEach(s => s.classList.toggle('selected', parseInt(s.dataset.val) <= n)); }
async function submitResena(servicioId) {
  if (!selectedStars) return showToast('Selecciona estrellas');
  const btn = document.getElementById('btn-send-resena'); btn.disabled = true; btn.textContent = '...';
  try {
    await supaFetch('/rest/v1/resenas', { method: 'POST', body: JSON.stringify({ servicio_id: servicioId, usuario_id: currentUser.id, estrellas: selectedStars, comentario: document.getElementById('resena-texto').value, aprobada: true }) });
    const todas = await supaFetch('/rest/v1/resenas?servicio_id=eq.'+servicioId+'&aprobada=eq.true&select=estrellas');
    const avg = todas.reduce((a,r)=>a+r.estrellas,0)/todas.length;
    await supaFetch('/rest/v1/servicios?id=eq.'+servicioId, { method: 'PATCH', body: JSON.stringify({ promedio_estrellas: parseFloat(avg.toFixed(2)), total_resenas: todas.length }) });
    showToast('✅ Reseña publicada'); loadResenas(servicioId);
  } catch(e) { showToast('Ya reseñaste esto o hubo error'); btn.disabled = false; btn.textContent = 'Publicar'; }
}

// ═══════════════════════════════════════════════
//  PERFIL Y MIS PUBLICACIONES
// ═══════════════════════════════════════════════
let avatarFileToUpload = null;
function openProfileModal() {
  document.getElementById('profile-dropdown-menu').classList.remove('open');
  if (!currentUser) return;
  document.getElementById('profile-nombre').value = currentUser.nombre || '';
  document.getElementById('profile-email').value = currentUser.email || '';
  document.getElementById('profile-telefono').value = (currentUser.telefono || '').replace('+52','').replace(/\D/g,'');
  const letter = document.getElementById('avatar-big-letter');
  if (currentUser.foto_perfil) { letter.innerHTML = `<img src="${currentUser.foto_perfil}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>`; } 
  else { letter.textContent = currentUser.nombre[0].toUpperCase(); }
  avatarFileToUpload = null;
  document.getElementById('profile-modal-overlay').classList.add('open');
}
function closeProfileModal() { document.getElementById('profile-modal-overlay').classList.remove('open'); }
function previewAvatar(input) {
  const file = input.files[0]; if(!file) return;
  avatarFileToUpload = file;
  const r = new FileReader();
  r.onload = e => document.getElementById('avatar-big-letter').innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>`;
  r.readAsDataURL(file);
}
async function saveProfile() {
  const nombre = document.getElementById('profile-nombre').value.trim();
  const tel = document.getElementById('profile-telefono').value.trim();
  if(!nombre) return showToast('El nombre no puede estar vacío');
  try {
    let fotoURL = currentUser.foto_perfil || null;
    if(avatarFileToUpload) {
      const comp = await comprimirImagen(avatarFileToUpload);
      fotoURL = await uploadToStorage(comp, 'avatares');
    }
    const payload = { nombre, foto_perfil: fotoURL };
    if(tel) payload.telefono = '+52' + tel.replace(/\D/g,'');
    await supaFetch('/rest/v1/usuarios?id=eq.' + currentUser.id, { method: 'PATCH', body: JSON.stringify(payload) });
    currentUser = { ...currentUser, ...payload }; setUser(currentUser); closeProfileModal(); showToast('Perfil actualizado');
  } catch(e) { showToast('Error al guardar'); }
}

async function openMisPub() {
  document.getElementById('profile-dropdown-menu').classList.remove('open');
  document.getElementById('mispub-modal-overlay').classList.add('open');
  document.getElementById('mispub-content').innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Cargando...</p></div>';
  try {
    const pubs = await supaFetch('/rest/v1/servicios?usuario_id=eq.' + currentUser.id + '&order=creado_en.desc&select=*');
    if (!pubs.length) { document.getElementById('mispub-content').innerHTML = '<div class="mispub-empty">No tienes publicaciones.</div>'; return; }
    let html = '<div class="mispub-grid">';
    pubs.forEach(s => {
      const estado = s.estado === 'activo' ? '&#9989; Activo' : s.estado === 'pendiente' ? '&#9203; En revision' : '&#10060; Rechazado';
      html += `<div class="mispub-card"><img src="${s.imagen_url || PLACEHOLDER_IMGS[s.categoria]}"/><div class="mispub-card-body"><h4>${escaparHTML(s.titulo)}</h4><span class="mispub-estado ${s.estado}">${estado}</span><br><button onclick="deleteService(event, ${s.id})" style="margin-top:8px;background:none;border:1px solid #FFCDD2;color:#E53935;border-radius:100px;padding:4px 12px;font-size:11px;font-weight:600;cursor:pointer;">Eliminar</button></div></div>`;
    });
    html += '</div>';
    document.getElementById('mispub-content').innerHTML = html;
  } catch(e) { document.getElementById('mispub-content').innerHTML = '<div class="mispub-empty">Error al cargar.</div>'; }
}
function closeMisPub() { document.getElementById('mispub-modal-overlay').classList.remove('open'); }
async function deleteService(e, id) {
  e.stopPropagation(); if (!confirm('¿Seguro que quieres eliminar esta publicación?')) return;
  try {
    await supaFetch('/rest/v1/servicios?id=eq.' + id + '&usuario_id=eq.' + currentUser.id, { method: 'PATCH', body: JSON.stringify({ activo: false }) });
    allServices = allServices.filter(s => s.id !== id); renderCards(); showToast('✅ Eliminada'); closeMisPub();
  } catch(e) { showToast('Error'); }
}

// ═══════════════════════════════════════════════
//  PANEL ADMIN
// ═══════════════════════════════════════════════
async function loadPendingCount() {
  try {
    const data = await supaFetch('/rest/v1/servicios?select=id&estado=eq.pendiente');
    const badge = document.getElementById('admin-badge');
    if (badge) badge.textContent = data.length;
  } catch(e) {}
}
async function openAdmin() {
  if (!currentUser || currentUser.tipo !== 'admin') return showToast('Acceso denegado');
  document.getElementById('admin-panel').classList.add('open');
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'pendientes'));
  loadAdminList('pendientes');
}
function closeAdmin() { document.getElementById('admin-panel').classList.remove('open'); }
function closeAdminOutside(e) { if(e.target.id === 'admin-panel') closeAdmin(); }
function switchAdminTab(el) { document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active')); el.classList.add('active'); loadAdminList(el.dataset.tab); }

async function loadAdminList(tab) {
  const list = document.getElementById('admin-list'); list.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Cargando...</p></div>';
  try {
    if(tab === 'usuarios') {
      const users = await supaFetch('/rest/v1/usuarios?select=*&order=creado_en.desc');
      list.innerHTML = `<div style="background:var(--bg-light);border-radius:14px;border:1px solid var(--border);padding:8px 20px;">` + users.map(u => {
        const esYo = currentUser && u.id === currentUser.id;
        const btnAdmin = esYo ? `<span style="font-size:12px;color:var(--text-light);">Tú</span>` : `<button onclick="toggleAdmin('${u.id}','${u.tipo}')" style="background:none;border:1px solid var(--border);border-radius:100px;padding:4px 10px;font-size:12px;cursor:pointer;color:var(--text-mid);">${u.tipo === 'admin' ? 'Quitar admin' : 'Hacer admin'}</button>`;
        const btnElim = esYo ? `` : `<button onclick="eliminarUsuario('${u.id}')" style="background:none;border:1px solid #FFCDD2;color:#E53935;border-radius:100px;padding:4px 10px;font-size:12px;cursor:pointer;margin-left:5px;">Eliminar</button>`;
        return `<div id="urow-${u.id}" style="display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--border);"><div style="width:36px;height:36px;border-radius:50%;background:var(--teal);display:flex;align-items:center;justify-content:center;color:#fff;">${u.nombre[0].toUpperCase()}</div><div style="flex:1;"><strong>${escaparHTML(u.nombre)}</strong><br><span style="font-size:12px;color:var(--text-light);">${escaparHTML(u.email)} - ${u.tipo}</span></div><div>${btnAdmin}${btnElim}</div></div>`;
      }).join('') + `</div>`;
    } else {
      const estado = tab === 'pendientes' ? 'pendiente' : tab === 'activos' ? 'activo' : 'rechazado';
      const data = await supaFetch('/rest/v1/servicios?select=*&estado=eq.' + estado + '&order=creado_en.desc');
      if(!data.length) { list.innerHTML = `<div class="empty-state">No hay servicios ${estado}s</div>`; return; }
      list.innerHTML = data.map(s => {
        const acciones = tab === 'pendientes' ? `<button onclick="reviewService(${s.id},'activo')" style="background:var(--teal);color:#fff;border:none;border-radius:100px;padding:8px 16px;cursor:pointer;margin-bottom:5px;">Aceptar</button><br><button onclick="reviewService(${s.id},'rechazado')" style="background:#fff;color:#E53935;border:1px solid #FFCDD2;border-radius:100px;padding:8px 16px;cursor:pointer;">Rechazar</button>` : tab === 'activos' ? `<button onclick="reviewService(${s.id},'rechazado')" style="background:#fff;color:#E53935;border:1px solid #FFCDD2;border-radius:100px;padding:8px 16px;cursor:pointer;">Rechazar</button>` : `<button onclick="reviewService(${s.id},'activo')" style="background:var(--teal);color:#fff;border:none;border-radius:100px;padding:8px 16px;cursor:pointer;">Reactivar</button>`;
        return `<div id="acard-${s.id}" class="admin-card" style="background:var(--bg-light);border-color:var(--border);"><img src="${s.imagen_url}" class="admin-card-img" onerror="this.src='${PLACEHOLDER_IMGS.servicios}'"/><div class="admin-card-info"><h4>${escaparHTML(s.titulo)}</h4><p>${escaparHTML(s.ubicacion)} - $${s.precio}</p></div><div style="flex-shrink:0;">${acciones}</div></div>`;
      }).join('');
    }
  } catch(e) { list.innerHTML = '<p>Error cargando datos.</p>'; }
}

async function reviewService(id, nuevoEstado) {
  try {
    await supaFetch('/rest/v1/servicios?id=eq.' + id, { method: 'PATCH', body: JSON.stringify({ estado: nuevoEstado, activo: nuevoEstado === 'activo' }) });
    showToast(nuevoEstado === 'activo' ? '✅ Aceptado' : '❌ Rechazado');
    const card = document.getElementById('acard-' + id); if(card) card.remove();
    loadPendingCount();
  } catch(e) { showToast('Error'); }
}
async function toggleAdmin(userId, tipo) {
  const n = tipo === 'admin' ? 'cliente' : 'admin';
  if(!confirm('¿Cambiar a '+n+'?')) return;
  try { await supaFetch('/rest/v1/usuarios?id=eq.'+userId, { method: 'PATCH', body: JSON.stringify({ tipo: n }) }); loadAdminList('usuarios'); showToast('Actualizado'); } catch(e){}
}
async function eliminarUsuario(userId) {
  if(!confirm('¿Eliminar usuario?')) return;
  try { await supaFetch('/rest/v1/usuarios?id=eq.'+userId, { method: 'DELETE' }); document.getElementById('urow-'+userId).remove(); showToast('Eliminado'); } catch(e){}
}

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
