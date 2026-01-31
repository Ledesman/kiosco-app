const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Get active promotions
router.get('/', authenticateToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const [promotions] = await db.query(
            `SELECT p.*, 
                    prod.name as product_name,
                    c.name as category_name
             FROM promotions p
             LEFT JOIN products prod ON p.product_id = prod.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.is_active = TRUE 
             AND p.start_date <= ? 
             AND p.end_date >= ?
             ORDER BY p.discount_percentage DESC`,
            [today, today]
        );

        res.json({ promotions });
    } catch (error) {
        console.error('Get promotions error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Get all promotions (admin only)
router.get('/all', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [promotions] = await db.query(
            `SELECT p.*, 
                    prod.name as product_name,
                    c.name as category_name
             FROM promotions p
             LEFT JOIN products prod ON p.product_id = prod.id
             LEFT JOIN categories c ON p.category_id = c.id
             ORDER BY p.created_at DESC`
        );

        res.json({ promotions });
    } catch (error) {
        console.error('Get all promotions error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Get single promotion
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const [promotions] = await db.query(
            `SELECT p.*, 
                    prod.name as product_name,
                    c.name as category_name
             FROM promotions p
             LEFT JOIN products prod ON p.product_id = prod.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.id = ?`,
            [req.params.id]
        );

        if (promotions.length === 0) {
            return res.status(404).json({ error: 'Promoción no encontrada' });
        }

        res.json({ promotion: promotions[0] });
    } catch (error) {
        console.error('Get promotion error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Create promotion (admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const {
            name,
            description,
            discount_percentage,
            product_id,
            category_id,
            start_date,
            end_date,
            is_active
        } = req.body;

        // Validation
        if (!name || !discount_percentage || !start_date || !end_date) {
            return res.status(400).json({ error: 'Campos requeridos faltantes' });
        }

        if (discount_percentage <= 0 || discount_percentage > 100) {
            return res.status(400).json({ error: 'El descuento debe estar entre 0 y 100' });
        }

        if (!product_id && !category_id) {
            return res.status(400).json({ error: 'Debe especificar un producto o categoría' });
        }

        const [result] = await db.query(
            `INSERT INTO promotions 
            (name, description, discount_percentage, product_id, category_id, 
             start_date, end_date, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                description || null,
                discount_percentage,
                product_id || null,
                category_id || null,
                start_date,
                end_date,
                is_active !== undefined ? is_active : true
            ]
        );

        res.status(201).json({
            message: 'Promoción creada exitosamente',
            promotion: {
                id: result.insertId,
                name,
                discount_percentage,
                start_date,
                end_date
            }
        });
    } catch (error) {
        console.error('Create promotion error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Update promotion (admin only)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const {
            name,
            description,
            discount_percentage,
            product_id,
            category_id,
            start_date,
            end_date,
            is_active
        } = req.body;

        // Validation
        if (!name || !discount_percentage || !start_date || !end_date) {
            return res.status(400).json({ error: 'Campos requeridos faltantes' });
        }

        const [result] = await db.query(
            `UPDATE promotions SET 
            name = ?, description = ?, discount_percentage = ?, 
            product_id = ?, category_id = ?, start_date = ?, 
            end_date = ?, is_active = ?
            WHERE id = ?`,
            [
                name,
                description || null,
                discount_percentage,
                product_id || null,
                category_id || null,
                start_date,
                end_date,
                is_active !== undefined ? is_active : true,
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Promoción no encontrada' });
        }

        res.json({ message: 'Promoción actualizada exitosamente' });
    } catch (error) {
        console.error('Update promotion error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Delete promotion (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM promotions WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Promoción no encontrada' });
        }

        res.json({ message: 'Promoción eliminada exitosamente' });
    } catch (error) {
        console.error('Delete promotion error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

module.exports = router;
