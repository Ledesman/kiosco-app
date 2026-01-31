-- Seleccionar la base de datos
USE kiosco_db2;

-- Crear tabla de devoluciones
CREATE TABLE IF NOT EXISTS devoluciones (
    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    venta_id INT(11) NOT NULL,
    motivo VARCHAR(500) COLLATE utf8mb4_unicode_ci NOT NULL,
    total_devolucion DECIMAL(10,2) NOT NULL DEFAULT '0.00',
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT(11) NOT NULL,
    estado ENUM('pendiente', 'procesada', 'cancelada') COLLATE utf8mb4_unicode_ci DEFAULT 'procesada',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (venta_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE RESTRICT,
    
    INDEX (venta_id),
    INDEX (fecha),
    INDEX (usuario_id),
    INDEX (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de detalles de devolución
CREATE TABLE IF NOT EXISTS devolucion_productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    devolucion_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad DECIMAL(10,3) NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    
    FOREIGN KEY (devolucion_id) REFERENCES devoluciones(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES products(id) ON DELETE RESTRICT,
    
    INDEX idx_devolucion (devolucion_id),
    INDEX idx_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear vista para facilitar consultas
CREATE OR REPLACE VIEW vista_devoluciones AS
SELECT 
    d.id,
    d.venta_id,
    v.ticket_number,
    d.motivo,
    d.total_devolucion,
    d.fecha,
    d.estado,
    u.full_name as usuario_nombre,
    d.created_at,
    d.updated_at,
    COUNT(dp.id) as total_productos,
    COALESCE(SUM(dp.cantidad), 0) as total_unidades
FROM devoluciones d
LEFT JOIN sales v ON d.venta_id = v.id
LEFT JOIN users u ON d.usuario_id = u.id
LEFT JOIN devolucion_productos dp ON d.id = dp.devolucion_id
GROUP BY d.id, d.venta_id, v.ticket_number, d.motivo, d.total_devolucion, 
         d.fecha, d.estado, u.full_name, d.created_at, d.updated_at;