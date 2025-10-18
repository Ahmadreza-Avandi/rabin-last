import pkg from 'pg';
const { Pool } = pkg;

const masterPool = new Pool({
  connectionString: 'postgresql://postgres:09034835138@localhost:5432/crm_master'
});

async function seedRabinData() {
  const client = await masterPool.connect();
  
  try {
    console.log('🌱 Seeding Rabin tenant data...\n');
    
    // Get tenant
    const tenantResult = await client.query(
      "SELECT * FROM tenants WHERE tenant_key = 'rabin'"
    );
    
    if (tenantResult.rows.length === 0) {
      console.log('❌ Tenant "rabin" not found!');
      return;
    }
    
    const tenant = tenantResult.rows[0];
    console.log('✅ Tenant found:', tenant.name);
    
    // Connect to tenant database
    const tenantPool = new Pool({
      connectionString: `postgresql://postgres:09034835138@localhost:5432/${tenant.db_name}`
    });
    
    const tenantClient = await tenantPool.connect();
    
    try {
      // Check if data already exists
      const usersCount = await tenantClient.query('SELECT COUNT(*) FROM users');
      
      if (parseInt(usersCount.rows[0].count) > 0) {
        console.log(`\n✅ Data already exists (${usersCount.rows[0].count} users)`);
        console.log('Skipping seed...');
        return;
      }
      
      console.log('\n📝 Adding sample users...');
      
      // Add sample users
      const users = [
        { name: 'علی احمدی', email: 'ali@rabin.com', role: 'ceo', password: '$2a$10$abcdefghijklmnopqrstuv' },
        { name: 'سارا محمدی', email: 'sara@rabin.com', role: 'sales_manager', password: '$2a$10$abcdefghijklmnopqrstuv' },
        { name: 'رضا کریمی', email: 'reza@rabin.com', role: 'sales', password: '$2a$10$abcdefghijklmnopqrstuv' },
      ];
      
      for (const user of users) {
        await tenantClient.query(
          `INSERT INTO users (name, email, role, password, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [user.name, user.email, user.role, user.password]
        );
        console.log(`  ✅ Added user: ${user.name}`);
      }
      
      console.log('\n📝 Adding sample customers...');
      
      // Add sample customers
      const customers = [
        { name: 'شرکت تکنولوژی پارس', email: 'info@pars-tech.com', phone: '02112345678' },
        { name: 'شرکت بازرگانی آریا', email: 'contact@arya.com', phone: '02187654321' },
        { name: 'موسسه مهندسی سپهر', email: 'info@sepehr.com', phone: '02155555555' },
      ];
      
      for (const customer of customers) {
        await tenantClient.query(
          `INSERT INTO customers (name, email, phone, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())`,
          [customer.name, customer.email, customer.phone]
        );
        console.log(`  ✅ Added customer: ${customer.name}`);
      }
      
      console.log('\n✅ Seed completed successfully!');
      
    } finally {
      tenantClient.release();
      await tenantPool.end();
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await masterPool.end();
  }
}

seedRabinData();
