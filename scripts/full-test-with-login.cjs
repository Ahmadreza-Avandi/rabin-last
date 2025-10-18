const http = require('http');

// تابع برای ارسال درخواست HTTP
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // دریافت cookies از response
        const cookies = res.headers['set-cookie'] || [];
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          cookies: cookies,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function fullTest() {
  try {
    console.log('🧪 Full Test: Login + Permissions\n');
    
    // Step 1: Login
    console.log('Step 1: Login as ceo-001...');
    const loginData = JSON.stringify({
      email: 'Robintejarat@gmail.com',
      password: 'admin123'
    });
    
    const loginOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData),
        'X-Tenant-Key': 'rabin'
      }
    };
    
    const loginResponse = await makeRequest(loginOptions, loginData);
    console.log('Login Status:', loginResponse.statusCode);
    
    if (loginResponse.statusCode !== 200) {
      console.log('❌ Login failed!');
      console.log('Response:', loginResponse.body);
      return;
    }
    
    const loginResult = JSON.parse(loginResponse.body);
    console.log('✅ Login successful!');
    console.log('User:', loginResult.user?.name);
    
    // استخراج token از cookies
    let token = null;
    for (const cookie of loginResponse.cookies) {
      if (cookie.startsWith('tenant_token=')) {
        token = cookie.split(';')[0].split('=')[1];
        break;
      }
      if (cookie.startsWith('auth-token=')) {
        token = cookie.split(';')[0].split('=')[1];
        break;
      }
    }
    
    if (!token) {
      console.log('❌ No token found in response!');
      console.log('Cookies:', loginResponse.cookies);
      return;
    }
    
    console.log('Token:', token.substring(0, 50) + '...');
    
    // Step 2: Get Permissions
    console.log('\nStep 2: Getting permissions...');
    const permissionsOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/permissions',
      method: 'GET',
      headers: {
        'Cookie': `tenant_token=${token}`,
        'X-Tenant-Key': 'rabin'
      }
    };
    
    const permissionsResponse = await makeRequest(permissionsOptions);
    console.log('Permissions Status:', permissionsResponse.statusCode);
    
    if (permissionsResponse.statusCode !== 200) {
      console.log('❌ Permissions request failed!');
      console.log('Response:', permissionsResponse.body);
      return;
    }
    
    const permissionsResult = JSON.parse(permissionsResponse.body);
    
    if (permissionsResult.success && permissionsResult.data) {
      console.log('✅ Permissions loaded successfully!');
      console.log(`\nFound ${permissionsResult.data.length} menu items:`);
      permissionsResult.data.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.display_name || item.module} (${item.route || 'no route'})`);
      });
      
      console.log('\n✅ All tests passed! Sidebar should work now.');
    } else {
      console.log('❌ Failed to load permissions');
      console.log('Response:', permissionsResponse.body);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

fullTest();
