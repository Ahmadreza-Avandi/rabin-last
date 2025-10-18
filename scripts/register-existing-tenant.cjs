#!/usr/bin/env node

/**
 * ثبت دیتابیس موجود به عنوان tenant در master database
 */

const mysql = require('mysql2/promise');
const path = require('path');
const { encryptPassword } = require('../lib/encryption.ts');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const DB_CONFIG = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD,
};

async function registerTenant() {
  let connection;
  
  try {
    const tenant_key = 'rabin';
    const company_name = 'شرکت رابین تجارت';
    const admin_email = 'ahmadrezaavandi@gmail.com';
    const admin_name = 'احمدرضا اوندی';
    const plan_key = 'professional';
    const subscription_months = 12;

    console.log(`🚀 ثبت tenant موجود: ${tenant_key}`);
    console.log(`📋 دیتابیس: crm_system\n`);

    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ اتصال برقرار شد\n');

    // دریافت اطلاعات پلن
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

    // Encrypt کردن password دیتابیس
    const db_password_encrypted = process.env.DB_PASSWORD || '';

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
        'crm_system', DB_CONFIG.host, DB_CONFIG.port, process.env.DB_USER || 'crm_user', db_password_encrypted,
        admin_name, admin_email, '',
        'active', plan_key, subscription_start, subscription_end,
        plan.max_users, plan.max_customers, plan.max_storage_mb, JSON.stringify(plan.features),
        true
      ]
    );

    const tenant_id = result.insertId;
    console.log(`✅ Tenant ثبت شد (ID: ${tenant_id})\n`);

    // ثبت در subscription_history
    console.log('📝 ثبت تاریخچه اشتراک...');
    const amount = subscription_months === 12 ? plan.price_yearly : plan.price_monthly;
    await connection.query(
      `INSERT INTO saas_master.subscription_history (
        tenant_id, plan_key, subscription_type, start_date, end_date, amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tenant_id, plan_key, subscription_months === 12 ? 'yearly' : 'monthly', subscription_start, subscription_end, amount, 'completed']
    );
    console.log('✅ تاریخچه ثبت شد\n');

    // ثبت لاگ
    console.log('📋 ثبت لاگ فعالیت...');
    await connection.query(
      `INSERT INTO saas_master.tenant_activity_logs (
        tenant_id, activity_type, description, metadata
      ) VALUES (?, ?, ?, ?)`,
      [tenant_id, 'tenant_created', `Tenant created: ${company_name}`, JSON.stringify({ plan_key, subscription_months, admin_email })]
    );
    console.log('✅ لاگ ثبت شد\n');

    console.log('✨ ثبت tenant با موفقیت انجام شد!\n');
    console.log('📊 خلاصه:');
    console.log(`   Tenant Key: ${tenant_key}`);
    console.log(`   Company: ${company_name}`);
    console.log(`   Database: crm_system`);
    console.log(`   URL: http://localhost:3000/${tenant_key}/login`);
    console.log(`   Subscription: ${plan.plan_name} (${subscription_months} ماه)`);
    console.log(`   Expires: ${subscription_end.toLocaleDateString('fa-IR')}\n`);

  } catch (error) {
    console.error('\n❌ خطا:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 اتصال بسته شد');
    }
  }
}

registerTenant();
