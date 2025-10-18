const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function checkContactsStructure() {
  let connection;

  try {
    console.log('🔍 بررسی ساختار جدول contacts...\n');

    connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'crm_system',
      charset: 'utf8mb4'
    });

    // بررسی ستون‌های جدول contacts
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'contacts'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DATABASE_NAME || 'crm_system']);

    console.log('📋 ستون‌های جدول contacts:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.COLUMN_TYPE})`);
    });

    // بررسی نمونه داده
    console.log('\n📊 نمونه داده‌ها:');
    const [samples] = await connection.query(`
      SELECT * FROM contacts WHERE tenant_key = 'rabin' LIMIT 3
    `);
    
    if (samples.length > 0) {
      console.log(`تعداد: ${samples.length}`);
      console.log('نمونه اول:', JSON.stringify(samples[0], null, 2));
    } else {
      console.log('هیچ داده‌ای یافت نشد');
    }

    console.log('\n✅ بررسی انجام شد!');

  } catch (error) {
    console.error('❌ خطا:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkContactsStructure().catch(console.error);
