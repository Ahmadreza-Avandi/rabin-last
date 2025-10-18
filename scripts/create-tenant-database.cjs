#!/usr/bin/env node

/**
 * اسکریپت ایجاد Tenant Database
 * 
 * این اسکریپت:
 * 1. دیتابیس جدید با نام crm_tenant_{tenant_key} ایجاد می‌کند
 * 2. ساختار جداول را از template کپی می‌کند
 * 3. کاربر دیتابیس اختصاصی user_{tenant_key} ایجاد می‌کند
 * 4. اطلاعات را encrypt کرده و در saas_master ذخیره می‌کند
 * 5. یک کاربر admin پیش‌فرض در tenant ایجاد می‌کند
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// تنظیمات اتصال
const DB_CONFIG = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD,
  multipleStatements: true
};

/**
 * Encrypt کردن password
 */
function encryptPassword(password) {
  const key = process.env.DB_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('DB_ENCRYPTION_KEY not set');
  }
  
  const keyBuffer = key.length === 64 
    ? Buffer.from(key, 'hex')
    : crypto.createHash('sha256').update(key).digest();
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
  
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * تولید password تصادفی
 */
function generateRandomPassword(length = 16) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * ایجاد tenant database
 */
async function createTenantDatabase(tenantData) {
  const {
    tenant_key,
    company_name,
    admin_email,
    admin_name,
    admin_phone,
    admin_password,
    plan_key = 'basic',
    subscription_months = 12
  } = tenantData;
  
  let connection;
  let tenantConnection;
  
  try {
    console.log(`\n🚀 شروع ایجاد tenant: ${tenant_key}`);
    console.log(`📋 شرکت: ${company_name}`);
    console.log(`📧 ایمیل: ${admin_email}`);
    console.log(`📦 پلن: ${plan_key}`);
    console.log(`⏱️  مدت: ${subscription_months} ماه\n`);
    
    // اتصال به MySQL
    console.log('🔌 اتصال به MySQL...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ اتصال برقرار شد\n');
    
    // بررسی تکراری نبودن tenant_key
    console.log('🔍 بررسی تکراری نبودن tenant_key...');
    const [existing] = await connection.query(
      'SELECT id FROM saas_master.tenants WHERE tenant_key = ?',
      [tenant_key]
    );
    
    if (existing.length > 0) {
      throw new Error(`Tenant با کلید ${tenant_key} قبلا ایجاد شده است`);
    }
    console.log('✅ tenant_key معتبر است\n');
    
    // تولید اطلاعات دیتابیس
    const db_name = `crm_tenant_${tenant_key}`;
    const db_user = `user_${tenant_key}`;
    const db_password = generateRandomPassword(20);
    const db_password_encrypted = encryptPassword(db_password);
    
    console.log('📊 اطلاعات دیتابیس:');
    console.log(`   Database: ${db_name}`);
    console.log(`   User: ${db_user}`);
    console.log(`   Password: ${db_password} (encrypted)\n`);
    
    // ایجاد دیتابیس
    console.log('🗄️  ایجاد دیتابیس...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${db_name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ دیتابیس ${db_name} ایجاد شد\n`);
    
    // ایجاد کاربر دیتابیس
    console.log('👤 ایجاد کاربر دیتابیس...');
    await connection.query(`CREATE USER IF NOT EXISTS '${db_user}'@'%' IDENTIFIED BY '${db_password}'`);
    await connection.query(`GRANT ALL PRIVILEGES ON \`${db_name}\`.* TO '${db_user}'@'%'`);
    await connection.query('FLUSH PRIVILEGES');
    console.log(`✅ کاربر ${db_user} ایجاد شد\n`);
    
    // خواندن template
    console.log('📄 خواندن template...');
    const templatePath = path.join(__dirname, '..', 'database', 'tenant-template.sql');
    
    if (!fs.existsSync(templatePath)) {
      throw new Error('Template file not found. Run export-tenant-template.cjs first.');
    }
    
    const templateSQL = fs.readFileSync(templatePath, 'utf8');
    console.log('✅ Template خوانده شد\n');
    
    // اتصال به دیتابیس tenant
    console.log('🔌 اتصال به دیتابیس tenant...');
    tenantConnection = await mysql.createConnection({
      ...DB_CONFIG,
      database: db_name
    });
    console.log('✅ اتصال برقرار شد\n');
    
    // اجرای template
    console.log('⚙️  ایجاد جداول...');
    await tenantConnection.query(templateSQL);
    console.log('✅ جداول ایجاد شدند\n');
    
    // دریافت اطلاعات پلن
    console.log('📦 دریافت اطلاعات پلن...');
    const [plans] = await connection.query(
      'SELECT * FROM saas_master.subscription_plans WHERE plan_key = ?',
      [plan_key]
    );
    
    if (plans.length === 0) {
      throw new Error(`Plan ${plan_key} not found`);
    }
    
    const plan = plans[0];
    console.log(`✅ پلن ${plan.plan_name} یافت شد\n`);
    
    // محاسبه تاریخ انقضا
    const subscription_start = new Date();
    const subscription_end = new Date();
    subscription_end.setMonth(subscription_end.getMonth() + subscription_months);
    
    // ثبت tenant در master database
    console.log('💾 ثبت tenant در master database...');
    const [result] = await connection.query(
      `INSERT INTO saas_master.tenants (
        tenant_key, company_name, 
        db_name, db_host, db_port, db_user, db_password,
        admin_name, admin_email, admin_phone,
        subscription_status, subscription_plan, subscription_start, subscription_end,
        max_users, max_customers, max_storage_mb, features,
        is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenant_key, company_name,
        db_name, DB_CONFIG.host, DB_CONFIG.port, db_user, db_password_encrypted,
        admin_name, admin_email, admin_phone,
        'active', plan_key, subscription_start, subscription_end,
        plan.max_users, plan.max_customers, plan.max_storage_mb, JSON.stringify(plan.features),
        true
      ]
    );
    
    const tenant_id = result.insertId;
    console.log(`✅ Tenant ثبت شد (ID: ${tenant_id})\n`);
    
    // ثبت در subscription_history
    console.log('📝 ثبت تاریخچه اشتراک...');
    const amount = subscription_months === 1 ? plan.price_monthly : plan.price_yearly;
    await connection.query(
      `INSERT INTO saas_master.subscription_history (
        tenant_id, plan_key, subscription_type, start_date, end_date, amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        tenant_id, plan_key,
        subscription_months === 1 ? 'monthly' : 'yearly',
        subscription_start, subscription_end, amount, 'active'
      ]
    );
    console.log('✅ تاریخچه ثبت شد\n');
    
    // ثبت لاگ
    console.log('📋 ثبت لاگ فعالیت...');
    await connection.query(
      `INSERT INTO saas_master.tenant_activity_logs (
        tenant_id, activity_type, description, metadata
      ) VALUES (?, ?, ?, ?)`,
      [
        tenant_id, 'created',
        `Tenant created: ${company_name}`,
        JSON.stringify({ plan_key, subscription_months, admin_email })
      ]
    );
    console.log('✅ لاگ ثبت شد\n');
    
    // ایجاد کاربر admin در tenant database
    console.log('👤 ایجاد کاربر admin در tenant...');
    const adminPassword = admin_password || generateRandomPassword(12);
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
    
    await tenantConnection.query(
      `INSERT INTO users (
        name, email, password, role, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      [admin_name || 'Admin', admin_email, adminPasswordHash, 'ceo', true]
    );
    console.log('✅ کاربر admin ایجاد شد\n');
    
    // خلاصه نهایی
    console.log('✨ ایجاد tenant با موفقیت انجام شد!\n');
    console.log('📊 خلاصه:');
    console.log(`   Tenant Key: ${tenant_key}`);
    console.log(`   Company: ${company_name}`);
    console.log(`   Database: ${db_name}`);
    console.log(`   URL: https://crm.robintejarat.com/${tenant_key}/login`);
    console.log(`   Subscription: ${plan.plan_name} (${subscription_months} ماه)`);
    console.log(`   Expires: ${subscription_end.toLocaleDateString('fa-IR')}\n`);
    
    console.log('🔐 اطلاعات لاگین Admin:');
    console.log(`   Email: ${admin_email}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   ⚠️  این password را به admin tenant ارسال کنید!\n`);
    
    return {
      success: true,
      tenant_id,
      tenant_key,
      db_name,
      admin_email,
      admin_password: adminPassword,
      url: `https://crm.robintejarat.com/${tenant_key}/login`
    };
    
  } catch (error) {
    console.error('\n❌ خطا در ایجاد tenant:', error.message);
    console.error(error);
    
    // Rollback: حذف دیتابیس و کاربر در صورت خطا
    if (connection) {
      try {
        console.log('\n🔄 Rollback...');
        const db_name = `crm_tenant_${tenant_key}`;
        const db_user = `user_${tenant_key}`;
        
        await connection.query(`DROP DATABASE IF EXISTS \`${db_name}\``);
        await connection.query(`DROP USER IF EXISTS '${db_user}'@'%'`);
        await connection.query(
          'DELETE FROM saas_master.tenants WHERE tenant_key = ?',
          [tenant_key]
        );
        
        console.log('✅ Rollback انجام شد');
      } catch (rollbackError) {
        console.error('❌ خطا در rollback:', rollbackError.message);
      }
    }
    
    throw error;
  } finally {
    if (tenantConnection) {
      await tenantConnection.end();
    }
    if (connection) {
      await connection.end();
      console.log('\n🔌 اتصال بسته شد');
    }
  }
}

// اجرای اسکریپت از command line
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('استفاده:');
    console.log('  node create-tenant-database.cjs <tenant_key> <company_name> <admin_email> [admin_name] [plan_key] [months]');
    console.log('\nمثال:');
    console.log('  node create-tenant-database.cjs rabin "شرکت رابین" admin@rabin.com "احمد رضایی" professional 12');
    process.exit(1);
  }
  
  const [tenant_key, company_name, admin_email, admin_name, plan_key, subscription_months] = args;
  
  createTenantDatabase({
    tenant_key,
    company_name,
    admin_email,
    admin_name: admin_name || 'Admin',
    plan_key: plan_key || 'basic',
    subscription_months: parseInt(subscription_months) || 12
  }).catch(error => {
    process.exit(1);
  });
}

module.exports = { createTenantDatabase };
