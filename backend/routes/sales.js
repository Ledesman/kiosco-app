const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Generate unique ticket number
function generateTicketNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${year}${month}${day}-${random}`;
}

// Create sale
router.post('/', authenticateToken, async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const {
            items, // Array of { product_id, quantity, unit_type, promotion_id }
            payment_methods, // { efectivo, debito, credito, transferencia, mercadopago, mp_transferencia }
            payment_note = null
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'No hay productos en la venta' });
        }

        if (!payment_methods) {
            return res.status(400).json({ error: 'Métodos de pago requeridos' });
        }

        let total_amount = 0;
        const sale_items = [];

        // Process each item
        for (const item of items) {
            // Get product details
            const [products] = await connection.query(
                'SELECT * FROM products WHERE id = ?',
                [item.product_id]
            );

            if (products.length === 0) {
                throw new Error(`Producto ${item.product_id} no encontrado`);
            }

            const product = products[0];

            // Check stock
            if (product.stock_quantity < item.quantity) {
                throw new Error(`Stock insuficiente para ${product.name}`);
            }

            // Calculate price
            let unit_price;
            if (item.unit_type === 'kg') {
                unit_price = product.price_per_kg || product.price;
            } else {
                unit_price = product.price;
            }

            let subtotal = unit_price * item.quantity;
            let discount_applied = 0;

            // Apply promotion if exists
            if (item.promotion_id) {
                const [promotions] = await connection.query(
                    'SELECT * FROM promotions WHERE id = ? AND is_active = TRUE',
                    [item.promotion_id]
                );

                if (promotions.length > 0) {
                    const promotion = promotions[0];
                    discount_applied = subtotal * (promotion.discount_percentage / 100);
                    subtotal -= discount_applied;
                }
            }

            total_amount += subtotal;

            sale_items.push({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_type: item.unit_type,
                unit_price,
                subtotal,
                promotion_id: item.promotion_id || null,
                discount_applied
            });

            // Update stock
            await connection.query(
                'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        // Validate payment total
        const payment_total =
            (parseFloat(payment_methods.efectivo) || 0) +
            (parseFloat(payment_methods.debito) || 0) +
            (parseFloat(payment_methods.credito) || 0) +
            (parseFloat(payment_methods.transferencia) || 0) +
            (parseFloat(payment_methods.mercadopago) || 0) +
            (parseFloat(payment_methods.mp_transferencia) || 0);

        if (Math.abs(payment_total - total_amount) > 0.01) {
            throw new Error('El total de pagos no coincide con el total de la venta');
        }

        // Generate ticket number
        const ticket_number = generateTicketNumber();

        // Insert sale
        const [saleResult] = await connection.query(
            `INSERT INTO sales 
            (user_id, total_amount, payment_method_efectivo, payment_method_debito, 
             payment_method_credito, payment_method_transferencia, payment_method_mercadopago, 
             ticket_number, payment_note) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                total_amount,
                payment_methods.efectivo || 0,
                payment_methods.debito || 0,
                payment_methods.credito || 0,
                payment_methods.transferencia || 0,
                (parseFloat(payment_methods.mercadopago) || 0) + (parseFloat(payment_methods.mp_transferencia) || 0),
                ticket_number,
                payment_note
            ]
        );

        const sale_id = saleResult.insertId;

        // Insert sale items
        for (const item of sale_items) {
            await connection.query(
                `INSERT INTO sale_items 
                (sale_id, product_id, quantity, unit_type, unit_price, subtotal, 
                 promotion_id, discount_applied) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    sale_id,
                    item.product_id,
                    item.quantity,
                    item.unit_type,
                    item.unit_price,
                    item.subtotal,
                    item.promotion_id,
                    item.discount_applied
                ]
            );
        }

        await connection.commit();

        res.status(201).json({
            message: 'Venta realizada exitosamente',
            sale: {
                id: sale_id,
                ticket_number,
                total_amount,
                items: sale_items
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Create sale error:', error);
        res.status(500).json({ error: error.message || 'Error en el servidor' });
    } finally {
        connection.release();
    }
});

// Get sales with filters
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { start_date, end_date, user_id } = req.query;

        let query = `
            SELECT s.*, u.full_name as cashier_name
            FROM sales s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (start_date) {
            query += ' AND DATE(s.sale_date) >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND DATE(s.sale_date) <= ?';
            params.push(end_date);
        }

        if (user_id) {
            query += ' AND s.user_id = ?';
            params.push(user_id);
        }

        const limitVal = parseInt(req.query.limit) || 100;
        query += ` ORDER BY s.sale_date DESC LIMIT ${limitVal}`;

        const [sales] = await db.query(query, params);

        res.json({ sales });
    } catch (error) {
        console.error('Get sales error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Get sale details
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        // Get sale
        const [sales] = await db.query(
            `SELECT s.*, u.full_name as cashier_name
             FROM sales s
             LEFT JOIN users u ON s.user_id = u.id
             WHERE s.id = ?`,
            [req.params.id]
        );

        if (sales.length === 0) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        // Get sale items
        const [items] = await db.query(
            `SELECT si.*, p.name as product_name, pr.name as promotion_name
             FROM sale_items si
             LEFT JOIN products p ON si.product_id = p.id
             LEFT JOIN promotions pr ON si.promotion_id = pr.id
             WHERE si.sale_id = ?`,
            [req.params.id]
        );

        res.json({
            sale: sales[0],
            items
        });
    } catch (error) {
        console.error('Get sale details error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Get sale by ticket number
router.get('/ticket/:ticketNumber', authenticateToken, async (req, res) => {
    try {
        const [sales] = await db.query(
            `SELECT s.*, u.full_name as cashier_name
             FROM sales s
             LEFT JOIN users u ON s.user_id = u.id
             WHERE s.ticket_number = ?`,
            [req.params.ticketNumber]
        );

        if (sales.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        const [items] = await db.query(
            `SELECT si.*, p.name as product_name, pr.name as promotion_name
             FROM sale_items si
             LEFT JOIN products p ON si.product_id = p.id
             LEFT JOIN promotions pr ON si.promotion_id = pr.id
             WHERE si.sale_id = ?`,
            [sales[0].id]
        );

        res.json({
            sale: sales[0],
            items
        });
    } catch (error) {
        console.error('Get sale by ticket error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Update sale payment methods
router.patch('/:id/payment', authenticateToken, async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const saleId = req.params.id;
        const { payment_methods, payment_note } = req.body;

        // 1) Get current sale
        const [sales] = await connection.query(
            'SELECT * FROM sales WHERE id = ?',
            [saleId]
        );

        if (sales.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        const sale = sales[0];

        // 2) Validate payment total matches sale total
        const payment_total =
            (parseFloat(payment_methods.efectivo) || 0) +
            (parseFloat(payment_methods.debito) || 0) +
            (parseFloat(payment_methods.credito) || 0) +
            (parseFloat(payment_methods.transferencia) || 0) +
            (parseFloat(payment_methods.mercadopago) || 0) +
            (parseFloat(payment_methods.mp_transferencia) || 0);

        if (Math.abs(payment_total - sale.total_amount) > 0.01) {
            await connection.rollback();
            throw new Error('El total de pagos no coincide con el total de la venta');
        }

        // 3) Update sale with new payment methods and note
        await connection.query(
            `UPDATE sales SET
             payment_method_efectivo = ?,
             payment_method_debito = ?,
             payment_method_credito = ?,
             payment_method_transferencia = ?,
             payment_method_mercadopago = ?,
             payment_note = ?
             WHERE id = ?`,
            [
                parseFloat(payment_methods.efectivo) || 0,
                parseFloat(payment_methods.debito) || 0,
                parseFloat(payment_methods.credito) || 0,
                parseFloat(payment_methods.transferencia) || 0,
                parseFloat(payment_methods.mercadopago) || 0,
                payment_note || null,
                saleId
            ]
        );

        await connection.commit();

        // 4) Fetch and return updated sale
        const [updatedSales] = await connection.query(
            'SELECT * FROM sales WHERE id = ?',
            [saleId]
        );

        const updatedSale = updatedSales[0];
        const responsePaymentMethods = {
            efectivo: parseFloat(updatedSale.payment_method_efectivo) || 0,
            debito: parseFloat(updatedSale.payment_method_debito) || 0,
            credito: parseFloat(updatedSale.payment_method_credito) || 0,
            transferencia: parseFloat(updatedSale.payment_method_transferencia) || 0,
            mercadopago: parseFloat(updatedSale.payment_method_mercadopago) || 0,
            mp_transferencia: 0
        };

        res.json({
            sale: {
                ...updatedSale,
                payment_methods: responsePaymentMethods
            },
            message: 'Método de pago actualizado correctamente'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Update sale payment error:', error);
        res.status(500).json({ error: error.message || 'Error en el servidor' });
    } finally {
        connection.release();
    }
});

module.exports = router;
