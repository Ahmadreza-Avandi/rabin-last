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

  console.log(`   Using encryption key: ${key.substring(0, 10)}...`);

  const keyBuffer = key.length === 64 ? Buffer.from(key, 'hex') : crypto.createHash('sha256').update(key).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptPassword(encryptedData) {
  const key = process.env.DB_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('DB_ENCRYPTION_KEY not found in .env');
  }

  const keyBuffer = key.length === 64 ? Buffer.from(key, 'hex') : crypto.createHash('sha256').update(key).digest();
  
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const [ivHex, authTagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

async function reEncryptPasswords() {
  console.log('\n🔐 Re-encrypting Tenant Passwords...\n');
  console.log('='.repeat(80));

  let connection;

  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      port: 3306,
      database: 'saas_master'
    });

    console.log('✅ Connected to saas_master\n');

    // Get all tenants
    console.log('1️⃣ Fetching all tenants:');
    console.log('-'.repeat(80));
    const [tenants] = await connection.query('SELECT id, tenant_key, db_user, db_password FROM tenants');
    
    console.log(`   Found ${tenants.length} tenants\n`);

    // Re-encrypt each tenant's password
    console.log('2️⃣ Re-encrypting passwords:');
    console.log('-'.repeat(80));

    for (const tenant of tenants) {
      console.log(`\n   Processing: ${tenant.tenant_key}`);
      console.log(`   Current user: ${tenant.db_user}`);
      
      // For rabin, use empty password with root user
      let newPassword = '';
      let newUser = 'root';
      
      if (tenant.tenant_key === 'rabin') {
        console.log(`   Setting password to: (empty)`);
        console.log(`   Setting user to: root`);
      } else {
        // Try to decrypt existing password
        try {
          newPassword = decryptPassword(tenant.db_password);
          console.log(`   Decrypted existing password successfully`);
          newUser = tenant.db_user;
        } catch (error) {
          console.log(`   ⚠️  Could not decrypt existing password, using empty password`);
          newPassword = '';
        }
      }

      // Encrypt with current key
      const encryptedPassword = encryptPassword(newPassword);
      console.log(`   New encrypted password: ${encryptedPassword.substring(0, 30)}...`);

      // Update database
      await connection.query(
        'UPDATE tenants SET db_user = ?, db_password = ? WHERE id = ?',
        [newUser, encryptedPassword, tenant.id]
      );

      console.log(`   ✅ Updated ${tenant.tenant_key}`);
    }

    // Verify
    console.log('\n3️⃣ Verifying encryption:');
    console.log('-'.repeat(80));
    
    const [updated] = await connection.query('SELECT tenant_key, db_user, db_password FROM tenants WHERE tenant_key = ?', ['rabin']);
    const rabin = updated[0];
    
    console.log(`\n   Rabin tenant:`);
    console.log(`   - User: ${rabin.db_user}`);
    console.log(`   - Encrypted password: ${rabin.db_password.substring(0, 30)}...`);
    
    try {
      const decrypted = decryptPassword(rabin.db_password);
      console.log(`   - Decrypted password: "${decrypted}"`);
      console.log(`   ✅ Encryption/Decryption working correctly!`);
    } catch (error) {
      console.log(`   ❌ Failed to decrypt: ${error.message}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Re-encryption Complete!\n');
    console.log('🎯 Next Steps:');
    console.log('1. Restart your Next.js application');
    console.log('2. Try logging in again\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

reEncryptPasswords().catch(console.error);
