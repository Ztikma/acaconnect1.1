// --- FUNCIÓN INDESTRUCTIBLE PARA ABRIR EL MENÚ DEL PERFIL ---
function toggleMenuDirecto(event) {
 event.stopPropagation();
const dropdown = document.getElementById('profile-dropdown');
  if (dropdown) { dropdown.classList.toggle('active'); }
}

document.addEventListener('click', () => {
  const dropdown = document.getElementById('profile-dropdown');
  if (dropdown) { dropdown.classList.remove('active'); }
});

// --- 1. MANEJO DEL CARRUSEL PREMIUM 3D ---
const slide = document.querySelector('.carousel-slide');
const items = document.querySelectorAll('.carousel-item');
const dots = document.querySelectorAll('.dot');
let counter = 0;
const totalImages = items ? items.length : 0;

function updateCarousel() {
  if (slide && items.length > 0) {
    slide.style.transform = `translateX(${-counter * 100}%)`;
      items.forEach((item, index) => {
          if (index === counter) item.classList.add('active');
          else item.classList.remove('active');
      });
      dots.forEach((dot, index) => {
          if (index === counter) dot.classList.add('active');
          else dot.classList.remove('active');
      });
  }
}
if (totalImages > 0) {
  setInterval(() => {
      counter = (counter + 1) >= totalImages ? 0 : counter + 1;
      updateCarousel();
  }, 3000);
}

// --- 2. CARGA DINÁMICA FILTRADA DESDE MYSQL (TABS Y CATEGORÍAS) ---
const btnCategories = document.getElementById('btn-categories');
const dropdownMenu = document.getElementById('dropdown-menu');
const coursesGrid = document.getElementById('courses-grid');
const tabs = document.querySelectorAll('.tab-btn');

let todosLosCursos = [];
let categoriaActivaId = 1;

function renderizarCursosFiltrados() {
  if (!coursesGrid) return;
  coursesGrid.innerHTML = '';
 
  // Forzamos conversión estricta a Number para evitar problemas de tipos de datos
  const cursosFiltrados = todosLosCursos.filter(c => Number(c.id_categoria) === Number(categoriaActivaId));

  if (cursosFiltrados.length === 0) {
      coursesGrid.innerHTML = '<p style="color: #888; grid-column: 1/-1; text-align: center; padding: 20px;">No hay cursos disponibles en esta categoría todavía.</p>';
     return;
 }

    cursosFiltrados.forEach((curso) => {
        const card = document.createElement('div');
        card.className = 'course-card';
        const srcImagen = curso.imagen_url || 'Cursos Imag/imagen_cursos1.png';
        card.innerHTML = `
            <a href="Cursos Detalle.php?id=${curso.id_curso}" style="text-decoration: none; color: inherit; display: block;">
                <div class="course-img-placeholder"><img src="${srcImagen}" alt="${curso.titulo}"></div>
                <div class="course-content">
                    <h3 class="course-title">${curso.titulo}</h3>
                    <p class="course-subtitle">${curso.descripcion_corta}</p>
                    <div class="course-stats">
                        <span class="stars"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></span>
                        <span class="users"><i class="far fa-user"></i> 250 usuarios</span>
                    </div>
                    <div class="course-price">$${parseFloat(curso.precio).toFixed(2)} MXN</div>
                </div>
            </a>
        `;
        coursesGrid.appendChild(card);
    });
}

function descargarCursosDesdeBD() {
    fetch(`${API_URL}/cursos.php`)
        .then(res => res.json())
        .then(data => {
            todosLosCursos = data;
            renderizarCursosFiltrados(); 
        }).catch(err => console.error(err));
}

// MEJORA INTEGRADA: Conversión inteligente de eñes y acentos para no romper el match visual
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // 1. Convertimos a minúsculas
        let textTab = tab.textContent.trim().toLowerCase();
        
        // 2. Limpieza en memoria de caracteres especiales para el mapa limpio
        textTab = textTab.replace(/ñ/g, 'n')
                         .replace(/[áàäâ]/g, 'a')
                         .replace(/[éèëê]/g, 'e')
                         .replace(/[íìïî]/g, 'i')
                         .replace(/[óòöô]/g, 'o')
                         .replace(/[úùüû]/g, 'u');
        
        const mapaLimpio = {
            "programacion": 1,
            "matematicas": 2,
            "idiomas": 3,
            "marketing": 4,
            "diseno grafico": 5,
            "gestion": 6
        };

        categoriaActivaId = mapaLimpio[textTab] || 1;
        renderizarCursosFiltrados();
    });
});

