const { getPool } = require('../../config/db');
const { hashPassword, comparePassword } = require('../../utils/password');
const jwt = require('jsonwebtoken');

// ========= DUEÑO =========
async function registerDueno(data) {
  const pool = await getPool();
  const { nombre_usuario, email, password, nombres, apellidos, telefono, dni } = data;
  const passwordHash = await hashPassword(password);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [userResult] = await conn.query(
      'INSERT INTO usuarios (nombre_usuario, email, password_hash, rol) VALUES (?, ?, ?, ?)',
      [nombre_usuario, email, passwordHash, 'DUENO']
    );
    const userId = userResult.insertId;

    await conn.query(
      'INSERT INTO duenos (id_usuario, dni, nombres, apellidos, telefono) VALUES (?, ?, ?, ?, ?)',
      [userId, dni || null, nombres, apellidos, telefono || null]
    );

    await conn.commit();
    return { success: true, message: 'Dueño registrado correctamente' };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ========= LOGIN =========
async function login(email, password) {
  const pool = await getPool();
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
  if (rows.length === 0) throw new Error('Usuario no encontrado');

  const user = rows[0];
  const ok = await comparePassword(password, user.password_hash);
  if (!ok) throw new Error('Contraseña incorrecta');

  const token = jwt.sign(
    { id: user.id_usuario, rol: user.rol },
    process.env.JWT_SECRET || 'secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  return { token, rol: user.rol, id_usuario: user.id_usuario };
}

// ========= STAFF (ADMIN/RECEPCIONISTA/VETERINARIO/TECNICO) =========
async function registerStaffService(data) {
  const pool = await getPool();
  const { nombre_usuario, email, password, rol } = data;

  if (!['ADMIN','RECEPCIONISTA','VETERINARIO','TECNICO'].includes(rol)) {
    throw new Error('Rol no válido');
  }

  const passwordHash = await hashPassword(password);

  const [userResult] = await pool.query(
    'INSERT INTO usuarios (nombre_usuario, email, password_hash, rol) VALUES (?, ?, ?, ?)',
    [nombre_usuario, email, passwordHash, rol]
  );

  return { success: true, message: `Usuario ${rol} registrado correctamente`, id: userResult.insertId };
}

module.exports = { registerDueno, login, registerStaffService };
