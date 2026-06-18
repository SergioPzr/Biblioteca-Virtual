// =========================================================
// DetalleLibro.js
//
// ESTRUCTURA DE DATOS ESPERADA (para integración futura):
//
// Oracle — GET /api/oracle/libros/:id devuelve:
//   { IDLIBRO, ISBN, TITULO, GENERO, FORMATO,
//     STOCK_TOTAL, STOCK_DISPONIBLE, ANIO_PUBLICACION }
//
// MongoDB fichas — GET /api/mongo/fichas/:idLibro devuelve:
//   { idLibro, autor, editorial, sinopsis, url_imagen,
//     tags: ['tag1','tag2'], coautores: [] }
//
// MongoDB reseñas — GET /api/mongo/resenas/:idLibro devuelve:
//   [{ _id, nombre_usuario, puntuacion_estrellas,
//      comentario, fecha_publicacion }]
//
// MongoDB reseñas — POST /api/mongo/resenas devuelve:
//   { mensaje, id }
// =========================================================

// -------------------------------------------------------
// DATOS SIMULADOS (reemplazar por fetch real)
// -------------------------------------------------------
const MOCK_LIBROS = {
    '1': {
        IDLIBRO: 1, ISBN: '9780307474728', TITULO: 'Cien años de soledad',
        GENERO: 'Novela', FORMATO: 'PDF · EPUB',
        STOCK_TOTAL: 5, STOCK_DISPONIBLE: 3, ANIO_PUBLICACION: 1967
    },
    '2': {
        IDLIBRO: 2, ISBN: '9788401242182', TITULO: 'La casa de los espíritus',
        GENERO: 'Novela', FORMATO: 'PDF · EPUB',
        STOCK_TOTAL: 4, STOCK_DISPONIBLE: 0, ANIO_PUBLICACION: 1982
    },
    '3': {
        IDLIBRO: 3, ISBN: '9788420633213', TITULO: 'La ciudad y los perros',
        GENERO: 'Novela', FORMATO: 'Físico',
        STOCK_TOTAL: 6, STOCK_DISPONIBLE: 2, ANIO_PUBLICACION: 1963
    },
    '4': {
        IDLIBRO: 4, ISBN: '9788420642697', TITULO: 'Ficciones',
        GENERO: 'Cuentos', FORMATO: 'Físico · PDF · EPUB',
        STOCK_TOTAL: 10, STOCK_DISPONIBLE: 10, ANIO_PUBLICACION: 1944
    },
    '5': {
        IDLIBRO: 5, ISBN: '9788437604572', TITULO: 'Rayuela',
        GENERO: 'Novela experimental', FORMATO: 'EPUB',
        STOCK_TOTAL: 3, STOCK_DISPONIBLE: 0, ANIO_PUBLICACION: 1963
    },
    '6': {
        IDLIBRO: 6, ISBN: '9786071606730', TITULO: 'Pedro Páramo',
        GENERO: 'Novela', FORMATO: 'Físico · PDF',
        STOCK_TOTAL: 7, STOCK_DISPONIBLE: 4, ANIO_PUBLICACION: 1955
    },
    '7': {
        IDLIBRO: 7, ISBN: '9788437604442', TITULO: 'El Aleph',
        GENERO: 'Cuentos', FORMATO: 'Físico',
        STOCK_TOTAL: 4, STOCK_DISPONIBLE: 1, ANIO_PUBLICACION: 1949
    },
    '8': {
        IDLIBRO: 8, ISBN: '9786124109058', TITULO: 'Los Ríos Profundos',
        GENERO: 'Novela', FORMATO: 'Físico · EPUB',
        STOCK_TOTAL: 5, STOCK_DISPONIBLE: 5, ANIO_PUBLICACION: 1958
    }
};

