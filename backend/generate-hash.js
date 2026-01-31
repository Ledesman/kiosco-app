const bcrypt = require('bcryptjs');

async function generateHash() {
    const hash = await bcrypt.hash('admin123', 10);
    console.log('Hash generado para admin123:');
    console.log(hash);
}

generateHash();
