const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function setPassword() {
  let connection;
  
  try {
    console.log('🔐 تنظیم رمز عبور به admin123\n');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'crm_user',
      password: '1234',
      database: 'crm_system'
    });

    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // تنظیم رمز برای همه کاربران rabin
    const [users] = await connection.query(
      'SELECT id, name, email FROM users WHERE tenant_key = ?',
      ['rabin']
    );

    console.log(`📝 در حال تنظیم رمز عبور "${password}" برای ${users.length} کاربر...\n`);

    for (const user of users) {
      await connection.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, user.id]
      );
      console.log(`✅ ${user.name} (${user.email})`);
    }

    console.log('\n✅ رمز عبور همه کاربران tenant rabin به admin123 تغییر کرد!');
    console.log('\n📝 اطلاعات ورود:');
    console.log(`   رمز عبور: ${password}`);
    console.log(`   لینک ورود: http://localhost:3000/rabin/login`);
    console.log('\n📧 ایمیل‌های قابل استفاده:');
    users.forEach(user => {
      console.log(`   - ${user.email}`);
    });

    // تست رمز عبور جدید
    console.log('\n🧪 تست رمز عبور جدید...');
    const testUser = users[0];
    const [testUsers] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      [testUser.email]
    );
    
    const isValid = await bcrypt.compare(password, testUsers[0].password);
    console.log(`   ${isValid ? '✅' : '❌'} رمز عبور ${password} برای ${testUser.email}`);

  } catch (error) {
    console.error('❌ خطا:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setPassword();
