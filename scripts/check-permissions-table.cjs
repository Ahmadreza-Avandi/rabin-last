#!/usr/bin/env node

const mysql = require('mysql2/promise');

async function checkPermissionsTable() {
  console.log('\n🔍 Checking Permissions Table Structure...\n');
  console.log('='.repeat(80));

  let connection;

  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      port: 3306,
      database: 'crm_system'
    });

    console.log('✅ Connected to crm_system\n');

    // Check if user_permissions table exists
    console.log('1️⃣ Checking user_permissions table:');
    console.log('-'.repeat(80));
    
    try {
      const [columns] = await connection.query('SHOW COLUMNS FROM user_permissions');
      console.log('   ✅ user_permissions table exists\n');
      console.log('   Columns:');
      columns.forEach(col => {
        console.log(`   - ${col.Field} (${col.Type})`);
      });

      // Show sample data
      console.log('\n   Sample data:');
      const [rows] = await connection.query('SELECT * FROM user_permissions LIMIT 3');
      console.log(`   Found ${rows.length} rows`);
      if (rows.length > 0) {
        console.log('   First row:', JSON.stringify(rows[0], null, 2));
      }
    } catch (error) {
      console.log('   ❌ user_permissions table does NOT exist');
    }

    // Check modules table
    console.log('\n2️⃣ Checking modules table:');
    console.log('-'.repeat(80));
    
    try {
      const [columns] = await connection.query('SHOW COLUMNS FROM modules');
      console.log('   ✅ modules table exists\n');
      console.log('   Columns:');
      columns.forEach(col => {
        console.log(`   - ${col.Field} (${col.Type})`);
      });

      const [modules] = await connection.query('SELECT * FROM modules WHERE is_active = 1 LIMIT 5');
      console.log(`\n   Active modules: ${modules.length}`);
      modules.forEach(m => {
        console.log(`   - ${m.name} (${m.display_name})`);
      });
    } catch (error) {
      console.log('   ❌ modules table does NOT exist');
    }

    // Check user_module_permissions table
    console.log('\n3️⃣ Checking user_module_permissions table:');
    console.log('-'.repeat(80));
    
    try {
      const [columns] = await connection.query('SHOW COLUMNS FROM user_module_permissions');
      console.log('   ✅ user_module_permissions table exists\n');
      console.log('   Columns:');
      columns.forEach(col => {
        console.log(`   - ${col.Field} (${col.Type})`);
      });

      const [count] = await connection.query('SELECT COUNT(*) as count FROM user_module_permissions');
      console.log(`\n   Total permissions: ${count[0].count}`);
    } catch (error) {
      console.log('   ❌ user_module_permissions table does NOT exist');
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Check complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkPermissionsTable().catch(console.error);
