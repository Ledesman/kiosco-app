const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetPassword() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'kiosco_db2'
    });

    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('New Hash:', hashedPassword);

    await connection.execute(
        'UPDATE users SET password = ? WHERE username = ?',
        [hashedPassword, 'admin']
    );

    console.log('Password updated successfully');
    await connection.end();
}

resetPassword().catch(console.error);
