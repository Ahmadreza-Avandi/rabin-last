#!/usr/bin/env node

/**
 * 🔍 تست دیباگ مخصوص API Stats
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

const CONFIG = {
    SERVER_URL: 'http://crm.robintejarat.com',
    LOGIN_EMAIL: 'Robintejarat@gmail.com',
    LOGIN_PASSWORD: 'admin123',
    TIMEOUT: 30000,
};

const makeRequest = (options, postData = null) => {
    return new Promise((resolve, reject) => {
        const client = options.protocol === 'https:' ? https : http;
        
        const req = client.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data,
                    cookies: res.headers['set-cookie'] || []
                });
            });
        });
        
        req.on('error', (err) => {
            reject(err);
        });
        
        req.setTimeout(CONFIG.TIMEOUT, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        if (postData) {
            req.write(postData);
        }
        
        req.end();
    });
};

const parseUrl = (url) => {
    const urlObj = new URL(url);
    return {
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search
    };
};

const extractCookies = (cookieHeaders) => {
    if (!cookieHeaders) return '';
    return cookieHeaders
        .map(cookie => cookie.split(';')[0])
        .join('; ');
};

async function login() {
    console.log('🔐 شروع لاگین...');
    
    // دریافت صفحه لاگین
    const loginPageUrl = parseUrl(`${CONFIG.SERVER_URL}/login`);
    const loginPageOptions = {
        ...loginPageUrl,
        method: 'GET',
        headers: {
            'User-Agent': 'Stats-Debug-Tester/1.0'
        }
    };

    const loginPageResponse = await makeRequest(loginPageOptions);
    const cookies = extractCookies(loginPageResponse.cookies);
    
    // ارسال درخواست لاگین
    const loginUrl = parseUrl(`${CONFIG.SERVER_URL}/api/auth/login`);
    const loginData = JSON.stringify({
        email: CONFIG.LOGIN_EMAIL,
        password: CONFIG.LOGIN_PASSWORD
    });

    const loginOptions = {
        ...loginUrl,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(loginData),
            'User-Agent': 'Stats-Debug-Tester/1.0',
            'Cookie': cookies
        }
    };

    const loginResponse = await makeRequest(loginOptions, loginData);
    
    if (loginResponse.statusCode === 200) {
        const loginResult = JSON.parse(loginResponse.body);
        if (loginResult.success && loginResult.token) {
            console.log('✅ لاگین موفق');
            return {
                token: loginResult.token,
                cookies: cookies
            };
        }
    }
    
    throw new Error('لاگین ناموفق');
}

async function testStatsAPI(authData) {
    console.log('\n🔍 تست API Stats...');
    
    const statsUrl = parseUrl(`${CONFIG.SERVER_URL}/api/system/stats`);
    
    const headers = {
        'User-Agent': 'Stats-Debug-Tester/1.0',
        'Accept': 'application/json',
        'Authorization': `Bearer ${authData.token}`,
        'Cookie': authData.cookies
    };

    const statsOptions = {
        ...statsUrl,
        method: 'GET',
        headers
    };

    console.log('📤 ارسال درخواست به:', `${CONFIG.SERVER_URL}/api/system/stats`);
    console.log('🔑 Authorization Header:', `Bearer ${authData.token.substring(0, 20)}...`);

    try {
        const response = await makeRequest(statsOptions);
        
        console.log('📥 پاسخ دریافت شد:');
        console.log('   Status Code:', response.statusCode);
        console.log('   Headers:', JSON.stringify(response.headers, null, 2));
        
        if (response.statusCode === 200) {
            console.log('✅ API Stats موفق');
            try {
                const data = JSON.parse(response.body);
                console.log('📊 داده‌های دریافتی:');
                console.log('   Success:', data.success);
                if (data.data) {
                    console.log('   Total Customers:', data.data.totalCustomers);
                    console.log('   Total Sales:', data.data.totalSales);
                    console.log('   Total Revenue:', data.data.totalRevenue);
                    console.log('   Total Feedbacks:', data.data.totalFeedbacks);
                }
            } catch (parseError) {
                console.log('❌ خطا در پارس JSON:', parseError.message);
                console.log('📄 Raw Response:', response.body.substring(0, 500));
            }
        } else if (response.statusCode === 500) {
            console.log('❌ خطای سرور 500');
            console.log('📄 Error Response:', response.body);
            
            // تلاش برای پارس خطا
            try {
                const errorData = JSON.parse(response.body);
                console.log('🔍 جزئیات خطا:', errorData);
            } catch (e) {
                console.log('📄 Raw Error:', response.body);
            }
        } else {
            console.log(`❌ خطای غیرمنتظره: HTTP ${response.statusCode}`);
            console.log('📄 Response:', response.body.substring(0, 500));
        }
        
    } catch (error) {
        console.log('❌ خطا در درخواست:', error.message);
    }
}

async function testDatabaseConnection(authData) {
    console.log('\n🗄️ تست اتصال مستقیم دیتابیس...');
    
    // تست API health که معمولاً اتصال دیتابیس رو چک می‌کنه
    const healthUrl = parseUrl(`${CONFIG.SERVER_URL}/api/health`);
    
    const headers = {
        'User-Agent': 'Stats-Debug-Tester/1.0',
        'Accept': 'application/json'
    };

    const healthOptions = {
        ...healthUrl,
        method: 'GET',
        headers
    };

    try {
        const response = await makeRequest(healthOptions);
        console.log('📥 Health Check Response:');
        console.log('   Status Code:', response.statusCode);
        console.log('   Body:', response.body);
    } catch (error) {
        console.log('❌ خطا در health check:', error.message);
    }
}

async function testEnvironmentVariables(authData) {
    console.log('\n🔧 تست متغیرهای محیطی...');
    
    // تست API debug که متغیرهای محیطی رو نشون می‌ده
    const debugUrl = parseUrl(`${CONFIG.SERVER_URL}/api/debug`);
    
    const headers = {
        'User-Agent': 'Stats-Debug-Tester/1.0',
        'Accept': 'application/json',
        'Authorization': `Bearer ${authData.token}`,
        'Cookie': authData.cookies
    };

    const debugOptions = {
        ...debugUrl,
        method: 'GET',
        headers
    };

    try {
        const response = await makeRequest(debugOptions);
        console.log('📥 Debug Response:');
        console.log('   Status Code:', response.statusCode);
        if (response.statusCode === 200) {
            try {
                const data = JSON.parse(response.body);
                console.log('🔍 Environment Info:', JSON.stringify(data, null, 2));
            } catch (e) {
                console.log('📄 Raw Debug:', response.body.substring(0, 500));
            }
        } else {
            console.log('📄 Debug Body:', response.body.substring(0, 300));
        }
    } catch (error) {
        console.log('❌ خطا در debug:', error.message);
    }
}

async function testSimpleQuery(authData) {
    console.log('\n📊 تست کوئری ساده...');
    
    // تست API customers که ساده‌تره
    const customersUrl = parseUrl(`${CONFIG.SERVER_URL}/api/customers`);
    
    const headers = {
        'User-Agent': 'Stats-Debug-Tester/1.0',
        'Accept': 'application/json',
        'Authorization': `Bearer ${authData.token}`,
        'Cookie': authData.cookies
    };

    const customersOptions = {
        ...customersUrl,
        method: 'GET',
        headers
    };

    try {
        const response = await makeRequest(customersOptions);
        console.log('📥 Customers API Response:');
        console.log('   Status Code:', response.statusCode);
        
        if (response.statusCode === 200) {
            try {
                const data = JSON.parse(response.body);
                console.log('✅ Customers API موفق');
                console.log('   تعداد مشتریان:', data.data ? data.data.length : 'نامشخص');
            } catch (e) {
                console.log('❌ خطا در پارس customers:', e.message);
            }
        } else {
            console.log('❌ Customers API ناموفق:', response.body.substring(0, 200));
        }
    } catch (error) {
        console.log('❌ خطا در customers API:', error.message);
    }
}

async function main() {
    console.log('🔍 تست دیباگ API Stats');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌐 سرور:', CONFIG.SERVER_URL);
    console.log('📧 ایمیل:', CONFIG.LOGIN_EMAIL);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
        // لاگین
        const authData = await login();
        
        // تست‌های مختلف
        await testStatsAPI(authData);
        await testDatabaseConnection(authData);
        await testEnvironmentVariables(authData);
        await testSimpleQuery(authData);
        
        console.log('\n✅ تست‌های دیباگ تمام شد');
        
    } catch (error) {
        console.log('\n❌ خطای کلی:', error.message);
    }
}

main().catch(error => {
    console.error('❌ خطای اجرا:', error.message);
    process.exit(1);
});