const http = require('http');

function makeRequest(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testAPIs() {
  console.log('🧪 Testing APIs directly...\n');
  
  // Test 1: Without headers
  console.log('1️⃣ Test /api/tenant/users WITHOUT headers:');
  try {
    const result1 = await makeRequest('/api/tenant/users');
    console.log(`   Status: ${result1.status}`);
    console.log(`   Response:`, result1.data);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 2: With X-Tenant-Key only
  console.log('\n2️⃣ Test /api/tenant/users WITH X-Tenant-Key only:');
  try {
    const result2 = await makeRequest('/api/tenant/users', {
      'X-Tenant-Key': 'rabin'
    });
    console.log(`   Status: ${result2.status}`);
    console.log(`   Response:`, result2.data);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 3: With X-Tenant-Key and fake token
  console.log('\n3️⃣ Test /api/tenant/users WITH X-Tenant-Key and Cookie:');
  console.log('   (You need to get a real token from browser)');
  console.log('   Open browser console and run:');
  console.log('   document.cookie.split("; ").find(r => r.startsWith("tenant_token="))');
  
  console.log('\n📝 Instructions:');
  console.log('1. Make sure Next.js dev server is running');
  console.log('2. Login at http://localhost:3000/rabin/login');
  console.log('3. Open browser console (F12)');
  console.log('4. Run: document.cookie');
  console.log('5. Copy the tenant_token value');
  console.log('6. Check Network tab to see actual requests');
}

testAPIs();
