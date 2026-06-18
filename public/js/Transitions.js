// transitions.js - Sistema global de cambio de pantallas

document.addEventListener('DOMContentLoaded', () => {
    // Buscamos todos los enlaces de la página
    const links = document.querySelectorAll('a[href]');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const target = link.getAttribute('href');
            
            // Ignorar enlaces internos (#), que abren en nueva pestaña (_blank) o correos (mailto:)
            if (!target || target.startsWith('#') || link.target === '_blank' || target.startsWith('mailto:')) {
                return;
            }

            // Evitamos que el navegador cambie de página bruscamente
            e.preventDefault();
            
            // Añadimos la clase que dispara la animación de salida en el CSS
            document.body.classList.add('fade-out');
            
            // Esperamos a que la animación termine (400 milisegundos) y luego cambiamos de página
            setTimeout(() => {
                window.location.href = target;
            }, 400); 
        });
    });
});

// FIX: Solución para cuando el usuario presiona el botón "Atrás" del navegador
// Esto evita que la página se quede en blanco (invisible) si está guardada en la caché del navegador
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        document.body.classList.remove('fade-out');
    }
});