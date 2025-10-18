#!/usr/bin/env node

/**
 * Encryption Issue Diagnostic Script
 * یہ script encryption کے مسائل کو diagnose کرتا ہے
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const ALGORITHM = 'aes-256-gcm';

async function main() {
    console.log('\n🔍 Encryption Diagnostic Tool\n');
    console.log('='.repeat(80));

    // چیک 1: Environment Variables
    console.log('\n1️⃣ Environment Variables Check:');
    console.log('-'.repeat(80));

    const encryptionKey = process.env.DB_ENCRYPTION_KEY;
    console.log(`DB_ENCRYPTION_KEY: ${encryptionKey ? '✅ تعریف شده' : '❌ تعریف نشده'}`);

    if (encryptionKey) {
        console.log(`  - طول: ${encryptionKey.length} characters`);
        console.log(`  - فرمت: ${encryptionKey.length === 64 ? '✅ Hex (64 chars)' : '⚠️ Other format'}`);
    }

    console.log(`\nDatabase Config:`);
    console.log(`  MASTER_DB_HOST: ${process.env.MASTER_DB_HOST || 'localhost'}`);
    console.log(`  MASTER_DB_USER: ${process.env.MASTER_DB_USER || 'root'}`);
    console.log(`  MASTER_DB_PASSWORD: ${process.env.MASTER_DB_PASSWORD ? '✅ تعریف شده' : '❌ تعریف نشده'}`);

    // چیک 2: Database Connection
    console.log('\n2️⃣ Database Connection Check:');
    console.log('-'.repeat(80));

    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.MASTER_DB_HOST || 'localhost',
            user: process.env.MASTER_DB_USER || 'root',
            password: process.env.MASTER_DB_PASSWORD || '',
            database: 'saas_master'
        });
        console.log('✅ Master Database سے connection ہوا');

        // چیک 3: Tenants کی معلومات
        console.log('\n3️⃣ Tenants Configuration Check:');
        console.log('-'.repeat(80));

        const [tenants] = await connection.query('SELECT id, tenant_key, db_name, db_user, db_password FROM tenants LIMIT 5');

        if (tenants.length === 0) {
            console.log('❌ کوئی tenant نہیں ملا');
        } else {
            console.log(`✅ ${tenants.length} tenants ملے:\n`);

            for (const tenant of tenants) {
                console.log(`Tenant: ${tenant.tenant_key}`);
                console.log(`  - DB Name: ${tenant.db_name}`);
                console.log(`  - DB User: ${tenant.db_user}`);
                console.log(`  - DB Password (encrypted): ${tenant.db_password.substring(0, 50)}...`);
                console.log(`  - Password Format: ${tenant.db_password.includes(':') ? '✅ Encrypted format (iv:authTag:encrypted)' : '⚠️ Plain text or different format'}`);

                // Try to decrypt
                if (tenant.db_password.includes(':')) {
                    try {
                        const decrypted = decryptPassword(tenant.db_password);
                        console.log(`  - Decryption: ✅ کامیاب - ${decrypted}`);
                    } catch (error) {
                        console.log(`  - Decryption: ❌ ناکام - ${error.message}`);
                    }
                }
                console.log();
            }
        }

        await connection.end();
        console.log('✅ Database connection بند کیا');
    } catch (error) {
        console.error('❌ Database Connection Error:', error.message);
        if (error.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('   - MySQL server چلتی نہیں ہے');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('   - غلط username یا password');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('   - saas_master database موجود نہیں ہے');
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n💡 نتیجہ:');
    console.log('-'.repeat(80));

    if (encryptionKey) {
        console.log('✅ DB_ENCRYPTION_KEY تعریف ہے');
    } else {
        console.log('❌ DB_ENCRYPTION_KEY تعریف نہیں ہے - .env میں اضافہ کریں');
    }

    console.log('\n🔧 اگر password decrypt نہیں ہو رہے تو:');
    console.log('1. DB_ENCRYPTION_KEY کو .env میں تبدیل کریں');
    console.log('2. یا پھر database میں passwords کو دوبارہ re-encrypt کریں');
    console.log('3. یا پھر plain text passwords استعمال کریں (اگر ممکن ہو)');
}

function decryptPassword(encryptedData) {
    const crypto = require('crypto');

    try {
        const key = process.env.DB_ENCRYPTION_KEY;
        if (!key) {
            throw new Error('DB_ENCRYPTION_KEY environment variable is not set');
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
        throw error;
    }
}

main().catch(console.error);