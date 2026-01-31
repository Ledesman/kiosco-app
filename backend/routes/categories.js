const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Get all categories
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [categories] = await db.query(
            'SELECT * FROM categories ORDER BY name ASC'
        );

        res.json({ categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Get single category
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const [categories] = await db.query(
            'SELECT * FROM categories WHERE id = ?',
            [req.params.id]
        );

        if (categories.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        res.json({ category: categories[0] });
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Create category (admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }

        const [result] = await db.query(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            [name, description || null]
        );

        res.status(201).json({
            message: 'Categoría creada exitosamente',
            category: {
                id: result.insertId,
                name,
                description
            }
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Update category (admin only)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }

        const [result] = await db.query(
            'UPDATE categories SET name = ?, description = ? WHERE id = ?',
            [name, description || null, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        res.json({
            message: 'Categoría actualizada exitosamente',
            category: {
                id: parseInt(req.params.id),
                name,
                description
            }
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Delete category (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Check if category has products
        const [products] = await db.query(
            'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
            [req.params.id]
        );

        if (products[0].count > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar la categoría porque tiene productos asociados'
            });
        }

        const [result] = await db.query(
            'DELETE FROM categories WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        res.json({ message: 'Categoría eliminada exitosamente' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

module.exports = router;
