const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function testMonitoringAPI() {
  let connection;

  try {
    console.log('🧪 تست API مانیتورینگ...\n');

    connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'crm_system',
      charset: 'utf8mb4'
    });

    const tenantKey = 'rabin';

    // تست 1: فروش ماهانه
    console.log('📊 تست 1: فروش ماهانه...');
    const [monthlySales] = await connection.query(`
      SELECT 
        DATE_FORMAT(sale_date, '%Y-%m') as month,
        COUNT(*) as count,
        SUM(total_amount) as revenue
      FROM sales
      WHERE tenant_key = ? AND sale_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(sale_date, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `, [tenantKey]);
    console.log(`✅ تعداد ماه‌ها: ${monthlySales.length}`);
    if (monthlySales.length > 0) {
      console.log(`   نمونه: ${monthlySales[0].month} - ${monthlySales[0].count} فروش`);
    }

    // تست 2: فروش هفتگی
    console.log('\n📊 تست 2: فروش هفتگی...');
    const [weeklySales] = await connection.query(`
      SELECT 
        YEARWEEK(sale_date) as week,
        DATE_FORMAT(sale_date, '%Y-%m-%d') as date,
        COUNT(*) as count,
        SUM(total_amount) as revenue
      FROM sales
      WHERE tenant_key = ? AND sale_date >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
      GROUP BY YEARWEEK(sale_date), DATE_FORMAT(sale_date, '%Y-%m-%d')
      ORDER BY week DESC
      LIMIT 8
    `, [tenantKey]);
    console.log(`✅ تعداد هفته‌ها: ${weeklySales.length}`);

    // تست 3: وضعیت پرداخت
    console.log('\n📊 تست 3: وضعیت پرداخت...');
    const [paymentStatus] = await connection.query(`
      SELECT 
        payment_status,
        COUNT(*) as count,
        SUM(total_amount) as total
      FROM sales
      WHERE tenant_key = ?
      GROUP BY payment_status
    `, [tenantKey]);
    console.log(`✅ تعداد وضعیت‌ها: ${paymentStatus.length}`);
    paymentStatus.forEach(status => {
      console.log(`   - ${status.payment_status}: ${status.count} فروش`);
    });

    // تست 4: برترین مشتریان
    console.log('\n📊 تست 4: برترین مشتریان...');
    const [topCustomers] = await connection.query(`
      SELECT 
        c.id,
        c.name,
        COUNT(s.id) as sales_count,
        SUM(s.total_amount) as total_revenue
      FROM customers c
      LEFT JOIN sales s ON c.id = s.customer_id AND s.tenant_key = ?
      WHERE c.tenant_key = ?
      GROUP BY c.id, c.name
      ORDER BY total_revenue DESC
      LIMIT 10
    `, [tenantKey, tenantKey]);
    console.log(`✅ تعداد مشتریان: ${topCustomers.length}`);
    if (topCustomers.length > 0) {
      console.log(`   نمونه: ${topCustomers[0].name} - ${topCustomers[0].sales_count} فروش`);
    }

    // تست 5: رضایت مشتریان
    console.log('\n📊 تست 5: رضایت مشتریان...');
    const [satisfaction] = await connection.query(`
      SELECT 
        AVG(satisfaction_score) as avg_score,
        COUNT(*) as total_customers,
        SUM(CASE WHEN satisfaction_score >= 4 THEN 1 ELSE 0 END) as satisfied,
        SUM(CASE WHEN satisfaction_score < 3 THEN 1 ELSE 0 END) as unsatisfied
      FROM customers
      WHERE tenant_key = ? AND satisfaction_score IS NOT NULL
    `, [tenantKey]);
    console.log(`✅ میانگین رضایت: ${satisfaction[0].avg_score || 0}`);
    console.log(`   کل مشتریان: ${satisfaction[0].total_customers}`);

    // تست 6: بازخوردها
    console.log('\n📊 تست 6: بازخوردها...');
    const [feedbacks] = await connection.query(`
      SELECT 
        rating,
        COUNT(*) as count
      FROM feedback
      WHERE tenant_key = ?
      GROUP BY rating
      ORDER BY rating DESC
    `, [tenantKey]);
    console.log(`✅ تعداد گروه‌های بازخورد: ${feedbacks.length}`);

    // تست 7: فروشندگان برتر
    console.log('\n📊 تست 7: فروشندگان برتر...');
    const [topSalespeople] = await connection.query(`
      SELECT 
        sales_person_name,
        COUNT(*) as sales_count,
        SUM(total_amount) as total_revenue
      FROM sales
      WHERE tenant_key = ?
      GROUP BY sales_person_name
      ORDER BY total_revenue DESC
      LIMIT 5
    `, [tenantKey]);
    console.log(`✅ تعداد فروشندگان: ${topSalespeople.length}`);
    if (topSalespeople.length > 0) {
      console.log(`   نمونه: ${topSalespeople[0].sales_person_name} - ${topSalespeople[0].sales_count} فروش`);
    }

    // تست 8: آمار کلی
    console.log('\n📊 تست 8: آمار کلی...');
    const [stats] = await connection.query(`
      SELECT 
        (SELECT COUNT(*) FROM sales WHERE tenant_key = ?) as total_sales,
        (SELECT SUM(total_amount) FROM sales WHERE tenant_key = ?) as total_revenue,
        (SELECT COUNT(*) FROM customers WHERE tenant_key = ?) as total_customers,
        (SELECT COUNT(*) FROM sales WHERE tenant_key = ? AND payment_status = 'paid') as paid_sales,
        (SELECT COUNT(*) FROM sales WHERE tenant_key = ? AND sale_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as sales_this_month,
        (SELECT SUM(total_amount) FROM sales WHERE tenant_key = ? AND sale_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as revenue_this_month
    `, [tenantKey, tenantKey, tenantKey, tenantKey, tenantKey, tenantKey]);
    
    console.log('✅ آمار کلی:');
    console.log(`   کل فروش: ${stats[0].total_sales}`);
    console.log(`   کل درآمد: ${stats[0].total_revenue}`);
    console.log(`   کل مشتریان: ${stats[0].total_customers}`);
    console.log(`   فروش پرداخت شده: ${stats[0].paid_sales}`);
    console.log(`   فروش ماه جاری: ${stats[0].sales_this_month}`);

    console.log('\n✅ تمام تست‌ها با موفقیت انجام شد!');

  } catch (error) {
    console.error('❌ خطا:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testMonitoringAPI().catch(console.error);
