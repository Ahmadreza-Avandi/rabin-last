const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function fixCustomerIssues() {
  let connection;

  try {
    console.log('🔧 شروع رفع مشکلات مشتریان...\n');

    // اتصال به دیتابیس
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'crm_system',
      charset: 'utf8mb4'
    });

    console.log('✅ اتصال به دیتابیس برقرار شد\n');

    // بررسی ستون‌های جدول customers
    console.log('📋 بررسی ساختار جدول customers...');
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'customers'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DATABASE_NAME || 'crm_system']);

    console.log('ستون‌های موجود:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });

    // بررسی وجود ستون status
    const hasStatus = columns.some(col => col.COLUMN_NAME === 'status');
    
    if (!hasStatus) {
      console.log('\n⚠️  ستون status وجود ندارد. در حال افزودن...');
      await connection.query(`
        ALTER TABLE customers 
        ADD COLUMN status VARCHAR(50) DEFAULT 'active' AFTER segment
      `);
      console.log('✅ ستون status اضافه شد');
    } else {
      console.log('\n✅ ستون status موجود است');
    }

    // به‌روزرسانی مقادیر NULL
    console.log('\n🔄 به‌روزرسانی مقادیر NULL...');
    await connection.query(`
      UPDATE customers 
      SET status = 'active' 
      WHERE status IS NULL OR status = ''
    `);

    // بررسی تعداد مشتریان
    const [countResult] = await connection.query(`
      SELECT COUNT(*) as total FROM customers
    `);
    console.log(`\n📊 تعداد کل مشتریان: ${countResult[0].total}`);

    // بررسی مشتریان بر اساس tenant_key
    const [tenantCounts] = await connection.query(`
      SELECT tenant_key, COUNT(*) as count
      FROM customers
      GROUP BY tenant_key
    `);
    
    console.log('\n📊 توزیع مشتریان بر اساس tenant:');
    tenantCounts.forEach(row => {
      console.log(`  - ${row.tenant_key}: ${row.count} مشتری`);
    });

    console.log('\n✅ رفع مشکلات با موفقیت انجام شد!');

  } catch (error) {
    console.error('❌ خطا:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixCustomerIssues().catch(console.error);
