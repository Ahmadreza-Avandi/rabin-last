const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function resetPasswords() {
  let connection;
  
  try {
    console.log('🔐 تنظیم رمز عبور برای کاربران tenant rabin\n');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'crm_user',
      password: '1234',
      database: 'crm_system'
    });

    const password = '123456';
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

    console.log('\n✅ رمز عبور همه کاربران tenant rabin تنظیم شد!');
    console.log('\n📝 اطلاعات ورود:');
    console.log(`   رمز عبور: ${password}`);
    console.log(`   لینک ورود: http://localhost:3000/rabin/login`);
    console.log('\n📧 ایمیل‌های قابل استفاده:');
    users.forEach(user => {
      console.log(`   - ${user.email}`);
    });

  } catch (error) {
    console.error('❌ خطا:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

resetPasswords();
