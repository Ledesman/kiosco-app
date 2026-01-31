const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Get all expenses
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { start_date, end_date, category } = req.query;
        let query = 'SELECT e.*, u.full_name as user_name FROM expenses e JOIN users u ON e.user_id = u.id WHERE 1=1';
        const params = [];

        if (start_date) {
            query += ' AND e.expense_date >= ?';
            params.push(start_date);
        }
        if (end_date) {
            query += ' AND e.expense_date <= ?';
            params.push(end_date);
        }
        if (category) {
            query += ' AND e.category = ?';
            params.push(category);
        }

        query += ' ORDER BY e.expense_date DESC';

        const [expenses] = await db.query(query, params);
        res.json({ expenses });
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Create expense
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { description, amount, category, expense_date } = req.body;
        const user_id = req.user.id;

        if (!description || !amount || !category || !expense_date) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        const [result] = await db.query(
            'INSERT INTO expenses (description, amount, category, expense_date, user_id) VALUES (?, ?, ?, ?, ?)',
            [description, amount, category, expense_date, user_id]
        );

        res.status(201).json({
            message: 'Gasto registrado exitosamente',
            expense: {
                id: result.insertId,
                description,
                amount,
                category,
                expense_date,
                user_id
            }
        });
    } catch (error) {
        console.error('Create expense error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Delete expense (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM expenses WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Gasto no encontrado' });
        }

        res.json({ message: 'Gasto eliminado exitosamente' });
    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

module.exports = router;
