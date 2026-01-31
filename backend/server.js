const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const app = express();
const multer = require('multer');


const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Import routes
const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');
const promotionsRoutes = require('./routes/promotions');
const salesRoutes = require('./routes/sales');
const reportsRoutes = require('./routes/reports');
const expensesRoutes = require('./routes/expenses');
const suppliersRoutes = require('./routes/suppliers');
const devolucionesRoutes = require('./routes/devoluciones');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/devoluciones', devolucionesRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Kiosco API is running' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint no encontrado' });
});
// Servir archivos estáticos desde la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Start server
app.listen(PORT, () => {
    console.log('=================================');
    console.log('🚀 Kiosco API Server');
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log('=================================');
});

module.exports = app;