// Fichas bibliográficas (MongoDB fichas_bibliograficas)
const MOCK_FICHAS = {
    '1': {
        autor: 'Gabriel García Márquez', editorial: 'Editorial Sudamericana',
        sinopsis: 'La saga de los Buendía en el mítico Macondo, donde lo fantástico y lo cotidiano se entrelazan a lo largo de siete generaciones. Una obra cumbre de la literatura latinoamericana que redefinió el realismo mágico.',
        url_imagen: 'https://m.media-amazon.com/images/I/81MI6+TpYkL._AC_UF1000,1000_QL80_.jpg',
        tags: ['Realismo mágico', 'Novela', 'Literatura latinoamericana']
    },
    '2': {
        autor: 'Isabel Allende', editorial: 'Plaza & Janés',
        sinopsis: 'Una saga familiar que abarca tres generaciones marcadas por el amor, la violencia política y lo sobrenatural en un país innominado de Latinoamérica. Una novela épica sobre el poder y la memoria.',
        url_imagen: 'https://m.media-amazon.com/images/I/91tUo+rK3WL._AC_UF1000,1000_QL80_.jpg',
        tags: ['Realismo mágico', 'Saga familiar', 'Política']
    },
    '3': {
        autor: 'Mario Vargas Llosa', editorial: 'Seix Barral',
        sinopsis: 'Un retrato brutal de la vida en el Colegio Militar Leoncio Prado de Lima. La novela explora el choque entre la violencia institucional, la amistad y la pérdida de la inocencia en la juventud peruana.',
        url_imagen: '',
        tags: ['Literatura peruana', 'Novela social', 'Premio Nobel']
    },
    '4': {
        autor: 'Jorge Luis Borges', editorial: 'Sur',
        sinopsis: 'Una colección de relatos donde laberintos, espejos y bibliotecas infinitas construyen universos que desafían la lógica. Considerada una de las obras más influyentes de la literatura universal del siglo XX.',
        url_imagen: 'https://m.media-amazon.com/images/I/71R2Qo2U4FL._AC_UF1000,1000_QL80_.jpg',
        tags: ['Cuentos', 'Metaficción', 'Literatura argentina']
    },
    '5': {
        autor: 'Julio Cortázar', editorial: 'Sudamericana',
        sinopsis: 'Una novela que puede leerse en múltiples órdenes. La historia de Horacio Oliveira y su búsqueda existencial entre París y Buenos Aires. Un experimento literario que transformó la narrativa hispanoamericana.',
        url_imagen: 'https://m.media-amazon.com/images/I/61r-Gtd2LML._AC_UF1000,1000_QL80_.jpg',
        tags: ['Novela experimental', 'Existencialismo', 'Boom latinoamericano']
    },
    '6': {
        autor: 'Juan Rulfo', editorial: 'FCE',
        sinopsis: 'Juan Preciado viaja al pueblo de Comala para encontrar a su padre, Pedro Páramo, y se encuentra con voces de muertos que pueblan un lugar fantasmal. Una obra breve y perfecta que mezcla lo mítico con lo cotidiano.',
        url_imagen: 'https://m.media-amazon.com/images/I/71Xm+1M7DNL._AC_UF1000,1000_QL80_.jpg',
        tags: ['Literatura mexicana', 'Realismo mágico', 'Clásico']
    },
    '7': {
        autor: 'Jorge Luis Borges', editorial: 'Losada',
        sinopsis: 'Cuentos que exploran la infinitud, el tiempo cíclico y la identidad. "El Aleph" —un punto del espacio que contiene todos los puntos— es la pieza central de una de las colecciones más celebradas de Borges.',
        url_imagen: 'https://m.media-amazon.com/images/I/71X1E8S5LwL._AC_UF1000,1000_QL80_.jpg',
        tags: ['Cuentos', 'Filosofía', 'Metaficción']
    },
    '8': {
        autor: 'José María Arguedas', editorial: 'Losada',
        sinopsis: 'El joven Ernesto recorre los Andes peruanos mientras observa el conflicto entre el mundo andino y la cultura occidental. Una novela lírica y profundamente peruana sobre la identidad y el desarraigo.',
        url_imagen: 'https://m.media-amazon.com/images/I/81h2QyPyl+L._AC_UF1000,1000_QL80_.jpg',
        tags: ['Literatura peruana', 'Indigenismo', 'Identidad cultural']
    }
};

// Reseñas (MongoDB resenas)
const MOCK_RESENAS = {
    '1': [
        { _id: 'r1', nombre_usuario: 'María López', puntuacion_estrellas: 5, comentario: 'Una obra maestra absoluta. Cada relectura revela algo nuevo.', fecha_publicacion: '2024-08-12' },
        { _id: 'r2', nombre_usuario: 'Carlos Ruiz', puntuacion_estrellas: 5, comentario: 'Macondo se quedará para siempre en mi memoria.', fecha_publicacion: '2024-09-03' }
    ],
    '3': [
        { _id: 'r3', nombre_usuario: 'Andrés Vera', puntuacion_estrellas: 4, comentario: 'Dura y necesaria. Vargas Llosa en su mejor momento.', fecha_publicacion: '2024-07-20' }
    ]
};

// -------------------------------------------------------
// Estado global de la pantalla
// -------------------------------------------------------
let idLibroActual = null;
let estrellaSeleccionada = 0;

// -------------------------------------------------------
// INICIALIZACIÓN
// -------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Leer el id de la URL
    const params = new URLSearchParams(window.location.search);
    idLibroActual = params.get('id');

    if (!idLibroActual) {
        window.location.href = '/Catalogo.html';
        return;
    }

    // 2. Inyectar enlace de navbar según rol
    inyectarNavRol();

    // 3. Cargar datos
    await cargarLibro(idLibroActual);
    await cargarResenas(idLibroActual);
});

