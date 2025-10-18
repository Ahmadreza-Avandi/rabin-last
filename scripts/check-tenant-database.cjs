const mysql = require('mysql2/promise');

async function checkTenantDatabase() {
  let connection;
  
  try {
    console.log('🔍 بررسی دیتابیس tenant rabin\n');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'crm_user',
      password: '1234',
      database: 'crm_system'
    });

    console.log('📋 لیست جداول موجود:\n');
    const [tables] = await connection.query('SHOW TABLES');
    
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.table(tableNames);

    // بررسی جداول مورد نیاز
    const requiredTables = [
      'customers',
      'tasks',
      'deals',
      'tickets',
      'activities',
      'events',
      'users'
    ];

    console.log('\n✅ جداول مورد نیاز:');
    for (const table of requiredTables) {
      const exists = tableNames.includes(table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
      
      if (exists) {
        const [count] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`      تعداد رکورد: ${count[0].count}`);
      }
    }

  } catch (error) {
    console.error('❌ خطا:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTenantDatabase();
