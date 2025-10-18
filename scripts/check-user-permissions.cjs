#!/usr/bin/env node

const mysql = require('mysql2/promise');

async function checkUserPermissions() {
  console.log('\n🔍 Checking User Permissions...\n');
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

    const userId = 'ceo-001';

    // Check user
    console.log(`1️⃣ Checking user ${userId}:`);
    console.log('-'.repeat(80));
    
    const [users] = await connection.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length > 0) {
      const user = users[0];
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
    } else {
      console.log(`   ❌ User not found`);
    }

    // Check module permissions
    console.log(`\n2️⃣ Module Permissions for ${userId}:`);
    console.log('-'.repeat(80));
    
    const [modulePerms] = await connection.query(`
      SELECT 
        m.name as module,
        m.display_name,
        m.route,
        m.icon,
        ump.granted
      FROM user_module_permissions ump
      JOIN modules m ON ump.module_id = m.id
      WHERE ump.user_id = ? AND m.is_active = 1
      ORDER BY m.sort_order
    `, [userId]);

    console.log(`   Found ${modulePerms.length} module permissions:\n`);
    modulePerms.forEach(p => {
      const status = p.granted ? '✅' : '❌';
      console.log(`   ${status} ${p.display_name} (${p.module}) - ${p.route}`);
    });

    // Check resource permissions
    console.log(`\n3️⃣ Resource Permissions for ${userId}:`);
    console.log('-'.repeat(80));
    
    const [resourcePerms] = await connection.query(`
      SELECT resource, action, granted
      FROM user_permissions
      WHERE user_id = ?
      ORDER BY resource, action
    `, [userId]);

    console.log(`   Found ${resourcePerms.length} resource permissions:\n`);
    const grouped = {};
    resourcePerms.forEach(p => {
      if (!grouped[p.resource]) {
        grouped[p.resource] = [];
      }
      grouped[p.resource].push({ action: p.action, granted: p.granted });
    });

    Object.keys(grouped).forEach(resource => {
      console.log(`   📦 ${resource}:`);
      grouped[resource].forEach(p => {
        const status = p.granted ? '✅' : '❌';
        console.log(`      ${status} ${p.action}`);
      });
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Check complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkUserPermissions().catch(console.error);
