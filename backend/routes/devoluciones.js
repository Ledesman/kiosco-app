const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Buscar ventas por número de ticket o DNI para devolución
router.get('/buscar-venta', authenticateToken, async (req, res) => {
    let connection;
    try {
        const { query } = req.query;
        console.log('Búsqueda de venta con término:', query);

        if (!query) {
            return res.status(400).json({ error: 'Se requiere un término de búsqueda' });
        }

        // Obtener una conexión del pool
        connection = await db.getConnection();

        // Verificar si la tabla sales existe
        const [tables] = await connection.query("SHOW TABLES LIKE 'sales'");
        if (tables.length === 0) {
            return res.status(500).json({ error: 'La tabla sales no existe en la base de datos' });
        }

        // Buscar ventas por número de ticket
        const [ventas] = await connection.query(
            `SELECT s.id, s.ticket_number, s.sale_date as fecha_venta, 
                    s.total_amount as total, 
                    CONCAT('Efectivo: $', s.payment_method_efectivo, 
                           ', Débito: $', s.payment_method_debito,
                           ', Crédito: $', s.payment_method_credito,
                           ', Transferencia: $', s.payment_method_transferencia,
                           ', MercadoPago: $', s.payment_method_mercadopago) as payment_method,
                    u.full_name as cliente_nombre,
                    u.username as cliente_usuario
             FROM sales s
             LEFT JOIN users u ON s.user_id = u.id
             WHERE s.ticket_number LIKE ?
             ORDER BY s.sale_date DESC
             LIMIT 20`,
            [`%${query}%`]
        );

        console.log('Resultados encontrados:', ventas.length);
        res.json({ ventas });
    } catch (error) {
        console.error('Error al buscar ventas para devolución:', error);
        res.status(500).json({
            error: 'Error al buscar ventas',
            details: error.message,
            sql: error.sql,
            code: error.code
        });
    } finally {
        if (connection) await connection.release();
    }
});

// Obtener detalles de una venta específica para devolución
router.get('/venta/:id', authenticateToken, async (req, res) => {
    let connection;
    try {
        const ventaId = req.params.id;
        console.log('Obteniendo detalles de venta ID:', ventaId);

        connection = await db.getConnection();

        // Obtener información de la venta
        const [ventas] = await connection.query(
            `SELECT s.*, 
                    u.full_name as cliente_nombre,
                    u.username as cliente_usuario
             FROM sales s
             LEFT JOIN users u ON s.user_id = u.id
             WHERE s.id = ?`,
            [ventaId]
        );

        if (ventas.length === 0) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        // Obtener los productos de la venta
        const [productos] = await connection.query(
            `SELECT si.*, p.name as producto_nombre, p.barcode, p.price,
                    (si.quantity * si.unit_price) as subtotal
             FROM sale_items si
             JOIN products p ON si.product_id = p.id
             WHERE si.sale_id = ?`,
            [ventaId]
        );

        const venta = {
            ...ventas[0],
            productos
        };

        console.log('Venta encontrada con', productos.length, 'productos');
        res.json({ venta });
    } catch (error) {
        console.error('Error al obtener detalles de venta:', error);
        res.status(500).json({
            error: 'Error al obtener la venta',
            details: error.message,
            sql: error.sql,
            code: error.code
        });
    } finally {
        if (connection) await connection.release();
    }
});

