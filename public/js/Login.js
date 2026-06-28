let selectedRole = 'cliente'; // Rol activo por defecto

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

function selectRole(role) {
    selectedRole = role;
    document.getElementById('role-cliente').classList.toggle('active', role === 'cliente');
    document.getElementById('role-admin').classList.toggle('active', role === 'admin');
}

// CONEXIÓN ASÍNCRONA REAL A MONGODB ATLAS
async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value.trim();

    if (!email || !pass) {
        alert("Por favor, ingresa tu correo y contraseña para continuar.");
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
            alert("❌ Error de acceso: " + data.error);
            return;
        }

        // Verificación estricta: Limpiamos y comparamos en minúsculas
        const rolServidor = data.rol.toLowerCase().trim();
        const rolSeleccionado = selectedRole.toLowerCase().trim();

        if (rolServidor !== rolSeleccionado) {
            alert(`⚠️ Privilegios insuficientes. Tu cuenta no cuenta con rol de: ${selectedRole.toUpperCase()}`);
            return;
        }

        // Almacenar las credenciales validadas de Atlas en la sesión activa
        sessionStorage.setItem('nexuslib_rol', rolServidor);
        sessionStorage.setItem('nexuslib_usuario', data.nombre);
        sessionStorage.setItem('nexuslib_email', email);

        // Ejecutar animación de salida (Transitions.js)
        document.body.classList.add('fade-out');

        setTimeout(() => {
            if (rolServidor === 'admin') {
                window.location.href = '/Dashboard.html'; // Te manda al panel de control de administración
            } else {
                window.location.href = '/Inicio.html'; // Te manda a la vitrina del cliente
            }
        }, 400);

    } catch (err) {
        alert("Error de red al conectar con MongoDB Atlas: " + err.message);
    }
}

// =========================================================
// Al cargar el Login: si ya está autenticado, lo derivamos a donde pertenece
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    const rolActivo = sessionStorage.getItem('nexuslib_rol');
    if (rolActivo) {
        window.location.href = rolActivo === 'admin' ? '/Dashboard.html' : '/Inicio.html';
    }
});