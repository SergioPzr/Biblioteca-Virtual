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
// ENDPOINTS DE AUTENTICACIÓN (ORACLE SQL)
// =========================================================================
app.post('/api/auth/login', async (req, res) => {
    let conn;
    try {
        const { email, password } = req.body;
        conn = await oracledb.getConnection(oracleConfig);

        const result = await conn.execute(
            `SELECT idUsuario, nombre, apellido, email, contrasenia_cifrada, rol, estado_cuenta
             FROM USUARIO WHERE email = :email`,
            { email },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'No existe ninguna cuenta con ese correo electrónico.' });
        }

        const usuario = result.rows[0];

        if (usuario.CONTRASENIA_CIFRADA !== password) {
            return res.status(401).json({ error: 'Contraseña incorrecta.' });
        }

        if (usuario.ESTADO_CUENTA.toLowerCase() === 'suspendido') {
            return res.status(403).json({ error: 'Tu cuenta está suspendida. Contacta al administrador.' });
        }

        const rolOracle = usuario.ROL.toLowerCase().trim();
        const rolFrontend = (rolOracle === 'administrador' || rolOracle === 'admin') ? 'admin' : 'cliente';

        res.json({
            mensaje: 'Autenticación exitosa',
            nombre: usuario.NOMBRE,
            apellido: usuario.APELLIDO,
            rol: rolFrontend
        });

    } catch (err) {
        console.error('Error en login Oracle:', err);
        res.status(500).json({ error: 'Error interno del servidor: ' + err.message });
    } finally {
        if (conn) { try { await conn.close(); } catch (e) { console.error(e); } }
    }
});
// POST: Registro de nuevo usuario (rol Lector por defecto)
app.post('/api/auth/registro', async (req, res) => {
    let conn;
    try {
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
        }

        conn = await oracledb.getConnection(oracleConfig);

        // Verificar que el email no esté ya registrado
        const check = await conn.execute(
            `SELECT idUsuario FROM USUARIO WHERE email = :email`,
            { email },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (check.rows.length > 0) {
            return res.status(409).json({ error: 'Ya existe una cuenta con ese correo electrónico.' });
        }

        // Insertar nuevo usuario con rol Lector y cuenta activa
        // El nombre completo va en "nombre"; apellido queda vacío por ahora
        // (el formulario actual solo pide nombre completo)
        await conn.execute(
            `INSERT INTO USUARIO (nombre, apellido, email, contrasenia_cifrada, rol, estado_cuenta)
             VALUES (:nombre, :apellido, :email, :password, 'Lector', 'activo')`,
            {
                nombre:   nombre,
                apellido: '',       // el formulario no pide apellido por separado
                email:    email,
                password: password  // en texto plano igual que el resto de la tabla
            }
        );

        await conn.commit();
        res.status(201).json({ mensaje: 'Usuario creado correctamente.' });

    } catch (err) {
        console.error('Error en registro Oracle:', err);
        res.status(500).json({ error: 'Error interno del servidor: ' + err.message });
    } finally {
        if (conn) {
            try { await conn.close(); } catch (e) { console.error(e); }
        }
    }
});



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

        const result = await conn.execute(
            `SELECT 
                p.idPrestamo      AS IDPRESTAMO,
                p.idUsuario       AS IDUSUARIO,
                u.nombre || ' ' || u.apellido AS NOMBRE_USUARIO,
                p.idLibro         AS IDLIBRO,
                l.titulo          AS TITULO_LIBRO,
                p.fecha_prestamo  AS FECHASALIDA,
                p.fecha_limite    AS FECHALIMITE,
                p.fecha_devuelcion AS FECHADEVOLUCION,
                p.estado          AS ESTADO
             FROM PRESTAMO p
             JOIN USUARIO u ON p.idUsuario = u.idUsuario
             JOIN LIBRO   l ON p.idLibro   = l.idLibro
             ORDER BY p.idPrestamo ASC`,
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
        const { isbn, titulo, autor, genero, formato, stock_total, stock_disponible, anio_publicacion, sinopsis } = req.body;

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
                sinopsis = :sinopsis
             WHERE idLibro = :idLibro`,
            {
                isbn, titulo, autor, genero, formato,
                stock_total: parseInt(stock_total),
                stock_disponible: parseInt(stock_disponible),
                anio_publicacion: parseInt(anio_publicacion),
                sinopsis,
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