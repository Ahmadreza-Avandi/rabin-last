const http = require('http');

async function testPermissionsAPI() {
  console.log('🧪 Testing permissions API...\n');
  
  // فرض میکنیم token داریم (باید از login گرفته بشه)
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjZW8tMDAxIiwidGVuYW50S2V5IjoicmFiaW4iLCJpYXQiOjE3Mzk3MjE2MDAsImV4cCI6MTczOTgwODAwMH0.example';
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/permissions',
    method: 'GET',
    headers: {
      'Cookie': `tenant_token=${token}`,
      'X-Tenant-Key': 'rabin'
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', data);
        
        try {
          const json = JSON.parse(data);
          if (json.success && json.data) {
            console.log('\n✅ Permissions loaded successfully!');
            console.log(`Found ${json.data.length} menu items:`);
            json.data.forEach(item => {
              console.log(`  - ${item.display_name || item.module}`);
            });
          } else {
            console.log('\n❌ Failed to load permissions');
          }
        } catch (e) {
          console.log('Could not parse JSON');
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      reject(error);
    });
    
    req.end();
  });
}

testPermissionsAPI().catch(console.error);
