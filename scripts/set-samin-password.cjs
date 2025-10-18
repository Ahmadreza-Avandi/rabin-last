const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setSaminPassword() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'crm_system'
    });
    
    console.log('✓ Connected to database\n');
    
    const email = 'admin@samin.com';
    const password = 'admin123';
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update password
    await connection.execute(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, email]
    );
    
    console.log(`✅ Password updated for ${email}`);
    console.log(`   New password: ${password}`);
    
    // Test login
    const [users] = await connection.execute(
      'SELECT id, name, email, password FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length > 0) {
      const user = users[0];
      const isValid = await bcrypt.compare(password, user.password);
      
      if (isValid) {
        console.log(`\n✅ Password test successful for ${user.name}`);
      } else {
        console.log(`\n❌ Password test failed`);
      }
    }
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setSaminPassword();
