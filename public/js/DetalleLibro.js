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

    // 🖼️ PORTADA: Usar mapa compartido de imagenesLibros.js (consistente con Catálogo)
    const coverImg = document.getElementById('libro-portada');
    const coverPlaceholder = document.getElementById('libro-portada-placeholder');
    const linkImagen = getImagenLibro(libro.IDLIBRO);

    if (coverImg) {
        coverImg.src = linkImagen;
        coverImg.alt = `Portada de ${libro.TITULO}`;
        coverImg.style.display = 'block';
        if (coverPlaceholder) coverPlaceholder.style.display = 'none';
        coverImg.onerror = function() {
            this.onerror = null;
            this.src = getImagenLibro(libro.IDLIBRO);
        };
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
                <span class="bar-label" style="width:32px;min-width:32px;display:flex;align-items:center;justify-content:flex-end;gap:3px;font-size:0.82rem;color:#374151;">${n}<span style="color:#f59e0b;font-size:0.9rem;line-height:1;">★</span></span>
                <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
                <span class="bar-count">${dist[n]}</span>
            </div>
        `;
    });

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
        mostrarToast('⚠️ Completa todos los campos y selecciona una puntuación.');
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
            mostrarToast('❌ Error en el almacenamiento de Atlas.');
        }
    } catch (err) {
        mostrarToast('❌ Fallo de comunicación: ' + err.message);
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
        const idUsuario = sessionStorage.getItem('nexuslib_id');
        const res = await fetch('/api/oracle/prestamos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idUsuario: idUsuario,
                idLibro: idLibroActual,
                fechaLimite: fechaLimiteStr
            })
        });
        const data = await res.json();

        if (res.ok) {
            mostrarToast(`✅ ${data.mensaje} — Devolver antes del ${fechaLimiteStr}`);
            await cargarDetallesHibridos(idLibroActual);
        } else {
            mostrarToast('❌ ' + data.error);
        }
    } catch (err) {
        mostrarToast('❌ Error transaccional: ' + err.message);
    }
}
function mostrarToast(mensaje) {
    let toast = document.getElementById('nexus-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'nexus-toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '32px';
        toast.style.right = '32px';
        toast.style.zIndex = '99999';
        toast.style.background = '#1e293b';
        toast.style.color = 'white';
        toast.style.padding = '14px 22px';
        toast.style.borderRadius = '12px';
        toast.style.fontFamily = 'Inter, sans-serif';
        toast.style.fontSize = '0.92rem';
        toast.style.fontWeight = '500';
        toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        toast.style.maxWidth = '360px';
        document.documentElement.appendChild(toast);
    }
    toast.textContent = mensaje;
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
        });
    });
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 3500);
}