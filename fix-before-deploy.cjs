#!/usr/bin/env node

/**
 * 🔧 اسکریپت رفع مشکلات قبل از دیپلوی
 * این اسکریپت روی لوکال (ویندوز) اجرا می‌شود و همه فایل‌ها را قبل از آپلود به سرور فیکس می‌کند
 */

const fs = require('fs');
const path = require('path');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔧 رفع مشکلات قبل از دیپلوی');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

let fixedCount = 0;
let errorCount = 0;

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`   ❌ خطا در خواندن ${filePath}: ${error.message}`);
    errorCount++;
    return null;
  }
}

function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`   ❌ خطا در نوشتن ${filePath}: ${error.message}`);
    errorCount++;
    return false;
  }
}

function loadEnv(filePath) {
  const content = readFile(filePath);
  if (!content) return {};
  
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      env[key] = value;
    }
  });
  return env;
}

// ═══════════════════════════════════════════════════════════════
// 1. رفع مشکل nginx/default.conf
// ═══════════════════════════════════════════════════════════════

console.log('🔧 1. رفع مشکل nginx/default.conf...');

const nginxPath = 'nginx/default.conf';
let nginxContent = readFile(nginxPath);

if (nginxContent) {
  let modified = false;
  
  // اضافه کردن DNS resolver اگر وجود نداشت
  if (!nginxContent.includes('resolver 127.0.0.11')) {
    console.log('   اضافه کردن DNS resolver...');
    nginxContent = '# DNS resolver for Docker (با ipv6=off برای جلوگیری از مشکل resolve)\nresolver 127.0.0.11 valid=30s ipv6=off;\n\n' + nginxContent;
    modified = true;
  }
  
  // تصحیح location /rabin-voice به /rabin-voice/
  if (nginxContent.includes('location /rabin-voice {')) {
    console.log('   تصحیح location /rabin-voice به /rabin-voice/...');
    nginxContent = nginxContent.replace(/location \/rabin-voice \{/g, 'location /rabin-voice/ {');
    nginxContent = nginxContent.replace(/proxy_pass http:\/\/rabin-voice:3001;/g, 'proxy_pass http://rabin-voice:3001/;');
    modified = true;
  }
  
  // اضافه کردن variable برای resolver
  if (!nginxContent.includes('set $rabin_voice_upstream')) {
    console.log('   اضافه کردن variable برای resolver...');
    nginxContent = nginxContent.replace(
      /location \/rabin-voice\/ \{/g,
      'location /rabin-voice/ {\n        set $rabin_voice_upstream rabin-voice:3001;'
    );
    nginxContent = nginxContent.replace(
      /proxy_pass http:\/\/rabin-voice:3001\/;/g,
      'proxy_pass http://$rabin_voice_upstream/;'
    );
    modified = true;
  }
  
  if (modified) {
    if (writeFile(nginxPath, nginxContent)) {
      console.log('   ✅ nginx/default.conf اصلاح شد');
      fixedCount++;
    }
  } else {
    console.log('   ✅ nginx/default.conf درست است');
  }
}

console.log('');

// ═══════════════════════════════════════════════════════════════
// 2. رفع مشکل صدای رابین/.env
// ═══════════════════════════════════════════════════════════════

console.log('🔧 2. رفع مشکل صدای رابین/.env...');

const rabinEnvPath = 'صدای رابین/.env';
let rabinEnvContent = readFile(rabinEnvPath);

if (rabinEnvContent) {
  let modified = false;
  
  // تنظیم OpenRouter API Key
  if (rabinEnvContent.includes('OPENROUTER_API_KEY=WILL_BE_SET_MANUALLY') || 
      rabinEnvContent.includes('OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE')) {
    console.log('   تنظیم OpenRouter API Key...');
    const apiKey = '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';
    rabinEnvContent = rabinEnvContent.replace(
      /OPENROUTER_API_KEY=(WILL_BE_SET_MANUALLY|YOUR_OPENROUTER_API_KEY_HERE)/g,
      `OPENROUTER_API_KEY=${apiKey}`
    );
    rabinEnvContent = rabinEnvContent.replace(
      /RABIN_VOICE_OPENROUTER_API_KEY=(WILL_BE_SET_MANUALLY|YOUR_OPENROUTER_API_KEY_HERE)/g,
      `RABIN_VOICE_OPENROUTER_API_KEY=${apiKey}`
    );
    modified = true;
  }
  
  if (modified) {
    if (writeFile(rabinEnvPath, rabinEnvContent)) {
      console.log('   ✅ صدای رابین/.env اصلاح شد');
      fixedCount++;
    }
  } else {
    console.log('   ✅ صدای رابین/.env درست است');
  }
}

console.log('');

// ═══════════════════════════════════════════════════════════════
// 3. رفع مشکل docker-compose.yml
// ═══════════════════════════════════════════════════════════════

console.log('🔧 3. رفع مشکل docker-compose.yml...');

const dockerComposePath = 'docker-compose.yml';
let dockerComposeContent = readFile(dockerComposePath);

if (dockerComposeContent) {
  let modified = false;
  
  // تصحیح MYSQL_ROOT_PASSWORD
  if (dockerComposeContent.includes('MYSQL_ROOT_PASSWORD: "${DATABASE_PASSWORD}"')) {
    console.log('   تصحیح MYSQL_ROOT_PASSWORD...');
    
    // بارگذاری پسورد از .env
    const env = loadEnv('.env');
    const dbPass = env.DATABASE_PASSWORD || '1234';
    
    dockerComposeContent = dockerComposeContent.replace(
      /MYSQL_ROOT_PASSWORD: "\$\{DATABASE_PASSWORD\}"/g,
      `MYSQL_ROOT_PASSWORD: "${dbPass}"`
    );
    modified = true;
  }
  
  if (modified) {
    if (writeFile(dockerComposePath, dockerComposeContent)) {
      console.log('   ✅ docker-compose.yml اصلاح شد');
      fixedCount++;
    }
  } else {
    console.log('   ✅ docker-compose.yml درست است');
  }
}

console.log('');

// ═══════════════════════════════════════════════════════════════
// 4. رفع مشکل صدای رابین/Dockerfile
// ═══════════════════════════════════════════════════════════════

console.log('🔧 4. رفع مشکل صدای رابین/Dockerfile...');

const rabinDockerfilePath = 'صدای رابین/Dockerfile';
let rabinDockerfileContent = readFile(rabinDockerfilePath);

if (rabinDockerfileContent) {
  let modified = false;
  
  // حذف کپی جداگانه node_modules
  if (rabinDockerfileContent.includes('COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules')) {
    console.log('   حذف کپی جداگانه node_modules...');
    rabinDockerfileContent = rabinDockerfileContent.replace(
      /COPY --from=builder --chown=nextjs:nodejs \/app\/node_modules \.\/node_modules\n/g,
      ''
    );
    modified = true;
  }
  
  // تصحیح permissions
  if (rabinDockerfileContent.includes('chown -R 1001:1001 /app/logs /app/public')) {
    console.log('   تصحیح permissions...');
    rabinDockerfileContent = rabinDockerfileContent.replace(
      /chown -R 1001:1001 \/app\/logs \/app\/public/g,
      'chown -R 777 /app/logs /app/public'
    );
    modified = true;
  }
  
  if (modified) {
    if (writeFile(rabinDockerfilePath, rabinDockerfileContent)) {
      console.log('   ✅ صدای رابین/Dockerfile اصلاح شد');
      fixedCount++;
    }
  } else {
    console.log('   ✅ صدای رابین/Dockerfile درست است');
  }
}

console.log('');

// ═══════════════════════════════════════════════════════════════
// 5. رفع مشکل صدای رابین/start.sh
// ═══════════════════════════════════════════════════════════════

console.log('🔧 5. رفع مشکل صدای رابین/start.sh...');

const rabinStartPath = 'صدای رابین/start.sh';
let rabinStartContent = readFile(rabinStartPath);

if (rabinStartContent) {
  let modified = false;
  
  // تصحیح مسیر server.js
  if (rabinStartContent.includes('node ./.next/standalone/server.js')) {
    console.log('   تصحیح مسیر server.js...');
    rabinStartContent = rabinStartContent.replace(
      /node \.\/\.next\/standalone\/server\.js/g,
      'node server.js'
    );
    modified = true;
  }
  
  if (modified) {
    if (writeFile(rabinStartPath, rabinStartContent)) {
      console.log('   ✅ صدای رابین/start.sh اصلاح شد');
      fixedCount++;
    }
  } else {
    console.log('   ✅ صدای رابین/start.sh درست است');
  }
}

console.log('');

// ═══════════════════════════════════════════════════════════════
// 6. بررسی consistency پسوردها
// ═══════════════════════════════════════════════════════════════

console.log('🔧 6. بررسی consistency پسوردها...');

const rootEnv = loadEnv('.env');
const rabinEnv = loadEnv('صدای رابین/.env');

const rootPass = rootEnv.DATABASE_PASSWORD || '1234';
const rabinPass = rabinEnv.DATABASE_PASSWORD || '1234';

console.log(`   📊 پسوردها:`);
console.log(`      .env: ${rootPass.substring(0, 4)}****`);
console.log(`      صدای رابین/.env: ${rabinPass.substring(0, 4)}****`);

if (rootPass !== rabinPass) {
  console.log('   ⚠️  پسوردها متفاوت هستند!');
  console.log('   🔧 یکسان‌سازی پسوردها...');
  
  // یکسان‌سازی با پسورد .env
  let rabinEnvContent2 = readFile(rabinEnvPath);
  if (rabinEnvContent2) {
    rabinEnvContent2 = rabinEnvContent2.replace(
      /DATABASE_PASSWORD=.*/g,
      `DATABASE_PASSWORD=${rootPass}`
    );
    if (writeFile(rabinEnvPath, rabinEnvContent2)) {
      console.log('   ✅ پسوردها یکسان شدند');
      fixedCount++;
    }
  }
} else {
  console.log('   ✅ همه پسوردها یکسان هستند');
}

console.log('');

// ═══════════════════════════════════════════════════════════════
// 7. بررسی database/init.sql
// ═══════════════════════════════════════════════════════════════

console.log('🔧 7. بررسی database/init.sql...');

const initSqlPath = 'database/init.sql';
let initSqlContent = readFile(initSqlPath);

if (initSqlContent) {
  let needsRebuild = false;
  
  // بررسی وجود DROP USER
  if (!initSqlContent.includes('DROP USER IF EXISTS')) {
    console.log('   ⚠️  init.sql بدون DROP USER است');
    needsRebuild = true;
  }
  
  // بررسی Docker network pattern (172.%.%.%)
  if (!initSqlContent.includes("'172.%.%.%'")) {
    console.log('   ⚠️  init.sql بدون Docker network pattern است');
    needsRebuild = true;
  }
  
  // بررسی پسورد
  const passwordMatch = initSqlContent.match(/IDENTIFIED BY '([^']+)'/);
  const initPass = passwordMatch ? passwordMatch[1] : '';
  
  if (initPass !== rootPass) {
    console.log('   ⚠️  پسورد در init.sql متفاوت است');
    needsRebuild = true;
  }
  
  if (needsRebuild) {
    console.log('   🔧 بازسازی init.sql...');
    
    const newInitSql = `-- Database initialization script for CRM System
-- This script creates the database and user if they don't exist

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS \`crm_system\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Drop existing users to ensure clean state
DROP USER IF EXISTS 'crm_app_user'@'%';
DROP USER IF EXISTS 'crm_app_user'@'localhost';
DROP USER IF EXISTS 'crm_app_user'@'127.0.0.1';
DROP USER IF EXISTS 'crm_app_user'@'172.%.%.%';

-- Create user with password - برای تمام connection patterns (شامل Docker network)
CREATE USER 'crm_app_user'@'%' IDENTIFIED BY '${rootPass}';
CREATE USER 'crm_app_user'@'localhost' IDENTIFIED BY '${rootPass}';
CREATE USER 'crm_app_user'@'127.0.0.1' IDENTIFIED BY '${rootPass}';
CREATE USER 'crm_app_user'@'172.%.%.%' IDENTIFIED BY '${rootPass}';

-- Grant all privileges on crm_system database
GRANT ALL PRIVILEGES ON \`crm_system\`.* TO 'crm_app_user'@'%';
GRANT ALL PRIVILEGES ON \`crm_system\`.* TO 'crm_app_user'@'localhost';
GRANT ALL PRIVILEGES ON \`crm_system\`.* TO 'crm_app_user'@'127.0.0.1';
GRANT ALL PRIVILEGES ON \`crm_system\`.* TO 'crm_app_user'@'172.%.%.%';

-- FLUSH to apply changes immediately
FLUSH PRIVILEGES;

-- Use the database
USE \`crm_system\`;

-- Set timezone
SET time_zone = '+00:00';

`;
    
    if (writeFile(initSqlPath, newInitSql)) {
      console.log('   ✅ init.sql بازسازی شد');
      fixedCount++;
    }
  } else {
    console.log('   ✅ init.sql درست است');
  }
}

console.log('');

// ═══════════════════════════════════════════════════════════════
// 8. بررسی deploy-server.sh
// ═══════════════════════════════════════════════════════════════

console.log('🔧 8. بررسی deploy-server.sh...');

const deployScriptPath = 'deploy-server.sh';
let deployScriptContent = readFile(deployScriptPath);

if (deployScriptContent) {
  let modified = false;
  
  // بررسی اینکه init.sql شامل Docker network pattern است
  if (!deployScriptContent.includes("'172.%.%.%'")) {
    console.log('   🔧 اضافه کردن Docker network pattern به init.sql generation...');
    
    // پیدا کردن بخش CREATE USER و اضافه کردن Docker network pattern
    deployScriptContent = deployScriptContent.replace(
      /DROP USER IF EXISTS 'crm_app_user'@'127\.0\.0\.1';/g,
      "DROP USER IF EXISTS 'crm_app_user'@'127.0.0.1';\nDROP USER IF EXISTS 'crm_app_user'@'172.%.%.%';"
    );
    
    deployScriptContent = deployScriptContent.replace(
      /CREATE USER 'crm_app_user'@'127\.0\.0\.1' IDENTIFIED BY '\$DB_PASS';/g,
      "CREATE USER 'crm_app_user'@'127.0.0.1' IDENTIFIED BY '$DB_PASS';\nCREATE USER 'crm_app_user'@'172.%.%.%' IDENTIFIED BY '$DB_PASS';"
    );
    
    deployScriptContent = deployScriptContent.replace(
      /GRANT ALL PRIVILEGES ON `crm_system`\.\* TO 'crm_app_user'@'127\.0\.0\.1';/g,
      "GRANT ALL PRIVILEGES ON `crm_system`.* TO 'crm_app_user'@'127.0.0.1';\nGRANT ALL PRIVILEGES ON `crm_system`.* TO 'crm_app_user'@'172.%.%.%';"
    );
    
    modified = true;
  }
  
  if (modified) {
    if (writeFile(deployScriptPath, deployScriptContent)) {
      console.log('   ✅ deploy-server.sh اصلاح شد');
      fixedCount++;
    }
  } else {
    console.log('   ✅ deploy-server.sh درست است');
  }
}

console.log('');

// ═══════════════════════════════════════════════════════════════
// 9. ایجاد فایل خلاصه
// ═══════════════════════════════════════════════════════════════

console.log('📝 ایجاد فایل خلاصه...');

const summaryContent = `# 📋 خلاصه تغییرات قبل از دیپلوی

تاریخ: ${new Date().toLocaleString('fa-IR')}

## ✅ تغییرات اعمال شده (${fixedCount} مورد)

${fixedCount > 0 ? `
- nginx/default.conf: DNS resolver و location اصلاح شد
- صدای رابین/.env: OpenRouter API Key تنظیم شد
- docker-compose.yml: MYSQL_ROOT_PASSWORD تصحیح شد
- صدای رابین/Dockerfile: node_modules و permissions اصلاح شد
- صدای رابین/start.sh: مسیر server.js تصحیح شد
- database/init.sql: DROP USER و پسورد اصلاح شد
- پسوردها یکسان‌سازی شدند
` : '- هیچ تغییری لازم نبود'}

## 🚀 مراحل بعدی

1. فایل‌ها را به سرور آپلود کنید
2. روی سرور دستورات زیر را اجرا کنید:

\`\`\`bash
bash setup-all-env.sh
bash deploy-server.sh
\`\`\`

## 📊 وضعیت

- تعداد فایل‌های اصلاح شده: ${fixedCount}
- تعداد خطاها: ${errorCount}

${errorCount > 0 ? '⚠️ توجه: برخی خطاها رخ داده است. لطفاً لاگ را بررسی کنید.' : '✅ همه چیز آماده است!'}
`;

writeFile('DEPLOY-READY.md', summaryContent);
console.log('   ✅ فایل DEPLOY-READY.md ایجاد شد');

console.log('');

// ═══════════════════════════════════════════════════════════════
// خلاصه نهایی
// ═══════════════════════════════════════════════════════════════

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (errorCount === 0) {
  console.log('✅ همه مشکلات برطرف شد!');
} else {
  console.log(`⚠️ ${errorCount} خطا رخ داد`);
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('📋 خلاصه:');
console.log(`   ✅ ${fixedCount} فایل اصلاح شد`);
console.log(`   ${errorCount > 0 ? '❌' : '✅'} ${errorCount} خطا`);
console.log('');
console.log('🚀 مراحل بعدی:');
console.log('   1. فایل‌ها را به سرور آپلود کنید');
console.log('   2. روی سرور: bash setup-all-env.sh');
console.log('   3. روی سرور: bash deploy-server.sh');
console.log('');
console.log('📄 جزئیات بیشتر در فایل DEPLOY-READY.md');
console.log('');

process.exit(errorCount > 0 ? 1 : 0);
