const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const upload = require('../middleware/upload');

// Crear un nuevo producto con imagen
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { name, price, stock_quantity, category_id, barcode, min_stock_alert } = req.body;
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;
        // Validar campos requeridos
        if (!name || !price || !stock_quantity || !category_id) {
            return res.status(400).json({ message: 'Faltan campos requeridos' });
        }
        const [result] = await db.query(
            `INSERT INTO products 
            (name, price, stock_quantity, category_id, barcode, min_stock_alert, image_url) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, price, stock_quantity, category_id, barcode || null, min_stock_alert || 5, image_url]
        );
        const [newProduct] = await db.query(
            'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?',
            [result.insertId]
        );
        res.status(201).json(newProduct[0]);
    } catch (error) {
        console.error('Error al crear el producto:', error);
        res.status(500).json({ message: 'Error al crear el producto', error: error.message });
    }
});


// Obtener productos con filtros
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { category_id, search, low_stock } = req.query;

        let query = `
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE 1=1
        `;
        const params = [];

        if (category_id) {
            query += ' AND p.category_id = ?';
            params.push(category_id);
        }

        if (search) {
            query += ' AND (p.name LIKE ? OR p.barcode LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (low_stock === 'true') {
            query += ' AND p.stock_quantity <= p.min_stock_alert';
        }

        query += ' ORDER BY p.name';

        const [products] = await db.query(query, params);
        res.json(products);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ message: 'Error al obtener productos', error: error.message });
    }
});

// Get single product
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const [products] = await db.query(
            `SELECT p.*, c.name as category_name 
             FROM products p 
             LEFT JOIN categories c ON p.category_id = c.id 
             WHERE p.id = ?`,
            [req.params.id]
        );

        if (products.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({ product: products[0] });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Create product (admin only)
/* router.post('/', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const {
            name,
            category_id,
            price,
            sale_type,
            price_per_kg,
            stock_quantity,
            stock_unit,
            min_stock_alert,
            barcode,
            image_url
        } = req.body;

        // Validation
        if (!name || !category_id || !price || !sale_type || !stock_quantity || !stock_unit || !image_url) {
            return res.status(400).json({ error: 'Campos requeridos faltantes' });
        }

        if (!['unit', 'kg', 'both'].includes(sale_type)) {
            return res.status(400).json({ error: 'Tipo de venta inválido' });
        }

        if (sale_type === 'both' && !price_per_kg) {
            return res.status(400).json({ error: 'Se requiere precio por kg para venta mixta' });
        }

        const [result] = await db.query(
            `INSERT INTO products 
            (name, category_id, price, sale_type, price_per_kg, stock_quantity, 
             stock_unit, min_stock_alert, barcode, image_url) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                category_id,
                price,
                sale_type,
                price_per_kg || null,
                stock_quantity,
                stock_unit,
                min_stock_alert || 0,
                barcode || null,
                image_url || null
            ]
        );

        res.status(201).json({
            message: 'Producto creado exitosamente',
            product: {
                id: result.insertId,
                name,
                category_id,
                price,
                sale_type,
                price_per_kg,
                stock_quantity,
                stock_unit
            }
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});*/

// Update product (admin only)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const {
            name,
            category_id,
            price,
            sale_type,
            price_per_kg,
            stock_quantity,
            stock_unit,
            min_stock_alert,
            barcode,
            image_url
        } = req.body;

        // Validation
        if (!name || !category_id || !price || !sale_type || stock_quantity === undefined || !stock_unit) {
            return res.status(400).json({ error: 'Campos requeridos faltantes' });
        }

        const [result] = await db.query(
            `UPDATE products SET 
            name = ?, category_id = ?, price = ?, sale_type = ?, 
            price_per_kg = ?, stock_quantity = ?, stock_unit = ?, 
            min_stock_alert = ?, barcode = ?, image_url = ?
            WHERE id = ?`,
            [
                name,
                category_id,
                price,
                sale_type,
                price_per_kg || null,
                stock_quantity,
                stock_unit,
                min_stock_alert || 0,
                barcode || null,
                image_url || null,
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({ message: 'Producto actualizado exitosamente' });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});
// Actualizar un producto existente
// Update product with PATCH
router.patch('/:id', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        let updateData = { ...req.body };
        
        // Handle file upload
        if (req.file) {
            updateData.image_url = '/uploads/' + req.file.filename;
        }

        // Remove fields that shouldn't be updated directly
        delete updateData.id;
        delete updateData.created_at;
        delete updateData.updated_at;

        // Convert numeric fields
        const numericFields = ['price', 'stock_quantity', 'category_id', 'price_per_kg', 'min_stock_alert'];
        numericFields.forEach(field => {
            if (updateData[field] !== undefined) {
                updateData[field] = parseFloat(updateData[field]);
            }
        });

        // Build the SQL query
        const setClause = Object.keys(updateData)
            .map(key => `${key} = ?`)
            .join(', ');
        
        const values = [...Object.values(updateData), id];

        const [result] = await db.query(
            `UPDATE products SET ${setClause} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        // Get the updated product
        const [updatedProduct] = await db.query(
            'SELECT * FROM products WHERE id = ?',
            [id]
        );

        res.json(updatedProduct[0]);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Error al actualizar el producto' });
    }
});


// Update stock (admin and cajero)
router.put('/:id/stock', authenticateToken, async (req, res) => {
    try {
        const { stock_quantity } = req.body;

        if (stock_quantity === undefined) {
            return res.status(400).json({ error: 'Cantidad de stock requerida' });
        }

        const [result] = await db.query(
            'UPDATE products SET stock_quantity = ? WHERE id = ?',
            [stock_quantity, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({ message: 'Stock actualizado exitosamente' });
    } catch (error) {
        console.error('Update stock error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Delete product (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM products WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Bulk import products (admin only)
router.post('/bulk-import', authenticateToken, isAdmin, async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { products } = req.body;

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'Lista de productos inválida' });
        }

        await connection.beginTransaction();

        const results = [];
        for (const p of products) {
            const [result] = await connection.query(
                `INSERT INTO products 
                (name, category_id, price, sale_type, stock_quantity, stock_unit, min_stock_alert, barcode) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                price = VALUES(price), 
                stock_quantity = stock_quantity + VALUES(stock_quantity)`,
                [
                    p.name,
                    p.category_id,
                    p.price || 0,
                    p.sale_type || 'unit',
                    p.stock_quantity || 0,
                    p.stock_unit || 'Unidad',
                    p.min_stock_alert || 0,
                    p.image_url || null,
                    p.barcode || null
                ]
            );
            results.push(result);
        }

        await connection.commit();
        res.json({ message: `${products.length} productos procesados correctamente` });
    } catch (error) {
        await connection.rollback();
        console.error('Bulk import error:', error);
        res.status(500).json({ error: 'Error en el servidor durante la importación' });
    } finally {
        connection.release();
    }
});

module.exports = router;
