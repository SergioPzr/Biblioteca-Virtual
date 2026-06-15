function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// FETCH: Cargar Libros de Oracle
async function cargarLibros() {
    const tbody = document.getElementById('tabla-libros');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Consultando Oracle DB...</td></tr>';
    try {
        const res = await fetch('/api/oracle/libros');
        const data = await res.json();
        tbody.innerHTML = '';
        data.forEach(libro => {
            tbody.innerHTML += `
                <tr>
                    <td>${libro.IDLIBRO}</td>
                    <td>${libro.ISBN}</td>
                    <td>${libro.TITULO}</td>
                    <td>${libro.GENERO}</td>
                    <td><strong>${libro.FORMATO.toUpperCase()}</strong></td>
                    <td>${libro.STOCK_DISPONIBLE} / ${libro.STOCK_TOTAL}</td>
                </tr>
            `;
        });
    } catch (err) { tbody.innerHTML = `<tr><td colspan="6" style="color:red;">Error: ${err.message}</td></tr>`; }
}

// SUBMIT: Registrar Préstamo en Oracle
document.getElementById('form-prestamo').addEventListener('submit', async (e) => {
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
        alert(res.ok ? data.mensaje : 'Error: ' + data.error);
        if(res.ok) document.getElementById('form-prestamo').reset();
    } catch (err) { alert('Error: ' + err.message); }
});

// FETCH: Cargar Multas
async function cargarMultas() {
    const tbody = document.getElementById('tabla-multas');
    try {
        const res = await fetch('/api/oracle/multas');
        const data = await res.json();
        tbody.innerHTML = '';
        data.forEach(multa => {
            tbody.innerHTML += `
                <tr>
                    <td>${multa.IDMULTA}</td>
                    <td>${multa.IDPRESTAMO}</td>
                    <td>S/. ${multa.MONTO}</td>
                    <td>${multa.DIAS_RETRASO} días</td>
                    <td><span style="color:${multa.ESTADO_PAGO === 'pendiente' ? 'red' : 'green'}">${multa.ESTADO_PAGO.toUpperCase()}</span></td>
                </tr>
            `;
        });
    } catch (err) { console.error(err); }
}

// SUBMIT: Registrar Reseña en MongoDB
document.getElementById('form-resena').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
        idLibro: document.getElementById('r-libro').value,
        usuario: document.getElementById('r-usuario').value,
        estrellas: document.getElementById('r-estrellas').value,
        comentario: document.getElementById('r-comentario').value
    };
    try {
        const res = await fetch('/api/mongo/resenas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        alert(res.ok ? data.mensaje : 'Error: ' + data.error);
        if(res.ok) document.getElementById('form-resena').reset();
    } catch (err) { alert('Error: ' + err.message); }
});