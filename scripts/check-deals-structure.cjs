const mysql = require('mysql2/promise');

async function checkStructure() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'crm_user',
      password: '1234',
      database: 'crm_system'
    });

    console.log('📋 ساختار جدول deals:\n');
    const [columns] = await connection.query('SHOW COLUMNS FROM deals');
    console.table(columns.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null, Key: c.Key, Default: c.Default })));

    console.log('\n📊 نمونه داده:');
    const [rows] = await connection.query('SELECT * FROM deals LIMIT 3');
    console.table(rows);

  } catch (error) {
    console.error('❌ خطا:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkStructure();
