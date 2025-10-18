const mysql = require('mysql2/promise');

async function checkMySQLRabin() {
    try {
        console.log('🔍 Checking MySQL databases...\n');

        // Connect to master database
        const masterConnection = await mysql.createConnection({
            host: 'localhost',
            user: 'crm_user',
            password: '1234',
            database: 'saas_master'
        });

        console.log('✅ Connected to saas_master\n');

        // Check tenants
        const [tenants] = await masterConnection.query(
            "SELECT * FROM tenants WHERE tenant_key = 'rabin'"
        );

        if (tenants.length === 0) {
            console.log('❌ Tenant "rabin" not found in saas_master!');
            await masterConnection.end();
            return;
        }

        const tenant = tenants[0];
        console.log('✅ Tenant found:', {
            id: tenant.id,
            name: tenant.name,
            tenant_key: tenant.tenant_key,
            db_name: tenant.db_name
        });

        await masterConnection.end();

        // Connect to tenant database
        const tenantConnection = await mysql.createConnection({
            host: tenant.db_host,
            user: tenant.db_user,
            password: tenant.db_password,
            database: tenant.db_name
        });

        console.log(`\n✅ Connected to ${tenant.db_name}\n`);

        // Check users
        const [usersCount] = await tenantConnection.query('SELECT COUNT(*) as count FROM users');
        console.log(`👥 Users: ${usersCount[0].count}`);

        if (usersCount[0].count > 0) {
            const [users] = await tenantConnection.query('SELECT id, name, email, role FROM users LIMIT 5');
            console.log('Sample users:');
            users.forEach(u => {
                console.log(`  - ${u.name} (${u.email}) - ${u.role}`);
            });
        }

        // Check customers
        const [customersCount] = await tenantConnection.query('SELECT COUNT(*) as count FROM customers');
        console.log(`\n🏢 Customers: ${customersCount[0].count}`);

        if (customersCount[0].count > 0) {
            const [customers] = await tenantConnection.query('SELECT id, name, email FROM customers LIMIT 5');
            console.log('Sample customers:');
            customers.forEach(c => {
                console.log(`  - ${c.name} (${c.email || 'no email'})`);
            });
        }

        // Check tasks
        const [tasksCount] = await tenantConnection.query('SELECT COUNT(*) as count FROM tasks');
        console.log(`\n📋 Tasks: ${tasksCount[0].count}`);

        await tenantConnection.end();

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 MySQL server is not running or not accessible');
            console.log('   Please start MySQL server first');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('\n💡 Database does not exist');
            console.log('   Please run setup scripts first');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 Access denied - check username/password');
        }
    }
}

checkMySQLRabin();
