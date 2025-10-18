#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n🔍 تشخیص جامع مشکلات SaaS\n');
console.log('='.repeat(80));

const issues = [];
const fixes = [];

// Check API routes
console.log('\n1️⃣ بررسی API Routes:');
console.log('-'.repeat(80));

const requiredAPIs = [
  'app/api/tenant/users/route.ts',
  'app/api/tenant/customers/route.ts',
  'app/api/tenant/customers-simple/route.ts',
  'app/api/tenant/coworkers/route.ts',
  'app/api/tenant/activities/route.ts',
  'app/api/tenant/tasks/route.ts',
  'app/api/tenant/documents/route.ts',
  'app/api/tenant/sales/route.ts',
  'app/api/tenant/products/route.ts',
  'app/api/tenant/chat/route.ts'
];

requiredAPIs.forEach(api => {
  const exists = fs.existsSync(api);
  if (exists) {
    console.log(`   ✅ ${api}`);
  } else {
    console.log(`   ❌ ${api} - MISSING`);
    issues.push(`API missing: ${api}`);
    fixes.push(`Create ${api} with tenant_key filtering`);
  }
});

console.log('\n' + '='.repeat(80));
console.log(`\n📊 خلاصه: ${issues.length} مشکل یافت شد\n`);

if (issues.length > 0) {
  console.log('🔴 مشکلات:');
  issues.forEach((issue, i) => {
    console.log(`   ${i + 1}. ${issue}`);
  });

  console.log('\n💡 راه‌حل‌ها:');
  fixes.forEach((fix, i) => {
    console.log(`   ${i + 1}. ${fix}`);
  });
}

console.log('\n' + '='.repeat(80));
console.log('\n🎯 مرحله بعدی:\n');
console.log('   node scripts/create-all-missing-apis.cjs\n');
