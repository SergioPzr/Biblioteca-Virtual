// =========================================================================
// NAV: CONTROL DE PESTAÑAS (TABS)
// =========================================================================
function switchTab(tabId) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    // Desactivar todos los botones del menú lateral
    document.querySelectorAll('.sidebar .nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // Mostrar la pestaña seleccionada
    document.getElementById(tabId).classList.add('active');
    
    // Activar el botón que recibió el clic de forma segura
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    // Carga automática de datos al cambiar de pestaña para mejorar la UX
    if (tabId === 'inventario-tab') cargarLibros();
    if (tabId === 'multas-tab') cargarMultas();
}

// =========================================================================
// ORACLE: SECCIÓN DE INVENTARIO (TABLA LIBRO)
// =========================================================================
async function cargarLibros() {
    const tbody = document.getElementById('tabla-libros');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Consultando Oracle DB...</td></tr>';
    try {
        const res = await fetch('/api/oracle/libros');
        const data = await res.json();
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay libros en el inventario de Oracle.</td></tr>';
            return;
        }

        data.forEach(libro => {
            tbody.innerHTML += `
                <tr>
                    <td>${libro.IDLIBRO}</td>
                    <td>${libro.ISBN}</td>
                    <td>${libro.TITULO}</td>
                    <td>${libro.GENERO}</td>
                    <td><span class="badge" style="background:#cbd5e1; padding:3px 6px; border-radius:4px; font-size:11px;">${libro.FORMATO.toUpperCase()}</span></td>
                    <td><strong>${libro.STOCK_DISPONIBLE}</strong> de ${libro.STOCK_TOTAL}</td>
                </tr>
            `;
        });
    } catch (err) { 
        tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:red;">Error: ${err.message}</td></tr>`; 
    }
}

// =========================================================================
// ORACLE: SECCIÓN DE PRÉSTAMOS (FORMULARIO TRANSACCIONAL)
// =========================================================================
const formPrestamo = document.getElementById('form-prestamo');
if (formPrestamo) {
    formPrestamo.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const body = {
            idPrestamo: document.getElementById('p-id').value,
            idUsuario: document.getElementById('p-usuario').value,
            idLibro: document.getElementById('p-libro').value,
            fechaLimite: document.getElementById('p-fecha').value
        };

        try {
            const res = await fetch('/api/oracle/prestamos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            
            if (res.ok) {
                alert('🚀 ' + data.mensaje);
                formPrestamo.reset();
            } else {
                alert('❌ Error: ' + data.error);
            }
        } catch (err) { 
            alert('❌ Error de red: ' + err.message); 
        }
    });
}

// =========================================================================
// ORACLE: SECCIÓN DE MULTAS (TABLA MULTA)
// =========================================================================
async function cargarMultas() {
    const tbody = document.getElementById('tabla-multas');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Consultando finanzas en Oracle...</td></tr>';
    try {
        const res = await fetch('/api/oracle/multas');
        const data = await res.json();
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Leyendo de forma limpia: No se registran multas pendientes de pago.</td></tr>';
            return;
        }

        data.forEach(multa => {
            const esPendiente = multa.ESTADO_PAGO.toLowerCase() === 'pendiente';
            tbody.innerHTML += `
                <tr>
                    <td>#${multa.IDMULTA}</td>
                    <td>Préstamo ${multa.IDPRESTAMO}</td>
                    <td style="font-weight: bold; color: #b91c1c;">S/. ${parseFloat(multa.MONTO).toFixed(2)}</td>
                    <td>${multa.DIAS_RETRASO} días</td>
                    <td>
                        <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; background-color: ${esPendiente ? '#fee2e2' : '#dcfce7'}; color: ${esPendiente ? '#991b1b' : '#166534'};">
                            ${multa.ESTADO_PAGO.toUpperCase()}
                        </span>
                    </td>
                </tr>
            `;
        });
    } catch (err) { 
        tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:red;">Error: ${err.message}</td></tr>`; 
    }
}

// =========================================================================
// MONGODB ATLAS: SECCIÓN DE MODERACIÓN (READ & DELETE)
// =========================================================================
async function buscarResenasMongo() {
    const idLibroInput = document.getElementById('buscar-id-libro');
    const contenedor = document.getElementById('contenedor-resenas-mongo');
    const contador = document.getElementById('contador-resenas');
    
    if (!idLibroInput || !contenedor || !contador) return;
    
    const idLibro = idLibroInput.value;
    if (!idLibro) { alert('Por favor ingresa un ID de libro'); return; }
    
    contenedor.innerHTML = '<p class="text-center">Consultando MongoDB Atlas...</p>';
    contador.innerHTML = '';
    
    try {
        const res = await fetch(`/api/mongo/resenas/${idLibro}`);
        const data = await res.json();
        contenedor.innerHTML = '';
        
        if (data.length === 0) {
            contador.innerHTML = '📊 Reseñas encontradas: 0';
            contenedor.innerHTML = '<p class="text-center" style="color:#e11d48;">Aún no se registran opiniones críticas para esta obra en la editorial digital.</p>';
            return;
        }
        
        contador.innerHTML = `📊 Reseñas encontradas en este libro: ${data.length}`;
        
        data.forEach(r => {
            contenedor.innerHTML += `
                <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin-bottom: 12px; border-left: 4px solid #13aa52; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                    <div style="flex: 1; padding-right: 20px;">
                        <div style="display:flex; gap: 15px; margin-bottom:5px;">
                            <strong>👤 ${r.nombre_usuario}</strong>
                            <span style="color:#eab308;">${'⭐'.repeat(r.puntuacion_estrellas)}</span>
                        </div>
                        <p style="margin: 0; font-size: 14px; color:#475569;">"${r.comentario}"</p>
                    </div>
                    <div>
                        <button class="btn" style="background-color: #ef4444; color: white; padding: 6px 12px; font-size: 12px; border:none; border-radius:4px; cursor:pointer;" onclick="eliminarResena('${r._id}')">⚠️ Eliminar</button>
                    </div>
                </div>
            `;
        });
    } catch (err) {
        contenedor.innerHTML = `<p style="color:red; text-align:center;">Error NoSQL: ${err.message}</p>`;
    }
}

async function eliminarResena(idMongo) {
    if (!confirm('¿Está seguro de que desea eliminar esta reseña por contenido inadecuado?')) return;
    
    try {
        const res = await fetch(`/api/mongo/resenas/${idMongo}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        
        if (res.ok) {
            alert('🛡️ ' + data.mensaje);
            buscarResenasMongo(); // Refresca la lista automáticamente
        } else {
            alert('❌ Error al eliminar: ' + data.error);
        }
    } catch (err) {
        alert('❌ Error de red: ' + err.message);
    }
}

// Inicializar la carga de libros de Oracle al abrir por primera vez la aplicación
document.addEventListener('DOMContentLoaded', () => {
    cargarLibros();
});