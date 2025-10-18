#!/usr/bin/env node

/**
 * اسکریپت تشخیص توکن و جریان احراز هویت
 * این اسکریپت بررسی می‌کند که:
 * 1. کاربران در دیتابیس وجود دارند
 * 2. توکن‌ها صحیح ایجاد می‌شوند
 * 3. توکن‌ها صحیح تفسیر می‌شوند
 */

const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function debugTokenFlow() {
    console.log('🔍 شروع تشخیص جریان توکن\n');

    const connection = await mysql.createConnection({
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '3306'),
        user: process.env.DATABASE_USER || 'root',
        password: process.env.DATABASE_PASSWORD || '',
        database: 'crm_system',
    });

    try {
        // 1. بررسی کاربران
        console.log('📋 Step 1: بررسی کاربران در دیتابیس');
        console.log('=====================================');
        const [users] = await connection.query(`
            SELECT id, email, name, role, tenant_key, status 
            FROM users 
            WHERE status = 'active'
            LIMIT 5
        `);

        if (users.length === 0) {
            console.error('❌ هیچ کاربر فعال یافت نشد!');
            return;
        }

        console.log(`✅ ${users.length} کاربر فعال یافت شد\n`);
        users.forEach((user, i) => {
            console.log(`${i + 1}. ${user.email} (${user.role}) - tenant: ${user.tenant_key}`);
        });

        // 2. ایجاد توکن برای اولین کاربر
        console.log('\n\n📝 Step 2: ایجاد توکن');
        console.log('=======================');

        const testUser = users[0];
        const tokenPayload = {
            userId: testUser.id,
            email: testUser.email,
            name: testUser.name,
            role: testUser.role,
            tenant_key: testUser.tenant_key
        };

        console.log(`توکن برای: ${testUser.email}`);
        console.log('Payload:', JSON.stringify(tokenPayload, null, 2));

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });
        console.log(`\n✅ توکن ایجاد شد`);
        console.log(`طول توکن: ${token.length} کاراکتر`);
        console.log(`توکن: ${token.substring(0, 50)}...${token.substring(token.length - 20)}\n`);

        // 3. تفسیر و تحقق توکن
        console.log('\n📖 Step 3: تفسیر و تحقق توکن');
        console.log('================================');

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            console.log('✅ توکن معتبر است');
            console.log('تفسیر شده:', JSON.stringify(decoded, null, 2));

            // بررسی فیلدهای موردنیاز
            console.log('\n📌 بررسی فیلدهای موردنیاز:');
            const requiredFields = ['userId', 'email', 'name', 'role', 'tenant_key', 'iat', 'exp'];
            requiredFields.forEach(field => {
                const exists = field in decoded;
                const status = exists ? '✅' : '❌';
                console.log(`${status} ${field}: ${decoded[field] || 'موجود نیست'}`);
            });

            // بررسی انقضا
            const now = Math.floor(Date.now() / 1000);
            const expiresIn = decoded.exp - now;
            console.log(`\n⏰ توکن در ${expiresIn} ثانیه منقضی می‌شود`);

        } catch (error) {
            console.error('❌ خطا در تحقق توکن:', error.message);
        }

        // 4. تست فرآیند getAuthUser
        console.log('\n\n🔐 Step 4: شبیه‌سازی getAuthUser()');
        console.log('=====================================');

        function decodeJWT(token) {
            try {
                const parts = token.split('.');
                if (parts.length !== 3) return null;

                const payload = parts[1];
                let paddedPayload = payload;
                while (paddedPayload.length % 4) {
                    paddedPayload += '=';
                }

                const base64 = paddedPayload.replace(/-/g, '+').replace(/_/g, '/');
                const jsonStr = Buffer.from(base64, 'base64').toString('utf8');
                const decoded = JSON.parse(jsonStr);

                // بررسی انقضا
                if (decoded.exp && decoded.exp < Date.now() / 1000) {
                    console.log('❌ توکن منقضی شده است');
                    return null;
                }

                const userId = decoded.id || decoded.userId || decoded.sub;
                if (!userId) {
                    console.log('⚠️ هیچ userId در توکن یافت نشد');
                    console.log('فیلدهای موجود:', Object.keys(decoded));
                    return null;
                }

                return {
                    id: userId,
                    email: decoded.email || 'unknown',
                    role: decoded.role || 'user'
                };
            } catch (error) {
                console.error('❌ خطا در تفسیر JWT:', error.message);
                return null;
            }
        }

        const authUser = decodeJWT(token);
        if (authUser) {
            console.log('✅ کاربر با موفقیت تفسیر شد:');
            console.log(JSON.stringify(authUser, null, 2));
        } else {
            console.error('❌ نتوانست کاربر را تفسیر کند');
        }

        // 5. خلاصه
        console.log('\n\n📊 Step 5: خلاصه و توصیه‌ها');
        console.log('=============================');

        if (authUser) {
            console.log('✅ تمام مراحل موفق بود');
            console.log('\nبرای تست در مرورگر:');
            console.log('1. F12 را فشار دهید');
            console.log('2. به Storage > Cookies > localhost بروید');
            console.log('3. اسم فیلد "auth-token" را جستجو کنید');
            console.log('4. مقدار باید با این توکن کوچک شود:');
            console.log(`   ${token.substring(0, 30)}...`);
        } else {
            console.error('❌ مشکلی در جریان توکن وجود دارد');
        }

    } catch (error) {
        console.error('❌ خطا:', error.message);
        console.error(error.stack);
    } finally {
        await connection.end();
    }
}

debugTokenFlow().catch(console.error);