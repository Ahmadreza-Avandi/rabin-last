#!/usr/bin/env node

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function addUserToTenant() {
  let connection;
  
  try {
    const [tenant_key, name, email, password] = process.argv.slice(2);

    if (!tenant_key || !name || !email || !password) {
      console.log('استفاده:');
      console.log('  node add-user-to-tenant.cjs <tenant_key> <name> <email> <password>');
      console.log('\nمثال:');
      console.log('  node add-user-to-tenant.cjs samin "مدیر سامین" "admin@samin.com" "Samin1234"');
      process.exit(1);
    }

    connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '3306'),
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD,
    });

    console.log(`👤 اضافه کردن کاربر به tenant: ${tenant_key}\n`);

    // بررسی وجود tenant
    const [tenants] = await connection.query(
      'SELECT * FROM saas_master.tenants WHERE tenant_key = ?',
      [tenant_key]
    );

    if (tenants.length === 0) {
      console.log('❌ Tenant یافت نشد!');
      process.exit(1);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = require('crypto').randomUUID();

    // ایجاد کاربر
    await connection.query(
      `INSERT INTO crm_system.users (
        id, name, email, password, role, status, tenant_key, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [userId, name, email, passwordHash, 'ceo', 'active', tenant_key]
    );

    console.log('✅ کاربر با موفقیت اضافه شد!');
    console.log(`   Name: ${name}`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   URL: http://localhost:3000/${tenant_key}/login\n`);

  } catch (error) {
    console.error('❌ خطا:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addUserToTenant();
