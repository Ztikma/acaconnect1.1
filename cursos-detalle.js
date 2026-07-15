// ===== MOCK DATA =====
const MOCK_CURSOS = [
    { id_curso: 1, titulo: 'Introducción a JavaScript', descripcion_corta: 'Aprende lo básico', acerca_de: 'Curso completo para principiantes en JavaScript', precio: 299.99, duracion_horas: 40, nivel: 'Principiante', id_categoria: 1, id_maestro: 1, imagen_url: 'cursos-imag/imagen-cursos1.png', maestro_nombre: 'Carlos', maestro_paterno: 'García' },
    { id_curso: 2, titulo: 'Python Avanzado', descripcion_corta: 'Domina Python', acerca_de: 'Técnicas avanzadas y patrones en Python', precio: 399.99, duracion_horas: 50, nivel: 'Avanzado', id_categoria: 1, id_maestro: 2, imagen_url: 'cursos-imag/imagen-cursos1.png', maestro_nombre: 'María', maestro_paterno: 'Rodríguez' },
    { id_curso: 3, titulo: 'React desde Cero', descripcion_corta: 'Crea interfaces', acerca_de: 'Aprende React moderna y hooks', precio: 349.99, duracion_horas: 45, nivel: 'Intermedio', id_categoria: 1, id_maestro: 1, imagen_url: 'cursos-imag/imagen-cursos1.png', maestro_nombre: 'Carlos', maestro_paterno: 'García' },
    { id_curso: 4, titulo: 'Cálculo I', descripcion_corta: 'Fundamentos', acerca_de: 'Introducción al cálculo diferencial', precio: 279.99, duracion_horas: 35, nivel: 'Principiante', id_categoria: 2, id_maestro: 3, imagen_url: 'cursos-imag/imagen-cursos1.png', maestro_nombre: 'Juan', maestro_paterno: 'Pérez' },
    { id_curso: 5, titulo: 'Álgebra Lineal', descripcion_corta: 'Matrices y vectores', acerca_de: 'Aplicaciones prácticas de álgebra lineal', precio: 329.99, duracion_horas: 42, nivel: 'Intermedio', id_categoria: 2, id_maestro: 3, imagen_url: 'cursos-imag/imagen-cursos1.png', maestro_nombre: 'Juan', maestro_paterno: 'Pérez' },
];

const MOCK_CATEGORIAS = [
    { id_categoria: 1, nombre: 'Programación' },
    { id_categoria: 2, nombre: 'Matematicas' },
    { id_categoria: 3, nombre: 'Idiomas' },
    { id_categoria: 4, nombre: 'Marketing' },
    { id_categoria: 5, nombre: 'Diseño Grafico' },
    { id_categoria: 6, nombre: 'Gestion' },
];

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

// ===== MODALES =====
const modalLogin = document.getElementById('modal-login');
const openLoginBtn = document.getElementById('open-login');
const closeLoginBtn = document.getElementById('close-login');

if (openLoginBtn) openLoginBtn.addEventListener('click', () => modalLogin.classList.add('active'));
if (closeLoginBtn) closeLoginBtn.addEventListener('click', () => modalLogin.classList.remove('active'));

// ===== CARGA DINÁMICA DE CURSO (Usando datos mock) =====
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const idCurso = parseInt(urlParams.get('id') || 1);

    // Buscar el curso en los datos mock
    const curso = MOCK_CURSOS.find(c => c.id_curso === idCurso);
    
    if (curso) {
        document.getElementById('dyn-breadcrumb').textContent = curso.titulo;
        document.getElementById('dyn-titulo').textContent = curso.titulo;
        document.getElementById('dyn-descripcion').textContent = curso.acerca_de;
        document.getElementById('dyn-precio').textContent = `$${parseFloat(curso.precio).toFixed(2)} MXN`;
        document.getElementById('dyn-duracion').textContent = curso.duracion_horas;
        document.getElementById('dyn-nivel').textContent = curso.nivel;
        if (curso.imagen_url) {
            document.getElementById('dyn-imagen').src = curso.imagen_url;
        }
        if (curso.maestro_nombre) {
            document.getElementById('dyn-maestro').textContent = `${curso.maestro_nombre} ${curso.maestro_paterno || ''}`;
        }
    } else {
        document.getElementById('dyn-titulo').textContent = "Curso no encontrado";
    }

    // Llenar menú de categorías
    if (dropdownMenu) {
        dropdownMenu.innerHTML = '';
        MOCK_CATEGORIAS.forEach(cat => {
            const link = document.createElement('a');
            link.href = `index.html`; 
            link.textContent = cat.nombre;
            dropdownMenu.appendChild(link);
        });
    }
        
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
            btnCrear.href = 'index.html'; 
            btnCrear.innerHTML = '<i class="fas fa-plus-circle"></i> Crear Curso';
            adminOptions.appendChild(btnCrear);

            const btnAdmin = document.createElement('a');
            btnAdmin.href = 'index.html';
            if (usuario.rol === 'admin') {
                userDisplayName.textContent = `${usuario.nombre} (Admin)`;
                btnAdmin.innerHTML = '<i class="fas fa-tasks"></i> Administrar Cursos';
                
                const btnPermisos = document.createElement('a');
                btnPermisos.href = 'index.html';
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
        window.location.href = 'index.html';
    });
}

// ===== FORM LOGIN =====
const formLogin = document.getElementById('form-login');
if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const usuarioSimulado = { nombre: 'Usuario Test', id: 1, rol: 'alumno', email: email };
        alert(`¡Bienvenido de nuevo, ${usuarioSimulado.nombre}!`);
        localStorage.setItem('usuario', JSON.stringify(usuarioSimulado));
        location.reload();
    });
}
