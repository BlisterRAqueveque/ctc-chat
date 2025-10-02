CREATE TABLE registros_registrar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    localidad INT,
    lat VARCHAR(255),
    lon VARCHAR(255),
    ubicacion VARCHAR(255),
    nombre VARCHAR(100),
    telefono VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);