#!/usr/bin/env node

const mysql = require('mysql2/promise');

async function addTenantKeyToTables() {
  console.log('\n🔧 Adding tenant_key to All Tables...\n');
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

    // Tables that need tenant_key
    const tables = [
      'customers',
      'contacts',
      'activities',
      'tasks',
      'deals',
      'products',
      'calendar_events',
      'tickets',
      'feedback',
      'documents'
    ];

    console.log('📋 Adding tenant_key column to tables:\n');

    for (const table of tables) {
      try {
        // Check if table exists
        const [tableExists] = await connection.query(
          `SHOW TABLES LIKE '${table}'`
        );

        if (tableExists.length === 0) {
          console.log(`   ⚠️  ${table} - Table does not exist, skipping`);
          continue;
        }

        // Check if tenant_key column exists
        const [columns] = await connection.query(
          `SHOW COLUMNS FROM ${table} LIKE 'tenant_key'`
        );

        if (columns.length > 0) {
          console.log(`   ✓ ${table} - tenant_key already exists`);
          
          // Update NULL values to 'rabin'
          await connection.query(
            `UPDATE ${table} SET tenant_key = 'rabin' WHERE tenant_key IS NULL`
          );
        } else {
          // Add tenant_key column
          await connection.query(
            `ALTER TABLE ${table} 
             ADD COLUMN tenant_key VARCHAR(50) DEFAULT 'rabin' AFTER id`
          );
          console.log(`   ✅ ${table} - tenant_key column added`);

          // Create index
          await connection.query(
            `ALTER TABLE ${table} 
             ADD INDEX idx_tenant_key (tenant_key)`
          );
          console.log(`   ✅ ${table} - index created`);
        }
      } catch (error) {
        console.log(`   ❌ ${table} - Error: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Tenant key columns added!\n');
    console.log('🎯 Next: Update APIs to filter by tenant_key\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addTenantKeyToTables().catch(console.error);
