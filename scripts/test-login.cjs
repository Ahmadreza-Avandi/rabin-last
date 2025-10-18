#!/usr/bin/env node

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function testLogin() {
  console.log('\n🔐 Testing Login Process...\n');
  console.log('='.repeat(80));

  let connection;

  try {
    // Connect to crm_system
    console.log('\n1️⃣ Connecting to crm_system:');
    console.log('-'.repeat(80));
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      port: 3306,
      database: 'crm_system'
    });

    console.log('✅ Connected successfully\n');

    // Get users
    console.log('2️⃣ Available Users:');
    console.log('-'.repeat(80));
    const [users] = await connection.query(`
      SELECT id, name, email, role, status, password
      FROM users 
      WHERE status = 'active'
      LIMIT 5
    `);

    console.log(`   Found ${users.length} active users:\n`);
    
    for (const user of users) {
      console.log(`   👤 ${user.name}`);
      console.log(`      Email: ${user.email}`);
      console.log(`      Role: ${user.role}`);
      console.log(`      Password hash: ${user.password.substring(0, 20)}...`);
      
      // Test password
      const testPassword = '123456'; // Default password
      try {
        const isValid = await bcrypt.compare(testPassword, user.password);
        if (isValid) {
          console.log(`      ✅ Password '${testPassword}' works!`);
        } else {
          console.log(`      ❌ Password '${testPassword}' does NOT work`);
        }
      } catch (error) {
        console.log(`      ⚠️  Could not verify password`);
      }
      console.log('');
    }

    // Check tenant_key field
    console.log('3️⃣ Checking tenant_key field:');
    console.log('-'.repeat(80));
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM users LIKE 'tenant_key'
    `);

    if (columns.length > 0) {
      console.log('   ✅ tenant_key field exists\n');
      
      const [usersWithTenant] = await connection.query(`
        SELECT id, name, email, tenant_key
        FROM users 
        WHERE status = 'active'
        LIMIT 5
      `);

      usersWithTenant.forEach(u => {
        console.log(`   - ${u.name}: tenant_key = ${u.tenant_key || '(null)'}`);
      });
    } else {
      console.log('   ⚠️  tenant_key field does NOT exist');
      console.log('   💡 Adding tenant_key field...\n');
      
      try {
        await connection.query(`
          ALTER TABLE users 
          ADD COLUMN tenant_key VARCHAR(50) DEFAULT 'rabin' AFTER email
        `);
        console.log('   ✅ tenant_key field added');
        
        await connection.query(`
          UPDATE users SET tenant_key = 'rabin' WHERE tenant_key IS NULL
        `);
        console.log('   ✅ All users updated with tenant_key = rabin');
      } catch (error) {
        console.log('   ❌ Failed to add tenant_key:', error.message);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Login test complete!\n');
    console.log('🎯 Try logging in with:');
    console.log('   Email: Robintejarat@gmail.com');
    console.log('   Password: 123456\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testLogin().catch(console.error);
