#!/usr/bin/env node

async function testLogin() {
  try {
    console.log('🔐 تست لاگین ساده...\n');

    const response = await fetch('http://localhost:3000/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Ahmadreza.avandi',
        password: 'Ahmadreza.avandi'
      })
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('\nResponse:', JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ خطا:', error.message);
  }
}

testLogin();