// -------------------------------------------------------
// NAVBAR DINÁMICA POR ROL
// -------------------------------------------------------
function inyectarNavRol() {
    const rol = sessionStorage.getItem('nexuslib_rol');
    const navLinks = document.getElementById('nav-links');

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
    const rol = sessionStorage.getItem('nexuslib_rol');
    if (rol) {
        // Ya hay sesión: ir a perfil o dashboard
        window.location.href = rol === 'admin' ? '/Dashboard.html' : '/MisPrestamos.html';
    } else {
        window.location.href = '/Login.html';
    }
}

// -------------------------------------------------------
// CARGAR DATOS DEL LIBRO
// Aquí se harán los dos fetch (Oracle + MongoDB) en producción
// -------------------------------------------------------
async function cargarLibro(id) {
    // ===== INTEGRACIÓN FUTURA =====
    // const [libroRes, fichaRes] = await Promise.all([
    //     fetch(`/api/oracle/libros/${id}`).then(r => r.json()),
    //     fetch(`/api/mongo/fichas/${id}`).then(r => r.json())
    // ]);
    // poblarLibro(libroRes, fichaRes);

    // === SIMULACIÓN ACTUAL ===
    const libro = MOCK_LIBROS[id];
    const ficha = MOCK_FICHAS[id];

    if (!libro) {
        // Libro no encontrado: redirigir
        window.location.href = '/Catalogo.html';
        return;
    }

    poblarLibro(libro, ficha || {});
}

function poblarLibro(libro, ficha) {
    // Título de la pestaña
    document.title = `${libro.TITULO} — NexusLib`;

    // Portada
    const portadaImg = document.getElementById('libro-portada');
    const portadaPH  = document.getElementById('libro-portada-placeholder');
    if (ficha.url_imagen) {
        portadaImg.src = ficha.url_imagen;
        portadaImg.alt = `Portada de ${libro.TITULO}`;
        portadaImg.style.display = 'block';
        portadaPH.style.display = 'none';
    } else {
        portadaImg.style.display = 'none';
        portadaPH.style.display = 'flex';
    }

    // Campos de texto
    document.getElementById('libro-titulo').textContent = libro.TITULO;
    document.getElementById('libro-autor').textContent  = ficha.autor || '—';
    document.getElementById('libro-isbn').textContent   = libro.ISBN || '—';
    document.getElementById('libro-anio').textContent   = libro.ANIO_PUBLICACION || '—';
    document.getElementById('libro-genero').textContent = libro.GENERO || '—';
    document.getElementById('libro-formato').textContent= libro.FORMATO || '—';
    document.getElementById('libro-stock').textContent  = `${libro.STOCK_DISPONIBLE} / ${libro.STOCK_TOTAL}`;

    // Actualizar fila de editorial si existe ficha
    if (ficha.editorial) {
        const filasContainer = document.querySelector('.ficha-rows');
        const filaEditorial = document.createElement('div');
        filaEditorial.className = 'ficha-row';
        filaEditorial.innerHTML = `
            <span class="ficha-key">EDITORIAL</span>
            <span class="ficha-val">${ficha.editorial}</span>
        `;
        filasContainer.appendChild(filaEditorial);
    }

    // Tags
    const tagsContainer = document.getElementById('libro-tags');
    if (ficha.tags && ficha.tags.length > 0) {
        tagsContainer.innerHTML = ficha.tags.map(t => `<span class="tag">${t}</span>`).join('');
    }

    // Badge de disponibilidad
    const badge = document.getElementById('disponibilidad-badge');
    if (libro.STOCK_DISPONIBLE > 0) {
        badge.className = 'disponibilidad-badge disponible';
        badge.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
            Disponible: ${libro.FORMATO}
        `;
    } else {
        badge.className = 'disponibilidad-badge agotado';
        badge.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            Sin stock disponible
        `;
        document.getElementById('btn-prestar').disabled = true;
    }

    // Sinopsis
    const sinopsis = document.getElementById('libro-sinopsis');
    sinopsis.textContent = ficha.sinopsis || 'Sinopsis no disponible para este título.';
}

// -------------------------------------------------------
// CARGAR RESEÑAS (MongoDB)
// -------------------------------------------------------
async function cargarResenas(id) {
    // ===== INTEGRACIÓN FUTURA =====
    // const resenas = await fetch(`/api/mongo/resenas/${id}`).then(r => r.json());
    // renderResenas(resenas);

    // === SIMULACIÓN ACTUAL ===
    const resenas = MOCK_RESENAS[id] || [];
    renderResenas(resenas);
}

