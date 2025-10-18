#!/usr/bin/env node

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function testAllAPIs() {
  console.log('\n🧪 تست کامل تمام API های Tenant\n');
  console.log('='.repeat(80));

  let connection;

  try {
    // 1. اتصال به دیتابیس
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      port: 3306,
      database: 'crm_system'
    });

    console.log('✅ Connected to database\n');

    // 2. ایجاد یک token تست
    console.log('🔐 ایجاد token تست...\n');
    
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    
    const testToken = jwt.sign(
      {
        userId: 'ceo-001',
        email: 'Robintejarat@gmail.com',
        name: 'مهندس کریمی',
        role: 'ceo',
        tenant_key: 'rabin'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Token created\n');

    // 3. لیست API ها برای تست
    const apis = [
      { name: 'customers-simple', url: 'http://localhost:3000/api/tenant/customers-simple?limit=10' },
      { name: 'coworkers', url: 'http://localhost:3000/api/tenant/coworkers' },
      { name: 'activities', url: 'http://localhost:3000/api/tenant/activities' },
      { name: 'tasks', url: 'http://localhost:3000/api/tenant/tasks' },
      { name: 'documents', url: 'http://localhost:3000/api/tenant/documents' },
      { name: 'sales', url: 'http://localhost:3000/api/tenant/sales' },
      { name: 'products', url: 'http://localhost:3000/api/tenant/products' },
      { name: 'chat', url: 'http://localhost:3000/api/tenant/chat' },
      { name: 'deals', url: 'http://localhost:3000/api/tenant/deals' },
      { name: 'contacts', url: 'http://localhost:3000/api/tenant/contacts' },
      { name: 'feedback', url: 'http://localhost:3000/api/tenant/feedback' },
      { name: 'users', url: 'http://localhost:3000/api/tenant/users' },
    ];

    console.log('📋 تست API ها:\n');
    console.log('-'.repeat(80));

    const results = {
      success: [],
      failed: [],
      notFound: []
    };

    for (const api of apis) {
      try {
        const fetch = (await import('node-fetch')).default;
        
        const response = await fetch(api.url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${testToken}`,
            'X-Tenant-Key': 'rabin',
            'Content-Type': 'application/json'
          }
        });

        const status = response.status;
        const statusIcon = status === 200 ? '✅' : status === 404 ? '❌' : status === 401 ? '🔒' : '⚠️';
        
        console.log(`${statusIcon} ${api.name.padEnd(20)} - Status: ${status}`);

        if (status === 200) {
          const data = await response.json();
          const count = data.data?.length || data.users?.length || data.customers?.length || data.coworkers?.length || 0;
          console.log(`   📊 داده: ${count} رکورد`);
          results.success.push(api.name);
        } else if (status === 404) {
          results.notFound.push(api.name);
        } else {
          const error = await response.text();
          console.log(`   ❌ خطا: ${error.substring(0, 100)}`);
          results.failed.push(api.name);
        }

      } catch (error) {
        console.log(`❌ ${api.name.padEnd(20)} - خطا: ${error.message}`);
        results.failed.push(api.name);
      }
      
      console.log('');
    }

    // 4. خلاصه نتایج
    console.log('='.repeat(80));
    console.log('\n📊 خلاصه نتایج:\n');
    
    console.log(`✅ موفق: ${results.success.length} API`);
    results.success.forEach(api => console.log(`   - ${api}`));
    
    console.log(`\n❌ ناموفق: ${results.failed.length} API`);
    results.failed.forEach(api => console.log(`   - ${api}`));
    
    console.log(`\n🔍 یافت نشد: ${results.notFound.length} API`);
    results.notFound.forEach(api => console.log(`   - ${api}`));

    // 5. بررسی tenant isolation
    console.log('\n' + '='.repeat(80));
    console.log('\n🔒 تست Tenant Isolation:\n');
    
    const [rabinData] = await connection.query(
      'SELECT COUNT(*) as count FROM customers WHERE tenant_key = ?',
      ['rabin']
    );
    
    const [saminData] = await connection.query(
      'SELECT COUNT(*) as count FROM customers WHERE tenant_key = ?',
      ['samin']
    );

    console.log(`   rabin: ${rabinData[0].count} مشتری`);
    console.log(`   samin: ${saminData[0].count} مشتری`);
    
    if (rabinData[0].count > 0 && saminData[0].count === 0) {
      console.log('\n   ✅ Tenant isolation کار می‌کند!');
    } else {
      console.log('\n   ⚠️  داده‌ها به درستی جدا نشده‌اند');
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ تست کامل شد!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testAllAPIs().catch(console.error);
