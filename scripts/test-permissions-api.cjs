#!/usr/bin/env node

const mysql = require('mysql2/promise');

async function testPermissionsAPI() {
  console.log('\n🔍 Testing Permissions API Requirements...\n');
  console.log('='.repeat(80));

  let connection;

  try {
    // Test connection with root (empty password)
    console.log('\n1️⃣ Testing Database Connection:');
    console.log('-'.repeat(80));
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      port: 3306,
      database: 'crm_system'
    });

    console.log('✅ Connected to crm_system\n');

    // Check users table
    console.log('2️⃣ Checking Users Table:');
    console.log('-'.repeat(80));
    const [users] = await connection.query(`
      SELECT id, name, email, role, status 
      FROM users 
      WHERE status = 'active'
      LIMIT 5
    `);
    
    console.log(`   Found ${users.length} active users:`);
    users.forEach(u => {
      console.log(`   - ${u.name} (${u.role})`);
    });

    // Check if modules table exists
    console.log('\n3️⃣ Checking Modules Table:');
    console.log('-'.repeat(80));
    try {
      const [modules] = await connection.query(`
        SELECT id, name, display_name 
        FROM modules 
        WHERE is_active = true
        LIMIT 5
      `);
      console.log(`   ✅ Modules table exists with ${modules.length} active modules`);
    } catch (error) {
      console.log('   ⚠️  Modules table does not exist (will use default modules)');
    }

    // Check if user_module_permissions table exists
    console.log('\n4️⃣ Checking User Module Permissions Table:');
    console.log('-'.repeat(80));
    try {
      const [permissions] = await connection.query(`
        SELECT COUNT(*) as count 
        FROM user_module_permissions
      `);
      console.log(`   ✅ user_module_permissions table exists with ${permissions[0].count} records`);
    } catch (error) {
      console.log('   ⚠️  user_module_permissions table does not exist');
      console.log('   💡 Creating table...');
      
      try {
        await connection.query(`
          CREATE TABLE IF NOT EXISTS user_module_permissions (
            id VARCHAR(36) PRIMARY KEY,
            user_id INT NOT NULL,
            module_id VARCHAR(36) NOT NULL,
            granted BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_module (user_id, module_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✅ user_module_permissions table created');
      } catch (createError) {
        console.log('   ❌ Failed to create table:', createError.message);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Permissions API requirements check complete!\n');
    console.log('🎯 Next Steps:');
    console.log('1. Restart your Next.js application');
    console.log('2. The permissions API should now work correctly\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testPermissionsAPI().catch(console.error);
