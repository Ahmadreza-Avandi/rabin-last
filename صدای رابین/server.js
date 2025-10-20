#!/usr/bin/env node
/**
 * Custom Next.js Server with Express
 * تشغیل Next.js standalone مع Express API
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

// متغیرهای محیطی
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'production';

console.log('[Next.js Server] Starting...');
console.log(`  - PORT: ${PORT}`);
console.log(`  - NODE_ENV: ${NODE_ENV}`);
console.log(`  - Base Path: /rabin-voice`);

// بررسی standalone files
const standaloneDir = path.join(__dirname, '.next', 'standalone');
const publicDir = path.join(__dirname, '.next', 'static');
const nextConfigPath = path.join(standaloneDir, 'package.json');

if (!fs.existsSync(standaloneDir)) {
    console.error('❌ خطا: دایرکتوری standalone یافت نشد');
    console.error(`   مسیر: ${standaloneDir}`);
    console.error('   لطفا اطمینان حاصل کنید که: npm run build اجرا شده است');
    process.exit(1);
}

// استفاده از built-in next server
try {
    // Load the next app from standalone
    const distDir = path.join(standaloneDir, '.next');
    const app = require(path.join(standaloneDir, 'server.js'));

    console.log('✅ Next.js standalone server loaded');

} catch (standaloneError) {
    console.log('ℹ️  Standalone server not found, trying Next dev server...');

    // اگر standalone نیستند، استفاده از next build output
    try {
        // مستقیما از built directory
        const { createServer } = require('http');
        const nextApp = require(path.join(standaloneDir, 'index.js'));

        const server = http.createServer(nextApp);

        server.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ Next.js Server running on port ${PORT}`);
            console.log(`   URL: http://0.0.0.0:${PORT}/rabin-voice`);
        });

    } catch (err2) {
        console.error('❌ نتوانستیم Next.js server را شروع کنیم');
        console.error('خطا:', err2.message);

        // آخرین تلاش: استفاده از node_modules
        console.log('\nℹ️  تلاش برای شروع با next package...');

        // قرار دهید next start
        const { spawn } = require('child_process');
        const nextProcess = spawn('npx', ['next', 'start', '--port', PORT], {
            cwd: __dirname,
            stdio: 'inherit',
            env: {
                ...process.env,
                PORT: PORT,
                NODE_ENV: NODE_ENV,
                HOSTNAME: '0.0.0.0'
            }
        });

        nextProcess.on('error', (err) => {
            console.error('❌ خطا در شروع next:', err);
            process.exit(1);
        });
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n🛑 SIGTERM دریافت شد، خروج...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 SIGINT دریافت شد، خروج...');
    process.exit(0);
});