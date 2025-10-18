const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabaseStructure() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'crm_system'
    });
    
    console.log('✓ Connected to database\n');
    
    // Get all tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Available Tables:');
    console.log('='.repeat(80));
    tables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`${index + 1}. ${tableName}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 Table Structures:');
    console.log('='.repeat(80) + '\n');
    
    // Check important tables
    const importantTables = [
      'users',
      'customers', 
      'products',
      'sales',
      'sale_items',
      'contacts',
      'activities',
      'tasks',
      'task_assignees',
      'events',
      'deals',
      'permissions',
      'user_permissions'
    ];
    
    for (const tableName of importantTables) {
      try {
        const [columns] = await connection.execute(`SHOW COLUMNS FROM ${tableName}`);
        console.log(`\n📦 Table: ${tableName}`);
        console.log('-'.repeat(80));
        columns.forEach(col => {
          console.log(`  ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
        });
        
        // Get row count
        const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`  📊 Total rows: ${count[0].count}`);
      } catch (error) {
        console.log(`\n❌ Table: ${tableName} - NOT FOUND`);
      }
    }
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDatabaseStructure();
