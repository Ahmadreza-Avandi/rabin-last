const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function checkRemainingIssues() {
  let connection;

  try {
    console.log('🔍 بررسی مشکلات باقیمانده...\n');

    connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'crm_system',
      charset: 'utf8mb4'
    });

    // مشکل 3: بررسی مشتری خاص
    console.log('📋 مشکل 3: بررسی مشتری bb19a347-ab65-11f0-81d2-581122e4f0be...');
    const [customer] = await connection.query(`
      SELECT id, name, email, phone, company_name, status
      FROM customers 
      WHERE id = 'bb19a347-ab65-11f0-81d2-581122e4f0be'
    `);
    
    if (customer.length > 0) {
      console.log('✅ مشتری یافت شد:');
      console.log(`   نام: ${customer[0].name}`);
      console.log(`   ایمیل: ${customer[0].email || 'ندارد'}`);
      console.log(`   تلفن: ${customer[0].phone || 'ندارد'}`);
      console.log(`   وضعیت: ${customer[0].status || 'نامشخص'}`);
      
      // بررسی فروش‌های این مشتری
      const [sales] = await connection.query(`
        SELECT COUNT(*) as count FROM sales 
        WHERE customer_id = 'bb19a347-ab65-11f0-81d2-581122e4f0be'
      `);
      console.log(`   تعداد فروش: ${sales[0].count}`);
      
      // بررسی فعالیت‌های این مشتری
      const [activities] = await connection.query(`
        SELECT COUNT(*) as count FROM activities 
        WHERE customer_id = 'bb19a347-ab65-11f0-81d2-581122e4f0be'
      `);
      console.log(`   تعداد فعالیت: ${activities[0].count}`);
    } else {
      console.log('❌ مشتری یافت نشد - این ID در دیتابیس وجود ندارد');
      
      // نمایش چند مشتری نمونه
      const [sampleCustomers] = await connection.query(`
        SELECT id, name FROM customers WHERE tenant_key = 'rabin' LIMIT 5
      `);
      console.log('\n📋 نمونه مشتریان موجود:');
      sampleCustomers.forEach(c => {
        console.log(`   - ${c.id}: ${c.name}`);
      });
    }

    // مشکل 4: بررسی جدول tasks
    console.log('\n📋 مشکل 4: بررسی جدول tasks...');
    const [tasks] = await connection.query(`
      SELECT COUNT(*) as count FROM tasks WHERE tenant_key = 'rabin'
    `);
    console.log(`✅ تعداد وظایف: ${tasks[0].count}`);
    
    if (tasks[0].count > 0) {
      const [sampleTasks] = await connection.query(`
        SELECT id, title, status, assigned_to FROM tasks 
        WHERE tenant_key = 'rabin' LIMIT 3
      `);
      console.log('نمونه وظایف:');
      sampleTasks.forEach(t => {
        console.log(`   - ${t.title} (${t.status})`);
      });
    }

    // بررسی کلی sales
    console.log('\n📋 بررسی نهایی sales...');
    const [salesCheck] = await connection.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN title IS NULL OR title = '' THEN 1 ELSE 0 END) as without_title,
        SUM(CASE WHEN customer_name IS NULL OR customer_name = '' THEN 1 ELSE 0 END) as without_customer
      FROM sales 
      WHERE tenant_key = 'rabin'
    `);
    console.log(`✅ کل فروش‌ها: ${salesCheck[0].total}`);
    console.log(`   بدون عنوان: ${salesCheck[0].without_title}`);
    console.log(`   بدون نام مشتری: ${salesCheck[0].without_customer}`);

    // بررسی customers-simple
    console.log('\n📋 بررسی customers-simple...');
    const [customersSimple] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM customers 
      WHERE tenant_key = 'rabin'
    `);
    console.log(`✅ تعداد مشتریان: ${customersSimple[0].count}`);

    console.log('\n✅ بررسی کامل شد!');

  } catch (error) {
    console.error('❌ خطا:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkRemainingIssues().catch(console.error);
