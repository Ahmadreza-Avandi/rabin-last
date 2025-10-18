#!/usr/bin/env node

/**
 * 🧪 API Integration Test Suite
 * تست کردن TTS و AI API Endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Colors for console
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

const log = {
    section: () => console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`),
    title: (title) => console.log(`${colors.bright}${colors.blue}📝 ${title}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
    request: (method, url) => console.log(`${colors.yellow}📤 ${method} ${url}${colors.reset}`),
    response: (code) => console.log(`${colors.blue}📥 Response: ${code}${colors.reset}`),
    data: (label, data) => console.log(`${colors.magenta}${label}:${colors.reset}`, JSON.stringify(data, null, 2))
};

// Test 1: TTS - Normal Request
async function testTTS_Normal() {
    log.title('Test 1: TTS - درخواست معمولی');

    try {
        log.request('POST', `${BASE_URL}/tts/text-to-speech`);

        const resp = await axios.post(`${BASE_URL}/tts/text-to-speech`, {
            text: 'سلام از نمونه',
            speaker: '3'
        });

        log.response(resp.status);
        const data = resp.data;

        // Validate response format
        const requiredFields = ['success', 'audioUrl', 'directUrl', 'requestId', 'shamsiDate', 'error'];
        const missingFields = requiredFields.filter(f => !(f in data));

        if (missingFields.length > 0) {
            log.error(`Missing fields: ${missingFields.join(', ')}`);
        } else {
            log.success('تمام فیلدها موجود هستند');
        }

        console.log(`  success: ${data.success}`);
        console.log(`  requestId: ${data.requestId}`);
        console.log(`  audioUrl: ${data.audioUrl ? '✓ موجود' : '✗ نمی‌باشد'}`);
        console.log(`  shamsiDate: ${data.shamsiDate}`);

        if (!data.success) {
            log.error(`API Error: ${data.error}`);
        }

        return data.success;

    } catch (err) {
        log.error(`درخواست ناموفق: ${err.message}`);
        if (err.response?.data) {
            log.data('Response', err.response.data);
        }
        return false;
    }
}

// Test 2: TTS - Long Text
async function testTTS_LongText() {
    log.title('Test 2: TTS - متن بلندتر');

    try {
        const longText = 'سلام، این یک تست برای سیستم صوتی جدید رابین است. ما سعی می‌کنیم بررسی کنیم که API درست کار می‌کند یا نه.';

        log.request('POST', `${BASE_URL}/tts/text-to-speech`);

        const resp = await axios.post(`${BASE_URL}/tts/text-to-speech`, {
            text: longText,
            speaker: '1'
        });

        log.response(resp.status);
        const data = resp.data;

        console.log(`  success: ${data.success}`);
        console.log(`  textLength: ${longText.length} characters`);
        console.log(`  speaker: 1 (male)`);

        return data.success;

    } catch (err) {
        log.error(`درخواست ناموفق: ${err.message}`);
        return false;
    }
}

// Test 3: TTS - Missing Text
async function testTTS_MissingText() {
    log.title('Test 3: TTS - بدون متن (خطا انتظار‌شده)');

    try {
        log.request('POST', `${BASE_URL}/tts/text-to-speech`);

        const resp = await axios.post(`${BASE_URL}/tts/text-to-speech`, {
            speaker: '3'
        });

        log.response(resp.status);
        log.error('باید 400 error برگشت دهد!');
        return false;

    } catch (err) {
        if (err.response?.status === 400) {
            log.response(err.response.status);
            log.success('خطای 400 دریافت شد (انتظار‌شده)');
            console.log(`  error: ${err.response.data.error}`);
            return true;
        } else {
            log.error(`خطای غیرمنتظره: ${err.message}`);
            return false;
        }
    }
}

// Test 4: TTS - Different Speaker
async function testTTS_DifferentSpeaker() {
    log.title('Test 4: TTS - Speaker های مختلف');

    const speakers = [
        { id: '1', name: 'مردانه' },
        { id: '2', name: 'کودک' },
        { id: '3', name: 'زنانه' }
    ];

    let successCount = 0;

    for (const speaker of speakers) {
        try {
            log.request('POST', `${BASE_URL}/tts/text-to-speech`);
            console.log(`  Speaker: ${speaker.id} (${speaker.name})`);

            const resp = await axios.post(`${BASE_URL}/tts/text-to-speech`, {
                text: `تست صدای شماره ${speaker.id}`,
                speaker: speaker.id
            });

            if (resp.data.success) {
                log.success(`Speaker ${speaker.id} کار کرد`);
                successCount++;
            } else {
                log.error(`Speaker ${speaker.id} - Error: ${resp.data.error}`);
            }

        } catch (err) {
            log.error(`Speaker ${speaker.id} - ${err.message}`);
        }
    }

    console.log(`\n📊 نتایج: ${successCount}/${speakers.length} موفق`);
    return successCount === speakers.length;
}

// Test 5: AI Chat
async function testAI_Chat() {
    log.title('Test 5: AI - درخواست چت');

    try {
        log.request('POST', `${BASE_URL}/ai/chat`);

        const resp = await axios.post(`${BASE_URL}/ai/chat`, {
            message: 'سلام رابین',
            userId: 'test-user-123'
        });

        log.response(resp.status);

        if (resp.data.response) {
            log.success('پاسخ دریافت شد');
            console.log(`  Response: ${resp.data.response.substring(0, 100)}...`);
            return true;
        } else if (resp.data.error) {
            log.error(`Error: ${resp.data.error}`);
            return false;
        }

    } catch (err) {
        log.error(`درخواست ناموفق: ${err.message}`);
        if (err.response?.data) {
            log.data('Response', err.response.data);
        }
        return false;
    }
}

// Test 6: Health Check
async function testHealth() {
    log.title('Test 6: Health Check');

    try {
        log.request('GET', `${BASE_URL.replace('/api', '')}/api/health`);

        const resp = await axios.get(`${BASE_URL.replace('/api', '')}/api/health`);

        log.response(resp.status);
        console.log(`  status: ${resp.data.status}`);
        console.log(`  message: ${resp.data.message}`);

        return resp.data.status === 'OK';

    } catch (err) {
        log.error(`درخواست ناموفق: ${err.message}`);
        return false;
    }
}

// Test 7: Response Format Validation
async function testResponseFormat() {
    log.title('Test 7: فرمت پاسخ - تفصیلی');

    try {
        const resp = await axios.post(`${BASE_URL}/tts/text-to-speech`, {
            text: 'تست فرمت',
            speaker: '3'
        });

        const data = resp.data;
        const schema = {
            success: 'boolean',
            audioUrl: 'string|null',
            directUrl: 'string|null',
            checksum: 'string|null',
            base64: 'null',
            requestId: 'string',
            shamsiDate: 'string',
            error: 'null|string'
        };

        console.log('\n🔍 فیلدهای پاسخ:\n');

        let valid = true;
        for (const [field, expectedType] of Object.entries(schema)) {
            const value = data[field];
            const types = expectedType.split('|');
            const valueType = value === null ? 'null' : typeof value;
            const isValid = types.includes(valueType);

            const symbol = isValid ? '✅' : '❌';
            const displayValue = typeof value === 'string'
                ? value.substring(0, 40) + (value.length > 40 ? '...' : '')
                : value;

            console.log(`  ${symbol} ${field}: ${valueType} = ${displayValue}`);

            if (!isValid) valid = false;
        }

        return valid;

    } catch (err) {
        log.error(`درخواست ناموفق: ${err.message}`);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    log.section();
    console.log(`${colors.bright}${colors.magenta}🎯 تست سیستم API ادغام شده${colors.reset}`);
    log.section();

    const results = [];

    try {
        results.push({ name: 'Health Check', result: await testHealth() });
        results.push({ name: 'TTS - Normal', result: await testTTS_Normal() });
        results.push({ name: 'TTS - Long Text', result: await testTTS_LongText() });
        results.push({ name: 'TTS - Missing Text', result: await testTTS_MissingText() });
        results.push({ name: 'TTS - Speakers', result: await testTTS_DifferentSpeaker() });
        results.push({ name: 'TTS - Response Format', result: await testResponseFormat() });
        results.push({ name: 'AI - Chat', result: await testAI_Chat() });

    } catch (err) {
        log.error(`خطای غیرمنتظره: ${err.message}`);
    }

    // Summary
    log.section();
    console.log(`${colors.bright}${colors.magenta}📊 خلاصه نتایج:${colors.reset}\n`);

    const passed = results.filter(r => r.result).length;
    const total = results.length;

    for (const { name, result } of results) {
        const symbol = result ? '✅' : '❌';
        console.log(`  ${symbol} ${name}`);
    }

    console.log(`\n${colors.bright}کل: ${passed}/${total}${colors.reset}\n`);

    if (passed === total) {
        log.success('تمام تست‌ها موفق!');
    } else {
        log.error(`${total - passed} تست ناموفق`);
    }

    log.section();
}

// Main
if (require.main === module) {
    runAllTests().catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
}

module.exports = { runAllTests };