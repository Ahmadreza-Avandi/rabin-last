const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function checkSalesStructure() {
  let connection;

  try {
    console.log('🔍 بررسی ساختار جدول sales...\n');

    connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'crm_system',
      charset: 'utf8mb4'
    });

    // بررسی ستون‌های جدول sales
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sales'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DATABASE_NAME || 'crm_system']);

    console.log('📋 ستون‌های جدول sales:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.COLUMN_TYPE}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // بررسی نمونه داده
    console.log('\n📊 نمونه داده‌ها:');
    const [samples] = await connection.query(`
      SELECT * FROM sales WHERE tenant_key = 'rabin' LIMIT 3
    `);
    
    if (samples.length > 0) {
      console.log(`تعداد: ${samples.length}`);
      console.log('نمونه اول:', JSON.stringify(samples[0], null, 2));
    } else {
      console.log('هیچ داده‌ای یافت نشد');
    }

    // اضافه کردن ستون‌های مورد نیاز
    console.log('\n🔧 اضافه کردن ستون‌های مورد نیاز...');
    
    const hasTitle = columns.some(col => col.COLUMN_NAME === 'title');
    if (!hasTitle) {
      console.log('⚠️  ستون title وجود ندارد. در حال افزودن...');
      await connection.query(`
        ALTER TABLE sales 
        ADD COLUMN title VARCHAR(255) AFTER id
      `);
      
      // به‌روزرسانی title برای رکوردهای موجود
      await connection.query(`
        UPDATE sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        SET s.title = CONCAT('فروش به ', COALESCE(c.name, 'مشتری'), ' - ', DATE_FORMAT(s.sale_date, '%Y/%m/%d'))
        WHERE s.title IS NULL OR s.title = ''
      `);
      
      console.log('✅ ستون title اضافه و مقداردهی شد');
    } else {
      console.log('✅ ستون title موجود است');
    }

    console.log('\n✅ بررسی و رفع مشکلات انجام شد!');

  } catch (error) {
    console.error('❌ خطا:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkSalesStructure().catch(console.error);
