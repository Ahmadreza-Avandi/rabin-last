const mysql = require('mysql2/promise');

async function checkTenantLogin() {
  let connection;
  
  try {
    console.log('🔍 در حال بررسی کاربران tenant...\n');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'crm_user',
      password: '1234',
      database: 'crm_system'
    });

    // بررسی ساختار جدول users
    console.log('📋 ساختار جدول users:');
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM users"
    );
    console.table(columns.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null, Key: c.Key })));

    // لیست تمام کاربران
    console.log('\n👥 لیست کاربران:');
    const [users] = await connection.query(
      'SELECT id, name, email, role, tenant_key, status FROM users'
    );
    console.table(users);

    // لیست tenants
    console.log('\n🏢 لیست tenants:');
    const [tenants] = await connection.query(
      'SELECT id, tenant_key, company_name, status FROM tenants'
    );
    console.table(tenants);

    console.log('\n✅ بررسی کامل شد');

  } catch (error) {
    console.error('❌ خطا:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTenantLogin();
