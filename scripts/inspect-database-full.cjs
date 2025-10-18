#!/usr/bin/env node

const mysql = require('mysql2/promise');

async function inspectDatabase() {
  console.log('\n🔍 بررسی کامل دیتابیس crm_system\n');
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

    // Get all tables
    console.log('📋 لیست جداول:');
    console.log('-'.repeat(80));
    const [tables] = await connection.query('SHOW TABLES');
    
    console.log(`\nتعداد کل جداول: ${tables.length}\n`);

    for (const tableRow of tables) {
      const tableName = Object.values(tableRow)[0];
      
      // Get table structure
      const [columns] = await connection.query(`SHOW COLUMNS FROM ${tableName}`);
      
      // Get row count
      const [countResult] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const rowCount = countResult[0].count;
      
      // Check if has tenant_key
      const hasTenantKey = columns.some(col => col.Field === 'tenant_key');
      const tenantIcon = hasTenantKey ? '✅' : '❌';
      
      console.log(`${tenantIcon} ${tableName} (${rowCount} rows)`);
      
      // Show columns
      const columnNames = columns.map(col => {
        const key = col.Key === 'PRI' ? '🔑' : col.Key === 'MUL' ? '🔗' : '  ';
        return `${key} ${col.Field} (${col.Type})`;
      });
      
      console.log(`   Columns: ${columns.length}`);
      columnNames.slice(0, 5).forEach(col => console.log(`      ${col}`));
      if (columns.length > 5) {
        console.log(`      ... و ${columns.length - 5} ستون دیگر`);
      }
      
      // If has tenant_key, show distribution
      if (hasTenantKey && rowCount > 0) {
        try {
          const [distribution] = await connection.query(
            `SELECT tenant_key, COUNT(*) as count FROM ${tableName} GROUP BY tenant_key`
          );
          
          if (distribution.length > 0) {
            console.log(`   توزیع tenant_key:`);
            distribution.forEach(d => {
              console.log(`      - ${d.tenant_key || 'NULL'}: ${d.count} رکورد`);
            });
          }
        } catch (err) {
          // Ignore errors
        }
      }
      
      console.log('');
    }

    // Summary of tables without tenant_key
    console.log('='.repeat(80));
    console.log('\n📊 خلاصه:\n');
    
    const tablesWithoutTenantKey = [];
    const tablesWithTenantKey = [];
    
    for (const tableRow of tables) {
      const tableName = Object.values(tableRow)[0];
      const [columns] = await connection.query(`SHOW COLUMNS FROM ${tableName}`);
      const hasTenantKey = columns.some(col => col.Field === 'tenant_key');
      
      if (hasTenantKey) {
        tablesWithTenantKey.push(tableName);
      } else {
        tablesWithoutTenantKey.push(tableName);
      }
    }
    
    console.log(`✅ جداول با tenant_key: ${tablesWithTenantKey.length}`);
    tablesWithTenantKey.forEach(t => console.log(`   - ${t}`));
    
    console.log(`\n❌ جداول بدون tenant_key: ${tablesWithoutTenantKey.length}`);
    tablesWithoutTenantKey.forEach(t => console.log(`   - ${t}`));
    
    // Check users by tenant
    console.log('\n' + '='.repeat(80));
    console.log('\n👥 کاربران بر اساس tenant:\n');
    
    const [users] = await connection.query(`
      SELECT tenant_key, COUNT(*) as count, GROUP_CONCAT(name SEPARATOR ', ') as names
      FROM users
      GROUP BY tenant_key
    `);
    
    users.forEach(u => {
      console.log(`📦 ${u.tenant_key}:`);
      console.log(`   تعداد: ${u.count}`);
      console.log(`   نام‌ها: ${u.names}`);
      console.log('');
    });

    // Check customers by tenant
    console.log('='.repeat(80));
    console.log('\n🏢 مشتریان بر اساس tenant:\n');
    
    try {
      const [customers] = await connection.query(`
        SELECT tenant_key, COUNT(*) as count
        FROM customers
        GROUP BY tenant_key
      `);
      
      if (customers.length > 0) {
        customers.forEach(c => {
          console.log(`   ${c.tenant_key || 'NULL'}: ${c.count} مشتری`);
        });
      } else {
        console.log('   هیچ مشتری‌ای وجود ندارد');
      }
    } catch (err) {
      console.log('   ⚠️  جدول customers وجود ندارد یا tenant_key ندارد');
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ بررسی کامل!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

inspectDatabase().catch(console.error);
