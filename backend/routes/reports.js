const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Daily sales report
router.get('/daily', authenticateToken, async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];

        // Total sales
        const [totalSales] = await db.query(
            `SELECT 
                COUNT(*) as total_transactions,
                SUM(total_amount) as total_revenue,
                SUM(payment_method_efectivo) as total_efectivo,
                SUM(payment_method_debito) as total_debito,
                SUM(payment_method_credito) as total_credito,
                SUM(payment_method_transferencia) as total_transferencia,
                SUM(payment_method_mercadopago) as total_mercadopago
             FROM sales
             WHERE DATE(sale_date) = ?`,
            [targetDate]
        );

        // Sales by hour
        const [salesByHour] = await db.query(
            `SELECT 
                HOUR(sale_date) as hour,
                COUNT(*) as transactions,
                SUM(total_amount) as revenue
             FROM sales
             WHERE DATE(sale_date) = ?
             GROUP BY HOUR(sale_date)
             ORDER BY hour`,
            [targetDate]
        );

        // Top products
        const [topProducts] = await db.query(
            `SELECT 
                p.name,
                SUM(si.quantity) as total_quantity,
                SUM(si.subtotal) as total_revenue
             FROM sale_items si
             JOIN sales s ON si.sale_id = s.id
             JOIN products p ON si.product_id = p.id
             WHERE DATE(s.sale_date) = ?
             GROUP BY si.product_id, p.name
             ORDER BY total_revenue DESC
             LIMIT 10`,
            [targetDate]
        );

        res.json({
            date: targetDate,
            summary: totalSales[0],
            sales_by_hour: salesByHour,
            top_products: topProducts
        });
    } catch (error) {
        console.error('Daily report error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Sales by category report
router.get('/by-category', authenticateToken, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let query = `
            SELECT 
                c.name as category_name,
                COUNT(DISTINCT s.id) as total_transactions,
                SUM(si.quantity) as total_items_sold,
                SUM(si.subtotal) as total_revenue
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN products p ON si.product_id = p.id
            JOIN categories c ON p.category_id = c.id
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

        query += ' GROUP BY c.id, c.name ORDER BY total_revenue DESC';

        const [results] = await db.query(query, params);

        res.json({
            start_date: start_date || 'all',
            end_date: end_date || 'all',
            categories: results
        });
    } catch (error) {
        console.error('Category report error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Sales by payment method report
router.get('/by-payment', authenticateToken, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let query = `
            SELECT 
                COUNT(*) as total_transactions,
                SUM(payment_method_efectivo) as efectivo,
                SUM(payment_method_debito) as debito,
                SUM(payment_method_credito) as credito,
                SUM(payment_method_transferencia) as transferencia,
                SUM(payment_method_mercadopago) as mercadopago,
                SUM(total_amount) as total
            FROM sales
            WHERE 1=1
        `;
        const params = [];

        if (start_date) {
            query += ' AND DATE(sale_date) >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND DATE(sale_date) <= ?';
            params.push(end_date);
        }

        const [results] = await db.query(query, params);

        // Transform to array format
        const payment_methods = [
            { method: 'Efectivo', amount: parseFloat(results[0].efectivo) || 0 },
            { method: 'Débito', amount: parseFloat(results[0].debito) || 0 },
            { method: 'Crédito', amount: parseFloat(results[0].credito) || 0 },
            { method: 'Transferencia', amount: parseFloat(results[0].transferencia) || 0 },
            { method: 'Mercado Pago', amount: parseFloat(results[0].mercadopago) || 0 }
        ];

        res.json({
            start_date: start_date || 'all',
            end_date: end_date || 'all',
            total_transactions: results[0].total_transactions,
            total_amount: parseFloat(results[0].total) || 0,
            payment_methods
        });
    } catch (error) {
        console.error('Payment method report error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Date range report
router.get('/date-range', authenticateToken, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'Fechas de inicio y fin requeridas' });
        }

        // Daily breakdown
        const [dailySales] = await db.query(
            `SELECT 
                DATE(sale_date) as date,
                COUNT(*) as transactions,
                SUM(total_amount) as revenue
             FROM sales
             WHERE DATE(sale_date) BETWEEN ? AND ?
             GROUP BY DATE(sale_date)
             ORDER BY date`,
            [start_date, end_date]
        );

        // Summary
        const [summary] = await db.query(
            `SELECT 
                COUNT(*) as total_transactions,
                SUM(total_amount) as total_revenue,
                AVG(total_amount) as average_sale
             FROM sales
             WHERE DATE(sale_date) BETWEEN ? AND ?`,
            [start_date, end_date]
        );

        res.json({
            start_date,
            end_date,
            summary: summary[0],
            daily_sales: dailySales
        });
    } catch (error) {
        console.error('Date range report error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Low stock alert
router.get('/low-stock', authenticateToken, async (req, res) => {
    try {
        const [products] = await db.query(
            `SELECT p.*, c.name as category_name
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.stock_quantity <= p.min_stock_alert
             ORDER BY p.stock_quantity ASC`
        );

        res.json({ low_stock_products: products });
    } catch (error) {
        console.error('Low stock report error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

module.exports = router;
