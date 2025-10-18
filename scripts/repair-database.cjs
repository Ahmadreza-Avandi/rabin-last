#!/usr/bin/env node

/**
 * اسکریپت تعمیر دیتابیس MySQL/MariaDB
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const DB_CONFIG = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD,
};

async function repairDatabase() {
  let connection;
  
  try {
    console.log('🔌 اتصال به MySQL...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ اتصال برقرار شد\n');

    // دریافت لیست دیتابیس‌ها
    const [databases] = await connection.query('SHOW DATABASES');
    
    for (const db of databases) {
      const dbName = db.Database;
      
      // Skip system databases
      if (['information_schema', 'performance_schema', 'mysql', 'sys'].includes(dbName)) {
        continue;
      }

      console.log(`🔧 تعمیر دیتابیس: ${dbName}`);
      
      try {
        // انتخاب دیتابیس
        await connection.query(`USE \`${dbName}\``);
        
        // دریافت لیست جداول
        const [tables] = await connection.query('SHOW TABLES');
        
        for (const table of tables) {
          const tableName = Object.values(table)[0];
          
          try {
            console.log(`   📋 تعمیر جدول: ${tableName}`);
            await connection.query(`REPAIR TABLE \`${tableName}\``);
          } catch (error) {
            console.log(`   ⚠️  خطا در تعمیر ${tableName}: ${error.message}`);
          }
        }
        
        console.log(`✅ دیتابیس ${dbName} تعمیر شد\n`);
      } catch (error) {
        console.log(`❌ خطا در تعمیر ${dbName}: ${error.message}\n`);
      }
    }

    console.log('✨ تعمیر دیتابیس‌ها کامل شد!');

  } catch (error) {
    console.error('❌ خطا:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 اتصال بسته شد');
    }
  }
}

repairDatabase();
