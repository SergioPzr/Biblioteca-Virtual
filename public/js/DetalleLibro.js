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
let idLibroActual = null;
let estrellaSeleccionada = 0;

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    idLibroActual = params.get('id');

    if (!idLibroActual) {
        window.location.href = '/Catalogo.html';
        return;
    }

    inyectarNavRol();
    await cargarDetallesHibridos(idLibroActual);
});

function inyectarNavRol() {
    const rol = sessionStorage.getItem('nexuslib_rol');
    const navLinks = document.getElementById('nav-links');
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

// ARQUITECTURA DISTRIBUIDA: ORACLE + MONGO ATLAS
async function cargarDetallesHibridos(id) {
    try {
        // 1. Fetch unificado a Oracle para datos de inventario
        const resOracle = await fetch('/api/oracle/libros');
        const libros = await resOracle.json();
        const libroSql = libros.find(l => l.IDLIBRO == id);

        if (!libroSql) {
            window.location.href = '/Catalogo.html';
            return;
        }

        // 2. Fetch a MongoDB Atlas para recuperar el foro de opiniones
        const resMongo = await fetch(`/api/mongo/resenas/${id}`);
        const resenasNoSql = await resMongo.json();

        poblarInterfaz(libroSql);
        renderResenas(resenasNoSql);

    } catch (err) {
        document.getElementById('libro-titulo').textContent = "Error de sincronización hibrida.";
    }
}

function poblarInterfaz(libro) {
    document.title = `${libro.TITULO} — NexusLib`;
    document.getElementById('libro-titulo').textContent = libro.TITULO;
    document.getElementById('libro-autor').textContent  = libro.AUTOR || 'Autor Desconocido';
    document.getElementById('libro-isbn').textContent   = libro.ISBN;
    document.getElementById('libro-anio').textContent   = libro.ANIO_PUBLICACION;
    document.getElementById('libro-genero').textContent = libro.GENERO;
    document.getElementById('libro-formato').textContent = libro.FORMATO.toUpperCase();
    document.getElementById('libro-stock').textContent  = `${libro.STOCK_DISPONIBLE} / ${libro.STOCK_TOTAL}`;
    document.getElementById('libro-sinopsis').textContent = libro.SINOPSIS || "Sinopsis no estructurada para esta obra.";

    // 🖼️ ASIGNACIÓN DINÁMICA DE LA PORTADA REACCIÓN EN DETALLE (MATCH CON CATÁLOGO)
   let libroImg = document.querySelector('img[alt="Portada del libro"]');
    
    // Si por si acaso no lo encuentra, usamos los selectores de respaldo anteriores
    if (!libroImg) {
        libroImg = document.querySelector('.detail-cover-wrapper img, .book-detail-cover img, img.libro-img-detalle, .detail-left img');
    }

    const linkImagen = portadasDeRespaldo[parseInt(libro.IDLIBRO) % portadasDeRespaldo.length];

    if (libroImg) {
        // Inyectamos el link estable de Unsplash que sí te funcionó en el catálogo
        libroImg.src = linkImagen;
        libroImg.alt = `Portada de ${libro.TITULO}`;
        libroImg.style.width = "100%";
        libroImg.style.height = "100%";
        libroImg.style.objectFit = "cover";
        libroImg.style.borderRadius = "12px"; // Para que mantenga los bordes boleados estéticos
    } else {
        // Último recurso: si el HTML no tiene un img, buscamos un contenedor genérico
        const contenedorPortada = document.querySelector('.detail-left, .book-sidebar, .catalog-detail');
        if (contenedorPortada) {
            contenedorPortada.innerHTML = `<img src="${linkImagen}" alt="Portada de ${libro.TITULO}" style="width:100%; height:100%; object-fit:cover; border-radius:12px;">`;
        } else {
            console.warn("No se detectó la etiqueta de imagen en el HTML.");
        }
    }

    // Renderizar marcador visual de stock
    const badge = document.getElementById('disponibilidad-badge');
    if (libro.STOCK_DISPONIBLE > 0) {
        badge.className = 'disponibilidad-badge disponible';
        badge.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg> Copias Físicas Disponibles`;
    } else {
        badge.className = 'disponibilidad-badge agotado';
        badge.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg> Sin Stock en Almacén`;
        document.getElementById('btn-prestar').disabled = true;
    }
}

function renderResenas(resenas) {
    const lista  = document.getElementById('resenas-lista');
    const empty  = document.getElementById('resenas-empty');
    const summary = document.getElementById('rating-summary');

    if (!resenas || resenas.length === 0) {
        lista.style.display = 'none';
        empty.style.display = 'block';
        summary.style.display = 'none';
        return;
    }

    lista.style.display = 'flex';
    empty.style.display = 'none';
    summary.style.display = 'flex';

    const total = resenas.length;
    const suma  = resenas.reduce((acc, r) => acc + r.puntuacion_estrellas, 0);
    const promedio = (suma / total).toFixed(1);

    const dist = {5:0, 4:0, 3:0, 2:0, 1:0};
    resenas.forEach(r => dist[r.puntuacion_estrellas]++);

    document.getElementById('rating-promedio').textContent = promedio;
    document.getElementById('rating-stars-big').innerHTML = '★'.repeat(Math.round(promedio));
    document.getElementById('rating-count').textContent = `${total} comentario${total !== 1 ? 's' : ''}`;

    const barsContainer = document.getElementById('rating-bars');
    barsContainer.innerHTML = '';
    [5,4,3,2,1].forEach(n => {
        const pct = Math.round((dist[n] / total) * 100);
        barsContainer.innerHTML += `
            <div class="rating-bar-row">
                <span class="bar-label">${n} ★</span>
                <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
                <span class="bar-count">${dist[n]}</span>
            </div>
        `;
    });

    lista.innerHTML = '';
    resenas.forEach(r => {
        const inicial = r.nombre_usuario.charAt(0).toUpperCase();
        const fecha = new Date(r.fecha_publicacion).toLocaleDateString('es-PE', { year:'numeric', month:'long', day:'numeric' });
        
        lista.innerHTML += `
            <div class="resena-card" style="border-bottom:1px solid #f1f5f9; padding:16px 0;">
                <div class="resena-top" style="display:flex; justify-content:between; align-items:center;">
                    <div class="resena-meta" style="display:flex; gap:12px; align-items:center;">
                        <div class="resena-avatar" style="width:36px; height:36px; border-radius:50%; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; font-weight:bold;">${inicial}</div>
                        <div class="resena-info" style="display:flex; flex-direction:column;">
                            <span class="resena-nombre" style="font-weight:600; color:var(--neutral-dark);">${r.nombre_usuario}</span>
                            <span class="resena-fecha" style="font-size:0.75rem; color:var(--neutral-mid);">${fecha}</span>
                        </div>
                    </div>
                    <span class="resena-estrellas" style="color:#eab308; margin-left:auto;">${'★'.repeat(r.puntuacion_estrellas)}</span>
                </div>
                <p class="resena-comentario" style="margin-top:10px; font-size:0.92rem; color:var(--neutral-mid); line-height:1.5;">${r.comentario}</p>
            </div>
        `;
    });
}

function toggleFormResena() {
    const form = document.getElementById('form-resena');
    const visible = form.style.display !== 'none';
    form.style.display = visible ? 'none' : 'flex';
    if (!visible) {
        estrellaSeleccionada = 0;
        updateStarPicker(0);
        document.getElementById('resena-nombre').value = sessionStorage.getItem('nexuslib_usuario') || '';
        document.getElementById('resena-comentario').value = '';
    }
}

function pickStar(val) { estrellaSeleccionada = val; updateStarPicker(val); }
function hoverStar(val) { updateStarPicker(val); }
function resetStar() { updateStarPicker(estrellaSeleccionada); }

function updateStarPicker(val) {
    document.querySelectorAll('.star-pick').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.val) <= val);
    });
}

