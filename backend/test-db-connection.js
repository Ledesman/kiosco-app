const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
    console.log('🔍 Probando conexión a la base de datos...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Usuario: ${process.env.DB_USER}`);
    console.log(`Base de datos: ${process.env.DB_NAME}`);

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ ¡Conexión exitosa! La base de datos está respondiendo correctamente.');
        await connection.end();
    } catch (error) {
        console.error('❌ Error al conectar:', error.message);
        console.error('Nota: Si estás usando un hosting gratuito (como Byet/Ezyro), es posible que bloqueen conexiones externas y solo permitan acceso desde su propio servidor web.');
    }
}

testConnection();