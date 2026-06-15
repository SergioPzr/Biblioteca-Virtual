async function cargarLibros() {
    const tbody = document.getElementById('tabla-libros');
    try {
        const res = await fetch('/api/oracle/libros');
        const data = await res.json();
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay registros relacionales disponibles.</td></tr>';
            return;
        }

        data.forEach(libro => {
            tbody.innerHTML += `
                <tr>
                    <td>${libro.IDLIBRO}</td>
                    <td style="font-family: monospace; color: var(--text-muted);">${libro.ISBN}</td>
                    <td style="font-weight: 600;">${libro.TITULO}</td>
                    <td>${libro.GENERO}</td>
                    <td><span style="font-size:12px; background:#f1f5f9; padding:4px 8px; border-radius:6px; font-weight:600;">${libro.FORMATO.toUpperCase()}</span></td>
                    <td><strong>${libro.STOCK_DISPONIBLE}</strong> <span style="color:var(--text-muted);">/ ${libro.STOCK_TOTAL}</span></td>
                </tr>
            `;
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger); text-align:center;">Error de enlace: ${err.message}</td></tr>`;
    }
}

document.addEventListener('DOMContentLoaded', cargarLibros);