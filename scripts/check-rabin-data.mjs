import { PrismaClient as MasterPrismaClient } from '@prisma/client';

const masterPrisma = new MasterPrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:09034835138@localhost:5432/crm_master'
    }
  }
});

async function checkRabinData() {
  try {
    console.log('🔍 Checking Rabin tenant data...\n');
    
    // Get tenant info
    const tenant = await masterPrisma.tenant.findUnique({
      where: { tenant_key: 'rabin' }
    });
    
    if (!tenant) {
      console.log('❌ Tenant "rabin" not found!');
      return;
    }
    
    console.log('✅ Tenant found:', {
      id: tenant.id,
      name: tenant.name,
      tenant_key: tenant.tenant_key,
      db_name: tenant.db_name
    });
    
    // Connect to tenant database
    const { PrismaClient: TenantPrismaClient } = await import('@prisma/client');
    const tenantPrisma = new TenantPrismaClient({
      datasources: {
        db: {
          url: `postgresql://postgres:09034835138@localhost:5432/${tenant.db_name}`
        }
      }
    });
    
    // Check users
    const usersCount = await tenantPrisma.user.count();
    console.log(`\n👥 Users: ${usersCount}`);
    
    if (usersCount > 0) {
      const users = await tenantPrisma.user.findMany({ take: 5 });
      console.log('Sample users:');
      users.forEach(u => {
        console.log(`  - ${u.name} (${u.email}) - ${u.role}`);
      });
    }
    
    // Check customers
    const customersCount = await tenantPrisma.customer.count();
    console.log(`\n🏢 Customers: ${customersCount}`);
    
    if (customersCount > 0) {
      const customers = await tenantPrisma.customer.findMany({ take: 5 });
      console.log('Sample customers:');
      customers.forEach(c => {
        console.log(`  - ${c.name} (${c.email || 'no email'})`);
      });
    }
    
    // Check tasks
    const tasksCount = await tenantPrisma.task.count();
    console.log(`\n📋 Tasks: ${tasksCount}`);
    
    if (tasksCount > 0) {
      const tasks = await tenantPrisma.task.findMany({ take: 5 });
      console.log('Sample tasks:');
      tasks.forEach(t => {
        console.log(`  - ${t.title} (${t.status})`);
      });
    }
    
    await tenantPrisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await masterPrisma.$disconnect();
  }
}

checkRabinData();