if (btnCategories && dropdownMenu) {
    btnCategories.addEventListener('click', (e) => {
        dropdownMenu.classList.toggle('active');
        e.stopPropagation();
    });
    document.addEventListener('click', () => dropdownMenu.classList.remove('active'));
}

// --- 3. INTERACTIVIDAD DE VENTANAS MODALES ADMINISTRATIVAS ---
const modalLogin = document.getElementById('modal-login');
const modalRegister = document.getElementById('modal-register');
const modalCreateCourse = document.getElementById('modal-create-course');
const modalPermissions = document.getElementById('modal-permissions');
const modalManageCourses = document.getElementById('modal-manage-courses');
const modalEditCourse = document.getElementById('modal-edit-course');

const openLoginBtn = document.getElementById('open-login');
const openRegisterBtn = document.getElementById('open-register');

const closeLoginBtn = document.getElementById('close-login');
const closeRegisterBtn = document.getElementById('close-register');
const closeCreateCourseBtn = document.getElementById('close-create-course');
const closePermissionsBtn = document.getElementById('close-permissions');
const closeManageCoursesBtn = document.getElementById('close-manage-courses');
const closeEditCourseBtn = document.getElementById('close-edit-course');

if (openLoginBtn) openLoginBtn.addEventListener('click', () => modalLogin.classList.add('active'));
if (openRegisterBtn) openRegisterBtn.addEventListener('click', () => modalRegister.classList.add('active'));
if (closeLoginBtn) closeLoginBtn.addEventListener('click', () => modalLogin.classList.remove('active'));
if (closeRegisterBtn) closeRegisterBtn.addEventListener('click', () => modalRegister.classList.remove('active'));
if (closeCreateCourseBtn) closeCreateCourseBtn.addEventListener('click', () => modalCreateCourse.classList.remove('active'));
if (closePermissionsBtn) closePermissionsBtn.addEventListener('click', () => modalPermissions.classList.remove('active'));
if (closeManageCoursesBtn) closeManageCoursesBtn.addEventListener('click', () => modalManageCourses.classList.remove('active'));
if (closeEditCourseBtn) closeEditCourseBtn.addEventListener('click', () => modalEditCourse.classList.remove('active'));

window.addEventListener('click', (e) => {
    if (e.target === modalLogin) modalLogin.classList.remove('active');
    if (e.target === modalRegister) modalRegister.classList.remove('active');
    if (e.target === modalCreateCourse) modalCreateCourse.classList.remove('active');
    if (e.target === modalPermissions) modalPermissions.classList.remove('active');
    if (e.target === modalManageCourses) modalManageCourses.classList.remove('active');
    if (e.target === modalEditCourse) modalEditCourse.classList.remove('active');
});

// --- 4. FORMULARIOS API Y GESTIÓN DE PERMISOS/CURSOS ---
const formRegister = document.getElementById('form-register');
const formLogin = document.getElementById('form-login');
const formCreateCourse = document.getElementById('form-create-course');
const formEditCourse = document.getElementById('form-edit-course');
const usersTableBody = document.getElementById('users-table-body');
const manageCoursesTableBody = document.getElementById('manage-courses-table-body');
const manageCategorySelect = document.getElementById('manage-category-select');

function rellenarSelectoresElemento(prefix) {
    const teacherSel = document.getElementById(`${prefix}-teacher-input`);
    const catSel = document.getElementById(`${prefix}-category-input`);
    
    if (teacherSel) {
        fetch(`${API_URL}/maestros.php`).then(res => res.json()).then(maestros => {
            teacherSel.innerHTML = '<option value="">-- Selecciona un Profesor --</option>';
            maestros.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.id_usuario;
                opt.textContent = `${m.nombre} ${m.apellido_paterno} (ID: ${m.id_usuario})`;
                teacherSel.appendChild(opt);
            });
        });
    }
    if (catSel) {
        fetch(`${API_URL}/categorias.php`).then(res => res.json()).then(categorias => {
            catSel.innerHTML = '<option value="">-- Selecciona una Categoría --</option>';
            categorias.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id_categoria;
                opt.textContent = c.nombre;
                catSel.appendChild(opt);
            });
        });
    }
}