// POST DE RESEÑAS DIRECTO A MONGODB ATLAS
async function enviarResena() {
    const nombre = document.getElementById('resena-nombre').value.trim();
    const comentario = document.getElementById('resena-comentario').value.trim();

    if (!nombre || !comentario || estrellaSeleccionada === 0) {
        alert('Completa todos los campos y selecciona una puntuación.');
        return;
    }

    try {
        const res = await fetch('/api/mongo/resenas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idLibro: idLibroActual,
                usuario: nombre,
                estrellas: estrellaSeleccionada,
                comentario
            })
        });

        if (res.ok) {
            toggleFormResena();
            await cargarDetallesHibridos(idLibroActual);
        } else {
            alert('Error en el almacenamiento de Atlas.');
        }
    } catch (err) {
        alert('Fallo de communication: ' + err.message);
    }
}

// INSERCIÓN DE OPERACIONES ACID TRANSACCIONALES EN ORACLE
async function solicitarPrestamo() {
    const emailActivo = sessionStorage.getItem('nexuslib_email');
    if (!emailActivo) {
        sessionStorage.setItem('nexuslib_returnTo', `/DetalleLibro.html?id=${idLibroActual}`);
        window.location.href = '/Login.html';
        return;
    }

    const hoy = new Date();
    hoy.setDate(hoy.getDate() + 7);
    const fechaLimiteStr = hoy.toISOString().split('T')[0];

    try {
        const res = await fetch('/api/oracle/prestamos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idUsuario: 3, 
                idLibro: idLibroActual,
                fechaLimite: fechaLimiteStr
            })
        });
        const data = await res.json();

        if (res.ok) {
            alert(`🎉 ¡Éxito Relacional!\n${data.mensaje}\nTienes hasta el ${fechaLimiteStr} para devolverlo.`);
            await cargarDetallesHibridos(idLibroActual);
        } else {
            alert('Fallo en la regla de negocio: ' + data.error);
        }
    } catch (err) {
        alert('Error transaccional en Oracle: ' + err.message);
    }
}