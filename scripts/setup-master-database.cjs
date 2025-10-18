#!/usr/bin/env node

/**
 * Master Database Setup Script
 * یہ script Master Database اور Rabin Tenant کو setup کرتا ہے
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

// Encryption function
function encryptPassword(password) {
  const key = process.env.DB_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('DB_ENCRYPTION_KEY not found in .env');
  }

  const keyBuffer = key.length === 64 ? Buffer.from(key, 'hex') : crypto.createHash('sha256').update(key).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

async function main() {
  console.log('\n🔧 Master Database Setup Script\n');
  console.log('='.repeat(80));

  let connection;

  try {
    // Step 1: Connect as root to create master database
    console.log('\n1️⃣ Connecting to MySQL as root...');
    console.log('-'.repeat(80));

    connection = await mysql.createConnection({
      host: process.env.MASTER_DB_HOST || 'localhost',
      user: process.env.MASTER_DB_USER || 'root',
      password: process.env.MASTER_DB_PASSWORD || '',
      port: parseInt(process.env.MASTER_DB_PORT || '3306')
    });

    console.log('✅ Connected to MySQL');

    // Step 2: Create Master Database
    console.log('\n2️⃣ Creating Master Database...');
    console.log('-'.repeat(80));

    await connection.query(`
      CREATE DATABASE IF NOT EXISTS saas_master
      CHARACTER SET utf8mb4
      COLLATE utf8mb4_unicode_ci
    `);
    console.log('✅ Master database created/exists');

    // Step 3: Read and execute schema
    console.log('\n3️⃣ Creating Tables...');
    console.log('-'.repeat(80));

    const fs = require('fs');
    const schemaPath = path.join(__dirname, '../database/saas-master-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(s => s.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
      }
    }
    console.log('✅ All tables created');

    // Step 4: Check if rabin tenant exists
    console.log('\n4️⃣ Checking Rabin Tenant...');
    console.log('-'.repeat(80));

    await connection.query('USE saas_master');
    const [tenants] = await connection.query('SELECT * FROM tenants WHERE tenant_key = ?', ['rabin']);

    if (tenants.length === 0) {
      console.log('❌ Rabin tenant not found - Creating...');

      // Encrypt the password
      const encryptedPassword = encryptPassword('1234');

      // Insert rabin tenant
      await connection.query(
        `INSERT INTO tenants (
          tenant_key, company_name, db_name, db_host, db_port, db_user, db_password,
          admin_name, admin_email, admin_phone, subscription_status, subscription_plan,
          subscription_start, subscription_end, max_users, max_customers, max_storage_mb,
          features, settings, is_active, is_deleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'rabin',                              // tenant_key
          'رابین CRM',                          // company_name
          'rabin_crm',                          // db_name
          'localhost',                          // db_host
          3306,                                 // db_port
          'crm_user',                           // db_user
          encryptedPassword,                    // db_password (encrypted)
          'احمد رضا',                           // admin_name
          'info@rabin.local',                   // admin_email
          '+98 123 4567',                       // admin_phone
          'active',                             // subscription_status
          'professional',                       // subscription_plan
          new Date(),                           // subscription_start
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // subscription_end (1 year)
          50,                                   // max_users
          10000,                                // max_customers
          5120,                                 // max_storage_mb
          JSON.stringify({
            voice_assistant: true,
            advanced_reports: true,
            api_access: true,
            custom_fields: true
          }),                                   // features
          JSON.stringify({}),                   // settings
          true,                                 // is_active
          false                                 // is_deleted
        ]
      );
      console.log('✅ Rabin tenant created');
    } else {
      console.log('✅ Rabin tenant already exists');
      console.log(`   - Status: ${tenants[0].subscription_status}`);
      console.log(`   - Active: ${tenants[0].is_active ? 'Yes' : 'No'}`);
    }

    // Step 5: Create Rabin Database
    console.log('\n5️⃣ Creating Rabin Tenant Database...');
    console.log('-'.repeat(80));

    await connection.query('CREATE DATABASE IF NOT EXISTS rabin_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('✅ Rabin database created/exists');

    // Step 6: Load tenant template into rabin database
    console.log('\n6️⃣ Setting up Rabin Database Schema...');
    console.log('-'.repeat(80));

    const tenantTemplate = fs.readFileSync(path.join(__dirname, '../database/tenant-template.sql'), 'utf8');
    const tenantStatements = tenantTemplate.split(';').filter(s => s.trim());

    // Create a connection to rabin_crm database
    const rabinConn = await mysql.createConnection({
      host: process.env.MASTER_DB_HOST || 'localhost',
      user: process.env.MASTER_DB_USER || 'root',
      password: process.env.MASTER_DB_PASSWORD || '',
      port: parseInt(process.env.MASTER_DB_PORT || '3306'),
      database: 'rabin_crm'
    });

    for (const statement of tenantStatements) {
      if (statement.trim()) {
        try {
          await rabinConn.query(statement);
        } catch (err) {
          // Skip if table already exists
          if (err.message.includes('already exists')) {
            console.log(`   ⚠️ Table already exists`);
          } else {
            throw err;
          }
        }
      }
    }
    console.log('✅ Rabin database schema created');
    await rabinConn.end();

    // Step 7: Summary
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Setup Complete!\n');
    console.log('🎯 Next Steps:');
    console.log('1. Restart your application');
    console.log('2. Go to http://localhost:3000/rabin/dashboard');
    console.log('3. You should no longer see tenant-not-found error');
    console.log('\n📝 Login with a user from your database');
    console.log('   Or create a user manually in rabin_crm.users table\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('   MySQL server is not running');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   Database credentials are incorrect');
      console.error('   Update MASTER_DB_* variables in .env');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('   Database does not exist yet (this is normal)');
    }
  } finally {
    if (connection) {
      await connection.end().catch(() => { });
    }
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

main().catch(console.error);