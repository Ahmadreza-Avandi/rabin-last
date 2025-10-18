#!/usr/bin/env node

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

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

async function fixRabinTenant() {
  console.log('\n🔧 Fixing Rabin Tenant Configuration...\n');
  console.log('='.repeat(80));

  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.MASTER_DB_HOST || 'localhost',
      user: process.env.MASTER_DB_USER || 'root',
      password: process.env.MASTER_DB_PASSWORD || '',
      port: parseInt(process.env.MASTER_DB_PORT || '3306'),
      database: 'saas_master'
    });

    console.log('✅ Connected to saas_master\n');

    // Check current rabin tenant
    console.log('1️⃣ Current Rabin Tenant Configuration:');
    console.log('-'.repeat(80));
    const [tenants] = await connection.query('SELECT * FROM tenants WHERE tenant_key = ?', ['rabin']);
    
    if (tenants.length === 0) {
      console.log('❌ Rabin tenant not found!');
      return;
    }

    const tenant = tenants[0];
    console.log(`   Database: ${tenant.db_name}`);
    console.log(`   Host: ${tenant.db_host}`);
    console.log(`   User: ${tenant.db_user}`);
    console.log(`   Active: ${tenant.is_active ? 'Yes' : 'No'}`);
    console.log(`   Status: ${tenant.subscription_status}`);

    // Update to use crm_system
    console.log('\n2️⃣ Updating Rabin Tenant to use crm_system database:');
    console.log('-'.repeat(80));

    const encryptedPassword = encryptPassword(''); // Empty password

    await connection.query(
      `UPDATE tenants 
       SET db_name = ?, 
           db_host = ?, 
           db_user = ?, 
           db_password = ?,
           is_active = 1,
           subscription_status = 'active'
       WHERE tenant_key = ?`,
      ['crm_system', 'localhost', 'root', encryptedPassword, 'rabin']
    );

    console.log('✅ Rabin tenant updated successfully!');

    // Verify update
    console.log('\n3️⃣ Verifying Update:');
    console.log('-'.repeat(80));
    const [updated] = await connection.query('SELECT * FROM tenants WHERE tenant_key = ?', ['rabin']);
    const updatedTenant = updated[0];
    console.log(`   Database: ${updatedTenant.db_name}`);
    console.log(`   Host: ${updatedTenant.db_host}`);
    console.log(`   User: ${updatedTenant.db_user}`);
    console.log(`   Active: ${updatedTenant.is_active ? 'Yes' : 'No'}`);
    console.log(`   Status: ${updatedTenant.subscription_status}`);

    // Check if crm_system has users
    console.log('\n4️⃣ Checking crm_system database:');
    console.log('-'.repeat(80));
    
    const crmConn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      port: 3306,
      database: 'crm_system'
    });

    const [users] = await crmConn.query('SELECT id, name, email, role FROM users LIMIT 5');
    console.log(`   Users found: ${users.length}`);
    users.forEach(u => {
      console.log(`   - ${u.name} (${u.email}) - Role: ${u.role}`);
    });

    await crmConn.end();

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Fix Complete!\n');
    console.log('🎯 Next Steps:');
    console.log('1. Restart your Next.js application');
    console.log('2. Go to http://localhost:3000/rabin/login');
    console.log('3. Login with one of the users from crm_system database\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixRabinTenant().catch(console.error);
