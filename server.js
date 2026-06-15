const express = require('express');
const path = require('path');
const oracledb = require('oracledb');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// =========================================================================
// CADENAS DE CONEXIÓN
// =========================================================================
const oracleConfig = {
    user: "admin_biblioteca",
    password: "Proyecto123",
    connectString: "localhost:1521/db_biblioteca"
};

const mongoUrl = 'mongodb://localhost:27017';
const dbMongoName = 'db_biblioteca_editorial';

// =========================================================================
// RUTAS DE ORACLE (PROCESOS CRÍTICOS Y FINANCIEROS)
// =========================================================================

// GET: Listar todos los libros en inventario
app.get('/api/oracle/libros', async (req, res) => {
    let conn;
    try {
        conn = await oracledb.getConnection(oracleConfig);
        const result = await conn.execute(
            `SELECT idLibro, isbn, titulo, genero, formato, stock_total, stock_disponible, anio_publicacion FROM LIBRO`,
            [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});

// POST: Registrar un nuevo Préstamo (Afecta stock disponible transaccionalmente)
app.post('/api/oracle/prestamos', async (req, res) => {
    let conn;
    try {
        const { idPrestamo, idUsuario, idLibro, fechaLimite } = req.body;
        conn = await oracledb.getConnection(oracleConfig);

        // Verificamos stock disponible antes de prestar
        const checkStock = await conn.execute(
            `SELECT stock_disponible FROM LIBRO WHERE idLibro = :idLibro`,
            { idLibro: parseInt(idLibro) }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (checkStock.rows.length === 0 || checkStock.rows[0].STOCK_DISPONIBLE <= 0) {
            return res.status(400).json({ error: 'No hay stock disponible para este libro.' });
        }

        // Insertar Préstamo
        await conn.execute(
            `INSERT INTO PRESTAMO (idPrestamo, idUsuario, idLibro, fecha_prestamo, fecha_limite, estado)
             VALUES (:idPrestamo, :idUsuario, :idLibro, SYSDATE, TO_DATE(:fechaLimite, 'YYYY-MM-DD'), 'activo')`,
            { idPrestamo: parseInt(idPrestamo), idUsuario: parseInt(idUsuario), idLibro: parseInt(idLibro), fechaLimite }
        );

        // Descontar Stock
        await conn.execute(
            `UPDATE LIBRO SET stock_disponible = stock_disponible - 1 WHERE idLibro = :idLibro`,
            { idLibro: parseInt(idLibro) }
        );

        await conn.commit(); // Atomicidad ACID garantizada
        res.status(201).json({ mensaje: '¡Préstamo registrado con éxito en Oracle!' });
    } catch (err) {
        if (conn) await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally { if (conn) await conn.close(); }
});

// GET: Listar todas las multas financieras
app.get('/api/oracle/multas', async (req, res) => {
    let conn;
    try {
        conn = await oracledb.getConnection(oracleConfig);
        const result = await conn.execute(
            `SELECT idMulta, idPrestamo, monto, dias_retraso, estado_pago FROM MULTA`,
            [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});

// =========================================================================
// RUTAS DE MONGODB (CATÁLOGO FLEXIBLE Y COMUNIDAD DE RESEÑAS)
// =========================================================================

// POST: Registrar reseña (NoSQL - Flexible)
app.post('/api/mongo/resenas', async (req, res) => {
    let client;
    try {
        const { idLibro, usuario, estrellas, comentario } = req.body;
        client = await MongoClient.connect(mongoUrl);
        const db = client.db(dbMongoName);

        const nuevaResena = {
            idLibro: parseInt(idLibro),
            nombre_usuario: usuario,
            puntuacion_estrellas: parseInt(estrellas),
            comentario: comentario,
            fecha_publicacion: new Date()
        };

        const result = await db.collection('resenas').insertOne(nuevaResena);
        res.status(201).json({ mensaje: '¡Reseña añadida en MongoDB!', id: result.insertedId });
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (client) client.close(); }
});

// GET: Obtener reseñas de un libro específico
app.get('/api/mongo/resenas/:idLibro', async (req, res) => {
    let client;
    try {
        const idLibro = parseInt(req.params.idLibro);
        client = await MongoClient.connect(mongoUrl);
        const db = client.db(dbMongoName);

        const resenas = await db.collection('resenas').find({ idLibro }).toArray();
        res.json(resenas);
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (client) client.close(); }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor híbrido corriendo en http://localhost:${PORT}`);
});