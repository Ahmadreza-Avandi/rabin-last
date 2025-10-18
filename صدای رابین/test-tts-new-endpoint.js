/**
 * 🎵 تست سیستم صوتی جدید رابین
 * 
 * استفاده:
 *   node test-tts-new-endpoint.js
 *   node test-tts-new-endpoint.js test1
 *   node test-tts-new-endpoint.js test2
 *   etc.
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/tts';

// رنگ‌های console
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const log = {
    section: (title) => console.log(`\n${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`),
    title: (title) => console.log(`${colors.bright}${colors.blue}📝 ${title}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
    request: (msg) => console.log(`${colors.yellow}📤 ${msg}${colors.reset}`),
    response: (msg) => console.log(`${colors.blue}📥 ${msg}${colors.reset}`),
    data: (data) => console.log(JSON.stringify(data, null, 2))
};

// تست 1: Endpoint جدید - درخواست معمولی
async function test1() {
    log.title('تست 1: POST /text-to-speech - درخواست معمولی');

    try {
        log.request(`POST ${BASE_URL}/text-to-speech`);
        console.log('Body:', JSON.stringify({ text: 'سلام دنیا', speaker: '3' }, null, 2));

        const response = await axios.post(`${BASE_URL}/text-to-speech`, {
            text: 'سلام دنیا',
            speaker: '3'
        });

        log.success('درخواست موفق');
        log.response('پاسخ:');

        const data = response.data;
        console.log(`  Success: ${data.success}`);
        console.log(`  Audio URL: ${data.audioUrl?.substring(0, 50)}...`);
        console.log(`  Request ID: ${data.requestId}`);
        console.log(`  Shamsi Date: ${data.shamsiDate}`);
        console.log(`  Error: ${data.error || 'None'}`);

    } catch (error) {
        log.error('درخواست ناموفق');
        console.error(`  Message: ${error.message}`);
        if (error.response?.data) {
            console.error('  Response:', error.response.data);
        }
    }
}

// تست 2: متن بلندتر
async function test2() {
    log.title('تست 2: متن بلندتر');

    const longText = 'سلام، این یک تست برای سیستم صوتی جدید است. امیدواریم همه چیز درست کار کند.';

    try {
        log.request(`POST ${BASE_URL}/text-to-speech`);
        console.log(`Body: { text: "${longText.substring(0, 40)}...", speaker: "1" }`);

        const response = await axios.post(`${BASE_URL}/text-to-speech`, {
            text: longText,
            speaker: '1'
        });

        log.success('درخواست موفق');
        const data = response.data;
        console.log(`  Success: ${data.success}`);
        console.log(`  Request ID: ${data.requestId}`);

        if (data.audioUrl) {
            log.info(`آدرس صوتی آماده است`);
        }

    } catch (error) {
        log.error(`خطا: ${error.message}`);
    }
}

// تست 3: بدون متن (خطا)
async function test3() {
    log.title('تست 3: درخواست بدون متن (انتظار خطا)');

    try {
        log.request(`POST ${BASE_URL}/text-to-speech`);
        console.log('Body:', JSON.stringify({ speaker: '3' }, null, 2));

        const response = await axios.post(`${BASE_URL}/text-to-speech`, {
            speaker: '3'
        });

        log.response('پاسخ دریافت شد:');
        const data = response.data;
        console.log(`  Success: ${data.success}`);
        console.log(`  Error: ${data.error}`);
        console.log(`  Request ID: ${data.requestId}`);

    } catch (error) {
        if (error.response?.status === 400) {
            log.success('خطای 400 دریافت شد (انتظار‌شده)');
            console.log(error.response.data);
        } else {
            log.error(`خطا: ${error.message}`);
        }
    }
}

// تست 4: Debug endpoint
async function test4() {
    log.title('تست 4: GET /debug/:text');

    try {
        const text = encodeURIComponent('سلام');
        log.request(`GET ${BASE_URL}/debug/${text}`);

        const response = await axios.get(`${BASE_URL}/debug/${text}`);

        log.success('درخواست موفق');
        const data = response.data;
        console.log(`  Request ID: ${data.requestId}`);
        console.log(`  Status: ${data.status}`);
        console.log(`  Response Keys: ${data.responseKeys.join(', ')}`);

    } catch (error) {
        log.error(`خطا: ${error.message}`);
    }
}

// تست 5: Endpoint قدیم (/convert)
async function test5() {
    log.title('تست 5: POST /convert (میراث)');

    try {
        log.request(`POST ${BASE_URL}/convert`);
        console.log('Body:', JSON.stringify({ text: 'سلام از تست' }, null, 2));

        const response = await axios.post(`${BASE_URL}/convert`, {
            text: 'سلام از تست'
        });

        log.success('درخواست موفق');
        const data = response.data;
        console.log(`  Success: ${data.success}`);
        console.log(`  Audio URL: ${data.audioUrl?.substring(0, 50)}...`);

    } catch (error) {
        log.error(`خطا: ${error.message}`);
    }
}

// تست 6: مقایسه سرعت
async function test6() {
    log.title('تست 6: مقایسه سرعت - Endpoint جدید vs قدیم');

    const text = 'سلام دنیا';

    try {
        // Endpoint جدید
        console.log('\n📤 تست endpoint جدید...');
        const start1 = Date.now();
        const response1 = await axios.post(`${BASE_URL}/text-to-speech`, {
            text: text,
            speaker: '3'
        });
        const duration1 = Date.now() - start1;
        console.log(`  ✅ مدت زمان: ${duration1}ms`);

        // Endpoint قدیم
        console.log('\n📤 تست endpoint قدیم...');
        const start2 = Date.now();
        const response2 = await axios.post(`${BASE_URL}/convert`, {
            text: text
        });
        const duration2 = Date.now() - start2;
        console.log(`  ✅ مدت زمان: ${duration2}ms`);

        console.log(`\n📊 نتایج:`);
        console.log(`  Endpoint جدید: ${duration1}ms`);
        console.log(`  Endpoint قدیم: ${duration2}ms`);
        console.log(`  تفاوت: ${Math.abs(duration1 - duration2)}ms`);

    } catch (error) {
        log.error(`خطا: ${error.message}`);
    }
}

// تست 7: بررسی URL صوتی
async function test7() {
    log.title('تست 7: بررسی URL صوتی (/test-url)');

    try {
        // ابتدا یک URL صوتی بگیریم
        const ttsResponse = await axios.post(`${BASE_URL}/text-to-speech`, {
            text: 'سلام',
            speaker: '3'
        });

        if (ttsResponse.data.success && ttsResponse.data.directUrl) {
            const audioUrl = ttsResponse.data.directUrl;
            log.request(`GET /test-url?url=${audioUrl.substring(0, 50)}...`);

            const response = await axios.get(`${BASE_URL}/test-url`, {
                params: { url: audioUrl }
            });

            log.success('آدرس صوتی قابل دسترس است');
            const data = response.data;
            console.log(`  Status: ${data.status}`);
            console.log(`  Content-Type: ${data.contentType}`);
            console.log(`  Content-Length: ${data.contentLength}`);
            console.log(`  Accessible: ${data.accessible}`);

        } else {
            log.error('نتوانست URL صوتی بگیرد');
        }

    } catch (error) {
        log.error(`خطا: ${error.message}`);
    }
}

// تست 8: درخواست‌های متعدد (stress test)
async function test8() {
    log.title('تست 8: درخواست‌های متعدد (Stress Test)');

    const promises = [];
    const count = 5;

    console.log(`📤 ارسال ${count} درخواست به‌صورت موازی...`);

    for (let i = 1; i <= count; i++) {
        promises.push(
            axios.post(`${BASE_URL}/text-to-speech`, {
                text: `درخواست شماره ${i}`,
                speaker: '3'
            })
                .then(() => {
                    console.log(`  ✅ درخواست ${i} موفق`);
                    return true;
                })
                .catch((err) => {
                    console.log(`  ❌ درخواست ${i} ناموفق: ${err.message}`);
                    return false;
                })
        );
    }

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r).length;

    console.log(`\n📊 نتایج:`);
    console.log(`  کل درخواست‌ها: ${count}`);
    console.log(`  موفق: ${successCount}`);
    console.log(`  ناموفق: ${count - successCount}`);
    console.log(`  نرخ موفقیت: ${(successCount / count * 100).toFixed(2)}%`);
}

// تست 9: بررسی responseFormat
async function test9() {
    log.title('تست 9: بررسی فرمت پاسخ');

    try {
        const response = await axios.post(`${BASE_URL}/text-to-speech`, {
            text: 'تست فرمت پاسخ',
            speaker: '3'
        });

        const data = response.data;
        const requiredFields = ['success', 'audioUrl', 'directUrl', 'checksum', 'base64', 'requestId', 'shamsiDate', 'error'];

        console.log('🔍 بررسی فیلدهای مورد نیاز:\n');

        for (const field of requiredFields) {
            const exists = field in data;
            const symbol = exists ? '✅' : '❌';
            console.log(`  ${symbol} ${field}: ${exists ? 'موجود' : 'موجود نیست'}`);
        }

        // نمایش مقادیر
        console.log('\n📋 مقادیر:\n');
        console.log(`  success: ${data.success}`);
        console.log(`  audioUrl: ${typeof data.audioUrl === 'string' ? data.audioUrl.substring(0, 40) + '...' : data.audioUrl}`);
        console.log(`  requestId: ${data.requestId}`);
        console.log(`  shamsiDate: ${data.shamsiDate}`);

    } catch (error) {
        log.error(`خطا: ${error.message}`);
    }
}

// فهرست تست‌ها
const tests = {
    '1': test1,
    '2': test2,
    '3': test3,
    '4': test4,
    '5': test5,
    '6': test6,
    '7': test7,
    '8': test8,
    '9': test9,
    'all': async () => {
        for (const [key, test] of Object.entries(tests)) {
            if (key !== 'all') {
                log.section();
                await test();
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }
};

// اجرای تست‌ها
async function main() {
    log.section();
    log.title('🎵 تست سیستم صوتی جدید رابین');

    const testArg = process.argv[2] || 'all';

    console.log(`\n${colors.cyan}دسترس‌پذیری: ${BASE_URL}${colors.reset}\n`);

    if (testArg === 'list') {
        console.log('🧪 تست‌های موجود:\n');
        console.log('  1 - درخواست معمولی');
        console.log('  2 - متن بلندتر');
        console.log('  3 - درخواست بدون متن (خطا)');
        console.log('  4 - Debug endpoint');
        console.log('  5 - Endpoint قدیم');
        console.log('  6 - مقایسه سرعت');
        console.log('  7 - بررسی URL صوتی');
        console.log('  8 - Stress test');
        console.log('  9 - بررسی فرمت پاسخ');
        console.log('  all - تمام تست‌ها (پیشفرض)\n');
    } else if (tests[testArg]) {
        await tests[testArg]();
        log.section();
        console.log(`\n${colors.green}✅ تست تکمیل شد${colors.reset}\n`);
    } else {
        console.log(`${colors.red}خطا: تست '${testArg}' موجود نیست${colors.reset}`);
        console.log(`استفاده: node test-tts-new-endpoint.js [test-number | all | list]\n`);
    }
}

main().catch(err => {
    console.error(`${colors.red}خطای غیرمنتظره:${colors.reset}`, err.message);
    process.exit(1);
});