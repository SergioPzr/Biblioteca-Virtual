// =========================================================
// Login.js — Lógica de autenticación simulada
// 
// NOTA PARA INTEGRACIÓN FUTURA (Oracle):
// La función handleLogin() debe reemplazar el bloque 
// "SIMULACIÓN" por un fetch real a:
//   POST /api/oracle/auth/login
//   body: { email, password, rol }
// El servidor verificará contra la tabla USUARIO y 
// devolverá { ok: true, rol: 'cliente'|'admin', nombre }
// =========================================================

let selectedRole = 'cliente'; // Rol activo por defecto

/**
 * Cambia entre los paneles "Iniciar sesión" y "Registrarse"
 */
function switchTab(tab) {
    const tabLogin    = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const panelLogin    = document.getElementById('panel-login');
    const panelRegister = document.getElementById('panel-register');

    if (tab === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        panelLogin.style.display    = 'block';
        panelRegister.style.display = 'none';
    } else {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        panelRegister.style.display = 'block';
        panelLogin.style.display    = 'none';
    }
}

/**
 * Actualiza el rol seleccionado visualmente y lo guarda en la variable
 */
function selectRole(role) {
    selectedRole = role;

    document.getElementById('role-cliente').classList.toggle('active', role === 'cliente');
    document.getElementById('role-admin').classList.toggle('active', role === 'admin');
}

/**
 * Maneja el submit del formulario de login.
 * 
 * === SIMULACIÓN ACTUAL ===
 * Guarda el rol en sessionStorage y redirige según el rol.
 * No valida credenciales.
 *
 * === INTEGRACIÓN FUTURA ===
 * Reemplazar el bloque de simulación por:
 *
 *   const res = await fetch('/api/oracle/auth/login', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ email, password, rol: selectedRole })
 *   });
 *   const data = await res.json();
 *   if (!res.ok) { mostrarError(data.error); return; }
 *   sessionStorage.setItem('nexuslib_rol', data.rol);
 *   sessionStorage.setItem('nexuslib_usuario', data.nombre);
 *   window.location.href = data.rol === 'admin' ? '/Dashboard.html' : '/Inicio.html';
 */
function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value.trim();

    // Validación obligatoria para que el botón tenga función real
    if (!email || !pass) {
        alert("Por favor, ingresa tu correo y contraseña para continuar.");
        return;
    }

    // === SIMULACIÓN ACTUAL ===
    sessionStorage.setItem('nexuslib_rol', selectedRole);
    sessionStorage.setItem('nexuslib_usuario', selectedRole === 'admin' ? 'Administrador' : 'Lector');

    // Animación de salida antes de redirigir
    document.body.classList.add('fade-out');

    setTimeout(() => {
        if (selectedRole === 'admin') {
            window.location.href = '/Dashboard.html';
        } else {
            window.location.href = '/Inicio.html';
        }
    }, 400);
}

// =========================================================
// Al cargar la página: si ya hay sesión, redirigir directo
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    const rolActivo = sessionStorage.getItem('nexuslib_rol');
    if (rolActivo) {
        window.location.href = rolActivo === 'admin' ? '/Dashboard.html' : '/Inicio.html';
    }
});
