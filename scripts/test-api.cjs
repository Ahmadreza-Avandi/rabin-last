#!/usr/bin/env node

/**
 * تست کامل API های SaaS
 */

const API_BASE = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 شروع تست API های SaaS\n');
  console.log('=' .repeat(60));

  // تست 1: لاگین Super Admin
  console.log('\n📝 تست 1: لاگین Super Admin');
  console.log('-'.repeat(60));
  
  try {
    const loginResponse = await fetch(`${API_BASE}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Ahmadreza.avandi',
        password: 'Ahmadreza.avandi'
      })
    });

    const loginData = await loginResponse.json();
    
    if (loginData.success) {
      console.log('✅ لاگین موفق');
      console.log(`   Admin: ${loginData.admin.name}`);
      
      // استخراج cookie
      const cookies = loginResponse.headers.get('set-cookie');
      const adminToken = cookies?.match(/admin_token=([^;]+)/)?.[1];
      
      if (!adminToken) {
        console.log('⚠️  توکن یافت نشد');
        return;
      }

      // تست 2: دریافت آمار
      console.log('\n📝 تست 2: دریافت آمار Dashboard');
      console.log('-'.repeat(60));
      
      const statsResponse = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: { 'Cookie': `admin_token=${adminToken}` }
      });
      
      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        console.log('✅ آمار دریافت شد');
        console.log(`   تعداد کل Tenants: ${statsData.data.totalTenants}`);
        console.log(`   Tenants فعال: ${statsData.data.activeTenants}`);
        console.log(`   درآمد ماهانه: ${statsData.data.monthlyRevenue.toLocaleString()} تومان`);
      } else {
        console.log('❌ خطا:', statsData.message);
      }

      // تست 3: دریافت لیست Tenants
      console.log('\n📝 تست 3: دریافت لیست Tenants');
      console.log('-'.repeat(60));
      
      const tenantsResponse = await fetch(`${API_BASE}/api/admin/tenants?limit=10`, {
        headers: { 'Cookie': `admin_token=${adminToken}` }
      });
      
      const tenantsData = await tenantsResponse.json();
      
      if (tenantsData.success) {
        console.log('✅ لیست Tenants دریافت شد');
        console.log(`   تعداد: ${tenantsData.data.tenants.length}`);
        tenantsData.data.tenants.forEach(tenant => {
          console.log(`   - ${tenant.tenant_key}: ${tenant.company_name} (${tenant.subscription_status})`);
        });
      } else {
        console.log('❌ خطا:', tenantsData.message);
      }

      // تست 4: دریافت لیست پلن‌ها
      console.log('\n📝 تست 4: دریافت لیست پلن‌های اشتراک');
      console.log('-'.repeat(60));
      
      const plansResponse = await fetch(`${API_BASE}/api/admin/plans`, {
        headers: { 'Cookie': `admin_token=${adminToken}` }
      });
      
      const plansData = await plansResponse.json();
      
      if (plansData.success) {
        console.log('✅ لیست پلن‌ها دریافت شد');
        console.log(`   تعداد: ${plansData.data.length}`);
        plansData.data.forEach(plan => {
          console.log(`   - ${plan.plan_name}: ${plan.price_monthly.toLocaleString()} تومان/ماه`);
        });
      } else {
        console.log('❌ خطا:', plansData.message);
      }

      // تست 5: ایجاد Tenant جدید
      console.log('\n📝 تست 5: ایجاد Tenant جدید از طریق API');
      console.log('-'.repeat(60));
      
      const newTenantData = {
        tenant_key: 'apitest',
        company_name: 'شرکت تست API',
        admin_name: 'مدیر API',
        admin_email: 'api@test.com',
        admin_phone: '09123456789',
        admin_password: 'ApiTest1234',
        subscription_plan: 'professional',
        subscription_months: 6
      };

      const createResponse = await fetch(`${API_BASE}/api/admin/tenants`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': `admin_token=${adminToken}` 
        },
        body: JSON.stringify(newTenantData)
      });
      
      const createData = await createResponse.json();
      
      if (createData.success) {
        console.log('✅ Tenant جدید ایجاد شد');
        console.log(`   Tenant Key: ${createData.data.tenant_key}`);
        console.log(`   URL: ${createData.data.url}`);
        console.log(`   Email: ${createData.data.admin_email}`);
        console.log(`   Password: ${createData.data.admin_password}`);

        // تست 6: لاگین به Tenant جدید
        console.log('\n📝 تست 6: لاگین به Tenant جدید');
        console.log('-'.repeat(60));
        
        const tenantLoginResponse = await fetch(`${API_BASE}/api/tenant/auth/login`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Tenant-Key': 'apitest'
          },
          body: JSON.stringify({
            email: 'api@test.com',
            password: 'ApiTest1234',
            tenant_key: 'apitest'
          })
        });
        
        const tenantLoginData = await tenantLoginResponse.json();
        
        if (tenantLoginData.success) {
          console.log('✅ لاگین به Tenant موفق');
          console.log(`   کاربر: ${tenantLoginData.user.name}`);
          console.log(`   نقش: ${tenantLoginData.user.role}`);
        } else {
          console.log('❌ خطا در لاگین:', tenantLoginData.message);
        }

      } else {
        console.log('❌ خطا در ایجاد Tenant:', createData.message);
      }

    } else {
      console.log('❌ لاگین ناموفق:', loginData.message);
    }

  } catch (error) {
    console.error('❌ خطای شبکه:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ تست‌ها کامل شد!\n');
}

// اجرا
testAPI().catch(console.error);
