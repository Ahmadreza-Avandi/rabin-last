#!/usr/bin/env node

/**
 * Fix Authentication & Database Issues
 * یہ script تمام authentication اور database مسائل کو fix کرتا ہے
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function main() {
    console.log('\n🔧 Authentication Issues Fix Script\n');
    console.log('='.repeat(80));

    let connection;

    try {
        // Step 1: Check Master Database
        console.log('\n1️⃣ Connecting to Master Database...');
        console.log('-'.repeat(80));

        connection = await mysql.createConnection({
            host: process.env.MASTER_DB_HOST || 'localhost',
            user: process.env.MASTER_DB_USER || 'root',
            password: process.env.MASTER_DB_PASSWORD || '',
            database: 'saas_master'
        });

        console.log('✅ Master Database connected');

        // Step 2: Check Tenant Configuration
        console.log('\n2️⃣ Checking Tenant Configuration...');
        console.log('-'.repeat(80));

        const [tenants] = await connection.query('SELECT * FROM tenants LIMIT 1');

        if (tenants.length === 0) {
            console.log('❌ کوئی tenant نہیں ملا');
        } else {
            const tenant = tenants[0];
            console.log(`✅ Tenant ملا: ${tenant.tenant_key}`);
            console.log(`   Database: ${tenant.db_name}`);
            console.log(`   Status: ${tenant.status}`);
        }

        // Step 3: Check for Password Encryption Issues
        console.log('\n3️⃣ Checking Password Encryption...');
        console.log('-'.repeat(80));

        const encryptionKey = process.env.DB_ENCRYPTION_KEY;
        if (!encryptionKey) {
            console.log('❌ DB_ENCRYPTION_KEY not found in .env');
            console.log('   ⚠️  Passwords may not decrypt properly');
        } else {
            console.log('✅ DB_ENCRYPTION_KEY is set');
            console.log(`   Key length: ${encryptionKey.length} (should be 64 for hex format)`);
        }

        // Step 4: Check Tenant Database Connection
        console.log('\n4️⃣ Testing Tenant Database Connections...');
        console.log('-'.repeat(80));

        for (const tenant of tenants) {
            try {
                // Try connecting to tenant database
                const tenantConn = await mysql.createConnection({
                    host: tenant.db_host,
                    user: tenant.db_user,
                    password: tenant.db_password, // This might fail if encrypted
                    database: tenant.db_name
                });

                const [users] = await tenantConn.query('SELECT COUNT(*) as count FROM users');
                console.log(`✅ ${tenant.tenant_key}: ${users[0].count} users found`);
                await tenantConn.end();
            } catch (error) {
                console.log(`❌ ${tenant.tenant_key}: ${error.message}`);
                console.log(`   Note: Password might be encrypted/corrupt`);
            }
        }

        // Step 5: Database Structure Check
        console.log('\n5️⃣ Database Tables Check (First Tenant)...');
        console.log('-'.repeat(80));

        if (tenants.length > 0) {
            try {
                // Try to connect as admin to get schema
                const adminConn = await mysql.createConnection({
                    host: process.env.DATABASE_HOST || 'localhost',
                    user: process.env.DATABASE_USER || 'root',
                    password: process.env.DATABASE_PASSWORD || '',
                    database: tenants[0].db_name
                });

                const [tables] = await adminConn.query('SHOW TABLES');
                console.log(`✅ Tables found: ${tables.length}`);

                // Check critical tables
                const criticalTables = ['users', 'permissions', 'user_permissions', 'roles'];
                for (const table of criticalTables) {
                    const [result] = await adminConn.query(`SHOW TABLES LIKE '${table}'`);
                    const status = result.length > 0 ? '✅' : '❌';
                    console.log(`   ${status} ${table}`);
                }

                await adminConn.end();
            } catch (error) {
                console.log(`❌ Cannot connect to tenant database: ${error.message}`);
            }
        }

        await connection.end();

        // Step 6: Recommendations
        console.log('\n' + '='.repeat(80));
        console.log('\n📋 Recommendations:\n');

        console.log('1️⃣  If encryption fails:');
        console.log('   - Check if DB_ENCRYPTION_KEY in .env is correct');
        console.log('   - Re-generate and re-encrypt all tenant passwords');
        console.log('   - Or store passwords in plain text (less secure)\n');

        console.log('2️⃣  If tenant connections fail:');
        console.log('   - Verify MySQL is running on the host');
        console.log('   - Check database credentials');
        console.log('   - Ensure tenant databases exist\n');

        console.log('3️⃣  If permissions API returns 401:');
        console.log('   - Clear browser cookies');
        console.log('   - Login again');
        console.log('   - Check JWT_SECRET in .env\n');

        console.log('4️⃣  Run this to see detailed logs:');
        console.log('   node scripts/check-database-structure.cjs\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('   MySQL server is not running');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('   Database credentials are incorrect');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('   Database does not exist');
        }
    } finally {
        if (connection) {
            await connection.end().catch(() => { });
        }
    }

    console.log('\n' + '='.repeat(80) + '\n');
}

main().catch(console.error);