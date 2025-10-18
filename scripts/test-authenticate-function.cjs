const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function authenticateTenantUser(tenantKey, email, password) {
    let connection;

    try {
        console.log('🔐 تست تابع authenticateTenantUser\n');
        console.log(`📧 ایمیل: ${email}`);
        console.log(`🏢 Tenant Key: ${tenantKey}`);
        console.log(`🔑 رمز عبور: ${password}\n`);

        // اتصال به crm_system
        connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'crm_user',
            password: '1234',
            database: 'crm_system'
        });

        console.log('✅ اتصال به دیتابیس برقرار شد\n');

        // جستجوی کاربر با tenant_key
        console.log('🔍 جستجوی کاربر...');
        const [users] = await connection.query(
            'SELECT * FROM users WHERE email = ? AND tenant_key = ? AND status = ?',
            [email, tenantKey, 'active']
        );

        console.log(`   تعداد کاربر یافت شده: ${users.length}\n`);

        if (users.length === 0) {
            console.log('❌ کاربر یافت نشد');
            return { success: false, message: 'ایمیل یا رمز عبور اشتباه است' };
        }

        const user = users[0];
        console.log('✅ کاربر یافت شد:');
        console.log(`   ID: ${user.id}`);
        console.log(`   نام: ${user.name}`);
        console.log(`   ایمیل: ${user.email}`);
        console.log(`   نقش: ${user.role}`);
        console.log(`   وضعیت: ${user.status}`);
        console.log(`   Tenant Key: ${user.tenant_key}`);
        console.log(`   رمز عبور هش: ${user.password ? user.password.substring(0, 20) + '...' : 'خالی'}\n`);

        // بررسی رمز عبور
        console.log('🔐 بررسی رمز عبور...');
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log(`   نتیجه: ${isPasswordValid ? '✅ صحیح' : '❌ نادرست'}\n`);

        if (!isPasswordValid) {
            console.log('❌ رمز عبور اشتباه است');
            return { success: false, message: 'ایمیل یا رمز عبور اشتباه است' };
        }

        console.log('✅ احراز هویت موفقیت‌آمیز بود!');
        return {
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                tenant_key: tenantKey
            }
        };

    } catch (error) {
        console.error('❌ خطا:', error.message);
        return { success: false, message: 'خطای سرور' };
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// تست با اطلاعات واقعی
authenticateTenantUser('rabin', 'Robintejarat@gmail.com', 'admin123')
    .then(result => {
        console.log('\n📋 نتیجه نهایی:');
        console.log(JSON.stringify(result, null, 2));
    });
