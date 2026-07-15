const API_URL = 'https://ingoliver.webpro1213.com/look_courses/api';

function toggleMenuDirecto(event) {
    event.stopPropagation(); 
    const dropdown = document.getElementById('profile-dropdown');
    if (dropdown) { dropdown.classList.toggle('active'); }
}

document.addEventListener('click', () => {
    const dropdown = document.getElementById('profile-dropdown');
    if (dropdown) { dropdown.classList.remove('active'); }
});

const btnCategories = document.getElementById('btn-categories');
const dropdownMenu = document.getElementById('dropdown-menu');

if (btnCategories && dropdownMenu) {
    btnCategories.addEventListener('click', (e) => {
        dropdownMenu.classList.toggle('active');
        e.stopPropagation();
    });
    document.addEventListener('click', () => dropdownMenu.classList.remove('active'));
}

// --- MODALES ---
const modalLogin = document.getElementById('modal-login');
const openLoginBtn = document.getElementById('open-login');
const closeLoginBtn = document.getElementById('close-login');

if (openLoginBtn) openLoginBtn.addEventListener('click', () => modalLogin.classList.add('active'));
if (closeLoginBtn) closeLoginBtn.addEventListener('click', () => modalLogin.classList.remove('active'));

// --- CARGA DINÁMICA DE CURSO Y PERFILES ---
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const idCurso = urlParams.get('id') || 1;

    // Traer la info del curso desde la nueva API indestructible
    fetch(`${API_URL}/obtener_detalle.php?id=${idCurso}`)
        .then(res => res.json())
        .then(curso => {
            if(curso.error) {
                document.getElementById('dyn-titulo').textContent = "Curso no encontrado";
                return;
            }
            document.getElementById('dyn-breadcrumb').textContent = curso.titulo;
            document.getElementById('dyn-titulo').textContent = curso.titulo;
            document.getElementById('dyn-descripcion').textContent = curso.acerca_de;
            document.getElementById('dyn-precio').textContent = `$${parseFloat(curso.precio).toFixed(2)} MXN`;
            document.getElementById('dyn-duracion').textContent = curso.duracion_horas;
            document.getElementById('dyn-nivel').textContent = curso.nivel;
            if(curso.imagen_url) {
                document.getElementById('dyn-imagen').src = curso.imagen_url;
            }
            if(curso.maestro_nombre) {
                document.getElementById('dyn-maestro').textContent = `${curso.maestro_nombre} ${curso.maestro_paterno || ''}`;
            }
        }).catch(err => console.error(err));

    // Categorías del menú superior
    fetch(`${API_URL}/categorias.php`)
        .then(res => res.json())
        .then(categorias => {
            if (dropdownMenu) {
                dropdownMenu.innerHTML = '';
                categorias.forEach(cat => {
                    const link = document.createElement('a');
                    link.href = `Look Courses.php?cat=${cat.id_categoria}`; 
                    link.textContent = cat.nombre;
                    dropdownMenu.appendChild(link);
                });
            }
        }).catch(err => console.error(err));
        
    // Roles del Panel Administrativo
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
        const usuario = JSON.parse(usuarioGuardado);
        const guestButtons = document.getElementById('auth-guest-buttons');
        const userProfile = document.getElementById('auth-user-profile');
        const userDisplayName = document.getElementById('user-display-name');
        const adminOptions = document.getElementById('admin-options');
        
        if (guestButtons) guestButtons.classList.add('hidden');
        if (userProfile) userProfile.classList.remove('hidden');
        
        if (adminOptions) {
            adminOptions.innerHTML = '';
            
            const btnCrear = document.createElement('a');
            btnCrear.href = 'Look Courses.php'; 
            btnCrear.innerHTML = '<i class="fas fa-plus-circle"></i> Crear Curso';
            adminOptions.appendChild(btnCrear);

            const btnAdmin = document.createElement('a');
            btnAdmin.href = 'Look Courses.php';
            if (usuario.rol === 'admin') {
                userDisplayName.textContent = `${usuario.nombre} (Admin)`;
                btnAdmin.innerHTML = '<i class="fas fa-tasks"></i> Administrar Cursos';
                
                const btnPermisos = document.createElement('a');
                btnPermisos.href = 'Look Courses.php';
                btnPermisos.innerHTML = '<i class="fas fa-user-shield"></i> Dar Permisos';
                adminOptions.appendChild(btnPermisos);
            } else if (usuario.rol === 'maestro') {
                userDisplayName.textContent = `${usuario.nombre} (Profesor)`;
                btnAdmin.innerHTML = '<i class="fas fa-tasks"></i> Administrar Mis Cursos';
            }
            adminOptions.insertBefore(btnAdmin, adminOptions.childNodes[1] || null);
        }
    }
});

const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('usuario');
        alert("Sesión cerrada.");
        window.location.href = 'Look Courses.php';
    });
}