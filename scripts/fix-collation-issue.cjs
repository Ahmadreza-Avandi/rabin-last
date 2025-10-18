const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixCollation() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: 'crm_system',
    });

    try {
        console.log('🔧 Starting collation fix...\n');

        // Check current collations
        console.log('📋 Current table collations:');
        const [currentCollations] = await connection.query(`
      SELECT TABLE_NAME, TABLE_COLLATION 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'crm_system'
      ORDER BY TABLE_NAME
    `);
        console.table(currentCollations);

        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        const tablesToFix = [
            'activities',
            'customers',
            'users',
            'deals',
            'contacts',
            'products',
            'categories',
            'permissions',
            'roles',
            'calendar_events',
            'chat_conversations',
            'chat_groups',
            'tasks',
            'notes',
            'sales',
            'coworkers',
            'feedback',
            'monitoring',
            'activity_log',
            'alerts',
            'backup_history',
            'chat_group_members',
            'chat_messages',
            'documents',
        ];

        console.log('\n🔄 Fixing collations for all tables...\n');

        for (const table of tablesToFix) {
            try {
                console.log(`  ⏳ Converting ${table}...`);
                await connection.query(
                    `ALTER TABLE \`${table}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
                );
                console.log(`  ✅ ${table} fixed`);
            } catch (error) {
                if (error.code === 'ER_NO_SUCH_TABLE') {
                    console.log(`  ℹ️  ${table} does not exist (skipping)`);
                } else {
                    console.error(`  ❌ Error fixing ${table}:`, error.message);
                }
            }
        }

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('\n\n✅ Collation fix completed!\n');

        // Verify all tables now use the same collation
        console.log('📋 Updated table collations:');
        const [updatedCollations] = await connection.query(`
      SELECT TABLE_NAME, TABLE_COLLATION 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'crm_system'
      ORDER BY TABLE_NAME
    `);
        console.table(updatedCollations);

        // Check for any remaining mismatches
        const mismatchCount = updatedCollations.filter(
            t => t.TABLE_COLLATION !== 'utf8mb4_unicode_ci'
        ).length;

        if (mismatchCount === 0) {
            console.log('\n✨ All tables are now using utf8mb4_unicode_ci');
        } else {
            console.log(`\n⚠️  ${mismatchCount} tables still have different collations`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

fixCollation();