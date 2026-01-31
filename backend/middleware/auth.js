const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'kiosco_dev_secret_key_2026';

// Verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido o expirado.' });
        }
        req.user = user;
        next();
    });
};

// Check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
    }
    next();
};

// Check if user is cajero or admin
const isCajeroOrAdmin = (req, res, next) => {
    if (req.user.role !== 'cajero' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado.' });
    }
    next();
};

module.exports = {
    authenticateToken,
    isAdmin,
    isCajeroOrAdmin
};
