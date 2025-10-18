const mysql = require('mysql2/promise');

async function checkPermissions() {
  let connection;
  
  try {
    // اتصال به crm_system
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'crm_system'
    });
    
    console.log('✅ Connected to crm_system database\n');
    
    // بررسی جداول موجود
    const [tables] = await connection.query('SHOW TABLES');
    console.log('📊 Available tables:');
    tables.forEach(t => console.log('  -', Object.values(t)[0]));
    
    // بررسی جدول modules
    console.log('\n📋 Checking modules table...');
    try {
      const [modules] = await connection.query('SELECT * FROM modules ORDER BY sort_order');
      console.log(`Found ${modules.length} modules:`);
      modules.forEach(m => {
        console.log(`  - ${m.name} (${m.display_name}) - Active: ${m.is_active}, Route: ${m.route}`);
      });
    } catch (error) {
      console.log('❌ modules table error:', error.message);
    }
    
    // بررسی جدول user_module_permissions
    console.log('\n🔐 Checking user_module_permissions table...');
    try {
      const [permissions] = await connection.query(`
        SELECT ump.*, m.name as module_name, m.display_name, u.name as user_name, u.role
        FROM user_module_permissions ump
        LEFT JOIN modules m ON ump.module_id = m.id
        LEFT JOIN users u ON ump.user_id = u.id
        ORDER BY ump.user_id, m.sort_order
      `);
      console.log(`Found ${permissions.length} permissions:`);
      permissions.forEach(p => {
        console.log(`  - User: ${p.user_name} (${p.role}) -> Module: ${p.module_name} (${p.display_name}) - Granted: ${p.granted}`);
      });
    } catch (error) {
      console.log('❌ user_module_permissions table error:', error.message);
    }
    
    // بررسی کاربر ceo-001
    console.log('\n👤 Checking user ceo-001...');
    try {
      const [users] = await connection.query('SELECT * FROM users WHERE id = ?', ['ceo-001']);
      if (users.length > 0) {
        const user = users[0];
        console.log('User found:');
        console.log('  ID:', user.id);
        console.log('  Name:', user.name);
        console.log('  Email:', user.email);
        console.log('  Role:', user.role);
        console.log('  Status:', user.status);
        
        // دریافت permissions این کاربر
        const [userPerms] = await connection.query(`
          SELECT ump.*, m.name as module_name, m.display_name, m.route, m.icon
          FROM user_module_permissions ump
          JOIN modules m ON ump.module_id = m.id
          WHERE ump.user_id = ? AND ump.granted = 1 AND m.is_active = 1
          ORDER BY m.sort_order
        `, ['ceo-001']);
        
        console.log(`\n  Permissions (${userPerms.length}):`);
        userPerms.forEach(p => {
          console.log(`    ✓ ${p.module_name} (${p.display_name}) - Route: ${p.route}`);
        });
      } else {
        console.log('❌ User ceo-001 not found!');
      }
    } catch (error) {
      console.log('❌ Error checking user:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkPermissions();
