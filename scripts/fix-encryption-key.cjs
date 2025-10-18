#!/usr/bin/env node

/**
 * Fix Encryption Key مسئله
 * این script مشکل رمزگذاری Tenant Rabin را حل می‌کند
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

// Encryption function - دقیقاً مثل lib/encryption.ts
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

// Decryption function
function decryptPassword(encryptedData) {
    try {
        const key = process.env.DB_ENCRYPTION_KEY;
        if (!key) {
            throw new Error('DB_ENCRYPTION_KEY not found');
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
    } catch (error) {
        return null;
    }
}

async function main() {
    console.log('\n🔧 Encryption Key Fix Script\n');
    console.log('='.repeat(80));

    let connection;

    try {
        // Step 1: Connect to MySQL
        console.log('\n1️⃣ Connecting to MySQL...');
        console.log('-'.repeat(80));

        connection = await mysql.createConnection({
            host: process.env.MASTER_DB_HOST || 'localhost',
            user: process.env.MASTER_DB_USER || 'root',
            password: process.env.MASTER_DB_PASSWORD || '',
            port: parseInt(process.env.MASTER_DB_PORT || '3306')
        });

        console.log('✅ Connected to MySQL');

        // Step 2: Create/Verify Master Database
        console.log('\n2️⃣ Creating/Verifying Master Database...');
        console.log('-'.repeat(80));

        const fs = require('fs');
        const schemaPath = path.join(__dirname, '../database/saas-master-schema.sql');

        if (!fs.existsSync(schemaPath)) {
            console.error('❌ Schema file not found:', schemaPath);
            process.exit(1);
        }

        const schema = fs.readFileSync(schemaPath, 'utf8');
        const statements = schema.split(';').filter(s => s.trim());

        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await connection.query(statement);
                } catch (err) {
                    if (!err.message.includes('already exists')) {
                        console.warn('   ⚠️  Statement error (may be normal):', err.message.substring(0, 100));
                    }
                }
            }
        }

        console.log('✅ Master database ready');

        // Step 3: Check Current Encryption Key
        console.log('\n3️⃣ Checking Encryption Key Configuration...');
        console.log('-'.repeat(80));

        const key = process.env.DB_ENCRYPTION_KEY;
        console.log(`   Key from .env: ${key.substring(0, 16)}...`);
        console.log(`   Key length: ${key.length} characters`);
        console.log(`   Key format: ${key.length === 64 ? 'hex (32 bytes)' : 'text (will be hashed)'}`);

        // Test encryption/decryption
        console.log('\n   Testing encryption/decryption...');
        const testPassword = 'test_12345';
        const encrypted = encryptPassword(testPassword);
        const decrypted = decryptPassword(encrypted);

        if (decrypted === testPassword) {
            console.log('   ✅ Encryption/Decryption working correctly');
        } else {
            console.error('   ❌ Encryption/Decryption FAILED!');
            throw new Error('Encryption test failed');
        }

        // Step 4: Check Rabin Tenant
        console.log('\n4️⃣ Checking Rabin Tenant...');
        console.log('-'.repeat(80));

        await connection.query('USE saas_master');
        const [tenants] = await connection.query('SELECT * FROM tenants WHERE tenant_key = ?', ['rabin']);

        if (tenants.length > 0) {
            const tenant = tenants[0];
            console.log(`   ✅ Rabin tenant found`);
            console.log(`      - ID: ${tenant.id}`);
            console.log(`      - Company: ${tenant.company_name}`);
            console.log(`      - Status: ${tenant.subscription_status}`);
            console.log(`      - DB: ${tenant.db_name}`);

            // Try to decrypt existing password
            console.log('\n   Attempting to decrypt stored password...');
            const decryptedPass = decryptPassword(tenant.db_password);

            if (decryptedPass) {
                console.log(`   ✅ Successfully decrypted: ${decryptedPass}`);
            } else {
                console.log('   ❌ Failed to decrypt - password corruption detected!');
                console.log('   🔄 Updating password...');

                const newEncryptedPassword = encryptPassword('1234');
                await connection.query(
                    'UPDATE tenants SET db_password = ? WHERE tenant_key = ?',
                    [newEncryptedPassword, 'rabin']
                );

                console.log('   ✅ Password updated successfully');
            }
        } else {
            console.log('   ❌ Rabin tenant NOT found - creating...');

            const encryptedPassword = encryptPassword('1234');

            await connection.query(
                `INSERT INTO tenants (
          tenant_key, company_name, db_name, db_host, db_port, db_user, db_password,
          admin_name, admin_email, admin_phone, subscription_status, subscription_plan,
          subscription_start, subscription_end, max_users, max_customers, max_storage_mb,
          features, settings, is_active, is_deleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    'rabin',
                    'رابین CRM',
                    'rabin_crm',
                    'localhost',
                    3306,
                    'crm_user',
                    encryptedPassword,
                    'احمد رضا',
                    'info@rabin.local',
                    '+98 123 4567',
                    'active',
                    'professional',
                    new Date(),
                    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                    50,
                    10000,
                    5120,
                    JSON.stringify({
                        voice_assistant: true,
                        advanced_reports: true,
                        api_access: true,
                        custom_fields: true
                    }),
                    JSON.stringify({}),
                    true,
                    false
                ]
            );

            console.log('   ✅ Rabin tenant created');
        }

        // Step 5: Verify Rabin Database
        console.log('\n5️⃣ Verifying Rabin CRM Database...');
        console.log('-'.repeat(80));

        await connection.query('CREATE DATABASE IF NOT EXISTS rabin_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        console.log('   ✅ Rabin database ready');

        // Step 6: Summary
        console.log('\n' + '='.repeat(80));
        console.log('\n✅ Encryption Fix Complete!\n');
        console.log('🎯 Current Configuration:');
        console.log(`   - DB_ENCRYPTION_KEY: ${key.substring(0, 16)}...${key.substring(key.length - 16)}`);
        console.log(`   - Rabin Tenant: rabin_crm`);
        console.log(`   - Status: READY FOR CONNECTION\n`);
        console.log('📝 Next Steps:');
        console.log('1. Restart your application');
        console.log('2. Clear browser cache');
        console.log('3. Visit http://localhost:3000/rabin/dashboard\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nFull error:');
        console.error(error);
    } finally {
        if (connection) {
            await connection.end().catch(() => { });
        }
    }

    console.log('\n' + '='.repeat(80) + '\n');
}

main().catch(console.error);