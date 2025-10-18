#!/usr/bin/env node

const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('\n🔍 Testing MySQL Connections...\n');

  const configs = [
    { name: 'localhost with root:1234', host: 'localhost', user: 'root', password: '1234' },
    { name: 'localhost with root:(empty)', host: 'localhost', user: 'root', password: '' },
    { name: 'localhost with crm_user:1234', host: 'localhost', user: 'crm_user', password: '1234' },
    { name: 'mysql with root:1234', host: 'mysql', user: 'root', password: '1234' },
    { name: '127.0.0.1 with root:1234', host: '127.0.0.1', user: 'root', password: '1234' },
  ];

  for (const config of configs) {
    try {
      console.log(`Testing: ${config.name}...`);
      const connection = await mysql.createConnection({
        host: config.host,
        user: config.user,
        password: config.password,
        port: 3306,
        connectTimeout: 3000
      });
      
      const [result] = await connection.query('SELECT 1 as test');
      await connection.end();
      
      console.log(`✅ SUCCESS: ${config.name}\n`);
      console.log(`🎯 Use these credentials:`);
      console.log(`   MASTER_DB_HOST=${config.host}`);
      console.log(`   MASTER_DB_USER=${config.user}`);
      console.log(`   MASTER_DB_PASSWORD=${config.password}\n`);
      break;
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }
}

testConnection().catch(console.error);
