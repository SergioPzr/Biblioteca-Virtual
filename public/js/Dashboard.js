// =========================================================================
// 🔒 PROTECCIÓN DE RUTA Y CONFIGURACIÓN INICIAL (DOM UNIFICADO)
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const rol = sessionStorage.getItem('nexuslib_rol');
    if (rol !== 'admin') {
        window.location.href = '/Inicio.html';
        return;
    }

    // Cargar datos iniciales reales de Oracle al entrar al Dashboard
    cargarInventarioOracle();
    cargarMultasOracle();       // 🌟 REACTIVADO: Sincroniza las multas reales desde el inicio
    obtenerTodosLosPrestamos(); // Sincroniza los préstamos existentes en orden ASC

    if (typeof inyectarNavRol === 'function') inyectarNavRol(); 

    // Vincular botón de Confirmar Operación Relacional (Préstamos Oracle)
    const btnRegistrarPrestamo = document.querySelector('#panel-prestamos form button');
    if (btnRegistrarPrestamo) {
        btnRegistrarPrestamo.type = 'button';
        btnRegistrarPrestamo.onclick = registrarPrestamoAdmin;
    }

    // Vincular botón de Consultar Foros NoSQL (MongoDB Atlas)
    const btnConsultarMongo = document.querySelector('#panel-moderacion .search-bar button');
    if (btnConsultarMongo) {
        btnConsultarMongo.type = 'button';
        btnConsultarMongo.onclick = consultarForoMongo;
    }
});

// Control de navegación interna entre pestañas del Dashboard
function switchPanel(panelId) {
    document.querySelectorAll('.admin-panel').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
    
    const targetPanel = document.getElementById('panel-' + panelId);
    if (targetPanel) targetPanel.style.display = 'block';
    
    if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
    }

    if (panelId === 'inventario') cargarInventarioOracle();
    if (panelId === 'prestamos') obtenerTodosLosPrestamos(); // Recarga reactiva al hacer click
    if (panelId === 'multas') cargarMultasOracle();
}

// =========================================================================
// 🏛️ FUNCIONES DE CONSUMO REAL — ORACLE SQL (INVENTARIO Y MULTAS)
// =========================================================================

