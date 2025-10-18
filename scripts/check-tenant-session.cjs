const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'local_jwt_secret_key_2024';

async function checkSession() {
  console.log('🔍 بررسی session tenant\n');
  
  // تست token
  const testUser = {
    id: 'ceo-001',
    name: 'مهندس کریمی',
    email: 'Robintejarat@gmail.com',
    role: 'ceo',
    tenant_key: 'rabin'
  };

  const token = jwt.sign(
    {
      userId: testUser.id,
      email: testUser.email,
      name: testUser.name,
      role: testUser.role,
      tenant_key: testUser.tenant_key
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  console.log('✅ Token تست ایجاد شد:');
  console.log(`   Token: ${token.substring(0, 50)}...`);
  
  // Decode token
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('\n📋 محتوای Token:');
  console.log(JSON.stringify(decoded, null, 2));

  console.log('\n💡 برای تست در مرورگر:');
  console.log('   1. وارد http://localhost:3000/rabin/login شوید');
  console.log('   2. با این اطلاعات لاگین کنید:');
  console.log(`      ایمیل: ${testUser.email}`);
  console.log('      رمز عبور: 123456');
  console.log('   3. در Console مرورگر این دستور را اجرا کنید:');
  console.log('      document.cookie');
  console.log('   4. باید cookie با نام "tenant_token" ببینید');
}

checkSession();
