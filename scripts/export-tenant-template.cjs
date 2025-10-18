#!/usr/bin/env node

/**
 * اسکریپت Export کردن Template دیتابیس Tenant
 * 
 * این اسکریپت ساختار دیتابیس crm_system را export می‌کند
 * (بدون data) برای استفاده به‌عنوان template برای tenant های جدید
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// تنظیمات اتصال
const DB_CONFIG = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD,
  database: 'crm_system'
};

async function exportTenantTemplate() {
  let connection;
  
  try {
    console.log('🔌 اتصال به دیتابیس crm_system...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ اتصال برقرار شد\n');
    
    // دریافت لیست جداول
    console.log('📊 دریافت لیست جداول...');
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    console.log(`✅ ${tableNames.length} جدول یافت شد:\n`);
    tableNames.forEach(name => console.log(`   - ${name}`));
    
    // ایجاد SQL template
    let sqlTemplate = `-- =====================================================
-- Tenant Database Template
-- =====================================================
-- این فایل ساختار دیتابیس برای tenant های جدید است
-- تاریخ ایجاد: ${new Date().toISOString()}
-- تعداد جداول: ${tableNames.length}

-- نوت: این فایل فقط ساختار جداول را شامل می‌شود (بدون data)

`;
    
    console.log('\n📝 Export کردن ساختار جداول...\n');
    
    // Export کردن ساختار هر جدول
    for (const tableName of tableNames) {
      console.log(`   📋 Export: ${tableName}`);
      
      // دریافت CREATE TABLE statement
      const [createTable] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
      const createStatement = createTable[0]['Create Table'];
      
      // اضافه کردن به template
      sqlTemplate += `-- =====================================================\n`;
      sqlTemplate += `-- جدول: ${tableName}\n`;
      sqlTemplate += `-- =====================================================\n`;
      sqlTemplate += `DROP TABLE IF EXISTS \`${tableName}\`;\n\n`;
      sqlTemplate += createStatement + ';\n\n';
    }
    
    // اضافه کردن یک کاربر admin پیش‌فرض (با password موقت)
    sqlTemplate += `-- =====================================================\n`;
    sqlTemplate += `-- داده‌های اولیه\n`;
    sqlTemplate += `-- =====================================================\n\n`;
    sqlTemplate += `-- نوت: کاربر admin با password موقت ایجاد می‌شود\n`;
    sqlTemplate += `-- Password باید توسط اسکریپت ایجاد tenant تنظیم شود\n\n`;
    
    // ذخیره فایل
    const outputPath = path.join(__dirname, '..', 'database', 'tenant-template.sql');
    fs.writeFileSync(outputPath, sqlTemplate, 'utf8');
    
    console.log('\n✅ Template با موفقیت ایجاد شد!');
    console.log(`📁 مسیر فایل: ${outputPath}`);
    console.log(`📊 تعداد جداول: ${tableNames.length}`);
    console.log(`💾 حجم فایل: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
    
    // نمایش خلاصه جداول
    console.log('\n📋 خلاصه جداول:');
    const categories = {
      'کاربران و احراز هویت': ['users', 'user_sessions', 'permissions'],
      'مشتریان': ['customers', 'customer_contacts', 'customer_segments'],
      'فروش': ['deals', 'deal_stages', 'deal_products'],
      'وظایف و فعالیت‌ها': ['tasks', 'activities', 'calendar_events'],
      'اسناد': ['documents', 'document_categories'],
      'نوتیفیکیشن': ['notifications', 'notification_settings'],
      'بازخورد': ['feedback', 'feedback_responses'],
      'تنظیمات': ['settings', 'system_settings']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      const matchedTables = tableNames.filter(name => 
        keywords.some(keyword => name.includes(keyword))
      );
      if (matchedTables.length > 0) {
        console.log(`\n   ${category}:`);
        matchedTables.forEach(name => console.log(`      - ${name}`));
      }
    }
    
  } catch (error) {
    console.error('\n❌ خطا در export:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 اتصال بسته شد');
    }
  }
}

// اجرای اسکریپت
if (require.main === module) {
  exportTenantTemplate();
}

module.exports = { exportTenantTemplate };