function cargarMaestrosEnSelect() { rellenarSelectoresElemento('course'); }

function cargarCategoriasEnFiltro() {
    if (!manageCategorySelect) return;
    fetch(`${API_URL}/categorias.php`).then(res => res.json()).then(categorias => {
        manageCategorySelect.innerHTML = '<option value="">-- Escoge una Categoría --</option>';
        categorias.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id_categoria;
            opt.textContent = c.nombre;
            manageCategorySelect.appendChild(opt);
        });
    });
}

function renderizarTablaAdminCursos(catIdOrArray, esMaestroExclusivo = false) {
    if (!manageCoursesTableBody) return;
    manageCoursesTableBody.innerHTML = '';
    let listaAMostrar = [];

    if (esMaestroExclusivo) {
        listaAMostrar = catIdOrArray;
        if (listaAMostrar.length === 0) {
            manageCoursesTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #888;">Aún no has subido ningún curso al sistema.</td></tr>';
            return;
        }
    } else {
        if (!catIdOrArray) {
            manageCoursesTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #888;">Por favor, selecciona una categoría arriba.</td></tr>';
            return;
        }
        listaAMostrar = todosLosCursos.filter(c => parseInt(c.id_categoria) === parseInt(catIdOrArray));
        if (listaAMostrar.length === 0) {
            manageCoursesTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #888;">No hay cursos en esta categoría.</td></tr>';
            return;
        }
    }

    listaAMostrar.forEach(curso => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>#${curso.id_curso}</strong></td>
            <td>${curso.titulo}</td>
            <td>$${parseFloat(curso.precio).toFixed(2)}</td>
            <td><span class="badge">${curso.nivel}</span></td>
            <td>
                <button class="btn-action-edit" onclick="abrirModalModificarCursoDirecto(${curso.id_curso})"><i class="fas fa-edit"></i> Editar</button>
                <button class="btn-action-delete" onclick="eliminarCursoDirecto(${curso.id_curso})"><i class="fas fa-trash-alt"></i> Eliminar</button>
            </td>
        `;
        manageCoursesTableBody.appendChild(tr);
    });
}

if (manageCategorySelect) {
    manageCategorySelect.addEventListener('change', (e) => {
        renderizarTablaAdminCursos(e.target.value, false);
    });
}

window.abrirModalModificarCursoDirecto = function(idCurso) {
    const curso = todosLosCursos.find(c => c.id_curso === idCurso);
    if (!curso) return;

    document.getElementById('edit-course-id').value = curso.id_curso;
    document.getElementById('edit-title-input').value = curso.titulo;
    document.getElementById('edit-desc-input').value = curso.descripcion_corta;
    document.getElementById('edit-about-input').value = curso.acerca_de;
    document.getElementById('edit-price-input').value = curso.precio;
    document.getElementById('edit-hours-input').value = curso.duracion_horas;
    document.getElementById('edit-level-input').value = curso.nivel;

    rellenarSelectoresElemento('edit');

    setTimeout(() => {
        const teacherInput = document.getElementById('edit-teacher-input');
        if (teacherInput) teacherInput.value = curso.id_maestro;
        document.getElementById('edit-category-input').value = curso.id_categoria;
    }, 150);

    if (modalEditCourse) modalEditCourse.classList.add('active');
};

window.eliminarCursoDirecto = function(idCurso) {
    if (confirm("¿Estás seguro de que deseas eliminar este curso de forma permanente?")) {
        fetch(`${API_URL}/cursos.php?action=eliminar&id=${idCurso}`, { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                alert(data.message || "Curso eliminado");
                fetch(`${API_URL}/cursos.php`)
                    .then(res => res.json())
                    .then(cursos => {
                        todosLosCursos = cursos;
                        renderizarCursosFiltrados();
                        const usr = JSON.parse(localStorage.getItem('usuario'));
                        if (usr && usr.rol === 'maestro') {
                            const filtrados = todosLosCursos.filter(c => parseInt(c.id_maestro) === parseInt(usr.id));
                            renderizarTablaAdminCursos(filtrados, true);
                        } else if (manageCategorySelect) {
                            renderizarTablaAdminCursos(manageCategorySelect.value, false);
                        }
                    });
            });
    }
};

function cargarUsuariosEnPanel() {
    if (!usersTableBody) return;
    fetch(`${API_URL}/usuarios.php`)
        .then(res => res.json())
        .then(usuarios => {
            usersTableBody.innerHTML = '';
            usuarios.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>#${user.id_usuario}</strong></td>
                    <td>${user.nombre}</td>
                    <td>${user.email}</td>
                    <td>
                        <select class="role-select" data-id="${user.id_usuario}" style="padding: 5px; border-radius: 6px; font-weight: 600;">
                            <option value="alumno" ${user.rol === 'alumno' ? 'selected' : ''}>Alumno</option>
                            <option value="maestro" ${user.rol === 'maestro' ? 'selected' : ''}>Maestro</option>
                            <option value="admin" ${user.rol === 'admin' ? 'selected' : ''}>Administrador</option>
                        </select>
                    </td>
                `;
                usersTableBody.appendChild(tr);
            });

            document.querySelectorAll('.role-select').forEach(select => {
                select.addEventListener('change', (e) => {
                    const idUsuario = e.target.getAttribute('data-id');
                    const nuevoRol = e.target.value;
                    fetch(`${API_URL}/usuarios.php?action=cambiar-rol`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id_usuario: idUsuario, rol: nuevoRol })
                    }).then(res => res.json());
                });
            });
        });
}

