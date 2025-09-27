#!/usr/bin/env node

/**
 * اسکریپت تست کامل API اسناد
 * این اسکریپت API documents را در محیط‌های مختلف تست می‌کند
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// تنظیمات تست
const CONFIG = {
    // URL های تست
    LOCAL_URL: 'http://localhost:3000',
    DOCKER_URL: 'https://crm.robintejarat.com',

    // اطلاعات احراز هویت
    TEST_USER: {
        username: 'Robintejarat@gmail.com',
        password: 'admin123'
    },

    // فایل‌های تست
    TEST_FILES: [
        {
            name: 'test-document.txt',
            content: 'این یک فایل تست است برای آپلود اسناد\nتاریخ: ' + new Date().toISOString(),
            mimeType: 'text/plain'
        },
        {
            name: 'test-image.png',
            content: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'),
            mimeType: 'image/png'
        }
    ]
};

// رنگ‌ها برای لاگ
const COLORS = {
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    MAGENTA: '\x1b[35m',
    CYAN: '\x1b[36m',
    WHITE: '\x1b[37m',
    RESET: '\x1b[0m'
};

// تابع لاگ با رنگ
function log(message, color = COLORS.WHITE) {
    console.log(`${color}${message}${COLORS.RESET}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, COLORS.GREEN);
}

function logError(message) {
    log(`❌ ${message}`, COLORS.RED);
}

function logWarning(message) {
    log(`⚠️  ${message}`, COLORS.YELLOW);
}

function logInfo(message) {
    log(`ℹ️  ${message}`, COLORS.BLUE);
}

function logHeader(message) {
    log(`\n${'='.repeat(60)}`, COLORS.CYAN);
    log(`${message}`, COLORS.CYAN);
    log(`${'='.repeat(60)}`, COLORS.CYAN);
}

// تابع ایجاد فایل تست
function createTestFile(fileConfig) {
    const filePath = path.join(__dirname, 'temp', fileConfig.name);

    // ایجاد پوشه temp اگر وجود ندارد
    const tempDir = path.dirname(filePath);
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(filePath, fileConfig.content);
    return filePath;
}

// تابع پاک کردن فایل‌های تست
function cleanupTestFiles() {
    const tempDir = path.join(__dirname, 'temp');
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}

// تابع درخواست HTTP
async function makeRequest(url, options = {}) {
    const fetch = (await import('node-fetch')).default;

    try {
        logInfo(`Making request to: ${url}`);
        logInfo(`Method: ${options.method || 'GET'}`);

        const response = await fetch(url, {
            timeout: 30000,
            ...options
        });

        logInfo(`Response status: ${response.status} ${response.statusText}`);

        const contentType = response.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        return {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            data
        };
    } catch (error) {
        logError(`Request failed: ${error.message}`);
        return {
            status: 0,
            error: error.message,
            data: null
        };
    }
}

// تابع ورود به سیستم
async function login(baseUrl) {
    logInfo('Attempting to login...');

    const loginResponse = await makeRequest(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(CONFIG.TEST_USER)
    });

    if (loginResponse.status === 200 && loginResponse.data.token) {
        logSuccess('Login successful');
        return loginResponse.data.token;
    } else {
        logError('Login failed');
        logError(JSON.stringify(loginResponse.data, null, 2));
        return null;
    }
}

// تابع تست آپلود فایل
async function testFileUpload(baseUrl, token, fileConfig) {
    logInfo(`Testing file upload: ${fileConfig.name}`);

    // ایجاد فایل تست
    const filePath = createTestFile(fileConfig);

    try {
        const FormData = require('form-data');
        const form = new FormData();

        form.append('file', fs.createReadStream(filePath));
        form.append('title', `تست آپلود ${fileConfig.name}`);
        form.append('description', 'این یک فایل تست است');
        form.append('accessLevel', 'public');
        form.append('tags', 'تست,آپلود,فایل');

        const response = await makeRequest(`${baseUrl}/api/documents`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                ...form.getHeaders()
            },
            body: form
        });

        if (response.status === 200 && response.data.success) {
            logSuccess(`File upload successful: ${fileConfig.name}`);
            return response.data.document;
        } else {
            logError(`File upload failed: ${fileConfig.name}`);
            logError(JSON.stringify(response.data, null, 2));
            return null;
        }
    } catch (error) {
        logError(`File upload error: ${error.message}`);
        return null;
    } finally {
        // پاک کردن فایل تست
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}

// تابع تست دریافت لیست اسناد
async function testGetDocuments(baseUrl, token) {
    logInfo('Testing get documents list...');

    const response = await makeRequest(`${baseUrl}/api/documents?page=1&limit=10`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (response.status === 200) {
        logSuccess('Get documents list successful');
        logInfo(`Found ${response.data.documents?.length || 0} documents`);
        return response.data.documents;
    } else {
        logError('Get documents list failed');
        logError(JSON.stringify(response.data, null, 2));
        return null;
    }
}

// تابع تست جستجو در اسناد
async function testSearchDocuments(baseUrl, token) {
    logInfo('Testing document search...');

    const response = await makeRequest(`${baseUrl}/api/documents?search=تست&page=1&limit=5`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (response.status === 200) {
        logSuccess('Document search successful');
        logInfo(`Found ${response.data.documents?.length || 0} matching documents`);
        return response.data.documents;
    } else {
        logError('Document search failed');
        logError(JSON.stringify(response.data, null, 2));
        return null;
    }
}

// تابع تست دانلود فایل
async function testFileDownload(baseUrl, token, documentId) {
    if (!documentId) {
        logWarning('No document ID provided for download test');
        return false;
    }

    logInfo(`Testing file download for document: ${documentId}`);

    const response = await makeRequest(`${baseUrl}/api/documents/${documentId}/download`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.status === 200) {
        logSuccess('File download successful');
        return true;
    } else {
        logError('File download failed');
        logError(JSON.stringify(response.data, null, 2));
        return false;
    }
}

// تابع تست کامل برای یک محیط
async function testEnvironment(baseUrl, environmentName) {
    logHeader(`Testing ${environmentName} Environment: ${baseUrl}`);

    const results = {
        environment: environmentName,
        baseUrl,
        tests: {},
        success: true
    };

    try {
        // تست اتصال
        logInfo('Testing connection...');
        const healthResponse = await makeRequest(`${baseUrl}/api/health`);
        if (healthResponse.status === 200) {
            logSuccess('Connection test passed');
            results.tests.connection = true;
        } else {
            logError('Connection test failed');
            results.tests.connection = false;
            results.success = false;
        }

        // تست ورود
        const token = await login(baseUrl);
        if (token) {
            results.tests.login = true;
        } else {
            results.tests.login = false;
            results.success = false;
            return results; // اگر ورود ناموفق باشد، ادامه ندهیم
        }

        // تست آپلود فایل‌ها
        const uploadedDocuments = [];
        for (const fileConfig of CONFIG.TEST_FILES) {
            const uploadedDoc = await testFileUpload(baseUrl, token, fileConfig);
            if (uploadedDoc) {
                uploadedDocuments.push(uploadedDoc);
                results.tests[`upload_${fileConfig.name}`] = true;
            } else {
                results.tests[`upload_${fileConfig.name}`] = false;
                results.success = false;
            }
        }

        // تست دریافت لیست اسناد
        const documents = await testGetDocuments(baseUrl, token);
        if (documents) {
            results.tests.getDocuments = true;
        } else {
            results.tests.getDocuments = false;
            results.success = false;
        }

        // تست جستجو
        const searchResults = await testSearchDocuments(baseUrl, token);
        if (searchResults) {
            results.tests.searchDocuments = true;
        } else {
            results.tests.searchDocuments = false;
            results.success = false;
        }

        // تست دانلود (اگر سندی آپلود شده باشد)
        if (uploadedDocuments.length > 0) {
            const downloadSuccess = await testFileDownload(baseUrl, token, uploadedDocuments[0].id);
            results.tests.downloadFile = downloadSuccess;
            if (!downloadSuccess) {
                results.success = false;
            }
        }

    } catch (error) {
        logError(`Environment test failed: ${error.message}`);
        results.success = false;
        results.error = error.message;
    }

    return results;
}

// تابع بررسی محیط Docker
async function checkDockerEnvironment() {
    logHeader('Checking Docker Environment');

    try {
        // بررسی وجود کانتینرها
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        logInfo('Checking Docker containers...');
        const { stdout } = await execAsync('docker ps --format "table {{.Names}}\\t{{.Status}}"');
        log(stdout, COLORS.CYAN);

        // بررسی logs کانتینر nextjs
        logInfo('Checking NextJS container logs...');
        try {
            const { stdout: logs } = await execAsync('docker logs crm-nextjs --tail 20');
            log('Recent NextJS logs:', COLORS.YELLOW);
            log(logs, COLORS.WHITE);
        } catch (logError) {
            logWarning('Could not fetch NextJS logs');
        }

        // بررسی volumes
        logInfo('Checking Docker volumes...');
        try {
            const { stdout: volumes } = await execAsync('docker volume ls');
            log(volumes, COLORS.CYAN);
        } catch (volumeError) {
            logWarning('Could not fetch Docker volumes');
        }

        return true;
    } catch (error) {
        logError(`Docker environment check failed: ${error.message}`);
        return false;
    }
}

// تابع اصلی
async function main() {
    logHeader('🚀 Starting Complete Documents API Test');

    const allResults = [];

    try {
        // بررسی محیط Docker
        await checkDockerEnvironment();

        // تست محیط Local
        logInfo('Testing Local environment...');
        const localResults = await testEnvironment(CONFIG.LOCAL_URL, 'Local');
        allResults.push(localResults);

        // تست محیط Docker
        logInfo('Testing Docker environment...');
        const dockerResults = await testEnvironment(CONFIG.DOCKER_URL, 'Docker');
        allResults.push(dockerResults);

        // نمایش نتایج نهایی
        logHeader('📊 Test Results Summary');

        for (const result of allResults) {
            log(`\n${result.environment} Environment (${result.baseUrl}):`, COLORS.MAGENTA);
            log(`Overall Success: ${result.success ? '✅' : '❌'}`, result.success ? COLORS.GREEN : COLORS.RED);

            for (const [testName, testResult] of Object.entries(result.tests)) {
                log(`  ${testName}: ${testResult ? '✅' : '❌'}`, testResult ? COLORS.GREEN : COLORS.RED);
            }

            if (result.error) {
                log(`  Error: ${result.error}`, COLORS.RED);
            }
        }

        // ذخیره نتایج در فایل
        const reportPath = path.join(__dirname, 'test-results.json');
        fs.writeFileSync(reportPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            results: allResults
        }, null, 2));

        logSuccess(`Test report saved to: ${reportPath}`);

        // تعیین وضعیت خروج
        const overallSuccess = allResults.every(r => r.success);
        if (overallSuccess) {
            logSuccess('🎉 All tests passed!');
            process.exit(0);
        } else {
            logError('💥 Some tests failed!');
            process.exit(1);
        }

    } catch (error) {
        logError(`Test execution failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    } finally {
        // پاک کردن فایل‌های موقت
        cleanupTestFiles();
    }
}

// اجرای اسکریپت
if (require.main === module) {
    main().catch(error => {
        logError(`Unhandled error: ${error.message}`);
        console.error(error);
        process.exit(1);
    });
}

module.exports = {
    testEnvironment,
    checkDockerEnvironment,
    CONFIG
};