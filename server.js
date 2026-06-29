const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
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
// CADENAS DE CONEXIÓN HÍBRIDAS (ORACLE LOCAL + MONGO ATLAS)
// =========================================================================
const oracleConfig = {
    user: "admin_biblioteca",
    password: "Proyecto123",
    connectString: "localhost:1521/db_biblioteca"
};

const mongoUrl = 'mongodb+srv://admin_proyecto:Proyecto123@clustermongoescobarcoag.hngvkps.mongodb.net/?appName=ClusterMongoEscobarCoaguila';
const dbMongoName = 'db_biblioteca_editorial';

// =========================================================================
// ENDPOINTS DE AUTENTICACIÓN (MONGODB ATLAS)
// =========================================================================
// POST: Login del Sistema (Autenticación NoSQL Atlas homologada con el frontend)
// POST: Login del Sistema (Autenticación NoSQL Atlas homologada con el frontend)
// POST: Login del Sistema (Autenticación NoSQL Atlas homologada con el frontend)
app.post('/api/auth/login', async (req, res) => {
    let client;
    try {
        const { email, password } = req.body;
        client = await MongoClient.connect(mongoUrl);
        const db = client.db(dbMongoName);

        // Buscar las credenciales en la colección usuarios_web de Atlas
        const usuario = await db.collection('usuarios_web').findOne({ email: email, contrasenia: password });

        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales inválidas en el clúster NoSQL Atlas.' });
        }

        // Homologación estricta de roles para hacer match perfecto con los botones del frontend
        let rolFrontend = usuario.rol.toLowerCase().trim();
        
        if (rolFrontend === 'lector' || rolFrontend === 'cliente') {
            rolFrontend = 'cliente';
        } else if (rolFrontend === 'administrador' || rolFrontend === 'admin') {
            rolFrontend = 'admin'; // Forzamos 'admin' para el JavaScript de la interfaz
        }

        res.json({
            mensaje: 'Autenticación exitosa',
            nombre: usuario.nombre,
            rol: rolFrontend // Envía exactamente 'admin' o 'cliente'
        });
    } catch (err) {
        res.status(500).json({ error: 'Fallo de infraestructura en Atlas: ' + err.message });
    } finally {
        if (client) client.close();
    }
});
// =========================================================================
// ENDPOINTS OPERACIONALES (ORACLE SQL)
// =========================================================================

