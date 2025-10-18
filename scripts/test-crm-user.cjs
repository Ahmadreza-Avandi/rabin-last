#!/usr/bin/env node

const mysql = require('mysql2/promise');

async function testCrmUser() {
  console.log('\n🔍 Testing crm_user credentials...\n');

  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'crm_user',
      password: '1234',
      port: 3306,
      database: 'crm_system'
    });

    console.log('✅ crm_user:1234 works!\n');
    
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    console.log(`   Users in database: ${users[0].count}`);
    
    await connection.end();

    console.log('\n🎯 Update tenant to use crm_user instead of root');
    
  } catch (error) {
    console.log('❌ crm_user:1234 does NOT work');
    console.log(`   Error: ${error.message}\n`);
    console.log('💡 Using root with empty password is fine for now');
  }
}

testCrmUser().catch(console.error);
