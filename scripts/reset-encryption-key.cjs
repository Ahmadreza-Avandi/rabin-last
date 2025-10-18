#!/usr/bin/env node

/**
 * Reset Encryption Key Script
 * یہ script پرانے encryption کو ہٹا کر نیا setup کرتا ہے
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function main() {
    console.log('\n🔧 Reset Encryption Key\n');
    console.log('='.repeat(80));

    let connection;

    try {
        console.log('\n1️⃣ Connecting to MySQL...');
        connection = await mysql.createConnection({
            host: process.env.MASTER_DB_HOST || 'localhost',
            user: process.env.MASTER_DB_USER || 'root',
            password: process.env.MASTER_DB_PASSWORD || '',
            port: parseInt(process.env.MASTER_DB_PORT || '3306')
        });
        console.log('✅ Connected');

        console.log('\n2️⃣ Deleting old rabin tenant...');
        await connection.query('USE saas_master');
        const [result] = await connection.query('DELETE FROM tenants WHERE tenant_key = ?', ['rabin']);
        console.log(`✅ Deleted ${result.affectedRows} rows`);

        console.log('\n3️⃣ Dropping rabin_crm database...');
        try {
            await connection.query('DROP DATABASE IF EXISTS rabin_crm');
            console.log('✅ Database dropped');
        } catch (e) {
            console.log('⚠️  Database does not exist (normal)');
        }

        console.log('\n' + '='.repeat(80));
        console.log('\n✅ Cleanup complete!\n');
        console.log('👉 Now run: node scripts/setup-master-database.cjs\n');
        console.log('='.repeat(80) + '\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end().catch(() => { });
        }
    }
}

main();