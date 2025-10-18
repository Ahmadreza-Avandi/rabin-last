#!/usr/bin/env node

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkDatabases() {
  console.log('\n🔍 Checking MySQL Databases...\n');
  console.log('='.repeat(80));

  let connection;

  try {
    // Connect to MySQL
    console.log('\n1️⃣ Connecting to MySQL...');
    console.log(`   Host: ${process.env.MASTER_DB_HOST || 'localhost'}`);
    console.log(`   User: ${process.env.MASTER_DB_USER || 'root'}`);
    console.log(`   Password: ${process.env.MASTER_DB_PASSWORD ? '***' : '(empty)'}`);

    connection = await mysql.createConnection({
      host: process.env.MASTER_DB_HOST || 'localhost',
      user: process.env.MASTER_DB_USER || 'root',
      password: process.env.MASTER_DB_PASSWORD || '',
      port: parseInt(process.env.MASTER_DB_PORT || '3306')
    });

    console.log('✅ Connected successfully!\n');

    // List all databases
    console.log('2️⃣ Available Databases:');
    console.log('-'.repeat(80));
    const [databases] = await connection.query('SHOW DATABASES');
    databases.forEach(db => {
      const dbName = db.Database;
      const marker = (dbName === 'saas_master' || dbName === 'rabin_crm') ? '✅' : '  ';
      console.log(`${marker} ${dbName}`);
    });

    // Check saas_master
    console.log('\n3️⃣ Checking saas_master database:');
    console.log('-'.repeat(80));
    const hasMaster = databases.some(db => db.Database === 'saas_master');
    if (hasMaster) {
      console.log('✅ saas_master exists');
      
      await connection.query('USE saas_master');
      const [tables] = await connection.query('SHOW TABLES');
      console.log(`   Tables: ${tables.length}`);
      tables.forEach(t => {
        console.log(`   - ${Object.values(t)[0]}`);
      });

      // Check tenants
      const [tenants] = await connection.query('SELECT tenant_key, company_name, is_active FROM tenants');
      console.log(`\n   Tenants: ${tenants.length}`);
      tenants.forEach(t => {
        console.log(`   - ${t.tenant_key} (${t.company_name}) - Active: ${t.is_active ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('❌ saas_master does NOT exist');
    }

    // Check rabin_crm
    console.log('\n4️⃣ Checking rabin_crm database:');
    console.log('-'.repeat(80));
    const hasRabin = databases.some(db => db.Database === 'rabin_crm');
    if (hasRabin) {
      console.log('✅ rabin_crm exists');
      
      await connection.query('USE rabin_crm');
      const [tables] = await connection.query('SHOW TABLES');
      console.log(`   Tables: ${tables.length}`);
      
      // Check users
      const [users] = await connection.query('SELECT id, name, email, role FROM users LIMIT 5');
      console.log(`\n   Users: ${users.length}`);
      users.forEach(u => {
        console.log(`   - ${u.name} (${u.email}) - Role: ${u.role}`);
      });
    } else {
      console.log('❌ rabin_crm does NOT exist');
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Database check complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Solution: Update your .env file with correct credentials:');
      console.error('   MASTER_DB_PASSWORD=1234');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDatabases().catch(console.error);
