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
        mostrarToast('⚠️ Por favor ingresa tu correo y contraseña para continuar.');
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
            mostrarToast('❌ ' + data.error);
            return;
        }

        // Guardar sesión con el rol que Oracle asignó
        sessionStorage.setItem('nexuslib_rol',      data.rol);
        sessionStorage.setItem('nexuslib_usuario',  data.nombre);
        sessionStorage.setItem('nexuslib_apellido', data.apellido || '');
        sessionStorage.setItem('nexuslib_email',    email);
        sessionStorage.setItem('nexuslib_id',       data.idUsuario);

        document.body.classList.add('fade-out');
        setTimeout(() => {
            window.location.href = data.rol === 'admin' ? '/Dashboard.html' : '/Inicio.html';
        }, 400);

    } catch (err) {
        mostrarToast('❌ Error de red: ' + err.message);
    }
}

// Registro de nuevo usuario — rol Lector por defecto
async function handleRegister() {
    const nombre   = document.getElementById('reg-nombre').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-pass').value.trim();

    if (!nombre || !email || !password) {
        mostrarToast('⚠️ Por favor completa todos los campos para registrarte.');
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
            mostrarToast('❌ ' + data.error);
            return;
        }

        mostrarToast(`✅ ¡Bienvenido, ${nombre}! Ya puedes iniciar sesión.`);
        switchTab('login');

    } catch (err) {
        mostrarToast('❌ Error de red: ' + err.message);
    }
}

// Enter en los inputs del login dispara handleLogin
document.addEventListener('DOMContentLoaded', () => {
    const onEnter = (e) => { if (e.key === 'Enter') handleLogin(); };
    document.getElementById('login-email')?.addEventListener('keydown', onEnter);
    document.getElementById('login-pass')?.addEventListener('keydown', onEnter);
});

function mostrarToast(mensaje) {
    let toast = document.getElementById('nexus-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'nexus-toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '32px';
        toast.style.right = '32px';
        toast.style.zIndex = '99999';
        toast.style.background = '#1e293b';
        toast.style.color = 'white';
        toast.style.padding = '14px 22px';
        toast.style.borderRadius = '12px';
        toast.style.fontFamily = 'Inter, sans-serif';
        toast.style.fontSize = '0.92rem';
        toast.style.fontWeight = '500';
        toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        toast.style.maxWidth = '360px';
        document.documentElement.appendChild(toast);
    }
    toast.textContent = mensaje;
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
        });
    });
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 3500);
}