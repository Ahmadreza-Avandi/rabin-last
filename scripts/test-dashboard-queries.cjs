const mysql = require('mysql2/promise');

async function testQueries() {
  let connection;
  
  try {
    console.log('🧪 تست query های داشبورد\n');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'crm_user',
      password: '1234',
      database: 'crm_system'
    });

    console.log('✅ اتصال به دیتابیس برقرار شد\n');

    // تست هر query
    console.log('1️⃣ تست: تعداد مشتریان فعال');
    const [customersCount] = await connection.query(
      'SELECT COUNT(*) as count FROM customers WHERE status = ?',
      ['active']
    );
    console.log(`   ✅ ${customersCount[0].count} مشتری فعال\n`);

    console.log('2️⃣ تست: تعداد وظایف در انتظار');
    const [tasksCount] = await connection.query(
      'SELECT COUNT(*) as count FROM tasks WHERE status IN (?, ?)',
      ['pending', 'in_progress']
    );
    console.log(`   ✅ ${tasksCount[0].count} وظیفه\n`);

    console.log('3️⃣ تست: تعداد معاملات فعال');
    const [dealsCount] = await connection.query(
      'SELECT COUNT(*) as count FROM deals WHERE actual_close_date IS NULL',
      []
    );
    console.log(`   ✅ ${dealsCount[0].count} معامله\n`);

    console.log('4️⃣ تست: تعداد تیکت‌های باز');
    const [ticketsCount] = await connection.query(
      'SELECT COUNT(*) as count FROM tickets WHERE status = ?',
      ['open']
    );
    console.log(`   ✅ ${ticketsCount[0].count} تیکت\n`);

    console.log('5️⃣ تست: فعالیت‌های امروز');
    const [todayActivities] = await connection.query(`
      SELECT 
        a.*,
        c.name as customer_name,
        u.name as performed_by_name
      FROM activities a
      LEFT JOIN customers c ON a.customer_id = c.id
      LEFT JOIN users u ON a.performed_by = u.id
      WHERE DATE(a.start_time) = CURDATE()
      ORDER BY a.start_time DESC
      LIMIT 10
    `);
    console.log(`   ✅ ${todayActivities.length} فعالیت\n`);

    console.log('6️⃣ تست: مشتریان اخیر');
    const [recentCustomers] = await connection.query(`
      SELECT id, name, email, phone, status, created_at
      FROM customers
      ORDER BY created_at DESC
      LIMIT 5
    `);
    console.log(`   ✅ ${recentCustomers.length} مشتری\n`);

    console.log('7️⃣ تست: برنامه امروز');
    const [todaySchedule] = await connection.query(`
      SELECT 
        e.*,
        c.name as customer_name
      FROM calendar_events e
      LEFT JOIN customers c ON e.customer_id = c.id
      WHERE DATE(e.start_date) = CURDATE()
      ORDER BY e.start_date ASC
      LIMIT 10
    `);
    console.log(`   ✅ ${todaySchedule.length} رویداد\n`);

    console.log('8️⃣ تست: گزارش کاربران');
    const [users] = await connection.query(`
      SELECT 
        u.id,
        u.name,
        u.role,
        COUNT(DISTINCT a.id) as activities_today,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as tasks_completed,
        COUNT(DISTINCT t.id) as tasks_assigned
      FROM users u
      LEFT JOIN activities a ON a.performed_by = u.id AND DATE(a.start_time) = CURDATE()
      LEFT JOIN tasks t ON t.assigned_to = u.id
      WHERE u.status = 'active'
      GROUP BY u.id, u.name, u.role
      ORDER BY activities_today DESC
    `);
    console.log(`   ✅ ${users.length} کاربر\n`);

    console.log('✅ همه query ها موفقیت‌آمیز بودند!');

  } catch (error) {
    console.error('❌ خطا:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testQueries();
