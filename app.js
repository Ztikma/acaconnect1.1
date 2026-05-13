// ===== VARIABLES GLOBALES =====
let allServices = [];
let activePill = 'todos';
let selectedCat = null;
let mainPhotoFile = null;
let extraPhotoFiles = [null, null, null, null];
let currentDetail = null;
let currentUser = null;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNav();
  initServices();
  loadUserProfile();
  document.getElementById('nav-toggle').addEventListener('click', toggleMobileMenu);
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
});

// ===== TEMA OSCURO/CLARO =====
function initTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon();
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const theme = document.documentElement.getAttribute('data-theme');
  document.getElementById('theme-toggle').textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ===== NAVEGACIÓN =====
function initNav() {
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = e.target.textContent.toLowerCase();
      closeMobileMenu();
    });
  });
}

function toggleMobileMenu() {
  const menu = document.getElementById('nav-menu');
  menu.classList.toggle('open');
}

function closeMobileMenu() {
  document.getElementById('nav-menu').classList.remove('open');
}

// ===== GESTIÓN DE PÁGINAS =====
function showPage(pageName, pushState = true) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + pageName).classList.add('active');
  closeMobileMenu();
  
  if (pushState) {
    history.pushState({ page: pageName }, '', '#' + pageName);
  }
}

window.onpopstate = (e) => {
  if (e.state && e.state.page) showPage(e.state.page, false);
};

