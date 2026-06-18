// Simulación de los datos del Backend (Se añadieron libros extra para asegurar el funcionamiento del carrusel)
const mockFeaturedBooks = [
    {
        id: '1', title: 'Cien años de soledad', author: 'Gabriel García Márquez', rating: 5, reviews: 1284,
        coverUrl: 'https://m.media-amazon.com/images/I/81MI6+TpYkL._AC_UF1000,1000_QL80_.jpg'
    },
    {
        id: '2', title: 'La casa de los espíritus', author: 'Isabel Allende', rating: 5, reviews: 932,
        coverUrl: 'https://m.media-amazon.com/images/I/91tUo+rK3WL._AC_UF1000,1000_QL80_.jpg'
    },
    {
        id: '3', title: 'La ciudad y los perros', author: 'Mario Vargas Llosa', rating: 4, reviews: 612,
        coverUrl: '' 
    },
    {
        id: '4', title: 'Ficciones', author: 'Jorge Luis Borges', rating: 5, reviews: 1502,
        coverUrl: 'https://m.media-amazon.com/images/I/71R2Qo2U4FL._AC_UF1000,1000_QL80_.jpg'
    },
    {
        id: '5', title: 'Rayuela', author: 'Julio Cortázar', rating: 5, reviews: 775,
        coverUrl: 'https://m.media-amazon.com/images/I/61r-Gtd2LML._AC_UF1000,1000_QL80_.jpg'
    },
    {
        id: '6', title: 'Pedro Páramo', author: 'Juan Rulfo', rating: 5, reviews: 845,
        coverUrl: 'https://m.media-amazon.com/images/I/71Xm+1M7DNL._AC_UF1000,1000_QL80_.jpg'
    },
    {
        id: '7', title: 'El Aleph', author: 'Jorge Luis Borges', rating: 5, reviews: 1102,
        coverUrl: 'https://m.media-amazon.com/images/I/71X1E8S5LwL._AC_UF1000,1000_QL80_.jpg'
    },
    {
        id: '8', title: 'Los Ríos Profundos', author: 'José María Arguedas', rating: 5, reviews: 450,
        coverUrl: 'https://m.media-amazon.com/images/I/81h2QyPyl+L._AC_UF1000,1000_QL80_.jpg'
    }
];

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

// Función principal de renderizado
function renderFeaturedBooks() {
    const container = document.getElementById('books-container');
    if (!container) return;
    container.innerHTML = '';

    mockFeaturedBooks.forEach(book => {
        const card = document.createElement('article');
        card.className = 'book-card';

        // Se eliminó la etiqueta del ISBN
        card.innerHTML = `
            ${book.coverUrl 
                ? `<img src="${book.coverUrl}" alt="Portada de ${book.title}" class="book-cover">` 
                : `<div class="book-cover flex items-center justify-center text-xs text-neutral-mid" style="display:flex;align-items:center;justify-content:center;text-align:center;">Sin Portada</div>`
            }
            <h3 class="book-title font-display">${book.title}</h3>
            <p class="book-author">${book.author}</p>
            <div class="book-meta">
                <div class="stars-container">${generateStars(book.rating)}</div>
                <span class="reviews">(${book.reviews})</span>
            </div>
        `;

        container.appendChild(card);
    });

    // Iniciar funcionalidad del carrusel una vez que las tarjetas existen en el DOM
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
    renderFeaturedBooks();
});