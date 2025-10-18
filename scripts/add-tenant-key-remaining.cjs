#!/usr/bin/env node

const mysql = require('mysql2/promise');

async function addTenantKeyRemaining() {
    console.log('\n🔧 اضافه کردن tenant_key به جداول باقی‌مانده...\n');
    console.log('='.repeat(80));

    let connection;

    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            port: 3306,
            database: 'crm_system'
        });

        console.log('✅ Connected to crm_system\n');

        // جداول مهم که نیاز فوری دارند
        const importantTables = [
            'sales',
            'chat_messages',
            'daily_reports',
            'notifications',
            'interactions',
            'sale_items',
            'task_assignees',
            'deal_products',
            'chat_conversations',
            'chat_participants'
        ];

        console.log('📋 اضافه کردن tenant_key به جداول مهم:\n');

        for (const table of importantTables) {
            try {
                // Check if table exists
                const [tableExists] = await connection.query(
                    `SHOW TABLES LIKE '${table}'`
                );

                if (tableExists.length === 0) {
                    console.log(`   ⚠️  ${table} - جدول وجود ندارد`);
                    continue;
                }

                // Check if tenant_key exists
                const [columns] = await connection.query(
                    `SHOW COLUMNS FROM ${table} LIKE 'tenant_key'`
                );

                if (columns.length > 0) {
                    console.log(`   ✓ ${table} - tenant_key از قبل وجود دارد`);
                } else {
                    // Add tenant_key
                    await connection.query(
                        `ALTER TABLE ${table} 
             ADD COLUMN tenant_key VARCHAR(50) DEFAULT 'rabin' AFTER id`
                    );
                    console.log(`   ✅ ${table} - tenant_key اضافه شد`);

                    // Add index
                    await connection.query(
                        `ALTER TABLE ${table} 
             ADD INDEX idx_tenant_key (tenant_key)`
                    );
                    console.log(`   ✅ ${table} - index ایجاد شد`);
                }
            } catch (error) {
                console.log(`   ❌ ${table} - خطا: ${error.message}`);
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('\n✅ تمام!\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

addTenantKeyRemaining().catch(console.error);
