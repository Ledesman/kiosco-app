const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const JWT_SECRET = process.env.JWT_SECRET || 'kiosco_dev_secret_key_2026';

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
        }

        console.log('Login attempt for:', username);
        // Get user from database
        const [users] = await db.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        console.log('Users found:', users.length);

        if (users.length === 0) {
            console.log('User not found');
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        const user = users[0];
        console.log('User found, verifying password...');

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        console.log('Password valid:', validPassword);

        if (!validPassword) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        // Create JWT token
        console.log('Creating token with secret');
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                full_name: user.full_name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Register new user (admin only)
router.post('/register', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { username, password, role, full_name } = req.body;

        if (!username || !password || !role || !full_name) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        if (role !== 'admin' && role !== 'cajero') {
            return res.status(400).json({ error: 'Rol inválido' });
        }

        // Check if user already exists
        const [existingUsers] = await db.query(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const [result] = await db.query(
            'INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, role, full_name]
        );

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            user: {
                id: result.insertId,
                username,
                role,
                full_name
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, username, role, full_name, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ user: users[0] });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Get all users (admin only)
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, username, role, full_name, created_at FROM users ORDER BY created_at DESC'
        );

        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

module.exports = router;
