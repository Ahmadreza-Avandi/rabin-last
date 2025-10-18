const fetch = require('node-fetch');

async function testLoginAPI() {
  try {
    console.log('🧪 تست API لاگین tenant\n');

    const loginData = {
      email: 'Robintejarat@gmail.com',
      password: '123456',
      tenant_key: 'rabin'
    };

    console.log('📤 ارسال درخواست لاگین:');
    console.log(`   URL: http://localhost:3000/api/tenant/auth/login`);
    console.log(`   Email: ${loginData.email}`);
    console.log(`   Password: ${loginData.password}`);
    console.log(`   Tenant Key: ${loginData.tenant_key}\n`);

    const response = await fetch('http://localhost:3000/api/tenant/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Key': 'rabin'
      },
      body: JSON.stringify(loginData)
    });

    console.log(`📥 پاسخ سرور: ${response.status} ${response.statusText}\n`);

    const data = await response.json();
    console.log('📋 محتوای پاسخ:');
    console.log(JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ لاگین موفقیت‌آمیز بود!');
      console.log(`   کاربر: ${data.user.name}`);
      console.log(`   نقش: ${data.user.role}`);
    } else {
      console.log('\n❌ لاگین ناموفق بود');
      console.log(`   پیام خطا: ${data.message}`);
    }

  } catch (error) {
    console.error('❌ خطا در تست:', error.message);
  }
}

testLoginAPI();
