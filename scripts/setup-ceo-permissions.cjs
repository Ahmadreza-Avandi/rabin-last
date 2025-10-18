#!/usr/bin/env node

const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

async function setupCEOPermissions() {
  console.log('\n🔐 Setting up CEO Permissions...\n');
  console.log('='.repeat(80));

  let connection;

  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      port: 3306,
      database: 'crm_system'
    });

    console.log('✅ Connected to crm_system\n');

    // Get all CEO users
    console.log('1️⃣ Finding CEO users:');
    console.log('-'.repeat(80));
    
    const [ceoUsers] = await connection.query(`
      SELECT id, name, email, role 
      FROM users 
      WHERE role IN ('ceo', 'مدیر') AND status = 'active'
    `);

    console.log(`   Found ${ceoUsers.length} CEO users:\n`);
    ceoUsers.forEach(u => {
      console.log(`   - ${u.name} (${u.email})`);
    });

    // Get all active modules
    console.log('\n2️⃣ Getting active modules:');
    console.log('-'.repeat(80));
    
    const [modules] = await connection.query(`
      SELECT id, name, display_name 
      FROM modules 
      WHERE is_active = 1
      ORDER BY sort_order
    `);

    console.log(`   Found ${modules.length} active modules:\n`);
    modules.forEach(m => {
      console.log(`   - ${m.display_name} (${m.name})`);
    });

    // Grant all modules to all CEOs
    console.log('\n3️⃣ Granting permissions:');
    console.log('-'.repeat(80));

    for (const user of ceoUsers) {
      console.log(`\n   Processing ${user.name}:`);
      
      for (const module of modules) {
        // Check if permission already exists
        const [existing] = await connection.query(
          'SELECT id FROM user_module_permissions WHERE user_id = ? AND module_id = ?',
          [user.id, module.id]
        );

        if (existing.length > 0) {
          // Update existing
          await connection.query(
            'UPDATE user_module_permissions SET granted = 1, updated_at = NOW() WHERE user_id = ? AND module_id = ?',
            [user.id, module.id]
          );
          console.log(`      ✓ Updated ${module.name}`);
        } else {
          // Insert new
          await connection.query(
            `INSERT INTO user_module_permissions (id, user_id, module_id, granted, created_at, updated_at)
             VALUES (?, ?, ?, 1, NOW(), NOW())`,
            [uuidv4(), user.id, module.id]
          );
          console.log(`      ✅ Granted ${module.name}`);
        }
      }
    }

    // Verify
    console.log('\n4️⃣ Verifying permissions:');
    console.log('-'.repeat(80));
    
    for (const user of ceoUsers) {
      const [count] = await connection.query(
        'SELECT COUNT(*) as count FROM user_module_permissions WHERE user_id = ? AND granted = 1',
        [user.id]
      );
      console.log(`   ${user.name}: ${count[0].count} modules granted`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ CEO permissions setup complete!\n');
    console.log('🎯 Refresh your dashboard to see the changes\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupCEOPermissions().catch(console.error);