// --- INTERFAZ DE USUARIO Y ROLES ---
const guestButtons = document.getElementById('auth-guest-buttons');
const userProfile = document.getElementById('auth-user-profile');
const userDisplayName = document.getElementById('user-display-name');
const adminOptions = document.getElementById('admin-options');
const btnLogout = document.getElementById('btn-logout');
const profileDropdown = document.getElementById('profile-dropdown');

function actualizarInterfazUsuario(usuario) {
    if (usuario) {
        if (guestButtons) guestButtons.classList.add('hidden');
        if (userProfile) userProfile.classList.remove('hidden');
        if (userDisplayName) userDisplayName.textContent = usuario.nombre;
        if (adminOptions) adminOptions.innerHTML = '';

        const createTeacherContainer = document.getElementById('container-select-teacher');
        const editTeacherContainer = document.getElementById('container-edit-teacher');
        const categoryFilterContainer = document.getElementById('container-manage-category-filter');
        const manageTitle = document.getElementById('manage-courses-modal-title');
        const manageTableLabel = document.getElementById('manage-courses-table-label');

        if (usuario.rol === 'admin') {
            if (userDisplayName) userDisplayName.textContent = `${usuario.nombre} (Admin)`;
            if (createTeacherContainer) createTeacherContainer.style.display = 'block';
            if (editTeacherContainer) editTeacherContainer.style.display = 'block';
            if (categoryFilterContainer) categoryFilterContainer.style.display = 'block';
            if (manageTitle) manageTitle.textContent = "Administración Completa de Cursos";
            if (manageTableLabel) manageTableLabel.textContent = "2. Cursos Encontrados:";

            inyectarBotonesRol('admin', usuario);
        } 
        else if (usuario.rol === 'maestro') {
            if (userDisplayName) userDisplayName.textContent = `${usuario.nombre} (Profesor)`;
            if (createTeacherContainer) createTeacherContainer.style.display = 'none';
            if (editTeacherContainer) editTeacherContainer.style.display = 'none';
            if (categoryFilterContainer) categoryFilterContainer.style.display = 'none';
            if (manageTitle) manageTitle.textContent = "Mis Cursos Publicados";
            if (manageTableLabel) manageTableLabel.textContent = "Listado de tus cursos en el sistema:";

            inyectarBotonesRol('maestro', usuario);
        }
    } else {
        if (guestButtons) guestButtons.classList.remove('hidden');
        if (userProfile) userProfile.classList.add('hidden');
        if (adminOptions) adminOptions.innerHTML = '';
    }
}

