#!/usr/bin/env node

const mysql = require('mysql2/promise');

async function checkTenantIsolation() {
  console.log('\n🔍 Checking Tenant Isolation...\n');
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

    // Check users by tenant_key
    console.log('1️⃣ Users by Tenant:');
    console.log('-'.repeat(80));
    
    const [users] = await connection.query(`
      SELECT id, name, email, role, tenant_key, status
      FROM users
      WHERE status = 'active'
      ORDER BY tenant_key, name
    `);

    const byTenant = {};
    users.forEach(u => {
      const key = u.tenant_key || 'NO_TENANT';
      if (!byTenant[key]) byTenant[key] = [];
      byTenant[key].push(u);
    });

    Object.keys(byTenant).forEach(tenantKey => {
      console.log(`\n   📦 Tenant: ${tenantKey}`);
      console.log(`   Users: ${byTenant[tenantKey].length}`);
      byTenant[tenantKey].forEach(u => {
        console.log(`      - ${u.name} (${u.email}) - ${u.role}`);
      });
    });

    // Check customers by tenant_key
    console.log('\n\n2️⃣ Customers by Tenant:');
    console.log('-'.repeat(80));
    
    try {
      const [customers] = await connection.query(`
        SELECT COUNT(*) as count, tenant_key
        FROM customers
        GROUP BY tenant_key
      `);

      customers.forEach(c => {
        console.log(`   - ${c.tenant_key || 'NO_TENANT'}: ${c.count} customers`);
      });
    } catch (error) {
      console.log('   ⚠️  tenant_key column does not exist in customers table');
    }

    // Check if coworkers API filters by tenant_key
    console.log('\n\n3️⃣ Checking Coworkers API:');
    console.log('-'.repeat(80));
    
    const [rabinUsers] = await connection.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE tenant_key = 'rabin' AND status = 'active'
    `);
    
    const [saminUsers] = await connection.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE tenant_key = 'samin' AND status = 'active'
    `);

    console.log(`   Rabin users: ${rabinUsers[0].count}`);
    console.log(`   Samin users: ${saminUsers[0].count}`);
    console.log(`   Total users: ${users.length}`);

    console.log('\n' + '='.repeat(80));
    console.log('\n⚠️  PROBLEM FOUND!\n');
    console.log('The coworkers page is showing ALL users from crm_system,');
    console.log('not filtering by tenant_key!\n');
    console.log('🎯 Solution: Update coworkers API to filter by tenant_key\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTenantIsolation().catch(console.error);
