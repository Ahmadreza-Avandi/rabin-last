const jwt = require('jsonwebtoken');
const http = require('http');

const JWT_SECRET = process.env.JWT_SECRET || 'local_jwt_secret_key_2024';

async function testDashboardAPI() {
  try {
    console.log('🧪 تست API داشبورد tenant\n');

    // ایجاد token تست
    const testUser = {
      userId: 'ceo-001',
      email: 'Robintejarat@gmail.com',
      name: 'مهندس کریمی',
      role: 'ceo',
      tenant_key: 'rabin'
    };

    const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '24h' });
    console.log('✅ Token تست ایجاد شد');
    console.log(`   Token: ${token.substring(0, 50)}...\n`);

    // تست API داشبورد
    console.log('📤 ارسال درخواست به /api/tenant/dashboard...');
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/tenant/dashboard',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-Key': 'rabin',
        'Content-Type': 'application/json',
        'Cookie': `tenant_token=${token}`
      }
    };

    const data = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        console.log(`📥 پاسخ سرور: ${res.statusCode} ${res.statusMessage}\n`);
        
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        });
      });
      
      req.on('error', reject);
      req.end();
    });
    
    if (data.success) {
      console.log('✅ API داشبورد کار می‌کند!');
      console.log('\n📊 داده‌های دریافت شده:');
      console.log(`   کاربر: ${data.data.currentUser.name}`);
      console.log(`   نقش: ${data.data.currentUser.role}`);
      console.log(`   مشتریان فعال: ${data.data.quickStats.active_customers}`);
      console.log(`   وظایف در انتظار: ${data.data.quickStats.pending_tasks}`);
      console.log(`   معاملات فعال: ${data.data.quickStats.active_deals}`);
      console.log(`   تیکت‌های باز: ${data.data.quickStats.open_tickets}`);
      console.log(`   فعالیت‌های امروز: ${data.data.teamActivities.length}`);
      console.log(`   مشتریان اخیر: ${data.data.recentCustomers.length}`);
      console.log(`   برنامه امروز: ${data.data.todaySchedule.length}`);
    } else {
      console.log('❌ خطا در API داشبورد');
      console.log(`   پیام: ${data.message}`);
    }

    console.log('\n📋 پاسخ کامل:');
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ خطا در تست:', error.message);
  }
}

testDashboardAPI();
