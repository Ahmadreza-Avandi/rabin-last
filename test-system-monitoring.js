#!/usr/bin/env node

/**
 * 🔍 تست کامل System Monitoring Dashboard
 * برای تست از لوکال و سرور
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

// تنظیمات
const CONFIG = {
    // تنظیمات سرور
    SERVER_URL: 'http://crm.robintejarat.com', // یا https://crm.robintejarat.com
    LOCAL_URL: 'http://localhost:3000',

    // اطلاعات لاگین
    LOGIN_EMAIL: 'Robintejarat@gmail.com',
    LOGIN_PASSWORD: 'admin123',

    // تنظیمات تست
    TIMEOUT: 30000,
    RETRY_COUNT: 3,

    // انتخاب محیط تست
    USE_LOCAL: process.argv.includes('--local'),
    USE_SERVER: process.argv.includes('--server'),
    VERBOSE: process.argv.includes('--verbose') || process.argv.includes('-v'),
    SKIP_LOGIN: process.argv.includes('--skip-login'),
};

// تشخیص محیط
if (!CONFIG.USE_LOCAL && !CONFIG.USE_SERVER) {
    CONFIG.USE_LOCAL = true; // پیش‌فرض لوکال
}

const BASE_URL = CONFIG.USE_LOCAL ? CONFIG.LOCAL_URL : CONFIG.SERVER_URL;

console.log('🔍 تست System Monitoring Dashboard');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`🌐 محیط تست: ${CONFIG.USE_LOCAL ? 'LOCAL' : 'SERVER'}`);
console.log(`🔗 URL: ${BASE_URL}`);
console.log(`📧 Email: ${CONFIG.LOGIN_EMAIL}`);
console.log(`🔐 Password: ${CONFIG.LOGIN_PASSWORD}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Helper functions
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

const log = (message, level = 'info') => {
    const timestamp = new Date().toISOString();
    const prefix = {
        'info': '📋',
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'debug': '🔍'
    }[level] || '📋';

    console.log(`${prefix} [${timestamp}] ${message}`);

    if (level === 'debug' && !CONFIG.VERBOSE) return;
};

// تست‌های اصلی
class SystemMonitoringTester {
    constructor() {
        this.authToken = null;
        this.cookies = '';
        this.testResults = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    async runTest(testName, testFn) {
        this.testResults.total++;
        log(`شروع تست: ${testName}`);

        try {
            await testFn();
            this.testResults.passed++;
            log(`✅ ${testName} - موفق`, 'success');
        } catch (error) {
            this.testResults.failed++;
            this.testResults.errors.push({ test: testName, error: error.message });
            log(`❌ ${testName} - ناموفق: ${error.message}`, 'error');
        }
    }

    async testConnection() {
        const urlParts = parseUrl(BASE_URL);

        const options = {
            ...urlParts,
            method: 'GET',
            headers: {
                'User-Agent': 'System-Monitoring-Tester/1.0'
            }
        };

        const response = await makeRequest(options);

        if (response.statusCode !== 200 && response.statusCode !== 302) {
            throw new Error(`سرور پاسخ نمی‌دهد: HTTP ${response.statusCode}`);
        }

        log(`اتصال برقرار شد: HTTP ${response.statusCode}`, 'success');
    }

    async login() {
        if (CONFIG.SKIP_LOGIN) {
            log('رد شدن از مرحله لاگین', 'warning');
            return;
        }

        // مرحله 1: دریافت صفحه لاگین
        log('دریافت صفحه لاگین...');
        const loginPageUrl = parseUrl(`${BASE_URL}/login`);

        const loginPageOptions = {
            ...loginPageUrl,
            method: 'GET',
            headers: {
                'User-Agent': 'System-Monitoring-Tester/1.0'
            }
        };

        const loginPageResponse = await makeRequest(loginPageOptions);

        if (loginPageResponse.statusCode !== 200) {
            throw new Error(`صفحه لاگین در دسترس نیست: HTTP ${loginPageResponse.statusCode}`);
        }

        this.cookies = extractCookies(loginPageResponse.cookies);
        log('صفحه لاگین دریافت شد', 'success');

        // مرحله 2: ارسال درخواست لاگین
        log('ارسال درخواست لاگین...');
        const loginUrl = parseUrl(`${BASE_URL}/api/auth/login`);

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
                'User-Agent': 'System-Monitoring-Tester/1.0',
                'Cookie': this.cookies
            }
        };

        const loginResponse = await makeRequest(loginOptions, loginData);

        if (CONFIG.VERBOSE) {
            log(`Login Response: ${loginResponse.statusCode}`, 'debug');
            log(`Login Body: ${loginResponse.body.substring(0, 200)}...`, 'debug');
        }

        // بررسی پاسخ لاگین
        if (loginResponse.statusCode === 200) {
            try {
                const loginResult = JSON.parse(loginResponse.body);
                if (loginResult.success && loginResult.token) {
                    this.authToken = loginResult.token;
                    log('لاگین موفق - توکن دریافت شد', 'success');
                } else {
                    throw new Error(`لاگین ناموفق: ${loginResult.message || 'خطای نامشخص'}`);
                }
            } catch (parseError) {
                throw new Error(`خطا در پارس کردن پاسخ لاگین: ${parseError.message}`);
            }
        } else {
            throw new Error(`لاگین ناموفق: HTTP ${loginResponse.statusCode}`);
        }

        // به‌روزرسانی کوکی‌ها
        if (loginResponse.cookies.length > 0) {
            const newCookies = extractCookies(loginResponse.cookies);
            this.cookies = this.cookies ? `${this.cookies}; ${newCookies}` : newCookies;
        }
    }

    async testSystemMonitoringPage() {
        log('تست صفحه System Monitoring...');
        const pageUrl = parseUrl(`${BASE_URL}/dashboard/system-monitoring`);

        const headers = {
            'User-Agent': 'System-Monitoring-Tester/1.0'
        };

        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        if (this.cookies) {
            headers['Cookie'] = this.cookies;
        }

        const pageOptions = {
            ...pageUrl,
            method: 'GET',
            headers
        };

        const response = await makeRequest(pageOptions);

        if (CONFIG.VERBOSE) {
            log(`Page Response: ${response.statusCode}`, 'debug');
            log(`Page Headers: ${JSON.stringify(response.headers)}`, 'debug');
        }

        if (response.statusCode === 302 || response.statusCode === 301) {
            const location = response.headers.location;
            if (location && location.includes('/auth/login')) {
                throw new Error('احراز هویت ناموفق - redirect به صفحه لاگین');
            }
            log(`Redirect به: ${location}`, 'warning');
        } else if (response.statusCode !== 200) {
            throw new Error(`صفحه در دسترس نیست: HTTP ${response.statusCode}`);
        }

        // بررسی محتوای صفحه
        const pageContent = response.body;
        const expectedElements = [
            'System Monitoring',
            'system-monitoring',
            'dashboard'
        ];

        for (const element of expectedElements) {
            if (!pageContent.includes(element)) {
                log(`عنصر مورد انتظار یافت نشد: ${element}`, 'warning');
            }
        }

        log('صفحه System Monitoring بارگذاری شد', 'success');
    }

    async testSystemMonitoringAPI() {
        log('تست API System Monitoring...');
        const apiUrl = parseUrl(`${BASE_URL}/api/system/monitoring`);

        const headers = {
            'User-Agent': 'System-Monitoring-Tester/1.0',
            'Accept': 'application/json'
        };

        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        if (this.cookies) {
            headers['Cookie'] = this.cookies;
        }

        const apiOptions = {
            ...apiUrl,
            method: 'GET',
            headers
        };

        const response = await makeRequest(apiOptions);

        if (CONFIG.VERBOSE) {
            log(`API Response: ${response.statusCode}`, 'debug');
            log(`API Body: ${response.body.substring(0, 500)}...`, 'debug');
        }

        if (response.statusCode === 401) {
            throw new Error('دسترسی غیرمجاز - توکن نامعتبر یا منقضی');
        } else if (response.statusCode !== 200) {
            throw new Error(`API در دسترس نیست: HTTP ${response.statusCode}`);
        }

        // بررسی پاسخ JSON
        try {
            const apiResult = JSON.parse(response.body);

            if (!apiResult.success) {
                throw new Error(`API خطا برگرداند: ${apiResult.message || 'خطای نامشخص'}`);
            }

            // بررسی داده‌های مورد انتظار
            const expectedFields = ['system', 'database', 'application'];
            for (const field of expectedFields) {
                if (!apiResult.data || !apiResult.data[field]) {
                    log(`فیلد مورد انتظار یافت نشد: ${field}`, 'warning');
                }
            }

            log('API System Monitoring پاسخ صحیح داد', 'success');

            if (CONFIG.VERBOSE) {
                log(`System Info: ${JSON.stringify(apiResult.data.system || {}, null, 2)}`, 'debug');
            }

        } catch (parseError) {
            throw new Error(`خطا در پارس کردن پاسخ API: ${parseError.message}`);
        }
    }

    async testSystemStats() {
        log('تست آمار سیستم...');
        const statsUrl = parseUrl(`${BASE_URL}/api/system/stats`);

        const headers = {
            'User-Agent': 'System-Monitoring-Tester/1.0',
            'Accept': 'application/json'
        };

        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        if (this.cookies) {
            headers['Cookie'] = this.cookies;
        }

        const statsOptions = {
            ...statsUrl,
            method: 'GET',
            headers
        };

        const response = await makeRequest(statsOptions);

        if (response.statusCode === 404) {
            log('API آمار سیستم پیاده‌سازی نشده', 'warning');
            return;
        }

        if (response.statusCode === 401) {
            throw new Error('دسترسی غیرمجاز به آمار سیستم');
        } else if (response.statusCode !== 200) {
            throw new Error(`API آمار در دسترس نیست: HTTP ${response.statusCode}`);
        }

        try {
            const statsResult = JSON.parse(response.body);
            log('API آمار سیستم پاسخ داد', 'success');

            if (CONFIG.VERBOSE) {
                log(`Stats: ${JSON.stringify(statsResult, null, 2)}`, 'debug');
            }
        } catch (parseError) {
            throw new Error(`خطا در پارس کردن آمار: ${parseError.message}`);
        }
    }

    async testDatabaseConnection() {
        log('تست اتصال دیتابیس...');
        const dbUrl = parseUrl(`${BASE_URL}/api/system/monitoring/database`);

        const headers = {
            'User-Agent': 'System-Monitoring-Tester/1.0',
            'Accept': 'application/json'
        };

        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        if (this.cookies) {
            headers['Cookie'] = this.cookies;
        }

        const dbOptions = {
            ...dbUrl,
            method: 'GET',
            headers
        };

        const response = await makeRequest(dbOptions);

        if (response.statusCode === 404) {
            log('API تست دیتابیس پیاده‌سازی نشده', 'warning');
            return;
        }

        if (response.statusCode === 401) {
            throw new Error('دسترسی غیرمجاز به تست دیتابیس');
        } else if (response.statusCode !== 200) {
            throw new Error(`API دیتابیس در دسترس نیست: HTTP ${response.statusCode}`);
        }

        try {
            const dbResult = JSON.parse(response.body);

            if (dbResult.success) {
                log('اتصال دیتابیس سالم است', 'success');
            } else {
                throw new Error(`مشکل در دیتابیس: ${dbResult.message}`);
            }

            if (CONFIG.VERBOSE) {
                log(`DB Info: ${JSON.stringify(dbResult.data || {}, null, 2)}`, 'debug');
            }
        } catch (parseError) {
            throw new Error(`خطا در پارس کردن پاسخ دیتابیس: ${parseError.message}`);
        }
    }

    async runAllTests() {
        log('🚀 شروع تست‌های کامل System Monitoring');

        try {
            // تست‌های اصلی
            await this.runTest('اتصال به سرور', () => this.testConnection());
            await this.runTest('لاگین کاربر', () => this.login());
            await this.runTest('صفحه System Monitoring', () => this.testSystemMonitoringPage());
            await this.runTest('API System Monitoring', () => this.testSystemMonitoringAPI());
            await this.runTest('آمار سیستم', () => this.testSystemStats());
            await this.runTest('اتصال دیتابیس', () => this.testDatabaseConnection());

        } catch (error) {
            log(`خطای کلی در تست: ${error.message}`, 'error');
        }

        // نمایش نتایج
        this.showResults();
    }

    showResults() {
        console.log('\n🏁 نتایج تست');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📊 کل تست‌ها: ${this.testResults.total}`);
        console.log(`✅ موفق: ${this.testResults.passed}`);
        console.log(`❌ ناموفق: ${this.testResults.failed}`);
        console.log(`📈 درصد موفقیت: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);

        if (this.testResults.errors.length > 0) {
            console.log('\n❌ خطاهای رخ داده:');
            this.testResults.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error.test}: ${error.error}`);
            });
        }

        console.log('\n🔧 دستورات مفید:');
        console.log('   • تست لوکال: node test-system-monitoring.js --local');
        console.log('   • تست سرور: node test-system-monitoring.js --server');
        console.log('   • تست با جزئیات: node test-system-monitoring.js --verbose');
        console.log('   • رد کردن لاگین: node test-system-monitoring.js --skip-login');
        console.log('   • ترکیبی: node test-system-monitoring.js --server --verbose');

        if (this.authToken) {
            console.log(`\n🔑 توکن احراز هویت: ${this.authToken.substring(0, 20)}...`);
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
}

// اجرای تست
async function main() {
    const tester = new SystemMonitoringTester();
    await tester.runAllTests();
}

// اجرا
main().catch(error => {
    console.error('❌ خطای کلی:', error.message);
    process.exit(1);
});

export default SystemMonitoringTester;