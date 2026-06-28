// =======================================================
// LÓGICA DEL PANEL DE ADMINISTRACIÓN (Dashboard.js)
// =======================================================

// PROTECCIÓN DE RUTA: Expulsa si no es admin
document.addEventListener('DOMContentLoaded', () => {
    const rol = sessionStorage.getItem('nexuslib_rol');
    if (rol !== 'admin') {
        window.location.href = '/Inicio.html';
    }
});

// CAMBIO DINÁMICO DE PANELES (Oracle & MongoDB)
function switchPanel(panelId) {
    // Ocultar todos los paneles
    document.querySelectorAll('.admin-panel').forEach(p => p.style.display = 'none');
    
    // Quitar estado activo a todos los botones de la navegación lateral
    document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
    
    // Mostrar el panel seleccionado
    const targetPanel = document.getElementById('panel-' + panelId);
    if (targetPanel) {
        targetPanel.style.display = 'block';
    }
    
    // Activar el botón correspondiente
    if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
    }
}

// CIERRE DE SESIÓN SEGURO
function cerrarSesion() {
    sessionStorage.clear();
    document.body.classList.add('fade-out');
    setTimeout(() => {
        window.location.href = '/Login.html';
    }, 400);
}