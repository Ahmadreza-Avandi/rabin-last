const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsers() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'crm_system'
    });
    
    console.log('✓ Connected to database');
    
    const [users] = await connection.execute(
      'SELECT id, name, email, role, status FROM users LIMIT 10'
    );
    
    console.log('\n📋 Available Users:');
    console.log('==================');
    users.forEach(user => {
      console.log(`\nID: ${user.id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Status: ${user.status}`);
    });
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUsers();
