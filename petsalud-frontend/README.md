# 🐾 PetSalud - Sistema de Gestión Veterinaria

Proyecto desarrollado con **Next.js**, **TypeScript**, **Tailwind CSS**, **Node.js**, **Express** y **MySQL**.  
Su objetivo es gestionar **dueños, mascotas, citas, análisis clínicos y facturación**, integrando roles múltiples (Dueño, Veterinario, Técnico, Recepcionista y Administrador).

---

## ⚙️ Tecnologías utilizadas

- **Frontend:** Next.js + TypeScript + Tailwind CSS  
- **Backend:** Node.js + Express  
- **Base de datos:** MySQL (usando XAMPP / phpMyAdmin)  
- **ORM / Librerías:** mysql2, dotenv, bcrypt, cors  
- **Servidor local:** http://localhost:3000

---

## Script SQL (Crear Base de Datos: "petsalud_db" en el PhpMyAdmin)

**El Mysql y el Apache tienen que esta encendidos**
**El puerto del Mysql tiene que ser 3307 y del apache, el predeterminado**
**Ir a la sección de SQL ya creada la base de datos y copiar estos scripts "Uno por Uno" para luego ejecutarlas**

/* =========================================================
                         PRIMER COPY
   ========================================================= */
CREATE DATABASE IF NOT EXISTS petsalud_db
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
USE petsalud_db;

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario       INT AUTO_INCREMENT PRIMARY KEY,
  nombre_usuario   VARCHAR(80) NOT NULL,
  email            VARCHAR(120) NOT NULL UNIQUE,
  password_hash    VARCHAR(255) NOT NULL,
  rol              ENUM('DUENO','RECEPCIONISTA','VETERINARIO','TECNICO','ADMIN') NOT NULL DEFAULT 'DUENO',
  activo           TINYINT(1) NOT NULL DEFAULT 1,
  creado_en        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_usuarios_rol (rol),
  INDEX idx_usuarios_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS duenos (
  id_dueno       INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario     INT NOT NULL,
  dni            VARCHAR(15),
  nombres        VARCHAR(100) NOT NULL,
  apellidos      VARCHAR(100) NOT NULL,
  telefono       VARCHAR(25),
  UNIQUE KEY uq_duenos_usuario (id_usuario),
  CONSTRAINT fk_duenos_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS mascotas (
  id_mascota     INT AUTO_INCREMENT PRIMARY KEY,
  id_dueno       INT NOT NULL,
  nombre         VARCHAR(80) NOT NULL,
  especie        ENUM('PERRO','GATO','AVE','ROEDOR','REPTIL','OTRO') NOT NULL,
  raza           VARCHAR(100),
  edad           INT,
  sexo           ENUM('MACHO','HEMBRA','INDETERMINADO') DEFAULT 'INDETERMINADO',
  alergias       TEXT,
  vacunas        TEXT,
  creado_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mascotas_dueno (id_dueno),
  INDEX idx_mascotas_nombre (nombre),
  CONSTRAINT fk_mascotas_dueno
    FOREIGN KEY (id_dueno) REFERENCES duenos(id_dueno)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS citas (
  id_cita        INT AUTO_INCREMENT PRIMARY KEY,
  id_mascota     INT NOT NULL,
  tipo_servicio  ENUM('CONSULTA','VACUNACION','ANALISIS','CONTROL','OTRO') NOT NULL,
  fecha_hora     DATETIME NOT NULL,
  estado         ENUM('PENDIENTE','CONFIRMADA','ATENDIDA','CANCELADA') NOT NULL DEFAULT 'PENDIENTE',
  notas          VARCHAR(255),
  creado_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_citas_mascota (id_mascota),
  INDEX idx_citas_fecha (fecha_hora),
  CONSTRAINT fk_citas_mascota
    FOREIGN KEY (id_mascota) REFERENCES mascotas(id_mascota)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS veterinarios (
  id_veterinario INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario     INT NOT NULL,
  especialidad   VARCHAR(120),
  telefono       VARCHAR(25),
  CONSTRAINT fk_vet_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tecnicos (
  id_tecnico     INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario     INT NOT NULL,
  especialidad   VARCHAR(120),
  telefono       VARCHAR(25),
  CONSTRAINT fk_tec_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

---

/* =========================================================
                         SEGUNDO COPY
   ========================================================= */

INSERT INTO usuarios (nombre_usuario, email, password_hash, rol)
VALUES ('admin1', 'admin@petsalud.com', '$2b$10$d0MuLoeQhpZzN2Ur7Dq9..5qW2EfrJ3bvRgMPGbO.eTyEg/wGNFAy', 'ADMIN');

---

/* =========================================================
                         TERCER COPY
   ========================================================= */

USE petsalud_db;

CREATE TABLE IF NOT EXISTS ordenes (
  id_orden       INT AUTO_INCREMENT PRIMARY KEY,
  id_mascota     INT NOT NULL,
  id_veterinario INT,
  tipo_examen    ENUM('SANGRE','ORINA','HECES','OTRO') NOT NULL,
  observaciones  VARCHAR(255),
  estado         ENUM('EMITIDA','MUESTRA_TOMADA','EN_PROCESO','RESULTADO_REGISTRADO','VALIDADA','ANULADA')
                NOT NULL DEFAULT 'EMITIDA',
  creado_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orden_mascota FOREIGN KEY (id_mascota) REFERENCES mascotas(id_mascota)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tomas_muestra (
  id_toma        INT AUTO_INCREMENT PRIMARY KEY,
  id_orden       INT NOT NULL,
  id_tecnico     INT,
  tipo_muestra   ENUM('SANGRE','ORINA','HECES','OTRA') NOT NULL,
  fecha_hora     DATETIME NOT NULL,
  notas          VARCHAR(255),
  creado_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_toma_orden FOREIGN KEY (id_orden) REFERENCES ordenes(id_orden)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resultados (
  id_resultado   INT AUTO_INCREMENT PRIMARY KEY,
  id_orden       INT NOT NULL,
  fecha_result   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  descripcion    TEXT,
  valores        JSON,
  conclusiones   TEXT,
  validado       TINYINT(1) NOT NULL DEFAULT 0,
  id_veterinario_validador INT,
  creado_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_res_orden FOREIGN KEY (id_orden) REFERENCES ordenes(id_orden)
    ON UPDATE CASCADE ON DELETE CASCADE
);

---

/* =========================================================
                         CUARTO COPY
   ========================================================= */

CREATE TABLE IF NOT EXISTS veterinarios (
  id_veterinario INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario     INT NOT NULL,
  especialidad   VARCHAR(120),
  telefono       VARCHAR(25),
  UNIQUE KEY uq_vet_id_usuario (id_usuario),
  CONSTRAINT fk_vet_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tecnicos (
  id_tecnico     INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario     INT NOT NULL,
  especialidad   VARCHAR(120),
  telefono       VARCHAR(25),
  UNIQUE KEY uq_tec_id_usuario (id_usuario),
  CONSTRAINT fk_tec_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO veterinarios (id_usuario)
SELECT u.id_usuario
FROM usuarios u
LEFT JOIN veterinarios v ON v.id_usuario = u.id_usuario
WHERE u.rol = 'VETERINARIO' AND v.id_veterinario IS NULL;

INSERT INTO tecnicos (id_usuario)
SELECT u.id_usuario
FROM usuarios u
LEFT JOIN tecnicos t ON t.id_usuario = u.id_usuario
WHERE u.rol = 'TECNICO' AND t.id_tecnico IS NULL;

---

/* =========================================================
                         QUINTO COPY
   ========================================================= */

CREATE TABLE IF NOT EXISTS citas_backup LIKE citas;
INSERT INTO citas_backup SELECT * FROM citas;

ALTER TABLE citas
  MODIFY COLUMN estado ENUM('PENDIENTE','PROGRAMADA','CONFIRMADA','ATENDIDA','CANCELADA')
  NOT NULL DEFAULT 'PENDIENTE';

ALTER TABLE citas
  CHANGE COLUMN notas nota_cancel VARCHAR(255);

ALTER TABLE citas DROP FOREIGN KEY fk_citas_mascota;
DROP INDEX idx_citas_fecha ON citas;

ALTER TABLE citas
  DROP COLUMN tipo_servicio,
  DROP COLUMN actualizado_en,
  ADD COLUMN id_dueno INT NULL AFTER id_cita,
  ADD COLUMN id_veterinario INT NULL AFTER id_mascota,
  ADD COLUMN motivo VARCHAR(255) NULL AFTER fecha_hora;

CREATE INDEX idx_cita_fecha  ON citas (fecha_hora);
CREATE INDEX idx_cita_estado ON citas (estado);

UPDATE citas c
JOIN mascotas m ON m.id_mascota = c.id_mascota
SET c.id_dueno = m.id_dueno
WHERE c.id_dueno IS NULL;

UPDATE citas SET estado = 'PROGRAMADA' WHERE estado = 'PENDIENTE';

ALTER TABLE citas
  MODIFY COLUMN estado ENUM('PROGRAMADA','CONFIRMADA','ATENDIDA','CANCELADA')
  NOT NULL DEFAULT 'PROGRAMADA';

ALTER TABLE citas
  ADD CONSTRAINT fk_cita_dueno
    FOREIGN KEY (id_dueno) REFERENCES duenos(id_dueno)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT fk_cita_mascota
    FOREIGN KEY (id_mascota) REFERENCES mascotas(id_mascota)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT fk_cita_veterinario
    FOREIGN KEY (id_veterinario) REFERENCES veterinarios(id_veterinario)
    ON UPDATE CASCADE ON DELETE RESTRICT;

---

/* =========================================================
                         SEXTO COPY
   ========================================================= */

CREATE TABLE IF NOT EXISTS facturas (
  id_factura     INT AUTO_INCREMENT PRIMARY KEY,
  id_dueno       INT NOT NULL,
  id_mascota     INT,
  id_cita        INT,
  id_orden       INT,
  fecha_emision  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  monto_total    DECIMAL(10,2) NOT NULL DEFAULT 0,
  estado         ENUM('PENDIENTE','PAGADA','ANULADA') NOT NULL DEFAULT 'PENDIENTE',
  metodo_pago    VARCHAR(40),
  observaciones  VARCHAR(255),

  CONSTRAINT fk_fact_dueno   FOREIGN KEY (id_dueno) REFERENCES duenos(id_dueno)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_fact_cita    FOREIGN KEY (id_cita)  REFERENCES citas(id_cita)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_fact_orden   FOREIGN KEY (id_orden) REFERENCES ordenes(id_orden)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS detalle_factura (
  id_detalle         INT AUTO_INCREMENT PRIMARY KEY,
  id_factura         INT NOT NULL,
  descripcion_servicio VARCHAR(200) NOT NULL,
  cantidad           INT NOT NULL DEFAULT 1,
  precio_unitario    DECIMAL(10,2) NOT NULL DEFAULT 0,
  subtotal           DECIMAL(10,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_det_fact FOREIGN KEY (id_factura) REFERENCES facturas(id_factura)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_fact_estado ON facturas(estado);
CREATE INDEX idx_fact_dueno  ON facturas(id_dueno);

---

/* =========================================================
                        SEPTIMO COPY
   ========================================================= */

ALTER TABLE citas
ADD COLUMN fecha_cancelada DATETIME NULL AFTER estado;
ADD COLUMN fecha_confirmada DATETIME NULL AFTER fecha_cancelada,
ADD COLUMN fecha_atendida DATETIME NULL AFTER fecha_confirmada;

---

/* =========================================================
                        OCTAVO COPY
   ========================================================= */

CREATE TABLE IF NOT EXISTS historial_clinico (
  id_historial INT PRIMARY KEY AUTO_INCREMENT,
  id_cita INT NOT NULL,
  id_mascota INT NOT NULL,
  id_veterinario INT NOT NULL,
  diagnostico TEXT NOT NULL,
  tratamiento TEXT,
  observaciones TEXT,
  receta_medica TEXT,
  examenes_solicitados TEXT,
  proxima_cita DATE,
  peso DECIMAL(5,2),
  temperatura DECIMAL(4,2),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_cita) REFERENCES citas(id_cita),
  FOREIGN KEY (id_mascota) REFERENCES mascotas(id_mascota),
  FOREIGN KEY (id_veterinario) REFERENCES veterinarios(id_veterinario)
);

---

/* =========================================================
                        NOVENO COPY
   ========================================================= */


ALTER TABLE historial_clinico
ADD UNIQUE KEY uk_historial_por_cita (id_cita);

---

## Instalación y ejecución del proyecto

1) cd petsalud-frontend (y luego) npm install
2) cd pet-salud-backend (y luego) npm install

---

## Comandos para ejecutar el backend y el frontend

1) Entrar a Terminal
2) cd pet-salud-backend (y luego) node src/server.js
3) Abrir otra Terminal
4) cd petsalud-frontend (y luego) npm run dev

---

## Correo y contraseña del "ADMIN"

**Correo**: admin@petsalud.com
**Contraseña**: Admin@123

---

## Listo Queda