// Procesar una devolución
router.post('/', authenticateToken, async (req, res) => {
    const connection = await db.getConnection();

    try {
        const { ventaId, productos, motivo } = req.body;
        const usuarioId = req.user.id;

        if (!ventaId || !productos || !productos.length) {
            return res.status(400).json({ error: 'Datos de devolución incompletos' });
        }

        await connection.beginTransaction();

        // 1. Obtener información de la venta
        const [ventas] = await connection.query(
            'SELECT * FROM sales WHERE id = ? FOR UPDATE',
            [ventaId]
        );

        if (ventas.length === 0) {
            await connection.rollBack();
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        // 2. Calcular el total de la devolución
        let totalDevolucion = 0;
        const productosDevolucion = [];

        // 3. Verificar productos y cantidades
        for (const item of productos) {
            // Buscar en sale_items (no venta_productos)
            const [productoVenta] = await connection.query(
                `SELECT si.*, p.name as producto_nombre, p.barcode
                 FROM sale_items si
                 JOIN products p ON si.product_id = p.id
                 WHERE si.id = ? AND si.sale_id = ?`,
                [item.ventaProductoId, ventaId]
            );

            if (productoVenta.length === 0) {
                await connection.rollback();
                return res.status(400).json({
                    error: `Producto no encontrado en la venta (Item ID: ${item.ventaProductoId})`
                });
            }

            const producto = productoVenta[0];

            // producto.quantity es la cantidad original comprada
            if (item.cantidad > producto.quantity) {
                await connection.rollback();
                return res.status(400).json({
                    error: `Cantidad a devolver (${item.cantidad}) excede la cantidad comprada (${producto.quantity}) para el producto ${producto.producto_nombre}`
                });
            }

            const subtotal = (producto.unit_price * item.cantidad).toFixed(2);
            totalDevolucion += parseFloat(subtotal);

            productosDevolucion.push({
                producto_id: producto.product_id,
                cantidad: item.cantidad,
                precio_unitario: producto.unit_price,
                subtotal: parseFloat(subtotal),
                producto_nombre: producto.producto_nombre,
                barcode: producto.barcode
            });
        }

        // 4. Insertar la devolución
        const [result] = await connection.query(
            `INSERT INTO devoluciones 
             (venta_id, usuario_id, motivo, total_devolucion, estado)
             VALUES (?, ?, ?, ?, 'completada')`,
            [ventaId, usuarioId, motivo, totalDevolucion]
        );

        const devolucionId = result.insertId;

        // 5. Insertar los productos de la devolución y actualizar el stock
        for (const item of productosDevolucion) {
            // Insertar en devolucion_productos
            await connection.query(
                `INSERT INTO devolucion_productos 
                 (devolucion_id, producto_id, cantidad, precio_unitario)
                 VALUES (?, ?, ?, ?)`,
                [devolucionId, item.producto_id, item.cantidad, item.precio_unitario]
            );

            // Actualizar el stock del producto
           await connection.query(
    'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
    [item.cantidad, item.producto_id]
);
        }

        // 6. Actualizar el estado de la venta si es necesario
        // (opcional: marcar la venta como parcialmente devuelta si no se devolvió todo)

        await connection.commit();

        // Obtener los detalles completos de la devolución
        const [devolucion] = await connection.query(
            `SELECT d.*, 
                    u.full_name as usuario_nombre,
                    v.ticket_number
             FROM devoluciones d
             LEFT JOIN users u ON d.usuario_id = u.id
             LEFT JOIN sales v ON d.venta_id = v.id
             WHERE d.id = ?`,
            [devolucionId]
        );

        res.status(201).json({
            message: 'Devolución registrada exitosamente',
            devolucion: {
                ...devolucion[0],
                productos: productosDevolucion
            }
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al procesar devolución:', error);
        res.status(500).json({ message: 'Error al procesar devolución' });
    } finally {
        if (connection) await connection.release();
    }
});

// Obtener historial de devoluciones
router.get('/historial', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, fechaInicio, fechaFin } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (fechaInicio) {
            whereClause += ' AND d.fecha >= ?';
            params.push(fechaInicio);
        }

        if (fechaFin) {
            whereClause += ' AND d.fecha <= ?';
            params.push(fechaFin + ' 23:59:59');
        }

        // Obtener el total de registros
        const [totalResult] = await db.query(
            `SELECT COUNT(*) as total 
             FROM devoluciones d
             ${whereClause}`,
            params
        );

        const total = totalResult[0].total;

        // Obtener las devoluciones con paginación
        const [devoluciones] = await db.query(
            `SELECT d.*, 
                    v.ticket_number,
                    u.full_name as usuario_nombre,
                    (SELECT COUNT(*) FROM devolucion_productos dp WHERE dp.devolucion_id = d.id) as total_productos,
                    (SELECT SUM(cantidad) FROM devolucion_productos dp WHERE dp.devolucion_id = d.id) as total_unidades
             FROM devoluciones d
             LEFT JOIN sales v ON d.venta_id = v.id
             LEFT JOIN users u ON d.usuario_id = u.id
             ${whereClause}
             ORDER BY d.fecha DESC
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        // Obtener los productos para cada devolución
        for (const devolucion of devoluciones) {
            const [productos] = await db.query(
                `SELECT dp.*, p.name as producto_nombre, p.barcode
                 FROM devolucion_productos dp
                 JOIN products p ON dp.producto_id = p.id
                 WHERE dp.devolucion_id = ?`,
                [devolucion.id]
            );
            devolucion.productos = productos;
        }

        res.json({
            devoluciones,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error al obtener historial de devoluciones:', error);
        res.status(500).json({ error: 'Error al obtener el historial de devoluciones' });
    }
});

module.exports = router;
