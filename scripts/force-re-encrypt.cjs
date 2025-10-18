#!/usr/bin/env node

const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Read .env file directly
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

let DB_ENCRYPTION_KEY = null;
for (const line of envLines) {
  if (line.startsWith('DB_ENCRYPTION_KEY=')) {
    DB_ENCRYPTION_KEY = line.split('=')[1].trim();
    break;
  }
}

if (!DB_ENCRYPTION_KEY) {
  console.error('❌ DB_ENCRYPTION_KEY not found in .env');
  process.exit(1);
}

console.log(`\n🔑 Using encryption key from .env: ${DB_ENCRYPTION_KEY.substring(0, 10)}...\n`);

const crypto = require('crypto');
const ALGORITHM = 'aes-256-gcm';

function encryptPassword(password) {
  const key = DB_ENCRYPTION_KEY;
  const keyBuffer = key.length === 64 ? Buffer.from(key, 'hex') : crypto.createHash('sha256').update(key).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptPassword(encryptedData) {
  const key = DB_ENCRYPTION_KEY;
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

async function forceReEncrypt() {
  console.log('🔐 Force Re-encrypting Tenant Passwords...\n');
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

    // Encrypt empty password for rabin
    console.log('1️⃣ Encrypting password for rabin tenant:');
    console.log('-'.repeat(80));
    
    const emptyPassword = '';
    const encryptedEmpty = encryptPassword(emptyPassword);
    
    console.log(`   Password to encrypt: "${emptyPassword}" (empty)`);
    console.log(`   Encrypted: ${encryptedEmpty.substring(0, 40)}...`);
    
    // Test decryption immediately
    try {
      const testDecrypt = decryptPassword(encryptedEmpty);
      console.log(`   ✅ Test decryption successful: "${testDecrypt}"`);
    } catch (error) {
      console.log(`   ❌ Test decryption FAILED: ${error.message}`);
      console.log('   This means there is a problem with the encryption key!');
      process.exit(1);
    }

    // Update database
    console.log('\n2️⃣ Updating database:');
    console.log('-'.repeat(80));
    
    await connection.query(
      'UPDATE tenants SET db_user = ?, db_password = ? WHERE tenant_key = ?',
      ['root', encryptedEmpty, 'rabin']
    );
    
    console.log('   ✅ Database updated\n');

    // Verify from database
    console.log('3️⃣ Verifying from database:');
    console.log('-'.repeat(80));
    
    const [rows] = await connection.query(
      'SELECT tenant_key, db_user, db_password FROM tenants WHERE tenant_key = ?',
      ['rabin']
    );
    
    if (rows.length > 0) {
      const tenant = rows[0];
      console.log(`   Tenant: ${tenant.tenant_key}`);
      console.log(`   User: ${tenant.db_user}`);
      console.log(`   Encrypted password: ${tenant.db_password.substring(0, 40)}...`);
      
      try {
        const decrypted = decryptPassword(tenant.db_password);
        console.log(`   Decrypted password: "${decrypted}"`);
        console.log(`   ✅ Encryption/Decryption working!`);
      } catch (error) {
        console.log(`   ❌ Decryption failed: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Force re-encryption complete!\n');
    console.log('🎯 IMPORTANT: Restart your Next.js server now!');
    console.log('   Press Ctrl+C in the terminal running npm run dev');
    console.log('   Then run: npm run dev\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

forceReEncrypt().catch(console.error);
