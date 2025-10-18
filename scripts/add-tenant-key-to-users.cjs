#!/usr/bin/env node

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function addTenantKeyColumn() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '3306'),
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD,
    });

    console.log('🔧 اضافه کردن ستون tenant_key به جدول users...\n');

    // بررسی وجود ستون
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'crm_system' 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'tenant_key'
    `);

    if (columns.length > 0) {
      console.log('✅ ستون tenant_key قبلا اضافه شده است');
    } else {
      await connection.query(`
        ALTER TABLE crm_system.users 
        ADD COLUMN tenant_key VARCHAR(100) DEFAULT 'rabin' COMMENT 'کلید tenant که کاربر به آن تعلق دارد'
      `);
      console.log('✅ ستون tenant_key اضافه شد');

      // اضافه کردن index
      await connection.query(`
        ALTER TABLE crm_system.users 
        ADD INDEX idx_tenant_key (tenant_key)
      `);
      console.log('✅ Index اضافه شد');
    }

    // به‌روزرسانی کاربران موجود
    console.log('\n📝 به‌روزرسانی کاربران موجود...');
    await connection.query(`
      UPDATE crm_system.users 
      SET tenant_key = 'rabin' 
      WHERE tenant_key IS NULL OR tenant_key = ''
    `);
    console.log('✅ کاربران موجود به tenant "rabin" اختصاص یافتند\n');

    console.log('✨ تغییرات با موفقیت اعمال شد!');

  } catch (error) {
    console.error('❌ خطا:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addTenantKeyColumn();
