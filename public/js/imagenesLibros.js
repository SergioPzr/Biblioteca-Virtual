// ============================================================
//  imagenesLibros.js — Mapa compartido de portadas
//  Incluir en: Catalogo.html, DetalleLibro.html, Dashboard.html
//
//  Las URLs se persisten en localStorage para sobrevivir
//  navegación entre páginas.
//
//  Para pre-cargar libros existentes agrega líneas en
//  IMAGENES_HARDCODED abajo: [ID]: "https://...",
// ============================================================

const IMAGENES_HARDCODED = {
    1: "https://imagessl4.casadellibro.com/a/l/t7/44/9788499890944.jpg",
    2: "https://images.cdn3.buscalibre.com/fit-in/360x360/6c/0f/6c0f14509b5a35dc3c7d1d9e0093ecf6.jpg",
    3: "https://img.rtve.es/imagenes/portada-comunidad-del-anillo-minotauro/1450947932148.jpg",
    4: "https://i.pinimg.com/736x/b5/0f/9c/b50f9c7c4969883cfa1dfe5a80763529.jpg",
    5: "https://images.cdn3.buscalibre.com/fit-in/360x360/61/8d/618d227e8967274cd9589a549adff52d.jpg",
    6: "https://images.cdn3.buscalibre.com/fit-in/360x360/b2/fa/b2fa7737f8878591abcea4957b294845.jpg",
    7: "https://images.cdn2.buscalibre.com/fit-in/360x360/ef/0f/ef0fe302954a688d71d2a988393ad609.jpg",
    8: "https://images.cdn2.buscalibre.com/fit-in/360x360/01/8e/018eda7c5353d6309dec7992b63096a7.jpg",
    9: "https://images.cdn1.buscalibre.com/fit-in/360x360/d1/d8/d1d83af23331b1e61922bcf3f7fa2024.jpg",
    10: "https://images.cdn2.buscalibre.com/fit-in/360x360/61/4c/614cb7af8329caf5c752abfaa897b58f.jpg",
    11: "https://images.cdn1.buscalibre.com/fit-in/360x360/b5/89/b589be02f650868192cc4bc0c876ea31.jpg",
    12: "https://images.cdn1.buscalibre.com/fit-in/360x360/ea/1f/ea1fc691874fa49ce341d876a981e2c1.jpg",
    13: "https://images.cdn1.buscalibre.com/fit-in/360x360/6e/25/6e25062d4578ce218d2593a6bc9ac7dc.jpg",
    14: "https://images.cdn2.buscalibre.com/fit-in/360x360/15/e5/15e55a11bf7ab69d43d90567a7b55827.jpg",
    15: "https://images.cdn3.buscalibre.com/fit-in/360x360/57/3b/573b138eb66205768eea6ca1cf09ffe3.jpg",
    16: "https://images.cdn2.buscalibre.com/fit-in/360x360/f4/c6/f4c6bc25e0a2235782af641e93bcbff2.jpg",
    17: "https://assets.lectulandia.co/b/Ernesto%20Sabato/El%20tunel%20(2360)/big.jpg",
    18: "https://images.cdn3.buscalibre.com/fit-in/360x360/46/85/4685286dbc1ec2013245afe1d537acfb.jpg",
    19: "https://images.cdn1.buscalibre.com/fit-in/360x360/46/0c/460cf768bec27103e3d93791c2770ba5.jpg",
    20: "https://www.librosperuanos.com/public_files/B23101.jpg",
    21: "https://images.cdn3.buscalibre.com/fit-in/360x360/49/6c/496cc2d26070c4f19d7f8e93a09274ac.jpg",
    22: "https://www.penguinlibros.com/pe/7393392-large_default/las-aventuras-de-tom-sawyer.webp",
    23: "https://images.cdn3.buscalibre.com/fit-in/360x360/91/9a/919ad0f691c172dea6d8af40ba3ead11.jpg",
    24: "https://images.cdn1.buscalibre.com/fit-in/360x360/ec/c6/ecc6925af7478dd66fce402ea5e3dda0.jpg",
    25: "https://images.cdn2.buscalibre.com/fit-in/360x360/2b/f4/2bf446b4fb582f86bb6616ee8bc279aa.jpg",
    26: "https://images.cdn3.buscalibre.com/fit-in/360x360/f5/f2/f5f2e2edd647784f07b709f1fef82d1c.jpg",
    27: "https://images.cdn1.buscalibre.com/fit-in/360x360/cb/94/cb94d39625dfa50b689117e9166c3915.jpg",
    28: "https://images.cdn1.buscalibre.com/fit-in/360x360/bf/4f/bf4f6db0115365851fea367e190daea9.jpg",
    29: "https://images.cdn1.buscalibre.com/fit-in/360x360/76/d1/76d106c929541eb2e86b3e61b8c7b8d3.jpg",
    30: "https://images.cdn2.buscalibre.com/fit-in/360x360/40/fa/40fa6a6657f79a3752fbf7a8501ccebd.jpg",
};

const PORTADAS_RESPALDO = [
    "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1513001900722-370f803f498d?w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1531988042231-d39a9cc12a9a?w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1614849963640-9cc74b2a826f?w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&auto=format&fit=crop",
];

const STORAGE_KEY = 'nexuslib_imagenes';

// Carga el mapa desde localStorage, fusionado con los hardcoded
function _cargarMapa() {
    try {
        const guardado = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        return Object.assign({}, IMAGENES_HARDCODED, guardado);
    } catch {
        return Object.assign({}, IMAGENES_HARDCODED);
    }
}

// Mapa activo en memoria para esta sesión
const IMAGENES_LIBROS = _cargarMapa();

/**
 * Devuelve la URL de portada para un libro dado su ID de Oracle.
 * Prioridad: localStorage > hardcoded > respaldo por ID.
 */
function getImagenLibro(idLibro) {
    const id = parseInt(idLibro);
    if (IMAGENES_LIBROS[id]) return IMAGENES_LIBROS[id];
    return PORTADAS_RESPALDO[id % PORTADAS_RESPALDO.length];
}

/**
 * Guarda una URL para un libro. Persiste en localStorage
 * para que Catálogo y DetalleLibro la vean al instante.
 */
function setImagenLibro(idLibro, url) {
    if (!url || url.trim() === '') return;
    const id = parseInt(idLibro);
    IMAGENES_LIBROS[id] = url.trim();
    try {
        const guardado = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        guardado[id] = url.trim();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(guardado));
    } catch (e) {
        console.warn('No se pudo guardar imagen en localStorage:', e);
    }
}