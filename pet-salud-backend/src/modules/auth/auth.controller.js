const { getPool } = require('../../config/db');
const { registerDueno, login } = require('./auth.service');
const { hashPassword } = require('../../utils/password');

async function register(req, res) {
  try {
    const result = await registerDueno(req.body);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body || {};
    const result = await login(email, password);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
}

async function registerStaff(req, res) {
  try {
    const { nombre_usuario, email, password, rol, especialidad, telefono } = req.body || {};

    if (!['RECEPCIONISTA', 'VETERINARIO', 'TECNICO', 'ADMIN'].includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }
    if (!email || !password || !nombre_usuario) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const pool = await getPool();
    const passHash = await hashPassword(password);

    const [ins] = await pool.query(
      `INSERT INTO usuarios (nombre_usuario, email, password_hash, rol)
       VALUES (?, ?, ?, ?)`,
      [nombre_usuario, email, passHash, rol]
    );

    if (rol === 'VETERINARIO') {
      await pool.query(
        `INSERT INTO veterinarios (id_usuario, especialidad, telefono) VALUES (?,?,?)`,
        [ins.insertId, especialidad || null, telefono || null]
      );
    } else if (rol === 'TECNICO') {
      await pool.query(
        `INSERT INTO tecnicos (id_usuario, especialidad, telefono) VALUES (?,?,?)`,
        [ins.insertId, especialidad || null, telefono || null]
      );
    }

    return res.status(201).json({ ok: true, id_usuario: ins.insertId, rol });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

module.exports = { register, loginUser, registerStaff };