// ===== SERVICIOS (MARKETPLACE) =====
function initServices() {
  // Servicios de demostración
  allServices = [
    { id: 1, titulo: 'Clases de Surf', categoria: 'experiencias', precio: 500, tipo: 'por persona', ubicacion: 'Playa Revolcadero', desc: 'Aprende a surfear con instructores profesionales.', fotos: ['https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400'], rating: 4.8, resenas: 24, usuarios: { nombre: 'Juan Surf', telefono: '+52 744 123 4567' } },
    { id: 2, titulo: 'Restaurante Casa de Mariscos', categoria: 'gastronomia', precio: 350, tipo: 'por persona', ubicacion: 'Zona Dorada', desc: 'Auténtica gastronomía acapulqueña frente al mar.', fotos: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'], rating: 4.9, resenas: 156, usuarios: { nombre: 'Chef Luis', telefono: '+52 744 987 6543' } },
    { id: 3, titulo: 'Hotel Boutique Vista Marina', categoria: 'hospedaje', precio: 1200, tipo: 'por noche', ubicacion: 'Zona Diamante', desc: 'Hotel de lujo con vista al océano Pacífico.', fotos: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400'], rating: 4.7, resenas: 89, usuarios: { nombre: 'María Hotel', telefono: '+52 744 555 1234' } },
    { id: 4, titulo: 'Tours en Barco', categoria: 'experiencias', precio: 450, tipo: 'por persona', ubicacion: 'Puerto', desc: 'Recorrido en barco por la bahía de Acapulco.', fotos: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400'], rating: 4.6, resenas: 67, usuarios: { nombre: 'Carlos Tours', telefono: '+52 744 234 5678' } },
    { id: 5, titulo: 'Masajes y SPA', categoria: 'servicios', precio: 600, tipo: 'por hora', ubicacion: 'Centro', desc: 'Relajación total con masajes tradicionales.', fotos: ['https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=400'], rating: 4.9, resenas: 112, usuarios: { nombre: 'Ana SPA', telefono: '+52 744 678 9012' } },
  ];
  renderCards();
}

function renderCards() {
  const grid = document.getElementById('cards-grid');
  const search = document.getElementById('search-input').value.toLowerCase();
  
  let filtered = allServices.filter(s => {
    const matchCat = activePill === 'todos' || s.categoria === activePill;
    const matchSearch = s.titulo.toLowerCase().includes(search) || s.desc.toLowerCase().includes(search);
    return matchCat && matchSearch;
  });

  grid.innerHTML = filtered.map(s => `
    <div class="card" onclick="openDetail(${s.id})">
      <img src="${s.fotos[0]}" alt="${s.titulo}" class="card-img"/>
      <div class="card-body">
        <span class="card-cat">${s.categoria}</span>
        <h3 class="card-title">${s.titulo}</h3>
        <div class="card-stars">${Array(Math.round(s.rating)).fill('<span>★</span>').join('')}</div>
        <div class="card-location">📍 ${s.ubicacion}</div>
        <div class="card-price">$${s.precio}</div>
        <div class="card-price-type">${s.tipo}</div>
      </div>
    </div>
  `).join('');

  document.getElementById('mkt-count').textContent = `${filtered.length} servicios encontrados`;
}

function filterPill(el) {
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  activePill = el.dataset.cat;
  renderCards();
}

function filterCards() {
  renderCards();
}

function sortCards(value) {
  if (value === 'recientes') allServices.sort((a, b) => b.id - a.id);
  if (value === 'precio-asc') allServices.sort((a, b) => a.precio - b.precio);
  if (value === 'precio-desc') allServices.sort((a, b) => b.precio - a.precio);
  if (value === 'mejor-rating') allServices.sort((a, b) => b.rating - a.rating);
  renderCards();
}

// ===== DETALLE DE SERVICIO =====
function openDetail(id) {
  currentDetail = allServices.find(s => s.id === id);
  if (!currentDetail) return;

  const overlay = document.getElementById('detail-overlay');
  const modal = document.getElementById('detail-modal');

  document.getElementById('detail-main-img').src = currentDetail.fotos[0];
  document.getElementById('detail-title').textContent = currentDetail.titulo;
  document.getElementById('detail-cat-badge').textContent = currentDetail.categoria;
  document.getElementById('detail-cat-label-sim').textContent = currentDetail.categoria;
  document.getElementById('detail-desc').textContent = currentDetail.desc;
  document.getElementById('detail-price').textContent = `$${currentDetail.precio}`;
  document.getElementById('detail-price-type').textContent = currentDetail.tipo;
  document.getElementById('detail-loc-text').textContent = currentDetail.ubicacion;
  document.getElementById('detail-rating-num').textContent = currentDetail.rating;
  document.getElementById('detail-reviews').textContent = `(${currentDetail.resenas} reseñas)`;
  
  const starsRow = document.getElementById('detail-stars');
  starsRow.innerHTML = Array(Math.round(currentDetail.rating)).fill('<span>★</span>').join('');

  // Miniaturas
  const thumbs = document.getElementById('detail-thumbs');
  thumbs.innerHTML = currentDetail.fotos.map((f, i) => `
    <div class="detail-thumb ${i === 0 ? 'active' : ''}" onclick="switchDetailImg(this, '${f}')">
      <img src="${f}" alt=""/>
    </div>
  `).join('');

  // Servicios similares
  const similares = allServices.filter(s => s.categoria === currentDetail.categoria && s.id !== currentDetail.id).slice(0, 3);
  document.getElementById('similares-grid').innerHTML = similares.map(s => `
    <div class="card" onclick="openSimilar(${s.id})" style="cursor:pointer;">
      <img src="${s.fotos[0]}" alt="${s.titulo}" class="card-img"/>
      <div class="card-body">
        <h3 class="card-title">${s.titulo}</h3>
        <div class="card-price">$${s.precio}</div>
      </div>
    </div>
  `).join('');

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeDetail() {
  document.getElementById('detail-overlay').classList.remove('active');
  document.body.style.overflow = '';
}

function closeDetailOutside(e) {
  if(e.target.id === 'detail-overlay') closeDetail();
}

function switchDetailImg(thumb, url) {
  document.getElementById('detail-main-img').src = url;
  document.querySelectorAll('.detail-thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
}

function openSimilar(idx) {
  closeDetail();
  setTimeout(() => openDetail(idx), 300);
}

function filterByCatAndClose() {
  if (!currentDetail) return;
  closeDetail();
  activePill = currentDetail.categoria;
  document.querySelectorAll('.pill').forEach(p => p.classList.toggle('active', p.dataset.cat === activePill));
  showPage('marketplace');
  renderCards();
}

function contactProvider() {
  if (!currentDetail) return;
  const tel = currentDetail.usuarios?.telefono?.replace(/\D/g, '');
  if (tel) {
    window.open(`https://wa.me/${tel.length === 10 ? '52' + tel : tel}`, '_blank');
  } else {
    showToast('Sin WhatsApp disponible', 'error');
  }
}

function shareService() {
  navigator.clipboard.writeText(window.location.href);
  showToast('Enlace copiado al portapapeles');
}

// ===== FORMULARIO DE PUBLICACIÓN =====
function selectCat(btn) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedCat = btn.dataset.cat;
}

function updateCount() {
  const len = document.getElementById('pub-desc').value.length;
  document.getElementById('char-count').textContent = len + '/500';
}

function handleDrag(e, id) {
  e.preventDefault();
  document.getElementById(id).classList.add('drag');
}

function handleDragLeave(e, id) {
  document.getElementById(id).classList.remove('drag');
}

function handleDrop(e, type, idx) {
  e.preventDefault();
  document.getElementById(type === 'main' ? 'main-drop' : `slot-${idx}`).classList.remove('drag');
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    processFile(files[0], type, idx);
  }
}

function handleFileSelect(input, type, idx) {
  if (input.files.length > 0) {
    processFile(input.files[0], type, idx);
  }
}

function processFile(file, type, idx) {
  if (!file.type.startsWith('image/')) {
    showToast('Por favor selecciona una imagen', 'error');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast('La imagen no debe superar 5MB', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    if (type === 'main') {
      mainPhotoFile = e.target.result;
      document.getElementById('preview-main').innerHTML = `
        <div class="foto-preview">
          <img src="${e.target.result}" alt=""/>
          <button class="foto-remove" onclick="removeMain()">×</button>
        </div>
      `;
      document.getElementById('main-drop').style.display = 'none';
    } else {
      extraPhotoFiles[idx] = e.target.result;
      document.getElementById(`slot-${idx}`).innerHTML = `
        <img src="${e.target.result}" alt=""/>
        <button class="foto-remove" onclick="removeExtra(${idx})" style="position:absolute;top:5px;right:5px;">×</button>
      `;
    }
  };
  reader.readAsDataURL(file);
}

function removeMain() {
  mainPhotoFile = null;
  document.getElementById('preview-main').innerHTML = '';
  document.getElementById('main-drop').style.display = 'block';
}

function removeExtra(idx) {
  extraPhotoFiles[idx] = null;
  document.getElementById(`slot-${idx}`).innerHTML = `
    <input type="file" accept="image/*" onchange="handleFileSelect(this,'extra',${idx})"/>
    <span class="plus">+</span>
  `;
}

function publishService() {
  const title = document.getElementById('pub-title').value.trim();
  const price = document.getElementById('pub-price').value;
  const priceType = document.getElementById('pub-price-type').value;
  const location = document.getElementById('pub-location').value;
  const desc = document.getElementById('pub-desc').value.trim();

  if (!title || !selectedCat || !price || !location || !desc || !mainPhotoFile) {
    showToast('Por favor completa todos los campos requeridos', 'error');
    return;
  }

  const newService = {
    id: allServices.length + 1,
    titulo: title,
    categoria: selectedCat,
    precio: parseInt(price),
    tipo: priceType,
    ubicacion: location,
    desc: desc,
    fotos: [mainPhotoFile, ...extraPhotoFiles.filter(f => f)],
    rating: 5,
    resenas: 0,
    usuarios: currentUser || { nombre: 'Anónimo', telefono: '' }
  };

  allServices.push(newService);
  localStorage.setItem('services', JSON.stringify(allServices));

  showToast('¡Servicio publicado exitosamente!', 'success');

  // Limpiar formulario
  document.getElementById('pub-title').value = '';
  document.getElementById('pub-price').value = '';
  document.getElementById('pub-location').value = '';
  document.getElementById('pub-desc').value = '';
  document.getElementById('char-count').textContent = '0/500';
  removeMain();
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
  extraPhotoFiles = [null, null, null, null];
  selectedCat = null;

  setTimeout(() => showPage('marketplace'), 1500);
}

// ===== AUTENTICACIÓN =====
function openModal(type) {
  document.getElementById('auth-modal').classList.add('active');
  switchTab(type);
}

function closeModal() {
  document.getElementById('auth-modal').classList.remove('active');
}

function closeModalOutside(e) {
  if (e.target.id === 'auth-modal') {
    e.target.classList.remove('active');
  }
}

function switchTab(tab) {
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.modal-form').forEach(f => f.classList.remove('active'));
  document.querySelector(`.modal-tab:nth-child(${tab === 'login' ? 1 : 2})`).classList.add('active');
  document.getElementById(`tab-${tab}`).classList.add('active');
}

function togglePass(inputId, btn) {
  const input = document.getElementById(inputId);
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  btn.textContent = isPassword ? '👁‍🗨' : '👁';
}

function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;

  if (!email || !pass) {
    showToast('Por favor completa todos los campos', 'error');
    return;
  }

  currentUser = { nombre: email.split('@')[0], email: email, telefono: '' };
  localStorage.setItem('currentUser', JSON.stringify(currentUser));

  showToast('¡Sesión iniciada!', 'success');
  closeModal();
  document.getElementById('login-email').value = '';
  document.getElementById('login-pass').value = '';
  updateNavProfile();
}

function doRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const pass = document.getElementById('reg-pass').value;

  if (!name || !email || !pass) {
    showToast('Por favor completa los campos requeridos', 'error');
    return;
  }

  currentUser = { nombre: name, email: email, telefono: phone, avatar: '' };
  localStorage.setItem('currentUser', JSON.stringify(currentUser));

  showToast('¡Cuenta creada exitosamente!', 'success');
  closeModal();
  document.getElementById('reg-name').value = '';
  document.getElementById('reg-email').value = '';
  document.getElementById('reg-phone').value = '';
  document.getElementById('reg-pass').value = '';
  updateNavProfile();
}

function loadUserProfile() {
  const saved = localStorage.getItem('currentUser');
  if (saved) {
    currentUser = JSON.parse(saved);
    updateNavProfile();
  }
}

function updateNavProfile() {
  const actions = document.getElementById('nav-actions');
  if (currentUser) {
    actions.innerHTML = `
      <button id="theme-toggle" class="theme-toggle" aria-label="Cambiar tema">🌙</button>
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:14px;color:var(--text-mid);">${currentUser.nombre}</span>
        <button onclick="showProfile()" style="background:var(--teal);color:white;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-weight:600;">Perfil</button>
        <button onclick="doLogout()" style="background:none;border:1.5px solid var(--border);color:var(--text-mid);padding:8px 16px;border-radius:8px;cursor:pointer;font-weight:600;">Salir</button>
      </div>
    `;
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  }
}

function showProfile() {
  const modal = document.getElementById('profile-modal-overlay');
  document.getElementById('profile-nombre').value = currentUser.nombre;
  document.getElementById('profile-email').value = currentUser.email;
  document.getElementById('profile-telefono').value = currentUser.telefono;
  modal.classList.add('active');
}

function closeProfileModal() {
  document.getElementById('profile-modal-overlay').classList.remove('active');
}

function saveProfile() {
  currentUser.nombre = document.getElementById('profile-nombre').value.trim();
  currentUser.telefono = document.getElementById('profile-telefono').value.trim();
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  showToast('Perfil actualizado', 'success');
  updateNavProfile();
  closeProfileModal();
}

function doLogout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  updateNavProfile();
  showToast('Sesión cerrada', 'success');
}

function previewAvatar(input) {
  if (input.files.length > 0) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('avatar-big-preview').innerHTML = `
        <img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>
      `;
      if (currentUser) {
        currentUser.avatar = e.target.result;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
      }
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// ===== FORMULARIO DE CONTACTO =====
function sendContact() {
  const nombre = document.getElementById('contact-nombre').value.trim();
  const email = document.getElementById('contact-email').value.trim();
  const mensaje = document.getElementById('contact-mensaje').value.trim();

  if (!nombre || !email || !mensaje) {
    showToast('Por favor completa todos los campos', 'error');
    return;
  }

  showToast('¡Mensaje enviado! Te contactaremos pronto.', 'success');
  document.getElementById('contact-nombre').value = '';
  document.getElementById('contact-email').value = '';
  document.getElementById('contact-mensaje').value = '';
}

// ===== NOTIFICACIONES =====
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== ADMIN PANEL (Placeholder) =====
function openAdmin() {
  document.getElementById('admin-panel').classList.add('active');
}

function closeAdmin() {
  document.getElementById('admin-panel').classList.remove('active');
}

function closeAdminOutside(e) {
  if (e.target.id === 'admin-panel') {
    e.target.classList.remove('active');
  }
}

function switchAdminTab(btn) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
}
