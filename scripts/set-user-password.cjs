const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setUserPassword() {
  let connection;
  
  try {
    console.log('🔐 تنظیم رمز عبور کاربر\n');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'crm_user',
      password: '1234',
      database: 'crm_system'
    });

    // نمایش لیست کاربران
    console.log('👥 لیست کاربران موجود:\n');
    const [users] = await connection.query(
      'SELECT id, name, email, tenant_key, role FROM users ORDER BY tenant_key, name'
    );
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Tenant: ${user.tenant_key} - Role: ${user.role}`);
    });

    console.log('\n');
    const userIndex = await question('شماره کاربر را وارد کنید (یا Enter برای همه کاربران tenant rabin): ');
    
    let selectedUsers = [];
    if (userIndex.trim() === '') {
      // تنظیم رمز برای همه کاربران rabin
      selectedUsers = users.filter(u => u.tenant_key === 'rabin');
      console.log(`\n✅ ${selectedUsers.length} کاربر tenant rabin انتخاب شد`);
    } else {
      const index = parseInt(userIndex) - 1;
      if (index >= 0 && index < users.length) {
        selectedUsers = [users[index]];
      } else {
        console.log('❌ شماره نامعتبر');
        rl.close();
        return;
      }
    }

    const password = await question('\nرمز عبور جدید را وارد کنید (پیش‌فرض: 123456): ');
    const finalPassword = password.trim() || '123456';

    console.log('\n🔄 در حال تنظیم رمز عبور...\n');

    const hashedPassword = await bcrypt.hash(finalPassword, 10);

    for (const user of selectedUsers) {
      await connection.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, user.id]
      );
      console.log(`✅ رمز عبور برای ${user.name} (${user.email}) تنظیم شد`);
    }

    console.log('\n✅ تنظیم رمز عبور با موفقیت انجام شد!');
    console.log(`\n📝 اطلاعات ورود:`);
    selectedUsers.forEach(user => {
      console.log(`   ایمیل: ${user.email}`);
      console.log(`   رمز عبور: ${finalPassword}`);
      console.log(`   Tenant Key: ${user.tenant_key}`);
      console.log(`   لینک ورود: http://localhost:3000/${user.tenant_key}/login\n`);
    });

    rl.close();

  } catch (error) {
    console.error('❌ خطا:', error.message);
    rl.close();
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setUserPassword();
