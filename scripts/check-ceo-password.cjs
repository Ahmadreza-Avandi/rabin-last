const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function checkPassword() {
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
    
    // دریافت اطلاعات کاربر
    const [users] = await connection.query(
      'SELECT id, name, email, password, role, status FROM users WHERE id = ?',
      ['ceo-001']
    );
    
    if (users.length === 0) {
      console.log('❌ User not found!');
      return;
    }
    
    const user = users[0];
    console.log('👤 User Info:');
    console.log('ID:', user.id);
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Status:', user.status);
    console.log('Password Hash:', user.password);
    
    // تست چند پسورد متداول
    const testPasswords = ['ceo123', '123456', 'admin', 'password', ''];
    
    console.log('\n🔐 Testing common passwords:');
    for (const testPass of testPasswords) {
      try {
        const match = await bcrypt.compare(testPass, user.password);
        if (match) {
          console.log(`✅ Password found: "${testPass}"`);
          return;
        } else {
          console.log(`❌ Not: "${testPass}"`);
        }
      } catch (error) {
        console.log(`❌ Error testing "${testPass}":`, error.message);
      }
    }
    
    console.log('\n💡 Suggestion: Update password to "ceo123"');
    const newHash = await bcrypt.hash('ceo123', 10);
    console.log('New hash:', newHash);
    
    await connection.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [newHash, 'ceo-001']
    );
    
    console.log('✅ Password updated to "ceo123"');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkPassword();
