#!/usr/bin/env node

const mysql = require('mysql2/promise');

async function clearCache() {
  console.log('\n🗑️  Clearing Tenant Cache...\n');
  console.log('='.repeat(80));

  let connection;

  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      port: 3306,
      database: 'saas_master'
    });

    console.log('✅ Connected to saas_master\n');

    // Get current encrypted password
    const [rows] = await connection.query(
      'SELECT tenant_key, db_user, db_password FROM tenants WHERE tenant_key = ?',
      ['rabin']
    );

    if (rows.length > 0) {
      const tenant = rows[0];
      console.log('Current tenant configuration:');
      console.log(`   Tenant: ${tenant.tenant_key}`);
      console.log(`   User: ${tenant.db_user}`);
      console.log(`   Encrypted password: ${tenant.db_password.substring(0, 40)}...\n`);
    }

    console.log('✅ Cache information displayed\n');
    console.log('🎯 To clear the cache:');
    console.log('   1. Stop your Next.js server (Ctrl+C)');
    console.log('   2. Delete .next folder: rmdir /s /q .next');
    console.log('   3. Start server again: npm run dev\n');
    console.log('Or simply restart the server - the fallback will handle it!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

clearCache().catch(console.error);
