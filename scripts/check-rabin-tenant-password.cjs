const mysql = require('mysql2/promise');

async function checkRabinTenant() {
  let connection;
  
  try {
    // اتصال به saas_master database
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'saas_master'
    });
    
    console.log('✅ Connected to saas_master database');
    
    // دریافت اطلاعات tenant rabin
    const [tenants] = await connection.query(
      'SELECT * FROM tenants WHERE tenant_key = ?',
      ['rabin']
    );
    
    if (tenants.length === 0) {
      console.log('❌ Tenant rabin not found!');
      return;
    }
    
    const tenant = tenants[0];
    console.log('\n📊 Tenant rabin info:');
    console.log('ID:', tenant.id);
    console.log('Name:', tenant.name);
    console.log('Tenant Key:', tenant.tenant_key);
    console.log('DB Name:', tenant.db_name);
    console.log('DB Host:', tenant.db_host);
    console.log('DB Port:', tenant.db_port);
    console.log('DB User:', tenant.db_user);
    console.log('DB Password (encrypted):', tenant.db_password);
    console.log('DB Password length:', tenant.db_password ? tenant.db_password.length : 0);
    console.log('DB Password format:', tenant.db_password ? tenant.db_password.substring(0, 50) + '...' : 'NULL');
    console.log('Status:', tenant.status);
    
    // بررسی فرمت encrypted password
    if (tenant.db_password) {
      const parts = tenant.db_password.split(':');
      console.log('\n🔍 Password format analysis:');
      console.log('Parts count:', parts.length);
      if (parts.length === 3) {
        console.log('✅ Format looks correct (iv:authTag:encrypted)');
        console.log('IV length:', parts[0].length);
        console.log('AuthTag length:', parts[1].length);
        console.log('Encrypted length:', parts[2].length);
      } else {
        console.log('❌ Format is incorrect! Expected 3 parts (iv:authTag:encrypted)');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkRabinTenant();
