// =======================================================
// PANEL DE PRÉSTAMOS DEL CLIENTE (MisPrestamos.js)
// =======================================================

// PROTECCIÓN DE RUTA: Expulsa si no hay sesión de cliente activa
document.addEventListener('DOMContentLoaded', () => {
    const rol = sessionStorage.getItem('nexuslib_rol');
    if (rol !== 'cliente') {
        window.location.href = '/Inicio.html';
    }
});

// CIERRE DE SESIÓN SEGURO
function cerrarSesion() {
    sessionStorage.clear();
    document.body.classList.add('fade-out');
    setTimeout(() => {
        window.location.href = '/Login.html';
    }, 400);
}