const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testTasksAuth() {
    console.log('🔍 Testing Tasks Page Authentication Flow\n');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: 'crm_system',
    });

    try {
        // Check if users table has the correct data
        console.log('📋 Checking users table...');
        const [users] = await connection.query(`
      SELECT id, email, name, role, tenant_key FROM users LIMIT 5
    `);
        console.log('Users found:', users.length);
        console.table(users);

        // Create a test token
        if (users.length > 0) {
            const testUser = users[0];
            console.log(`\n🔑 Creating test JWT token for: ${testUser.email}\n`);

            const token = jwt.sign(
                {
                    id: testUser.id,
                    email: testUser.email,
                    name: testUser.name,
                    role: testUser.role,
                    tenant_key: testUser.tenant_key,
                },
                process.env.JWT_SECRET || 'secret-key-dev',
                { expiresIn: '24h' }
            );

            console.log('✅ Token created:');
            console.log('Token:', token.substring(0, 50) + '...');

            // Decode to verify
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key-dev');
                console.log('\n✅ Token verification successful');
                console.table(decoded);
            } catch (err) {
                console.error('❌ Token verification failed:', err.message);
            }
        }

        // Check if /api/auth/me endpoint can be called
        console.log('\n📝 Instructions for testing:');
        console.log('1. Open browser DevTools Console (F12)');
        console.log('2. Go to: http://localhost:3000/rabin/login');
        console.log('3. Log in with your credentials');
        console.log('4. After login, check:');
        console.log('   - document.cookie (should have auth-token)');
        console.log('   - localStorage.getItem("auth-token")');
        console.log('5. Then navigate to: http://localhost:3000/rabin/dashboard/tasks');
        console.log('6. Check console for any errors');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

testTasksAuth();