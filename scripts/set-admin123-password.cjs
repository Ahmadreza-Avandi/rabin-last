const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function setPassword() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'crm_system'
    });
    
    console.log('✅ Connected to crm_system\n');
    
    // Hash کردن پسورد admin123
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('🔐 Setting password to "admin123"...');
    console.log('Hash:', hashedPassword);
    
    // آپدیت پسورد
    await connection.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, 'ceo-001']
    );
    
    console.log('✅ Password updated successfully!');
    
    // تست پسورد
    console.log('\n🧪 Testing password...');
    const [users] = await connection.query(
      'SELECT password FROM users WHERE id = ?',
      ['ceo-001']
    );
    
    const match = await bcrypt.compare(password, users[0].password);
    if (match) {
      console.log('✅ Password verification successful!');
      console.log('\n📝 Login credentials:');
      console.log('Email: Robintejarat@gmail.com');
      console.log('Password: admin123');
    } else {
      console.log('❌ Password verification failed!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setPassword();
