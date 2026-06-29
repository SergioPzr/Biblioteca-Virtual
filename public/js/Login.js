// =========================================================
// Login.js — Autenticación contra Oracle SQL
// Los botones "Cliente" y "Admin" solo autorrellanan campos.
// El rol real lo determina Oracle, no el usuario.
// =========================================================

// Autorellena los campos con las credenciales de prueba según el perfil
function selectRole(perfil) {
    const emailInput = document.getElementById('login-email');
    const passInput  = document.getElementById('login-pass');

    if (perfil === 'admin') {
        emailInput.value = 'sergio.pizarro@urp.edu.pe';
        passInput.value  = 'hash123';
    } else {
        emailInput.value = 'lokochon.oyataitambo@gmail.com';
        passInput.value  = 'hash123';
    }

    // Resaltar visualmente el botón pulsado (solo estético)
    document.getElementById('role-cliente').classList.toggle('active', perfil === 'cliente');
    document.getElementById('role-admin').classList.toggle('active', perfil === 'admin');
}

// Alterna entre los paneles "Iniciar sesión" y "Registrarse"
function switchTab(tab) {
    const tabLogin      = document.getElementById('tab-login');
    const tabRegister   = document.getElementById('tab-register');
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

// Login — el rol viene de Oracle, no del botón
async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const pass  = document.getElementById('login-pass').value.trim();

    if (!email || !pass) {
        alert('Por favor ingresa tu correo y contraseña para continuar.');
        return;
    }

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
        });

        const data = await res.json();

        if (!res.ok) {
            alert('❌ ' + data.error);
            return;
        }

        // Guardar sesión con el rol que Oracle asignó
        sessionStorage.setItem('nexuslib_rol',      data.rol);
        sessionStorage.setItem('nexuslib_usuario',  data.nombre);
        sessionStorage.setItem('nexuslib_apellido', data.apellido || '');
        sessionStorage.setItem('nexuslib_email',    email);

        document.body.classList.add('fade-out');
        setTimeout(() => {
            window.location.href = data.rol === 'admin' ? '/Dashboard.html' : '/Inicio.html';
        }, 400);

    } catch (err) {
        alert('Error de red al conectar con el servidor: ' + err.message);
    }
}

// Registro de nuevo usuario — rol Lector por defecto
async function handleRegister() {
    const nombre   = document.getElementById('reg-nombre').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-pass').value.trim();

    if (!nombre || !email || !password) {
        alert('Por favor completa todos los campos para registrarte.');
        return;
    }

    try {
        const res = await fetch('/api/auth/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            alert('❌ ' + data.error);
            return;
        }

        alert(`✅ Cuenta creada exitosamente. ¡Bienvenido, ${nombre}!\nYa puedes iniciar sesión.`);
        switchTab('login');

    } catch (err) {
        alert('Error de red al conectar con el servidor: ' + err.message);
    }
}

// Enter en los inputs del login dispara handleLogin
document.addEventListener('DOMContentLoaded', () => {
    const onEnter = (e) => { if (e.key === 'Enter') handleLogin(); };
    document.getElementById('login-email')?.addEventListener('keydown', onEnter);
    document.getElementById('login-pass')?.addEventListener('keydown', onEnter);
});
