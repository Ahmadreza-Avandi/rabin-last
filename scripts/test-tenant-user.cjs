#!/usr/bin/env node

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function testTenantUser() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '3306'),
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD,
    });

    const tenantKey = process.argv[2] || 'testcompany';

    console.log(`🔍 بررسی tenant: ${tenantKey}\n`);

    // بررسی tenant در master
    const [tenants] = await connection.query(
      'SELECT * FROM saas_master.tenants WHERE tenant_key = ?',
      [tenantKey]
    );

    if (tenants.length === 0) {
      console.log('❌ Tenant یافت نشد!');
      return;
    }

    const tenant = tenants[0];
    console.log('✅ Tenant یافت شد:');
    console.log(`   Company: ${tenant.company_name}`);
    console.log(`   Status: ${tenant.subscription_status}`);
    console.log(`   Plan: ${tenant.subscription_plan}`);
    console.log(`   Expires: ${new Date(tenant.subscription_end).toLocaleDateString('fa-IR')}\n`);

    // بررسی کاربران
    const [users] = await connection.query(
      'SELECT id, name, email, role, status, tenant_key FROM crm_system.users WHERE tenant_key = ?',
      [tenantKey]
    );

    console.log(`👥 کاربران (${users.length}):`);
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email})`);
      console.log(`     Role: ${user.role}, Status: ${user.status}`);
    });

  } catch (error) {
    console.error('❌ خطا:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testTenantUser();