function inyectarBotonesRol(rol, usuario) {
    if (!adminOptions) return;
    
    const btnCrearCurso = document.createElement('a');
    btnCrearCurso.href = '#';
    btnCrearCurso.style.cursor = 'pointer';
    btnCrearCurso.innerHTML = '<i class="fas fa-plus-circle"></i> Crear Curso';
    btnCrearCurso.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (formCreateCourse) formCreateCourse.reset();
        if (profileDropdown) profileDropdown.classList.remove('active'); 
        if (modalCreateCourse) modalCreateCourse.classList.add('active');
        setTimeout(cargarMaestrosEnSelect, 50);
    });
    adminOptions.appendChild(btnCrearCurso);

    const btnAdminCursos = document.createElement('a');
    btnAdminCursos.href = '#';
    btnAdminCursos.style.cursor = 'pointer';
    btnAdminCursos.innerHTML = `<i class="fas fa-tasks"></i> ${rol === 'admin' ? 'Administrar Cursos' : 'Administrar Mis Cursos'}`;
    btnAdminCursos.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (profileDropdown) profileDropdown.classList.remove('active');
        if (modalManageCourses) modalManageCourses.classList.add('active');
        
        if (rol === 'admin') {
            cargarCategoriasEnFiltro(); 
            renderizarTablaAdminCursos(""); 
        } else {
            const filtrados = todosLosCursos.filter(c => parseInt(c.id_maestro) === parseInt(usuario.id));
            renderizarTablaAdminCursos(filtrados, true);
        }
    });
    adminOptions.appendChild(btnAdminCursos);

    if (rol === 'admin') {
        const btnPermisos = document.createElement('a');
        btnPermisos.href = '#';
        btnPermisos.style.cursor = 'pointer';
        btnPermisos.innerHTML = '<i class="fas fa-user-shield"></i> Dar Permisos';
        btnPermisos.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (profileDropdown) profileDropdown.classList.remove('active'); 
            if (modalPermissions) modalPermissions.classList.add('active');
            cargarUsuariosEnPanel(); 
        });
        adminOptions.appendChild(btnPermisos);
    }
}

if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('usuario');
        alert("Sesión cerrada correctamente.");
        location.reload();
    });
}

// --- ARRANQUE PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
    descargarCursosDesdeBD();
    rellenarSelectoresElemento('course');
    
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) { actualizarInterfazUsuario(JSON.parse(usuarioGuardado)); }
    
    fetch(`${API_URL}/categorias.php`)
        .then(res => res.json())
        .then(categorias => {
            if (dropdownMenu) {
                dropdownMenu.innerHTML = '';
                categorias.forEach(cat => {
                    const link = document.createElement('a');
                    link.href = '#';
                    link.textContent = cat.nombre;
                    dropdownMenu.appendChild(link);
                });
            }
        });
});

