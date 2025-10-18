const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function testAllIssues() {
  let connection;

  try {
    console.log('🧪 شروع تست تمام مشکلات...\n');

    connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'crm_system',
      charset: 'utf8mb4'
    });

    console.log('✅ اتصال به دیتابیس برقرار شد\n');

    // تست 1: بررسی customers-simple API
    console.log('📋 تست 1: بررسی جدول customers...');
    const [customers] = await connection.query(`
      SELECT id, name, email, phone, company_name as company 
      FROM customers 
      WHERE tenant_key = 'rabin'
      ORDER BY name 
      LIMIT 10
    `);
    console.log(`✅ تعداد مشتریان: ${customers.length}`);
    if (customers.length > 0) {
      console.log(`   نمونه: ${customers[0].name || 'بدون نام'}`);
    }

    // تست 2: بررسی sales با title و customer_name
    console.log('\n📋 تست 2: بررسی جدول sales...');
    const [sales] = await connection.query(`
      SELECT 
        s.id,
        s.title,
        c.name as customer_name,
        s.total_value,
        s.stage
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.tenant_key = 'rabin'
      LIMIT 10
    `);
    console.log(`✅ تعداد فروش‌ها: ${sales.length}`);
    if (sales.length > 0) {
      const sale = sales[0];
      console.log(`   نمونه: ${sale.title || 'بدون عنوان'} - ${sale.customer_name || 'بدون مشتری'}`);
      
      // بررسی NULL values
      const nullTitles = sales.filter(s => !s.title).length;
      const nullCustomers = sales.filter(s => !s.customer_name).length;
      if (nullTitles > 0) console.log(`   ⚠️  ${nullTitles} فروش بدون عنوان`);
      if (nullCustomers > 0) console.log(`   ⚠️  ${nullCustomers} فروش بدون نام مشتری`);
    }

    // تست 3: بررسی activities
    console.log('\n📋 تست 3: بررسی جدول activities...');
    const [activities] = await connection.query(`
      SELECT 
        a.id,
        a.title,
        a.type,
        c.name as customer_name
      FROM activities a
      LEFT JOIN customers c ON a.customer_id = c.id
      WHERE a.tenant_key = 'rabin'
      LIMIT 10
    `);
    console.log(`✅ تعداد فعالیت‌ها: ${activities.length}`);

    // تست 4: بررسی tasks
    console.log('\n📋 تست 4: بررسی جدول tasks...');
    const [tasks] = await connection.query(`
      SELECT id, title, status, priority
      FROM tasks 
      WHERE tenant_key = 'rabin'
      LIMIT 10
    `);
    console.log(`✅ تعداد وظایف: ${tasks.length}`);

    // تست 5: بررسی یک مشتری خاص
    console.log('\n📋 تست 5: بررسی مشتری خاص (bb19a347-ab65-11f0-81d2-581122e4f0be)...');
    const [specificCustomer] = await connection.query(`
      SELECT * FROM customers 
      WHERE id = 'bb19a347-ab65-11f0-81d2-581122e4f0be' AND tenant_key = 'rabin'
    `);
    
    if (specificCustomer.length > 0) {
      console.log(`✅ مشتری یافت شد: ${specificCustomer[0].name}`);
      
      // بررسی فروش‌های این مشتری
      const [customerSales] = await connection.query(`
        SELECT COUNT(*) as count FROM sales 
        WHERE customer_id = 'bb19a347-ab65-11f0-81d2-581122e4f0be' AND tenant_key = 'rabin'
      `);
      console.log(`   فروش‌ها: ${customerSales[0].count}`);
      
      // بررسی فعالیت‌های این مشتری
      const [customerActivities] = await connection.query(`
        SELECT COUNT(*) as count FROM activities 
        WHERE customer_id = 'bb19a347-ab65-11f0-81d2-581122e4f0be' AND tenant_key = 'rabin'
      `);
      console.log(`   فعالیت‌ها: ${customerActivities[0].count}`);
    } else {
      console.log('❌ مشتری یافت نشد');
    }

    // تست 6: به‌روزرسانی sales برای اطمینان از وجود title و customer_name
    console.log('\n🔧 تست 6: به‌روزرسانی sales...');
    
    // به‌روزرسانی title های NULL
    const [updateTitles] = await connection.query(`
      UPDATE sales 
      SET title = CONCAT('فروش ', SUBSTRING(id, 1, 8))
      WHERE title IS NULL OR title = ''
    `);
    if (updateTitles.affectedRows > 0) {
      console.log(`✅ ${updateTitles.affectedRows} فروش بدون عنوان به‌روزرسانی شد`);
    }

    console.log('\n✅ تمام تست‌ها با موفقیت انجام شد!');

  } catch (error) {
    console.error('❌ خطا:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testAllIssues().catch(console.error);
