async function cargarMultas() {
    const tbody = document.getElementById('tabla-multas');
    try {
        const res = await fetch('/api/oracle/multas');
        const data = await res.json();
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No se registran penalizaciones financieras huérfanas.</td></tr>';
            return;
        }

        data.forEach(multa => {
            const estado = multa.ESTADO_PAGO.toLowerCase();
            tbody.innerHTML += `
                <tr>
                    <td style="font-family: monospace; color: var(--text-muted);">#${multa.IDMULTA}</td>
                    <td>Ref. Préstamo ${multa.IDPRESTAMO}</td>
                    <td class="monto-currency">S/. ${parseFloat(multa.MONTO).toFixed(2)}</td>
                    <td>${multa.DIAS_RETRASO} días</td>
                    <td>
                        <span class="badge-status ${estado}">
                            ${multa.ESTADO_PAGO}
                        </span>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" style="color:var(--danger); text-align:center;">Error: ${err.message}</td></tr>`;
    }
}

document.addEventListener('DOMContentLoaded', cargarMultas);