// --- SUBMIT DE REGISTRO ---
if (formRegister) {
    formRegister.addEventListener('submit', (e) => {
        e.preventDefault();
        const datosUsuario = {
            nombre: document.getElementById('reg-name').value,
            apellido_paterno: document.getElementById('reg-paterno').value,
            apellido_materno: document.getElementById('reg-materno').value || null,
            email: document.getElementById('reg-email').value,
            contrasena: document.getElementById('reg-password').value
        };
        fetch(`${API_URL}/auth.php?action=registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosUsuario)
        })
        .then(res => res.json()).then(data => {
            if (data.error) alert("Error: " + data.error);
            else {
                alert("¡Cuenta creada!");
                modalRegister.classList.remove('active');
                formRegister.reset();
            }
        });
    });
}

// --- SUBMIT DE LOGIN ---
if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('email', document.getElementById('login-email').value.trim());
        formData.append('contrasena', document.getElementById('login-password').value);

        fetch(`${API_URL}/auth.php?action=login`, { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
            if(data.error) { alert(data.error); }
            else {
                alert(`¡Bienvenido de nuevo, ${data.usuario.nombre}!`);
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                location.reload();
            }
        }).catch(err => alert("Error al conectar con el servidor."));
    });
}

// --- SUBMIT DE CREACIÓN DE CURSOS ---
if (formCreateCourse) {
    formCreateCourse.addEventListener('submit', (e) => {
        e.preventDefault();
        const usr = JSON.parse(localStorage.getItem('usuario'));
        let idMaestroFinal = (usr && usr.rol === 'maestro') ? parseInt(usr.id) : parseInt(document.getElementById('course-teacher-input').value);

        const archivoImagen = document.getElementById('course-image-file').files[0];
        const lector = new FileReader();
        
        lector.onloadend = function() {
            const datosCurso = {
                titulo: document.getElementById('course-title-input').value,
                descripcion_corta: document.getElementById('course-desc-input').value,
                acerca_de: document.getElementById('course-about-input').value,
                precio: parseFloat(document.getElementById('course-price-input').value),
                duracion_horas: parseInt(document.getElementById('course-hours-input').value),
                nivel: document.getElementById('course-level-input').value,
                id_maestro: idMaestroFinal, 
                id_categoria: parseInt(document.getElementById('course-category-input').value), 
                imagen_url: lector.result 
            };

            fetch(`${API_URL}/cursos.php?action=crear`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosCurso)
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) alert("Error: " + data.error);
                else {
                    alert("¡Curso creado con éxito!");
                    modalCreateCourse.classList.remove('active');
                    formCreateCourse.reset();
                    descargarCursosDesdeBD();
                }
            });
        };
        if (archivoImagen) lector.readAsDataURL(archivoImagen);
    });
}

// --- SUBMIT DE EDICIÓN DE CURSOS ---
if (formEditCourse) {
    formEditCourse.addEventListener('submit', (e) => {
        e.preventDefault();
        const idCurso = document.getElementById('edit-course-id').value;
        const archivoImagen = document.getElementById('edit-image-file').files[0];
        const cursoOriginal = todosLosCursos.find(c => c.id_curso == idCurso);
        const usr = JSON.parse(localStorage.getItem('usuario'));

        const enviarDatosActualizados = (imgUrlData) => {
            const maestroIdFinal = (usr && usr.rol === 'maestro') ? parseInt(usr.id) : parseInt(document.getElementById('edit-teacher-input').value);

            const datosModificados = {
                titulo: document.getElementById('edit-title-input').value,
                descripcion_corta: document.getElementById('edit-desc-input').value,
                acerca_de: document.getElementById('edit-about-input').value,
                precio: parseFloat(document.getElementById('edit-price-input').value),
                duracion_horas: parseInt(document.getElementById('edit-hours-input').value),
                nivel: document.getElementById('edit-level-input').value,
                id_maestro: maestroIdFinal,
                id_categoria: parseInt(document.getElementById('edit-category-input').value),
                imagen_url: imgUrlData
            };

            fetch(`${API_URL}/cursos.php?action=actualizar&id=${idCurso}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosModificados)
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) alert("Error: " + data.error);
                else {
                    alert("¡Curso actualizado con éxito!");
                    modalEditCourse.classList.remove('active');
                    fetch(`${API_URL}/cursos.php`).then(res => res.json()).then(cursos => {
                        todosLosCursos = cursos;
                        renderizarCursosFiltrados();
                        if (usr && usr.rol === 'maestro') {
                            const filtrados = todosLosCursos.filter(c => parseInt(c.id_maestro) === parseInt(usr.id));
                            renderizarTablaAdminCursos(filtrados, true);
                        } else if (manageCategorySelect) {
                            renderizarTablaAdminCursos(manageCategorySelect.value, false);
                        }
                    });
                }
            });
        };

        if (archivoImagen) {
            const lector = new FileReader();
            lector.onloadend = () => enviarDatosActualizados(lector.result);
            lector.readAsDataURL(archivoImagen);
        } else {
            enviarDatosActualizados(cursoOriginal ? cursoOriginal.imagen_url : null);
        }
    });
}