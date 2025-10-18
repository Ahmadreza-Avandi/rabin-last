const mysql = require('mysql2/promise');

async function fullDiagnostic() {
  console.log('🔍 Full System Diagnostic\n');
  console.log('='.repeat(60));
  
  try {
    // 1. Check Master Database
    console.log('\n📊 1. Checking Master Database (saas_master)...');
    const masterConnection = await mysql.createConnection({
      host: 'localhost',
      user: 'crm_user',
      password: '1234',
      database: 'saas_master'
    });
    
    const [tenants] = await masterConnection.query(
      "SELECT * FROM tenants WHERE tenant_key = 'rabin'"
    );
    
    if (tenants.length === 0) {
      console.log('❌ Tenant "rabin" NOT FOUND in saas_master!');
      await masterConnection.end();
      return;
    }
    
    const tenant = tenants[0];
    console.log('✅ Tenant found:');
    console.log(`   - ID: ${tenant.id}`);
    console.log(`   - Name: ${tenant.name || 'N/A'}`);
    console.log(`   - Key: ${tenant.tenant_key}`);
    console.log(`   - DB Name: ${tenant.db_name}`);
    console.log(`   - DB Host: ${tenant.db_host}`);
    console.log(`   - DB User: ${tenant.db_user}`);
    
    await masterConnection.end();
    
    // 2. Check Tenant Database
    console.log(`\n📊 2. Checking Tenant Database (${tenant.db_name})...`);
    const tenantConnection = await mysql.createConnection({
      host: tenant.db_host,
      user: tenant.db_user,
      password: tenant.db_password,
      database: tenant.db_name
    });
    
    // Check tables
    const [tables] = await tenantConnection.query('SHOW TABLES');
    console.log(`✅ Database has ${tables.length} tables`);
    
    // Check users table structure
    console.log('\n📋 Users Table:');
    const [usersCount] = await tenantConnection.query('SELECT COUNT(*) as count FROM users');
    console.log(`   - Total: ${usersCount[0].count} users`);
    
    if (usersCount[0].count > 0) {
      const [userColumns] = await tenantConnection.query('DESCRIBE users');
      console.log('   - Columns:', userColumns.map(c => c.Field).join(', '));
      
      const [sampleUsers] = await tenantConnection.query(
        'SELECT id, name, email, role, status FROM users LIMIT 3'
      );
      console.log('   - Sample data:');
      sampleUsers.forEach(u => {
        console.log(`     • ${u.name} (${u.email}) - ${u.role} - ${u.status || 'N/A'}`);
      });
    }
    
    // Check customers table structure
    console.log('\n📋 Customers Table:');
    const [customersCount] = await tenantConnection.query('SELECT COUNT(*) as count FROM customers');
    console.log(`   - Total: ${customersCount[0].count} customers`);
    
    if (customersCount[0].count > 0) {
      const [customerColumns] = await tenantConnection.query('DESCRIBE customers');
      console.log('   - Columns:', customerColumns.map(c => c.Field).join(', '));
      
      const [sampleCustomers] = await tenantConnection.query(
        'SELECT id, name, email, phone FROM customers LIMIT 3'
      );
      console.log('   - Sample data:');
      sampleCustomers.forEach(c => {
        console.log(`     • ${c.name} - ${c.email || 'no email'} - ${c.phone || 'no phone'}`);
      });
    }
    
    // Check tasks table
    console.log('\n📋 Tasks Table:');
    const [tasksCount] = await tenantConnection.query('SELECT COUNT(*) as count FROM tasks');
    console.log(`   - Total: ${tasksCount[0].count} tasks`);
    
    await tenantConnection.end();
    
    // 3. Check API Response Format
    console.log('\n📊 3. Expected API Response Formats:');
    console.log('   /api/tenant/users should return:');
    console.log('   { success: true, users: [...] }');
    console.log('');
    console.log('   /api/tenant/customers should return:');
    console.log('   { success: true, customers: [...] }');
    
    // 4. Check Frontend Code
    console.log('\n📊 4. Frontend Requirements:');
    console.log('   ✓ useParams() to get tenant_key');
    console.log('   ✓ X-Tenant-Key header in all fetch calls');
    console.log('   ✓ Authorization header with Bearer token');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Diagnostic Complete!');
    console.log('\nNext Steps:');
    console.log('1. Restart your Next.js dev server');
    console.log('2. Clear browser cache and cookies');
    console.log('3. Login again at http://localhost:3000/rabin/login');
    console.log('4. Check browser console for any errors');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 MySQL server is not running');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Database does not exist');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Access denied - check credentials');
    } else {
      console.error(error);
    }
  }
}

fullDiagnostic();