async function cargarInventarioOracle() {
    try {
        const res = await fetch('/api/oracle/libros');
        const libros = await res.json();
        
        const tbody = document.querySelector('#panel-inventario .admin-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        libros.forEach(l => {
            const badgeClass = l.STOCK_DISPONIBLE > 0 ? 'badge-green' : 'badge-red';
            tbody.innerHTML += `
                <tr>
                    <td>${l.IDLIBRO}</td>
                    <td>${l.ISBN}</td>
                    <td>${l.TITULO}</td>
                    <td>${l.GENERO}</td>
                    <td>${l.FORMATO.toUpperCase()}</td>
                    <td><span class="badge ${badgeClass}">${l.STOCK_DISPONIBLE} / ${l.STOCK_TOTAL}</span></td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Error al cargar inventario: ", err);
    }
}

async function cargarMultasOracle() {
    try {
        const res = await fetch('/api/oracle/multas');
        const multas = await res.json();
        
        const tbody = document.querySelector('#panel-multas .admin-table tbody');
        if (!tbody) return;
        
        // 🌟 CLAVE: Limpiamos por completo el contenido estático del HTML (M-01, 911) antes de pintar
        tbody.innerHTML = '';

        if (!multas || multas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 16px; color: var(--neutral-mid);">No se registran penalidades en caja.</td></tr>`;
            return;
        }

        multas.forEach(m => {
            // Controlamos de forma estricta si las propiedades vienen en MAYÚSCULAS o minúsculas desde el backend
            const idMulta     = m.IDMULTA || m.idMulta || m.ID || '---';
            const idPrestamo  = m.IDPRESTAMO || m.idPrestamo || '---';
            const monto       = m.MONTO || m.monto || 0;
            const diasRetraso = m.DIAS_RETRASO || m.dias_retraso || m.DIASRETRASO || 0;
            const estadoPago  = (m.ESTADO_PAGO || m.estado_pago || m.ESTADO || 'pendiente').toLowerCase();

            // Respetamos los estilos exactos de los badges de tu compañero
            const estadoBadge = estadoPago === 'pagado' ? 'badge-green' : 'badge-red';
            
            tbody.innerHTML += `
                <tr>
                    <td>M-${idMulta}</td>
                    <td>${idPrestamo}</td>
                    <td>S/ ${parseFloat(monto).toFixed(2)}</td>
                    <td>${diasRetraso} días</td>
                    <td><span class="badge ${estadoBadge}">${estadoPago.toUpperCase()}</span></td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Error al cargar multas: ", err);
    }
}

// =========================================================================
// 🏛️ REGISTRO Y SEGUIMIENTO DE PRÉSTAMOS — ORACLE SQL (ACID)
// =========================================================================

async function registrarPrestamoAdmin() {
    const idUsuario   = document.getElementById('prestamo-usuario-id').value.trim();
    const idLibro     = document.getElementById('prestamo-libro-id').value.trim();
    const fechaLimite = document.getElementById('prestamo-fecha').value.trim();

    if (!idUsuario || !idLibro || !fechaLimite) {
        alert("Por favor, complete todos los campos obligatorios para procesar el préstamo.");
        return;
    }

    try {
        const res = await fetch('/api/oracle/prestamos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idUsuario: parseInt(idUsuario),
                idLibro: parseInt(idLibro),
                fechaLimite: fechaLimite
            })
        });
        
        const data = await res.json();

        if (res.ok) {
            alert(`🎉 ¡Éxito Relacional!\nPréstamo registrado correctamente.\nOracle asignó la clave primaria automática de forma limpia.`);
            
            document.getElementById('prestamo-usuario-id').value = '';
            document.getElementById('prestamo-libro-id').value = '';
            document.getElementById('prestamo-fecha').value = '';

            obtenerTodosLosPrestamos();
        } else {
            alert(`⚠️ Error en las Reglas de Negocio:\n${data.error}`);
        }
    } catch (err) {
        alert("Error de comunicación con el servidor Oracle: " + err.message);
    }
}

async function obtenerTodosLosPrestamos() {
    try {
        const res = await fetch('/api/oracle/prestamos');
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const prestamos = await res.json();
        renderizarTablaPrestamos(prestamos);
    } catch (err) {
        console.error('Error al recuperar historial de préstamos:', err);
    }
}

function renderizarTablaPrestamos(listaPrestamos) {
    const tablaBody = document.getElementById('prestamos-admin-tabla');
    if (!tablaBody) return;

    if (!listaPrestamos || listaPrestamos.length === 0) {
        tablaBody.innerHTML = `
            <tr>
                <td colspan="7" style="padding: 16px; text-align: center; color: #64748b;">
                    No existen registros de préstamos activos en el sistema.
                </td>
            </tr>`;
        return;
    }

    tablaBody.innerHTML = ''; 

    listaPrestamos.forEach(p => {
        const idPrestamo = p.IDPRESTAMO || '---';
        const usuario    = p.IDUSUARIO || '---';
        const libro      = p.IDLIBRO || '---';
        
        // Procesar fechas
        const fSalida = p.FECHASALIDA ? new Date(p.FECHASALIDA).toLocaleDateString('es-PE') : '---';
        const fLimite = p.FECHALIMITE ? new Date(p.FECHALIMITE).toLocaleDateString('es-PE') : '---';
        const fDevolucion = p.FECHADEVOLUCION ? new Date(p.FECHADEVOLUCION).toLocaleDateString('es-PE') : 'Pendiente';

        let estadoActual = (p.ESTADO || 'activo').toLowerCase();
        let badgeEstado = '';

        if (estadoActual === 'devuelto') {
            badgeEstado = `<span class="badge badge-green">Devuelto</span>`;
        } else if (estadoActual === 'vencido') {
            badgeEstado = `<span class="badge badge-red">Vencido</span>`;
        } else {
            badgeEstado = `<span class="badge" style="background: #eff6ff; color: #1d4ed8;">Activo</span>`;
        }

        // 🌟 CORREGIDO: Ahora inyectamos exactamente 7 columnas (td) haciendo match perfecto con el HTML
        const fila = document.createElement('tr');
        fila.style.borderBottom = '1px solid #e2e8f0';
        fila.innerHTML = `
            <td style="padding: 12px; font-weight: bold; color: #1e293b;">${idPrestamo}</td>
            <td style="padding: 12px; color: #1e293b;">User #${usuario}</td>
            <td style="padding: 12px; font-style: italic; color: #1e293b;">Libro #${libro}</td>
            <td style="padding: 12px; color: #64748b;">${fSalida}</td>
            <td style="padding: 12px; color: #64748b;">${fLimite}</td>
            <td style="padding: 12px; color: #64748b; font-weight: 500;">${fDevolucion}</td>
            <td style="padding: 12px;">${badgeEstado}</td>
        `;
        tablaBody.appendChild(fila);
    });
}

// =========================================================================
// 🍃 FORO DE AUDITORÍA Y MODERACIÓN — MONGODB ATLAS
// =========================================================================

async function consultarForoMongo() {
    const input = document.querySelector('#panel-moderacion .search-bar input');
    const idLibro = input ? input.value.trim() : '';

    if (!idLibro) {
        alert("Por favor, ingrese un ID de libro válido para auditar.");
        return;
    }

    try {
        const res = await fetch(`/api/mongo/resenas/${idLibro}`);
        const resenas = await res.json();

        const viejoContenedor = document.getElementById('auditoria-resultados');
        if (viejoContenedor) viejoContenedor.remove();

        const resultadoCard = document.createElement('div');
        resultadoCard.id = 'auditoria-resultados';
        resultadoCard.style.marginTop = '24px';
        resultadoCard.className = 'admin-card';

        if (resenas.length === 0) {
            resultadoCard.innerHTML = `<h3>Foro Literario (ID: ${idLibro})</h3><p style="margin-top:12px; color:var(--neutral-mid);">No se registran comentarios para esta obra en MongoDB Atlas.</p>`;
        } else {
            let tablaHtml = `
                <h3>Foro Literario (ID: ${idLibro})</h3>
                <p style="margin-top:4px; margin-bottom:16px; font-size:0.85rem; color:var(--neutral-mid);">Documentos distribuidos recuperados de la nube.</p>
                <table class="admin-table">
                    <thead>
                        <tr><th>Usuario</th><th>Valoración</th><th>Comentario</th><th>Acción</th></tr>
                    </thead>
                    <tbody>
            `;

            resenas.forEach(r => {
                tablaHtml += `
                    <tr>
                        <td><strong>${r.nombre_usuario}</strong></td>
                        <td style="color:#eab308;">${'★'.repeat(r.puntuacion_estrellas)}</td>
                        <td style="font-size:0.9rem; max-width:400px; white-space:normal;">"${r.comentario}"</td>
                        <td>
                            <button onclick="eliminarDocumentoAtlas('${r._id}')" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.8rem;">
                                Purgar Documento
                            </button>
                        </td>
                    </tr>
                `;
            });

            tablaHtml += `</tbody></table>`;
            resultadoCard.innerHTML = tablaHtml;
        }

        document.getElementById('panel-moderacion').appendChild(resultadoCard);

    } catch (err) {
        alert("Fallo al auditar foros en Atlas: " + err.message);
    }
}

async function eliminarDocumentoAtlas(idMongo) {
    if (!confirm("¿Desea purgar este documento de forma permanente del clúster distribuido?")) return;

    try {
        const res = await fetch(`/api/mongo/resenas/${idMongo}`, { method: 'DELETE' });
        const data = await res.json();

        alert(data.mensaje);
        consultarForoMongo();
    } catch (err) {
        alert("Error al purgar documento: " + err.message);
    }
}

function cerrarSesion() {
    sessionStorage.clear();
    document.body.classList.add('fade-out');
    setTimeout(() => { window.location.href = '/Login.html'; }, 400);
}