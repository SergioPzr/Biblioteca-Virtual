// -------------------------------------------------------
// NAVBAR DINÁMICA POR ROL
// -------------------------------------------------------
function inyectarNavRol() {
    const rol = sessionStorage.getItem('nexuslib_rol');
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    let tercerEnlace = '';
    if (rol === 'admin') {
        tercerEnlace = `<a href="/Dashboard.html">Dashboard</a>`;
    } else if (rol === 'cliente') {
        tercerEnlace = `<a href="/MisPrestamos.html">Mis préstamos</a>`;
    }

    navLinks.innerHTML = `
        <a href="/Inicio.html" class="active">Inicio</a>
        <a href="/Catalogo.html">Catálogo</a>
        ${tercerEnlace}
    `;
}

function goToLogin() {
    const rol = sessionStorage.getItem('nexuslib_rol');
    
    // Si ya tenía sesión iniciada, esto funciona como un "Cerrar Sesión" seguro
    if (rol) {
        sessionStorage.clear();
    }
    
    // Activamos la animación de transición estética
    document.body.classList.add('fade-out');
    
    // Redirigimos al formulario de Login
    setTimeout(() => {
        window.location.href = '/Login.html';
    }, 250); // Ajustado a la velocidad del telón blanco de Transitions.js
}

// Generador de estrellas SVG
function generateStars(rating) {
    let starsHtml = '';
    const starFilled = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    const starEmpty = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

    for (let i = 0; i < 5; i++) {
        starsHtml += i < rating ? starFilled : starEmpty;
    }
    return starsHtml;
}

// Función principal de renderizado — trae libros reales de Oracle
async function renderFeaturedBooks() {
    const container = document.getElementById('books-container');
    if (!container) return;
    container.innerHTML = '';

    let libros = [];
    try {
        const res = await fetch('/api/oracle/libros');
        const data = await res.json();
        // Tomar hasta 8 libros con stock disponible primero, luego el resto
        const conStock = data.filter(l => l.STOCK_DISPONIBLE > 0);
        const sinStock = data.filter(l => l.STOCK_DISPONIBLE <= 0);
        libros = [...conStock, ...sinStock].slice(0, 8);
    } catch (e) {
        console.warn('No se pudo cargar libros de Oracle para el carrusel.');
        initCarousel();
        return;
    }

    libros.forEach(libro => {
        const card = document.createElement('article');
        card.className = 'book-card';
        card.style.cursor = 'pointer';

        const coverUrl = (typeof getImagenLibro !== 'undefined')
            ? getImagenLibro(libro.IDLIBRO)
            : '';

        card.innerHTML = `
            <img src="${coverUrl}" alt="Portada de ${libro.TITULO}" class="book-cover"
                onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop';">
            <h3 class="book-title font-display">${libro.TITULO}</h3>
            <p class="book-author">${libro.AUTOR || 'Autor desconocido'}</p>
            <div class="book-meta">
                <div class="stars-container">${generateStars(5)}</div>
                <span class="reviews">(${libro.ANIO_PUBLICACION || ''})</span>
            </div>
        `;

        card.addEventListener('click', () => {
            document.body.classList.add('fade-out');
            setTimeout(() => { window.location.href = `/DetalleLibro.html?id=${libro.IDLIBRO}`; }, 250);
        });

        container.appendChild(card);
    });

    initCarousel();
}

// Lógica del Carrusel (Solución del Botón Izquierdo)
function initCarousel() {
    const container = document.getElementById('books-container');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    let autoPlayInterval;

    if (!container || !prevBtn || !nextBtn) return;

    // Calculamos el desplazamiento exacto (Ancho de la tarjeta 190px + gap de 40px)
    const getScrollAmount = () => {
        const firstCard = container.querySelector('.book-card');
        return firstCard ? firstCard.offsetWidth + 40 : 230;
    };

    const scrollNext = () => {
        // Tolerancia de 10px para evitar fallos por decimales en pantallas de alta resolución
        if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
            container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
            // Usamos scrollTo absoluto en lugar de scrollBy
            container.scrollTo({ left: container.scrollLeft + getScrollAmount(), behavior: 'smooth' });
        }
    };

    const scrollPrev = () => {
        // Si estamos en el principio (o casi en el principio)
        if (container.scrollLeft <= 10) {
            container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
        } else {
            // Al retroceder, calculamos la posición absoluta exacta para vencer el imán del CSS
            const targetPosition = container.scrollLeft - getScrollAmount();
            container.scrollTo({ left: targetPosition, behavior: 'smooth' });
        }
    };

    // Eventos de los botones
    prevBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Evita comportamientos extraños del botón
        scrollPrev();
        resetAutoPlay(); 
    });

    nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        scrollNext();
        resetAutoPlay();
    });

    // Funciones de Auto-Play
    const startAutoPlay = () => {
        autoPlayInterval = setInterval(scrollNext, 10000); 
    };

    const resetAutoPlay = () => {
        clearInterval(autoPlayInterval);
        startAutoPlay();
    };

    // Iniciar temporizador al cargar la página
    startAutoPlay();
}

document.addEventListener('DOMContentLoaded', () => {
    inyectarNavRol();
    renderFeaturedBooks();
    // Nota: incluir /js/imagenesLibros.js ANTES de este script en el HTML
});