// GET: Listar Obras con el nuevo esquema extendido
app.get('/api/oracle/libros', async (req, res) => {
    let conn;
    try {
        conn = await oracledb.getConnection(oracleConfig);
        const result = await conn.execute(
            `SELECT idLibro, isbn, titulo, autor, genero, formato, stock_total, stock_disponible, anio_publicacion, sinopsis FROM LIBRO`,
            [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});

// POST: Préstamo con asignación de Llave Primaria Automática (GENERATED AS IDENTITY)
// =========================================================================
// 🏛️ ENDPOINT REACCIÓN PARA TRAER TODOS LOS PRÉSTAMOS (ORACLE SQL)
// =========================================================================
// =========================================================================
// 🏛️ ENDPOINT CORRECTO PARA LISTAR PRÉSTAMOS (SERVER.JS)
// =========================================================================
// =========================================================================
// 🏛️ PROCESAMIENTO DE PRÉSTAMOS — ORACLE SQL (ACID)
// =========================================================================

// 📥 1. REGISTRAR UN NUEVO PRÉSTAMO (POST)
app.post('/api/oracle/prestamos', async (req, res) => {
    let conn;
    try {
        const { idUsuario, idLibro, fechaLimite } = req.body;
        conn = await oracledb.getConnection(oracleConfig);

        // Validar Stock Disponible
        const checkStock = await conn.execute(
            `SELECT stock_disponible FROM LIBRO WHERE idLibro = :idLibro`,
            { idLibro: parseInt(idLibro) }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (checkStock.rows.length === 0 || checkStock.rows[0].STOCK_DISPONIBLE <= 0) {
            return res.status(400).json({ error: 'No hay stock disponible para este libro.' });
        }

        // Insertar omitiendo idPrestamo (Identity autoincrementable)
        await conn.execute(
            `INSERT INTO PRESTAMO (idUsuario, idLibro, fecha_prestamo, fecha_limite, estado)
             VALUES (:idUsuario, :idLibro, SYSDATE, TO_DATE(:fechaLimite, 'YYYY-MM-DD'), 'activo')`,
            { idUsuario: parseInt(idUsuario), idLibro: parseInt(idLibro), fechaLimite }
        );

        // Descontar Stock
        await conn.execute(
            `UPDATE LIBRO SET stock_disponible = stock_disponible - 1 WHERE idLibro = :idLibro`,
            { idLibro: parseInt(idLibro) }
        );

        await conn.commit();
        res.status(201).json({ mensaje: 'Préstamo procesado bajo estricta atomicidad ACID.' });
    } catch (err) {
        if (conn) await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

// 📤 2. LISTAR TODOS LOS PRÉSTAMOS (GET)
app.get('/api/oracle/prestamos', async (req, res) => {
    let conn;
    try {
        conn = await oracledb.getConnection(oracleConfig);

        // Mapeo exacto respetando "fecha_devuelcion" de tu script
        const result = await conn.execute(
            `SELECT 
                idPrestamo AS IDPRESTAMO,
                idUsuario AS IDUSUARIO,
                idLibro AS IDLIBRO,
                fecha_prestamo AS FECHASALIDA,
                fecha_limite AS FECHALIMITE,
                fecha_devuelcion AS FECHADEVOLUCION,
                estado AS ESTADO
             FROM PRESTAMO
             ORDER BY idPrestamo ASC`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.json(result.rows);
    } catch (err) {
        console.error("Error en GET préstamos Oracle:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) {
            try { await conn.close(); } catch (e) { console.error(e); }
        }
    }
});


// =========================================================================
// 🗑️ ELIMINAR REGISTRO DE PRÉSTAMO INDIVIDUAL (ORACLE SQL)
// =========================================================================
app.delete('/api/oracle/prestamos/:id', async (req, res) => {
    let conn;
    try {
        const idPrestamo = parseInt(req.params.id);
        conn = await oracledb.getConnection(oracleConfig);

        await conn.execute(
            `DELETE FROM PRESTAMO WHERE idPrestamo = :idPrestamo`,
            { idPrestamo }
        );
        
        await conn.commit();
        res.json({ mensaje: 'El registro del préstamo ha sido eliminado de Oracle correctamente.' });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error("Error al eliminar el préstamo:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

// 📤 3. LISTAR TODAS LAS MULTAS (GET)
app.get('/api/oracle/multas', async (req, res) => {
    let conn;
    try {
        conn = await oracledb.getConnection(oracleConfig);

        // Consultamos directamente tu tabla de multas relacional
        // Ajusta las columnas si tu tabla usa nombres ligeramente distintos
        const result = await conn.execute(
            `SELECT 
                idMulta AS IDMULTA,
                idPrestamo AS IDPRESTAMO,
                monto AS MONTO,
                dias_retraso AS DIAS_RETRASO,
                estado_pago AS ESTADO_PAGO
             FROM MULTA
             ORDER BY idMulta ASC`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.json(result.rows);
    } catch (err) {
        console.error("Error en GET multas Oracle:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) {
            try { await conn.close(); } catch (e) { console.error(e); }
        }
    }
});


// =========================================================================
// ENDPOINTS DE OPINIONES (MONGODB ATLAS)
// =========================================================================
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
        res.status(201).json({ mensaje: 'Reseña indexada.', id: result.insertedId });
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (client) client.close(); }
});

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

app.delete('/api/mongo/resenas/:id', async (req, res) => {
    let client;
    try {
        const idResena = req.params.id;
        client = await MongoClient.connect(mongoUrl);
        const db = client.db(dbMongoName);
        const result = await db.collection('resenas').deleteOne({ _id: new ObjectId(idResena) });

        if (result.deletedCount === 1) {
            res.json({ mensaje: 'Reseña purgada con éxito.' });
        } else {
            res.status(404).json({ error: 'Documento no encontrado.' });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (client) client.close(); }
});

// =========================================================================
// ENDPOINTS DE USUARIOS (ORACLE SQL — JOIN con MEMBRESIA)
// =========================================================================

// GET: Listar todos los usuarios con su membresía activa (LEFT JOIN)
app.get('/api/oracle/usuarios', async (req, res) => {
    let conn;
    try {
        conn = await oracledb.getConnection(oracleConfig);
        const result = await conn.execute(
            `SELECT 
                u.idUsuario       AS IDUSUARIO,
                u.nombre          AS NOMBRE,
                u.apellido        AS APELLIDO,
                u.email           AS EMAIL,
                u.rol             AS ROL,
                u.estado_cuenta   AS ESTADO_CUENTA,
                m.tipo_plan       AS TIPO_PLAN,
                m.estado          AS ESTADO_MEMBRESIA
             FROM USUARIO u
             LEFT JOIN MEMBRESIA m ON u.idUsuario = m.idUsuario
             ORDER BY u.idUsuario ASC`,
            [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error GET /api/oracle/usuarios:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) try { await conn.close(); } catch(e) {}
    }
});

// PUT: Actualizar membresía de un usuario (UPDATE en tabla MEMBRESIA)
app.put('/api/oracle/usuarios/:id/membresia', async (req, res) => {
    let conn;
    try {
        const idUsuario = parseInt(req.params.id);
        const { membresia } = req.body;

        const membresiasValidas = ['Mega Fan', 'Premium', 'Estudiante', 'Básico'];
        if (!membresiasValidas.includes(membresia)) {
            return res.status(400).json({ error: 'Membresía no válida.' });
        }

        conn = await oracledb.getConnection(oracleConfig);

        // Verificar si ya tiene una fila en MEMBRESIA
        const check = await conn.execute(
            `SELECT idMembresia FROM MEMBRESIA WHERE idUsuario = :idUsuario`,
            { idUsuario },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (check.rows.length > 0) {
            // UPDATE si ya existe
            await conn.execute(
                `UPDATE MEMBRESIA SET tipo_plan = :membresia WHERE idUsuario = :idUsuario`,
                { membresia, idUsuario }
            );
        } else {
            // INSERT si el usuario no tiene membresía aún
            await conn.execute(
                `INSERT INTO MEMBRESIA (idUsuario, tipo_plan, fecha_inicio, fecha_vencimiento, estado)
                 VALUES (:idUsuario, :membresia, SYSDATE, ADD_MONTHS(SYSDATE, 12), 'activo')`,
                { idUsuario, membresia }
            );
        }

        await conn.commit();
        res.json({ mensaje: `Membresía actualizada a '${membresia}' correctamente.` });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error("Error al actualizar membresía Oracle:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) {
            try { await conn.close(); } catch (e) { console.error(e); }
        }
    }
});

// =========================================================================
// ENDPOINT DE ACTUALIZACIÓN DE LIBRO (ORACLE SQL)
// =========================================================================

// PUT: Actualizar todos los campos de un libro
app.put('/api/oracle/libros/:id', async (req, res) => {
    let conn;
    try {
        const idLibro = parseInt(req.params.id);
        const { isbn, titulo, autor, genero, formato, stock_total, stock_disponible, anio_publicacion, sinopsis, url_imagen } = req.body;

        conn = await oracledb.getConnection(oracleConfig);
        await conn.execute(
            `UPDATE LIBRO SET
                isbn = :isbn,
                titulo = :titulo,
                autor = :autor,
                genero = :genero,
                formato = :formato,
                stock_total = :stock_total,
                stock_disponible = :stock_disponible,
                anio_publicacion = :anio_publicacion,
                sinopsis = :sinopsis,
                url_imagen = :url_imagen
             WHERE idLibro = :idLibro`,
            {
                isbn, titulo, autor, genero, formato,
                stock_total: parseInt(stock_total),
                stock_disponible: parseInt(stock_disponible),
                anio_publicacion: parseInt(anio_publicacion),
                sinopsis,
                url_imagen: url_imagen || null,
                idLibro
            }
        );
        await conn.commit();
        res.json({ mensaje: 'Obra actualizada correctamente en Oracle.' });
    } catch (err) {
        if (conn) await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});


// 📥 INSERTAR UN NUEVO LIBRO (POST)
app.post('/api/oracle/libros', async (req, res) => {
    let conn;
    try {
        const { isbn, titulo, autor, genero, formato, stock_total, stock_disponible, anio_publicacion, sinopsis } = req.body;
        conn = await oracledb.getConnection(oracleConfig);

        // Omitimos idLibro ya que se autogenera secuencialmente en Oracle
        await conn.execute(
            `INSERT INTO LIBRO (isbn, titulo, autor, genero, formato, stock_total, stock_disponible, anio_publicacion, sinopsis)
             VALUES (:isbn, :titulo, :autor, :genero, :formato, :stock_total, :stock_disponible, :anio_publicacion, :sinopsis)`,
            {
                isbn, titulo, autor, genero, formato,
                stock_total: parseInt(stock_total) || 0,
                stock_disponible: parseInt(stock_disponible) || 0,
                anio_publicacion: parseInt(anio_publicacion) || null,
                sinopsis: sinopsis || null
            }
        );
        await conn.commit();
        res.status(201).json({ mensaje: 'Nueva obra indexada correctamente en Oracle.' });
    } catch (err) {
        if (conn) await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

// 🗑️ ELIMINAR UN LIBRO CON CONTROL DE INTEGRIDAD ACID (DELETE)
app.delete('/api/oracle/libros/:id', async (req, res) => {
    let conn;
    try {
        const idLibro = parseInt(req.params.id);
        conn = await oracledb.getConnection(oracleConfig);

        await conn.execute(
            `DELETE FROM LIBRO WHERE idLibro = :idLibro`,
            { idLibro }
        );
        await conn.commit();
        res.json({ mensaje: 'La obra ha sido removida del inventario de Oracle con éxito.' });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error("Error al eliminar libro:", err.message);
        
        // Control de restricción de clave foránea (ORA-02292: integrity constraint violated - child record found)
        if (err.message.includes("ORA-02292")) {
            return res.status(400).json({ 
                error: 'Restricción de Integridad: Este libro cuenta con registros de préstamos históricos activos y no puede ser eliminado.' 
            });
        }
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

app.get('/', (req, res) => {
    res.redirect('/Inicio.html');
});

app.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    
    console.log(`\n=================================================================`);
    console.log(`Servidor de Ingeniería Híbrido Corriendo en Puerto: ${PORT}`);
    console.log(`Enlace de datos simultáneo activo: Oracle Local + MongoDB Atlas Cloud`);
    console.log(`Enlace directo de la aplicación: ${url}`);
    console.log(`=================================================================\n`);

    // Detectar el sistema operativo para ejecutar el comando correcto de apertura nativa
    const comandoApertura = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    
    // Ejecutar la apertura automática en el navegador predeterminado sin bloquear hilos
    require('child_process').exec(`${comandoApertura} ${url}`);
});