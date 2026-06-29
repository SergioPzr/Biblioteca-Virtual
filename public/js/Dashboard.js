// =========================================================================
// 🔒 PROTECCIÓN DE RUTA Y CONFIGURACIÓN INICIAL (DOM UNIFICADO)
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const rol = sessionStorage.getItem('nexuslib_rol');
    if (rol !== 'admin') {
        window.location.href = '/Inicio.html';
        return;
    }

    cargarInventarioOracle();
    cargarMultasOracle();       
    obtenerTodosLosPrestamos(); 

    if (typeof inyectarNavRol === 'function') inyectarNavRol(); 

    const btnRegistrarPrestamo = document.querySelector('#panel-prestamos form button');
    if (btnRegistrarPrestamo) {
        btnRegistrarPrestamo.type = 'button';
        btnRegistrarPrestamo.onclick = registrarPrestamoAdmin;
    }

    const btnConsultarMongo = document.querySelector('#panel-moderacion .search-bar button');
    if (btnConsultarMongo) {
        btnConsultarMongo.type = 'button';
        btnConsultarMongo.onclick = consultarForoMongo;
    }
});

function switchPanel(panelId) {
    document.querySelectorAll('.admin-panel').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
    
    const targetPanel = document.getElementById('panel-' + panelId);
    if (targetPanel) targetPanel.style.display = 'block';
    
    document.querySelectorAll('.nav-tab').forEach(btn => {
        if (btn.getAttribute('onclick') === `switchPanel('${panelId}')`) {
            btn.classList.add('active');
        }
    });

    if (panelId === 'inventario') cargarInventarioOracle();
    if (panelId === 'prestamos') obtenerTodosLosPrestamos();
    if (panelId === 'multas') cargarMultasOracle();
    if (panelId === 'usuarios') cargarUsuariosAtlas();
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
            const libroData = encodeURIComponent(JSON.stringify({
                id: l.IDLIBRO, isbn: l.ISBN, titulo: l.TITULO, autor: l.AUTOR,
                genero: l.GENERO, formato: l.FORMATO, stock_total: l.STOCK_TOTAL,
                stock_disponible: l.STOCK_DISPONIBLE, anio: l.ANIO_PUBLICACION,
                sinopsis: l.SINOPSIS || ''
            }));
            
            tbody.innerHTML += `
                <tr>
                    <td>${l.IDLIBRO}</td>
                    <td>${l.ISBN}</td>
                    <td><strong>${l.TITULO}</strong></td>
                    <td>${l.GENERO}</td>
                    <td>${(l.FORMATO || '').toUpperCase()}</td>
                    <td><span class="badge ${badgeClass}">${l.STOCK_DISPONIBLE} / ${l.STOCK_TOTAL}</span></td>
                    <td>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <button onclick="abrirModalLibro('${libroData}')" style="background: rgba(59,130,246,0.1); color: #1d4ed8; border: none; padding: 8px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s;" title="Editar Libro">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button onclick="eliminarLibroOracle(${l.IDLIBRO}, '${l.TITULO.replace(/'/g, "\\'")}')" style="background: rgba(239,68,68,0.1); color: #dc2626; border: none; padding: 8px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s;" title="Eliminar Libro">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Error al cargar inventario: ", err);
    }
}

async function eliminarLibroOracle(id, titulo) {
    if (!confirm(`¿Está seguro de que desea remover permanentemente la obra '${titulo}' de Oracle?`)) return;

    try {
        const res = await fetch(`/api/oracle/libros/${id}`, { method: 'DELETE' });
        const data = await res.json();

        if (res.ok) {
            mostrarToast(`🗑️ ${data.mensaje}`);
            await cargarInventarioOracle();
        } else {
            alert(`⚠️ Error Relacional:\n${data.error}`);
        }
    } catch (err) {
        alert("Fallo de comunicación con la base de datos: " + err.message);
    }
}

function abrirModalAgregarLibro() {
    document.getElementById('form-agregar-libro').reset();
    document.getElementById('modal-agregar-libro').style.display = 'flex';
}

async function confirmarAgregarLibro() {
    // Capturamos los elementos asegurando limpieza de espacios
    const isbnVal   = document.getElementById('add-isbn').value.trim();
    const tituloVal = document.getElementById('add-titulo').value.trim();
    const autorVal  = document.getElementById('add-autor').value.trim();
    const generoVal = document.getElementById('add-genero').value.trim();
    const formatoVal = document.getElementById('add-formato').value;
    const anioVal   = document.getElementById('add-anio').value.trim();
    const totalVal  = document.getElementById('add-stock-total').value.trim();
    const dispVal   = document.getElementById('add-stock-disponible').value.trim();
    const sinopVal  = document.getElementById('add-sinopsis').value.trim();

    if (!tituloVal || !isbnVal) {
        alert("⚠️ El Título y el ISBN son campos relacionales obligatorios.");
        return;
    }

    const payload = {
        isbn: isbnVal,
        titulo: tituloVal,
        autor: autorVal || "Anónimo",
        genero: generoVal || "General",
        formato: formatoVal,
        anio_publicacion: anioVal ? parseInt(anioVal) : null,
        stock_total: totalVal ? parseInt(totalVal) : 0,
        stock_disponible: dispVal ? parseInt(dispVal) : 0,
        sinopsis: sinopVal || ""
    };

    try {
        const res = await fetch('/api/oracle/libros', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();

        if (res.ok) {
            cerrarModal('modal-agregar-libro');
            // Limpiar el formulario nativo
            const form = document.getElementById('form-agregar-libro');
            if (form) form.reset();
            
            // Recargar la tabla reactivamente
            await cargarInventarioOracle();
            mostrarToast(`✅ ${data.mensaje}`);
        } else {
            alert(`⚠️ Error devuelto por Oracle:\n${data.error}`);
        }
    } catch (err) {
        alert("Error de infraestructura al enviar datos a Oracle: " + err.message);
    }
}

async function cargarMultasOracle() {
    try {
        const res = await fetch('/api/oracle/multas');
        const multas = await res.json();
        const tbody = document.querySelector('#panel-multas .admin-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!multas || multas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 16px; color: var(--neutral-mid);">No se registran penalidades en caja.</td></tr>`;
            return;
        }

        multas.forEach(m => {
            const idMulta     = m.IDMULTA || m.idMulta || '---';
            const idPrestamo  = m.IDPRESTAMO || m.idPrestamo || '---';
            const monto       = m.MONTO || m.monto || 0;
            const diasRetraso = m.DIAS_RETRASO || m.dias_retraso || 0;
            const estadoPago  = (m.ESTADO_PAGO || m.estado_pago || 'pendiente').toLowerCase();
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
// 🏛 *REGISTRO Y SEGUIMIENTO DE PRÉSTAMOS — ORACLE SQL (ACID)*
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
            alert(`🎉 ¡Éxito Relacional!\nPréstamo registrado correctamente.`);
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
                <td colspan="8" style="padding: 16px; text-align: center; color: #64748b;">
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
            <td style="padding: 12px; text-align: center;">
                <button onclick="eliminarPrestamoOracle(${idPrestamo})" style="background: rgba(239, 68, 68, 0.1); color: #dc2626; border: none; padding: 8px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: background 0.2s;" title="Eliminar Préstamo">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </td>
        `;
        tablaBody.appendChild(fila);
    });
}

// Functión para eliminar préstamo y limpiar dependencias
async function eliminarPrestamoOracle(idPrestamo) {
    if (!confirm(`⚠️ ¿Está seguro de eliminar permanentemente el préstamo N° ${idPrestamo}?\nEsta acción removerá la restricción en Oracle.`)) return;

    try {
        const res = await fetch(`/api/oracle/prestamos/${idPrestamo}`, { method: 'DELETE' });
        const data = await res.json();

        if (res.ok) {
            mostrarToast(`🗑️ ${data.mensaje}`);
            // Refrescar paneles implicados de manera inmediata
            await obtenerTodosLosPrestamos();
            await cargarInventarioOracle();
        } else {
            alert(`⚠️ Error al remover el préstamo:\n${data.error}`);
        }
    } catch (err) {
        alert("Fallo de comunicación asíncrona: " + err.message);
    }
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
                    <thead><tr><th>Usuario</th><th>Valoración</th><th>Comentario</th><th>Acción</th></tr></thead>
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
                    </tr>`;
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

// =========================================================================
// 👤 GESTIÓN DE USUARIOS — ORACLE SQL (JOIN con MEMBRESIA)
// =========================================================================

async function cargarUsuariosAtlas() {
    const tbody = document.getElementById('usuarios-admin-tabla');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:16px;color:var(--neutral-mid);">Cargando usuarios desde Oracle...</td></tr>`;
    try {
        const res = await fetch('/api/oracle/usuarios');
        if (!res.ok) {
            const e = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
            throw new Error(e.error || `HTTP ${res.status}`);
        }
        const usuarios = await res.json();
        tbody.innerHTML = '';
        if (!usuarios || usuarios.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:16px;color:var(--neutral-mid);">No se encontraron usuarios en Oracle.</td></tr>`;
            return;
        }
        const membMap = { 'mega fan':'badge-megafan','premium':'badge-premium','estudiante':'badge-estudiante','basico':'badge-basico','básico':'badge-basico' };
        usuarios.forEach(u => {
            const nombre  = `${u.NOMBRE||''} ${u.APELLIDO||''}`.trim()||'---';
            const email   = u.EMAIL||'---';
            const rol     = u.ROL||'lector';
            const memb    = u.TIPO_PLAN||null;
            const estado  = (u.ESTADO_CUENTA||'activo').toLowerCase();
            const mClass  = memb ? (membMap[memb.toLowerCase()]||'badge-basico') : '';
            const mHtml   = memb ? `<span class="badge ${mClass}">${memb}</span>` : `<span style="color:#9ca3af;font-size:0.82rem;">Sin membresía</span>`;
            const eClass  = estado==='activo' ? 'badge-activo' : 'badge-inactivo';
            tbody.innerHTML += `
                <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:12px;font-weight:600;color:#1e293b;">${nombre}</td>
                    <td style="padding:12px;color:#475569;">${email}</td>
                    <td style="padding:12px;color:#475569;text-transform:capitalize;">${rol}</td>
                    <td style="padding:12px;">${mHtml}</td>
                    <td style="padding:12px;"><span class="badge ${eClass}">${estado.charAt(0).toUpperCase()+estado.slice(1)}</span></td>
                    <td style="padding:12px;"><button class="btn-edit" onclick="abrirModalMembresia(${u.IDUSUARIO},'${nombre.replace(/'/g,"&apos;")}','${memb||''}')">✏️ Membresía</button></td>
                </tr>`;
        });
    } catch(err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:16px;color:#dc2626;">⚠️ Error al cargar: ${err.message}</td></tr>`;
    }
}

function abrirModalMembresia(id, nombre, membresiaActual) {
    document.getElementById('modal-membresia-id').value = id;
    document.getElementById('modal-membresia-nombre').textContent = nombre;
    const select = document.getElementById('modal-membresia-select');
    for (let opt of select.options) {
        opt.selected = opt.value === membresiaActual;
    }
    document.getElementById('modal-membresia').style.display = 'flex';
}

async function confirmarMembresia() {
    const id        = document.getElementById('modal-membresia-id').value;
    const membresia = document.getElementById('modal-membresia-select').value;
    try {
        const res = await fetch(`/api/oracle/usuarios/${id}/membresia`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ membresia })
        });
        const data = await res.json();
        if (res.ok) {
            cerrarModal('modal-membresia');
            await cargarUsuariosAtlas();
            mostrarToast(`✅ ${data.mensaje}`);
        } else {
            alert(`⚠️ Error: ${data.error}`);
        }
    } catch (err) {
        alert("Error de comunicación con Oracle: " + err.message);
    }
}

