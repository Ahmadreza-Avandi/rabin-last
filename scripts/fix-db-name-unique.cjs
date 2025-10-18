#!/usr/bin/env node

/**
 * حذف UNIQUE constraint از db_name چون همه tenants از یک دیتابیس استفاده می‌کنن
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function fixDbNameUnique() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '3306'),
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD,
    });

    console.log('🔧 حذف UNIQUE constraint از db_name...\n');

    // بررسی وجود constraint
    const [indexes] = await connection.query(`
      SHOW INDEX FROM saas_master.tenants WHERE Key_name = 'db_name'
    `);

    if (indexes.length > 0) {
      await connection.query(`
        ALTER TABLE saas_master.tenants DROP INDEX db_name
      `);
      console.log('✅ UNIQUE constraint حذف شد');
    } else {
      console.log('ℹ️  UNIQUE constraint وجود ندارد');
    }

    // اضافه کردن index معمولی (غیر unique)
    const [normalIndexes] = await connection.query(`
      SHOW INDEX FROM saas_master.tenants WHERE Key_name = 'idx_db_name'
    `);

    if (normalIndexes.length === 0) {
      await connection.query(`
        ALTER TABLE saas_master.tenants ADD INDEX idx_db_name (db_name)
      `);
      console.log('✅ Index معمولی اضافه شد');
    }

    console.log('\n✨ تغییرات با موفقیت اعمال شد!');

  } catch (error) {
    console.error('❌ خطا:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixDbNameUnique();
