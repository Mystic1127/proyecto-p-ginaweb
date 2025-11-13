// src/server.js
const dotenv = require('dotenv');
dotenv.config();

const { app } = require('./app');

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
}

module.exports = { app }; // útil por si algún test importa desde server.js
