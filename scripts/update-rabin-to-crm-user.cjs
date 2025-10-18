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

async function updateToCrmUser() {
  console.log('\n🔧 Updating Rabin Tenant to use crm_user...\n');

  let connection;

  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      port: 3306,
      database: 'saas_master'
    });

    const encryptedPassword = encryptPassword('1234');

    await connection.query(
      `UPDATE tenants 
       SET db_user = ?, 
           db_password = ?
       WHERE tenant_key = ?`,
      ['crm_user', encryptedPassword, 'rabin']
    );

    console.log('✅ Rabin tenant updated to use crm_user:1234\n');

    const [updated] = await connection.query('SELECT tenant_key, db_name, db_user FROM tenants WHERE tenant_key = ?', ['rabin']);
    console.log('Current configuration:');
    console.log(`   Database: ${updated[0].db_name}`);
    console.log(`   User: ${updated[0].db_user}`);
    console.log(`   Password: 1234 (encrypted)\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateToCrmUser().catch(console.error);
