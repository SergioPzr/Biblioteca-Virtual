// Base de datos simulada
const mockBooks = [
    { id: '1', title: 'Cien años de soledad', author: 'Gabriel García Márquez', year: 1967, stock: 5, format: ['Físico', 'PDF'], rating: 5, reviews: 1284, coverUrl: 'https://m.media-amazon.com/images/I/81MI6+TpYkL._AC_UF1000,1000_QL80_.jpg' },
    { id: '2', title: 'La casa de los espíritus', author: 'Isabel Allende', year: 1982, stock: 0, format: ['PDF', 'EPUB'], rating: 5, reviews: 932, coverUrl: 'https://m.media-amazon.com/images/I/91tUo+rK3WL._AC_UF1000,1000_QL80_.jpg' },
    { id: '3', title: 'La ciudad y los perros', author: 'Mario Vargas Llosa', year: 1963, stock: 2, format: ['Físico'], rating: 4, reviews: 612, coverUrl: '' },
    { id: '4', title: 'Ficciones', author: 'Jorge Luis Borges', year: 1944, stock: 10, format: ['Físico', 'PDF', 'EPUB'], rating: 5, reviews: 1502, coverUrl: 'https://m.media-amazon.com/images/I/71R2Qo2U4FL._AC_UF1000,1000_QL80_.jpg' },
    { id: '5', title: 'Rayuela', author: 'Julio Cortázar', year: 1963, stock: 0, format: ['EPUB'], rating: 5, reviews: 775, coverUrl: 'https://m.media-amazon.com/images/I/61r-Gtd2LML._AC_UF1000,1000_QL80_.jpg' },
    { id: '6', title: 'Pedro Páramo', author: 'Juan Rulfo', year: 1955, stock: 4, format: ['Físico', 'PDF'], rating: 5, reviews: 845, coverUrl: 'https://m.media-amazon.com/images/I/71Xm+1M7DNL._AC_UF1000,1000_QL80_.jpg' },
    { id: '7', title: 'El Aleph', author: 'Jorge Luis Borges', year: 1949, stock: 1, format: ['Físico'], rating: 5, reviews: 1102, coverUrl: 'https://m.media-amazon.com/images/I/71X1E8S5LwL._AC_UF1000,1000_QL80_.jpg' },
    { id: '8', title: 'Como agua para chocolate', author: 'Laura Esquivel', year: 1989, stock: 8, format: ['Físico', 'EPUB'], rating: 4, reviews: 540, coverUrl: 'https://m.media-amazon.com/images/I/81h2QyPyl+L._AC_UF1000,1000_QL80_.jpg' }
];

const allYears = mockBooks.map(b => b.year);
const minYear = Math.min(...allYears);
const maxYear = Math.max(...allYears);
const allFormats = [...new Set(mockBooks.flatMap(b => b.format))];

let currentQuery = "";
let currentMinYear = minYear;
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

function initFilterUI() {
    yearSlider.min = minYear;
    yearSlider.max = maxYear;
    yearSlider.value = minYear;
    yearDisplay.textContent = minYear;
    yearMinLabel.textContent = minYear;
    yearMaxLabel.textContent = maxYear;

    allFormats.forEach(format => {
        const label = document.createElement('label');
        label.className = 'checkbox-wrapper';
        label.innerHTML = `
            <input type="checkbox" class="custom-checkbox format-checkbox" value="${format}">
            <span class="checkbox-text">${format}</span>
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

    document.querySelectorAll('.format-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            selectedFormats = Array.from(document.querySelectorAll('.format-checkbox:checked')).map(box => box.value);
            filterBooks();
        });
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

function generateStars(rating) {
    let starsHtml = '';
    const starFilled = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    const starEmpty = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    for (let i = 0; i < 5; i++) starsHtml += i < rating ? starFilled : starEmpty;
    return starsHtml;
}

function filterBooks() {
    const q = currentQuery.trim().toLowerCase();
    const filteredBooks = mockBooks.filter(b => {
        const matchesQuery = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
        const matchesYear = b.year >= currentMinYear;
        const matchesStock = !filterInStock || b.stock > 0;
        const matchesFormat = selectedFormats.length === 0 || b.format.some(f => selectedFormats.includes(f));
        return matchesQuery && matchesYear && matchesStock && matchesFormat;
    });

    // 1. Inicia Fade Out inmediatamente
    booksGrid.style.opacity = '0';
    booksGrid.style.transform = 'translateY(6px)';
    
    // Limpia colisiones si el usuario desliza muy rápido
    clearTimeout(filterTimeout);
    
    // 2. Transición Ultra Rápida (150ms)
    filterTimeout = setTimeout(() => {
        resultsCount.textContent = `${filteredBooks.length} libro${filteredBooks.length !== 1 ? 's' : ''} encontrado${filteredBooks.length !== 1 ? 's' : ''}`;

        if (filteredBooks.length === 0) {
            booksGrid.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            booksGrid.style.display = 'grid';
            emptyState.style.display = 'none';
            booksGrid.innerHTML = '';
            
            filteredBooks.forEach(book => {
                const card = document.createElement('article');
                card.className = 'book-card';
                
                const stockBadge = book.stock > 0 
                    ? `<span style="position:absolute; top:8px; right:8px; background:var(--primary); color:white; font-size:0.65rem; padding:4px 10px; border-radius:12px; font-weight:bold; z-index:5;">Disponible</span>`
                    : `<span style="position:absolute; top:8px; right:8px; background:#ef4444; color:white; font-size:0.65rem; padding:4px 10px; border-radius:12px; font-weight:bold; z-index:5;">Agotado</span>`;

                card.innerHTML = `
                    <div class="book-cover-wrapper">
                        ${stockBadge}
                        ${book.coverUrl 
                            ? `<img src="${book.coverUrl}" alt="Portada" class="book-cover">` 
                            : `<div class="empty-cover">Sin Portada</div>`
                        }
                    </div>
                    <h3 class="book-title font-display">${book.title}</h3>
                    <p class="book-author">${book.author}</p>
                    <div class="book-meta">
                        <div class="stars-container">${generateStars(book.rating)}</div>
                        <span class="reviews">(${book.year})</span>
                    </div>
                `;
                booksGrid.appendChild(card);
            });
        }
        
        // 3. Forzar repintado para el navegador
        void booksGrid.offsetWidth;
        
        // 4. Inicia Fade In
        booksGrid.style.opacity = '1';
        booksGrid.style.transform = 'translateY(0)';
        
    }, 150); // Tiempo óptimo para evitar cuelgues
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
    initFilterUI();
    filterBooks();
});