// ===== MODAL LIBRO =====
function abrirModalLibro(encodedData) {
    const l = JSON.parse(decodeURIComponent(encodedData));
    document.getElementById('edit-libro-id').value         = l.id;
    document.getElementById('edit-isbn').value            = l.isbn || '';
    document.getElementById('edit-titulo').value          = l.titulo || '';
    document.getElementById('edit-autor').value           = l.autor || '';
    document.getElementById('edit-genero').value          = l.genero || '';
    document.getElementById('edit-anio').value            = l.anio || '';
    document.getElementById('edit-stock-total').value     = l.stock_total || 0;
    document.getElementById('edit-stock-disponible').value = l.stock_disponible || 0;
    document.getElementById('edit-sinopsis').value        = l.sinopsis || '';
    document.getElementById('modal-libro-titulo-ref').textContent = l.titulo || 'Obra sin título';

    const fmtSelect = document.getElementById('edit-formato');
    for (let opt of fmtSelect.options) {
        opt.selected = opt.value === (l.formato || '').toLowerCase();
    }
    document.getElementById('modal-libro').style.display = 'flex';
}

async function confirmarEdicionLibro() {
    const id = document.getElementById('edit-libro-id').value;
    const payload = {
        isbn:              document.getElementById('edit-isbn').value.trim(),
        titulo:            document.getElementById('edit-titulo').value.trim(),
        autor:             document.getElementById('edit-autor').value.trim(),
        genero:            document.getElementById('edit-genero').value.trim(),
        formato:           document.getElementById('edit-formato').value,
        anio_publicacion:  document.getElementById('edit-anio').value,
        stock_total:       document.getElementById('edit-stock-total').value,
        stock_disponible:  document.getElementById('edit-stock-disponible').value,
        sinopsis:          document.getElementById('edit-sinopsis').value.trim(),
        url_imagen:        null // Aseguramos que no interfiera ninguna URL obsoleta
    };

    if (!payload.titulo || !payload.isbn) {
        alert("El título y el ISBN son obligatorios.");
        return;
    }

    try {
        const res = await fetch(`/api/oracle/libros/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
            cerrarModal('modal-libro');
            await cargarInventarioOracle();
            mostrarToast(`✅ ${data.mensaje}`);
        } else {
            alert(`⚠️ Error Oracle: ${data.error}`);
        }
    } catch (err) {
        alert("Error de comunicación con Oracle: " + err.message);
    }
}

function cerrarModal(id) {
    document.getElementById(id).style.display = 'none';
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.style.display = 'none';
    }
});

function mostrarToast(mensaje) {
    let toast = document.getElementById('nexus-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'nexus-toast';
        toast.style.cssText = `
            position: fixed; bottom: 32px; right: 32px; z-index: 2000;
            background: #1e293b; color: white;
            padding: 14px 22px; border-radius: 12px;
            font-family: var(--font-sans); font-size: 0.92rem; font-weight: 500;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
            transform: translateY(20px); opacity: 0;
            transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
            max-width: 360px;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = mensaje;
    requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    });
    setTimeout(() => {
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
    }, 3500);
}

function cerrarSesion() {
    sessionStorage.clear();
    document.body.classList.add('fade-out');
    setTimeout(() => { window.location.href = '/Login.html'; }, 400);
}