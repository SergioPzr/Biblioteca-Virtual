// =======================================================
// Transitions.js - Sistema de carga tipo Telón (Sin congelamiento visual)
// =======================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inyectamos un telón blanco que cubre toda la pantalla
    const overlayHTML = `
        <div id="nexus-transition-overlay" style="
            position: fixed; 
            inset: 0; 
            background: #ffffff; 
            z-index: 99999; 
            opacity: 1; 
            transition: opacity 0.25s ease-out; 
            pointer-events: none;
        "></div>
    `;
    
    if (!document.getElementById('nexus-transition-overlay')) {
        document.body.insertAdjacentHTML('beforeend', overlayHTML);
    }

    const overlay = document.getElementById('nexus-transition-overlay');

    // 2. Al entrar a la página, el telón desaparece suavemente revelando el contenido
    requestAnimationFrame(() => {
        setTimeout(() => {
            overlay.style.opacity = '0';
        }, 50); // Un pequeño respiro antes de revelar
    });

    // 3. Interceptar enlaces
    const links = document.querySelectorAll('a[href]');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const target = link.getAttribute('href');
            
            // Ignorar enlaces internos o acciones JS
            if (!target || target.startsWith('#') || link.target === '_blank' || target.startsWith('mailto:') || target.startsWith('javascript:')) {
                return;
            }

            e.preventDefault();
            
            // Subimos el telón de nuevo para tapar la pantalla actual
            overlay.style.opacity = '1';
            
            // Esperamos exactamente lo que dura la transición CSS (250ms) antes de redirigir.
            // Si el navegador se congela aquí, lo hará sobre una pantalla en blanco.
            setTimeout(() => {
                window.location.href = target;
            }, 250); 
        });
    });
});

// Restaurar el telón a transparente si se usa el botón "Atrás"
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        const overlay = document.getElementById('nexus-transition-overlay');
        if (overlay) overlay.style.opacity = '0';
    }
});