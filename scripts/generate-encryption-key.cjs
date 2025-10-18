#!/usr/bin/env node

/**
 * اسکریپت تولید Encryption Key
 * 
 * این اسکریپت یک encryption key تصادفی 32-byte (256-bit) تولید می‌کند
 * که برای encrypt کردن password های دیتابیس tenant استفاده می‌شود
 */

const crypto = require('crypto');

function generateEncryptionKey() {
  const key = crypto.randomBytes(32).toString('hex');
  return key;
}

console.log('🔐 تولید Encryption Key...\n');

const key = generateEncryptionKey();

console.log('✅ Encryption Key تولید شد:\n');
console.log(key);
console.log('\n📝 این key را در فایل .env اضافه کنید:');
console.log(`DB_ENCRYPTION_KEY=${key}`);
console.log('\n⚠️  هشدار: این key را در جای امنی نگهداری کنید!');
console.log('⚠️  اگر این key را گم کنید، نمی‌توانید password های encrypt شده را decrypt کنید!');

module.exports = { generateEncryptionKey };
