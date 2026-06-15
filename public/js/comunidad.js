async function buscarResenasMongo() {
    const idLibro = document.getElementById('buscar-id-libro').value;
    const contenedor = document.getElementById('contenedor-resenas-mongo');
    const contador = document.getElementById('contador-resenas');
    
    if(!idLibro) { alert('Ingrese un ID válido'); return; }
    
    contenedor.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Extrayendo de MongoDB Atlas...</p>';
    contador.innerHTML = '';
    
    try {
        const res = await fetch(`/api/mongo/resenas/${idLibro}`);
        const data = await res.json();
        contenedor.innerHTML = '';
        
        if(data.length === 0) {
            contador.innerHTML = 'Métricas: 0 Documentos';
            contenedor.innerHTML = '<p style="text-align:center; color:var(--text-muted);">No existen opiniones críticas para este ID de libro.</p>';
            return;
        }
        
        contador.innerHTML = `Métricas: ${data.length} Documentos en la nube`;
        
        data.forEach(r => {
            const estrellasEstilizadas = '<i class="fa-solid fa-star"></i>'.repeat(r.puntuacion_estrellas);
            contenedor.innerHTML += `
                <div class="review-item">
                    <div>
                        <div style="margin-bottom:4px;">
                            <span style="font-weight:600;">${r.nombre_usuario}</span>
                            <span class="stars">${estrellasEstilizadas}</span>
                        </div>
                        <p style="margin:0; font-size:14px; color:var(--text-muted); font-style:italic;">"${r.comentario}"</p>
                    </div>
                    <button class="btn-danger-sm" onclick="eliminarResena('${r._id}')">Remover</button>
                </div>
            `;
        });
    } catch (err) {
        contenedor.innerHTML = `<p style="color:var(--danger); text-align:center;">Fallo NoSQL: ${err.message}</p>`;
    }
}

async function eliminarResena(idMongo) {
    if (!confirm('¿Desea purgar este documento de MongoDB Atlas de forma permanente?')) return;
    try {
        const res = await fetch(`/api/mongo/resenas/${idMongo}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
            alert('Moderación completada: ' + data.mensaje);
            buscarResenasMongo();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}