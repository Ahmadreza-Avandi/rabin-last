const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:09034835138@localhost:5432/crm_master'
});

async function checkRabinData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking Rabin tenant data...\n');
    
    // Get tenant info
    const tenantResult = await client.query(
      "SELECT * FROM tenants WHERE tenant_key = 'rabin'"
    );
    
    if (tenantResult.rows.length === 0) {
      console.log('❌ Tenant "rabin" not found!');
      return;
    }
    
    const tenant = tenantResult.rows[0];
    console.log('✅ Tenant found:', {
      id: tenant.id,
      name: tenant.name,
      tenant_key: tenant.tenant_key,
      db_name: tenant.db_name
    });
    
    // Connect to tenant database
    const tenantPool = new Pool({
      connectionString: `postgresql://postgres:09034835138@localhost:5432/${tenant.db_name}`
    });
    
    const tenantClient = await tenantPool.connect();
    
    try {
      // Check users
      const usersResult = await tenantClient.query('SELECT COUNT(*) FROM users');
      console.log(`\n👥 Users: ${usersResult.rows[0].count}`);
      
      if (parseInt(usersResult.rows[0].count) > 0) {
        const usersList = await tenantClient.query('SELECT id, name, email, role FROM users LIMIT 5');
        console.log('Sample users:');
        usersList.rows.forEach(u => {
          console.log(`  - ${u.name} (${u.email}) - ${u.role}`);
        });
      }
      
      // Check customers
      const customersResult = await tenantClient.query('SELECT COUNT(*) FROM customers');
      console.log(`\n🏢 Customers: ${customersResult.rows[0].count}`);
      
      if (parseInt(customersResult.rows[0].count) > 0) {
        const customersList = await tenantClient.query('SELECT id, name, email FROM customers LIMIT 5');
        console.log('Sample customers:');
        customersList.rows.forEach(c => {
          console.log(`  - ${c.name} (${c.email})`);
        });
      }
      
      // Check tasks
      const tasksResult = await tenantClient.query('SELECT COUNT(*) FROM tasks');
      console.log(`\n📋 Tasks: ${tasksResult.rows[0].count}`);
      
      if (parseInt(tasksResult.rows[0].count) > 0) {
        const tasksList = await tenantClient.query('SELECT id, title, status FROM tasks LIMIT 5');
        console.log('Sample tasks:');
        tasksList.rows.forEach(t => {
          console.log(`  - ${t.title} (${t.status})`);
        });
      }
      
    } finally {
      tenantClient.release();
      await tenantPool.end();
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkRabinData();