function renderResenas(resenas) {
    const lista  = document.getElementById('resenas-lista');
    const empty  = document.getElementById('resenas-empty');
    const summary = document.getElementById('rating-summary');

    if (resenas.length === 0) {
        lista.style.display = 'none';
        empty.style.display = 'block';
        summary.style.display = 'none';
        return;
    }

    lista.style.display = 'flex';
    empty.style.display = 'none';

    // Calcular promedio y distribución
    const total = resenas.length;
    const suma  = resenas.reduce((acc, r) => acc + r.puntuacion_estrellas, 0);
    const promedio = (suma / total).toFixed(1);

    const dist = {5:0, 4:0, 3:0, 2:0, 1:0};
    resenas.forEach(r => dist[r.puntuacion_estrellas]++);

    // Resumen de puntuación
    document.getElementById('rating-promedio').textContent = promedio;
    document.getElementById('rating-stars-big').innerHTML = '★'.repeat(Math.round(promedio));
    document.getElementById('rating-count').textContent = `${total} reseña${total !== 1 ? 's' : ''}`;

    const barsContainer = document.getElementById('rating-bars');
    barsContainer.innerHTML = '';
    [5,4,3,2,1].forEach(n => {
        const pct = total > 0 ? Math.round((dist[n] / total) * 100) : 0;
        barsContainer.innerHTML += `
            <div class="rating-bar-row">
                <span class="bar-label">
                    ${n}<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </span>
                <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
                <span class="bar-count">${dist[n]}</span>
            </div>
        `;
    });

    // Tarjetas de reseñas
    lista.innerHTML = '';
    resenas.forEach(r => {
        const inicial = r.nombre_usuario.charAt(0).toUpperCase();
        const fecha = new Date(r.fecha_publicacion).toLocaleDateString('es-PE', { year:'numeric', month:'long', day:'numeric' });
        const estrellas = '★'.repeat(r.puntuacion_estrellas) + '☆'.repeat(5 - r.puntuacion_estrellas);

        lista.innerHTML += `
            <div class="resena-card">
                <div class="resena-top">
                    <div class="resena-meta">
                        <div class="resena-avatar">${inicial}</div>
                        <div class="resena-info">
                            <span class="resena-nombre">${r.nombre_usuario}</span>
                            <span class="resena-fecha">${fecha}</span>
                        </div>
                    </div>
                    <span class="resena-estrellas">${estrellas}</span>
                </div>
                <p class="resena-comentario">${r.comentario}</p>
            </div>
        `;
    });
}

// -------------------------------------------------------
// FORMULARIO DE NUEVA RESEÑA
// -------------------------------------------------------
function toggleFormResena() {
    const form = document.getElementById('form-resena');
    const visible = form.style.display !== 'none';
    form.style.display = visible ? 'none' : 'flex';
    if (!visible) {
        // Limpiar al abrir
        estrellaSeleccionada = 0;
        updateStarPicker(0);
        document.getElementById('resena-nombre').value = '';
        document.getElementById('resena-comentario').value = '';
    }
}

function pickStar(val) {
    estrellaSeleccionada = val;
    updateStarPicker(val);
}

function updateStarPicker(val) {
    document.querySelectorAll('.star-pick').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.val) <= val);
    });
}

async function enviarResena() {
    const nombre     = document.getElementById('resena-nombre').value.trim();
    const comentario = document.getElementById('resena-comentario').value.trim();

    if (!nombre || !comentario || estrellaSeleccionada === 0) {
        alert('Completa todos los campos y selecciona una puntuación.');
        return;
    }

    // ===== INTEGRACIÓN FUTURA =====
    // await fetch('/api/mongo/resenas', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //         idLibro: idLibroActual,
    //         usuario: nombre,
    //         estrellas: estrellaSeleccionada,
    //         comentario
    //     })
    // });

    // === SIMULACIÓN ACTUAL: añadir localmente ===
    if (!MOCK_RESENAS[idLibroActual]) MOCK_RESENAS[idLibroActual] = [];
    MOCK_RESENAS[idLibroActual].unshift({
        _id: 'new_' + Date.now(),
        nombre_usuario: nombre,
        puntuacion_estrellas: estrellaSeleccionada,
        comentario,
        fecha_publicacion: new Date().toISOString().split('T')[0]
    });

    toggleFormResena();
    await cargarResenas(idLibroActual);
}

// -------------------------------------------------------
// SOLICITAR PRÉSTAMO
// -------------------------------------------------------
function solicitarPrestamo() {
    const rol = sessionStorage.getItem('nexuslib_rol');
    if (!rol) {
        // No hay sesión: ir a login
        sessionStorage.setItem('nexuslib_returnTo', `/DetalleLibro.html?id=${idLibroActual}`);
        window.location.href = '/Login.html';
        return;
    }

    // ===== INTEGRACIÓN FUTURA =====
    // Abrir modal con formulario de préstamo o POST /api/oracle/prestamos
    alert(`Préstamo solicitado (simulado). En producción esto creará el registro en Oracle.`);
}
