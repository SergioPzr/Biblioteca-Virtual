// =======================================================
// PANEL DE PRÉSTAMOS DEL CLIENTE (MisPrestamos.js)
// =======================================================

document.addEventListener('DOMContentLoaded', async () => {
    const rol   = sessionStorage.getItem('nexuslib_rol');
    const email = sessionStorage.getItem('nexuslib_email');

    if (rol !== 'cliente' || !email) {
        window.location.href = '/Inicio.html';
        return;
    }

    await cargarMisPrestamos(email);
});

async function cargarMisPrestamos(email) {
    const container = document.getElementById('prestamos-container');
    container.innerHTML = `<p style="text-align:center;color:var(--neutral-mid);padding:40px 0;">Sincronizando con Oracle...</p>`;

    try {
        const res = await fetch(`/api/oracle/prestamos/mis?email=${encodeURIComponent(email)}`);
        const prestamos = await res.json();

        if (!res.ok) throw new Error(prestamos.error);

        if (!prestamos || prestamos.length === 0) {
            container.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:60px 0;">
                    <p style="font-size:1.1rem;color:var(--neutral-mid);">No tienes préstamos activos en este momento.</p>
                    <a href="/Catalogo.html" style="display:inline-block;margin-top:16px;color:var(--primary);font-weight:600;">Explorar catálogo →</a>
                </div>`;
            return;
        }

        container.innerHTML = '';
        prestamos.forEach(p => {
            const fechaSalida  = p.FECHASALIDA  ? new Date(p.FECHASALIDA).toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' }) : '—';
            const fechaLimite  = p.FECHALIMITE  ? new Date(p.FECHALIMITE).toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' }) : '—';

            // Alerta si vence en ≤3 días
            const diasRestantes = p.FECHALIMITE
                ? Math.ceil((new Date(p.FECHALIMITE) - new Date()) / (1000*60*60*24))
                : null;
            const esUrgente = diasRestantes !== null && diasRestantes <= 3 && diasRestantes >= 0;
            const estadoClass = esUrgente ? 'estado-urgente' : 'estado-activo';
            const estadoLabel = esUrgente ? `⚠ Vence en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}` : 'En tu poder';

            const imgSrc = (typeof getImagenLibro !== 'undefined')
                ? getImagenLibro(p.IDLIBRO)
                : 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop';

            const card = document.createElement('article');
            card.className = 'prestamo-card';
            card.innerHTML = `
                <div class="prestamo-portada-wrapper">
                    <img src="${imgSrc}" alt="${p.TITULO_LIBRO}" class="prestamo-portada"
                         onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop';">
                </div>
                <div class="prestamo-info">
                    <span class="prestamo-estado ${estadoClass}">${estadoLabel}</span>
                    <h3 class="prestamo-titulo">${p.TITULO_LIBRO}</h3>
                    <p class="prestamo-formato">Formato: ${(p.FORMATO || '—').toUpperCase()}</p>
                    <div class="prestamo-fechas">
                        <div class="fecha-item">
                            <span>Retirado el</span>
                            <strong>${fechaSalida}</strong>
                        </div>
                        <div class="fecha-item limite" style="text-align:right;">
                            <span>Devolución</span>
                            <strong>${fechaLimite}</strong>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (err) {
        container.innerHTML = `<p style="text-align:center;color:#dc2626;padding:40px 0;">Error al cargar préstamos: ${err.message}</p>`;
    }
}

function cerrarSesion() {
    sessionStorage.clear();
    document.body.classList.add('fade-out');
    setTimeout(() => { window.location.href = '/Login.html'; }, 400);
}
