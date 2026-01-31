const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Get all suppliers
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [suppliers] = await db.query('SELECT * FROM suppliers ORDER BY name ASC');
        res.json({ suppliers });
    } catch (error) {
        console.error('Get suppliers error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Get single supplier
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const [suppliers] = await db.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
        if (suppliers.length === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }
        res.json({ supplier: suppliers[0] });
    } catch (error) {
        console.error('Get supplier error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Create supplier (admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, contact_name, phone, email, address } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }

        const [result] = await db.query(
            'INSERT INTO suppliers (name, contact_name, phone, email, address) VALUES (?, ?, ?, ?, ?)',
            [name, contact_name || null, phone || null, email || null, address || null]
        );

        res.status(201).json({
            message: 'Proveedor creado exitosamente',
            supplier: {
                id: result.insertId,
                name,
                contact_name,
                phone,
                email,
                address
            }
        });
    } catch (error) {
        console.error('Create supplier error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Update supplier (admin only)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, contact_name, phone, email, address } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }

        const [result] = await db.query(
            'UPDATE suppliers SET name = ?, contact_name = ?, phone = ?, email = ?, address = ? WHERE id = ?',
            [name, contact_name || null, phone || null, email || null, address || null, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        res.json({ message: 'Proveedor actualizado exitosamente' });
    } catch (error) {
        console.error('Update supplier error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Delete supplier (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Check if supplier has products
        const [products] = await db.query('SELECT COUNT(*) as count FROM products WHERE supplier_id = ?', [req.params.id]);
        if (products[0].count > 0) {
            return res.status(400).json({ error: 'No se puede eliminar el proveedor porque tiene productos asociados' });
        }

        const [result] = await db.query('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        res.json({ message: 'Proveedor eliminado exitosamente' });
    } catch (error) {
        console.error('Delete supplier error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

module.exports = router;
