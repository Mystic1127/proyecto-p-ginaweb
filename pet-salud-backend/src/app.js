// src/app.js
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Salud
app.get('/', (_req, res) => res.send('Bienvenido a la API de PetSalud!'));

// Rutas
app.use('/auth',     require('./modules/auth/auth.routes'));
app.use('/mascotas', require('./modules/mascotas/mascotas.routes'));
app.use('/citas',    require('./modules/citas/citas.routes'));
app.use('/lab',      require('./modules/lab/lab.routes'));
app.use('/staff',    require('./modules/staff/staff.routes'));
app.use('/facturas', require('./modules/facturas/facturas.routes'));
app.use('/duenos',   require('./modules/duenos/duenos.routes'));
app.use('/reportes', require('./modules/reportes/reportes.routes'));
app.use('/historial',require('./modules/historial/historial.routes'));

module.exports = { app };
