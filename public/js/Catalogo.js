const portadasDeRespaldo = [
    "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop", // 0
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop", // 1
    "https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=400&auto=format&fit=crop", // 2
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&auto=format&fit=crop", // 3
    "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&auto=format&fit=crop", // 4
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&auto=format&fit=crop", // 5
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop", // 6
    "https://images.unsplash.com/photo-1513001900722-370f803f498d?w=400&auto=format&fit=crop", // 7
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&auto=format&fit=crop", // 8
    "https://images.unsplash.com/photo-1531988042231-d39a9cc12a9a?w=400&auto=format&fit=crop", // 9
    "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400&auto=format&fit=crop", // 10
    "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&auto=format&fit=crop", // 11. CAMBIADO Y VERIFICADO (Libros médicos)
    "https://images.unsplash.com/photo-1614849963640-9cc74b2a826f?w=400&auto=format&fit=crop", // 12
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&auto=format&fit=crop", // 13
    "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&auto=format&fit=crop", // 14. CAMBIADO Y VERIFICADO (Biblioteca clásica)
    "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&auto=format&fit=crop", // 15. CAMBIADO Y VERIFICADO (Libro jurídico/formal)
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&auto=format&fit=crop", // 18
];

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
        <a href="/Inicio.html">Inicio</a>
        <a href="/Catalogo.html" class="active">Catálogo</a>
        ${tercerEnlace}
    `;
}

function goToLogin() {
    sessionStorage.clear();
    document.body.classList.add('fade-out');
    setTimeout(() => { window.location.href = '/Login.html'; }, 400);
}

// Variables de estado dinámicas
let librosBaseDeDatos = [];
let currentQuery = "";
let currentMinYear = 1900;
let filterInStock = false;
let selectedFormats = [];
let filterTimeout;

const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const booksGrid = document.getElementById('books-grid');
const emptyState = document.getElementById('empty-state');
const resultsCount = document.getElementById('results-count');
const catalogBody = document.querySelector('.catalog-body');
const filterDrawer = document.getElementById('filter-drawer');
const openFiltersBtn = document.getElementById('open-filters-btn');
const closeFiltersBtn = document.getElementById('close-filters-btn');
const resetFiltersBtn = document.getElementById('reset-filters-btn');
const yearSlider = document.getElementById('year-slider');
const yearDisplay = document.getElementById('year-display');
const yearMinLabel = document.getElementById('year-min-label');
const yearMaxLabel = document.getElementById('year-max-label');
const stockFilter = document.getElementById('stock-filter');
const formatFiltersContainer = document.getElementById('format-filters');

// TRAER DATOS REALES DE ORACLE
async function obtenerLibrosDeOracle() {
    try {
        const res = await fetch('/api/oracle/libros');
        const data = await res.json();
        
        // Mapear el formato JSON de Oracle a minúsculas para mantener consistencia con el frontend
        librosBaseDeDatos = data.map(l => ({
            id: l.IDLIBRO,
            isbn: l.ISBN,
            title: l.TITULO,
            author: l.AUTOR,
            genre: l.GENERO,
            format: l.FORMATO,
            stock: l.STOCK_DISPONIBLE,
            year: l.ANIO_PUBLICACION,
            coverUrl: l.URL_IMAGEN || '' // Usar la URL guardada en Oracle si existe
        }));

        initFilterUI();
        filterBooks();
    } catch (err) {
        resultsCount.textContent = "Error al conectar con el servidor.";
    }
}

function initFilterUI() {
    if (librosBaseDeDatos.length === 0) return;
    const years = librosBaseDeDatos.map(b => b.year);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const formats = [...new Set(librosBaseDeDatos.map(b => b.format))];

    yearSlider.min = minYear;
    yearSlider.max = maxYear;
    yearSlider.value = minYear;
    yearDisplay.textContent = minYear;
    yearMinLabel.textContent = minYear;
    yearMaxLabel.textContent = maxYear;

    formatFiltersContainer.innerHTML = '';
    formats.forEach(format => {
        const label = document.createElement('label');
        label.className = 'checkbox-wrapper';
        label.innerHTML = `
            <input type="checkbox" class="custom-checkbox format-checkbox" value="${format}">
            <span class="checkbox-text">${format.toUpperCase()}</span>
        `;
        formatFiltersContainer.appendChild(label);
    });

    yearSlider.addEventListener('input', (e) => {
        currentMinYear = parseInt(e.target.value);
        yearDisplay.textContent = currentMinYear;
        filterBooks();
    });

    stockFilter.addEventListener('change', (e) => {
        filterInStock = e.target.checked;
        filterBooks();
    });

    formatFiltersContainer.addEventListener('change', () => {
        selectedFormats = Array.from(formatFiltersContainer.querySelectorAll('.format-checkbox:checked')).map(box => box.value);
        filterBooks();
    });
}

function toggleDrawer(forceClose = false) {
    if (forceClose || filterDrawer.classList.contains('open')) {
        filterDrawer.classList.remove('open');
        catalogBody.classList.remove('drawer-open');
    } else {
        filterDrawer.classList.add('open');
        catalogBody.classList.add('drawer-open');
    }
}

openFiltersBtn.addEventListener('click', () => toggleDrawer());
closeFiltersBtn.addEventListener('click', () => toggleDrawer(true));

function generateStars() {
    let starsHtml = '';
    const starFilled = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    for (let i = 0; i < 5; i++) starsHtml += starFilled;
    return starsHtml;
}

// 🎨 LOGICA REACCIÓN FILTRADA CON VÍNCULO DE IMÁGENES DE RESPALDO
function filterBooks() {
    const q = currentQuery.trim().toLowerCase();
    const filteredBooks = librosBaseDeDatos.filter(b => {
        const matchesQuery = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
        const matchesYear = b.year >= currentMinYear;
        const matchesStock = !filterInStock || b.stock > 0;
        const matchesFormat = selectedFormats.length === 0 || selectedFormats.includes(b.format);
        return matchesQuery && matchesYear && matchesStock && matchesFormat;
    });

    booksGrid.style.opacity = '0';
    booksGrid.style.transform = 'translateY(6px)';
    clearTimeout(filterTimeout);

    filterTimeout = setTimeout(() => {
        resultsCount.textContent = `${filteredBooks.length} libro${filteredBooks.length !== 1 ? 's' : ''} encontrado${filteredBooks.length !== 1 ? 's' : ''}`;

        if (filteredBooks.length === 0) {
            booksGrid.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            booksGrid.style.display = 'grid';
            emptyState.style.display = 'none';
            booksGrid.innerHTML = '';

            // Se añadió 'index' en el forEach para mapear de manera cíclica las portadas
            filteredBooks.forEach((book, index) => {
                const card = document.createElement('article');
                card.className = 'book-card';
                card.style.cursor = 'pointer';

                // Usar URL de Oracle si existe, sino usar imagen de respaldo por índice
                const linkImagen = (book.coverUrl && book.coverUrl.trim() !== '')
                    ? book.coverUrl
                    : portadasDeRespaldo[index % portadasDeRespaldo.length];

                const stockBadge = book.stock > 0
                    ? `<span style="position:absolute; top:8px; right:8px; background:var(--primary); color:white; font-size:0.65rem; padding:4px 10px; border-radius:12px; font-weight:bold; z-index:5;">Disponible (${book.stock})</span>`
                    : `<span style="position:absolute; top:8px; right:8px; background:#ef4444; color:white; font-size:0.65rem; padding:4px 10px; border-radius:12px; font-weight:bold; z-index:5;">Agotado</span>`;

                card.innerHTML = `
                    <div class="book-cover-wrapper" style="position:relative; width:100%; height:250px; overflow:hidden; border-radius:8px;">
                        ${stockBadge}
                        <img 
                            src="${linkImagen}" 
                            alt="Portada de ${book.title}" 
                            style="width:100%; height:100%; object-fit:cover;"
                            onerror="this.onerror=null; this.src='${portadasDeRespaldo[index % portadasDeRespaldo.length]}';"
                        >
                    </div>
                    <h3 class="book-title font-display" style="margin-top:12px; font-size:1.1rem; color:var(--neutral-dark);">${book.title}</h3>
                    <p class="book-author" style="font-size:0.85rem; color:var(--neutral-mid);">${book.author}</p>
                    <div class="book-meta" style="margin-top:auto; padding-top:8px;">
                        <div class="stars-container">${generateStars()}</div>
                        <span class="reviews">(${book.year})</span>
                    </div>
                `;

                card.addEventListener('click', () => {
                    document.body.classList.add('fade-out');
                    setTimeout(() => { window.location.href = `/DetalleLibro.html?id=${book.id}`; }, 250);
                });

                booksGrid.appendChild(card);
            });
        }
        booksGrid.style.opacity = '1';
        booksGrid.style.transform = 'translateY(0)';
    }, 150);
}

searchInput.addEventListener('input', (e) => {
    currentQuery = e.target.value;
    clearSearchBtn.style.display = currentQuery ? 'flex' : 'none';
    filterBooks();
});

clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentQuery = '';
    clearSearchBtn.style.display = 'none';
    filterBooks();
});

resetFiltersBtn.addEventListener('click', () => {
    if (librosBaseDeDatos.length === 0) return;
    const years = librosBaseDeDatos.map(b => b.year);
    const minYear = Math.min(...years);
    yearSlider.value = minYear;
    currentMinYear = minYear;
    yearDisplay.textContent = minYear;
    stockFilter.checked = false;
    filterInStock = false;
    document.querySelectorAll('.format-checkbox').forEach(cb => cb.checked = false);
    selectedFormats = [];
    filterBooks();
});

document.addEventListener('DOMContentLoaded', () => {
    inyectarNavRol();
    const profileBtn = document.querySelector('.profile-btn');
    if (profileBtn) profileBtn.addEventListener('click', goToLogin);
    obtenerLibrosDeOracle();
});