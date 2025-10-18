const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function testLogin() {
  let connection;
  
  try {
    console.log('🔐 تست اعتبارسنجی لاگین...\n');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'crm_user',
      password: '1234',
      database: 'crm_system'
    });

    const testEmail = 'Robintejarat@gmail.com';
    const testTenantKey = 'rabin';

    console.log(`📧 ایمیل تست: ${testEmail}`);
    console.log(`🏢 Tenant Key: ${testTenantKey}\n`);

    // جستجوی کاربر
    const [users] = await connection.query(
      'SELECT * FROM users WHERE email = ? AND tenant_key = ?',
      [testEmail, testTenantKey]
    );

    if (users.length === 0) {
      console.log('❌ کاربر یافت نشد');
      return;
    }

    const user = users[0];
    console.log('✅ کاربر یافت شد:');
    console.log(`   نام: ${user.name}`);
    console.log(`   ایمیل: ${user.email}`);
    console.log(`   نقش: ${user.role}`);
    console.log(`   وضعیت: ${user.status}`);
    console.log(`   Tenant Key: ${user.tenant_key}`);
    console.log(`   رمز عبور هش شده: ${user.password ? 'موجود' : 'خالی'}`);

    if (!user.password) {
      console.log('\n⚠️ رمز عبور برای این کاربر تنظیم نشده است!');
      console.log('💡 برای تنظیم رمز عبور از اسکریپت زیر استفاده کنید:');
      console.log('   node scripts/set-user-password.cjs');
    } else {
      console.log('\n✅ رمز عبور موجود است');
      
      // تست رمز عبور
      const testPassword = '123456'; // رمز عبور پیش‌فرض
      const isValid = await bcrypt.compare(testPassword, user.password);
      
      console.log(`\n🔑 تست رمز عبور "${testPassword}": ${isValid ? '✅ صحیح' : '❌ نادرست'}`);
      
      if (!isValid) {
        console.log('\n💡 رمز عبور صحیح نیست. رمزهای احتمالی:');
        console.log('   - 123456');
        console.log('   - password');
        console.log('   - admin123');
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

testLogin();
