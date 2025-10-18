#!/usr/bin/env node

const mysql = require('mysql2/promise');

async function testPermissionsResponse() {
  console.log('\n🔍 Testing Permissions API Response...\n');
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

    // Simulate the API query
    console.log('1️⃣ Simulating API query:');
    console.log('-'.repeat(80));
    
    const [modulePermissions] = await connection.query(`
      SELECT 
        m.name as module,
        m.display_name,
        m.route,
        m.icon,
        ump.granted as can_view
      FROM user_module_permissions ump
      JOIN modules m ON ump.module_id = m.id
      WHERE ump.user_id = ? AND ump.granted = 1 AND m.is_active = 1
      ORDER BY m.sort_order
    `, [userId]);

    console.log(`   Found ${modulePermissions.length} modules:\n`);
    
    modulePermissions.forEach((p, index) => {
      console.log(`   ${index + 1}. ${p.display_name} (${p.module})`);
      console.log(`      Route: ${p.route}`);
      console.log(`      Icon: ${p.icon}`);
      console.log('');
    });

    // Show what the API would return
    console.log('2️⃣ API Response Format:');
    console.log('-'.repeat(80));
    
    const apiResponse = modulePermissions.map(p => ({
      module: p.module,
      display_name: p.display_name,
      route: p.route,
      icon: p.icon,
      can_view: 1,
      can_create: 1,
      can_edit: 1,
      can_delete: 1
    }));

    console.log(JSON.stringify({
      success: true,
      data: apiResponse.slice(0, 5), // Show first 5
      user: {
        id: userId,
        name: 'مهندس کریمی',
        email: 'Robintejarat@gmail.com',
        role: 'ceo'
      }
    }, null, 2));

    console.log(`\n   ... and ${apiResponse.length - 5} more modules\n`);

    console.log('='.repeat(80));
    console.log('\n✅ Test complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testPermissionsResponse().catch(console.error);
