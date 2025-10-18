const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function addSampleData() {
  let connection;

  try {
    console.log('📊 اضافه کردن داده نمونه برای مانیتورینگ...\n');

    connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'crm_system',
      charset: 'utf8mb4'
    });

    const tenantKey = 'rabin';

    // 1. اضافه کردن satisfaction_score به مشتریان
    console.log('1️⃣ اضافه کردن امتیاز رضایت به مشتریان...');
    const [updateResult] = await connection.query(`
      UPDATE customers 
      SET satisfaction_score = FLOOR(3 + (RAND() * 2))
      WHERE tenant_key = ? AND satisfaction_score IS NULL
      LIMIT 100
    `, [tenantKey]);
    console.log(`✅ ${updateResult.affectedRows} مشتری به‌روزرسانی شد`);

    // 2. بررسی جدول feedback
    console.log('\n2️⃣ بررسی جدول feedback...');
    const [feedbackCount] = await connection.query(`
      SELECT COUNT(*) as count FROM feedback WHERE tenant_key = ?
    `, [tenantKey]);
    
    console.log(`   تعداد بازخوردهای موجود: ${feedbackCount[0].count}`);

    if (feedbackCount[0].count < 10) {
      console.log('   اضافه کردن بازخوردهای نمونه...');
      
      // دریافت لیست مشتریان
      const [customers] = await connection.query(`
        SELECT id FROM customers WHERE tenant_key = ? LIMIT 20
      `, [tenantKey]);

      if (customers.length > 0) {
        for (const customer of customers) {
          const score = Math.floor(1 + Math.random() * 5);
          const messages = [
            'خدمات عالی بود',
            'محصول با کیفیت',
            'پشتیبانی خوب',
            'قیمت مناسب',
            'تحویل به موقع'
          ];
          const message = messages[Math.floor(Math.random() * messages.length)];

          await connection.query(`
            INSERT INTO feedback (id, tenant_key, customer_id, score, message, created_at)
            VALUES (UUID(), ?, ?, ?, ?, NOW())
          `, [tenantKey, customer.id, score, message]);
        }
        console.log(`✅ ${customers.length} بازخورد اضافه شد`);
      }
    } else {
      console.log('✅ بازخوردهای کافی موجود است');
    }

    // 3. نمایش آمار نهایی
    console.log('\n📊 آمار نهایی:');
    
    const [finalStats] = await connection.query(`
      SELECT 
        (SELECT COUNT(*) FROM customers WHERE tenant_key = ? AND satisfaction_score IS NOT NULL) as customers_with_score,
        (SELECT AVG(satisfaction_score) FROM customers WHERE tenant_key = ?) as avg_satisfaction,
        (SELECT COUNT(*) FROM feedback WHERE tenant_key = ?) as total_feedback,
        (SELECT COUNT(*) FROM sales WHERE tenant_key = ?) as total_sales
    `, [tenantKey, tenantKey, tenantKey, tenantKey]);

    const stats = finalStats[0];
    console.log(`   مشتریان با امتیاز رضایت: ${stats.customers_with_score}`);
    console.log(`   میانگین رضایت: ${stats.avg_satisfaction ? stats.avg_satisfaction.toFixed(2) : 0}`);
    console.log(`   کل بازخوردها: ${stats.total_feedback}`);
    console.log(`   کل فروش‌ها: ${stats.total_sales}`);

    console.log('\n✅ داده‌های نمونه با موفقیت اضافه شد!');
    console.log('\n🎉 حالا می‌توانید صفحه مانیتورینگ را مشاهده کنید:');
    console.log('   http://localhost:3000/rabin/dashboard/system-monitoring');

  } catch (error) {
    console.error('❌ خطا:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addSampleData().catch(console.error);
