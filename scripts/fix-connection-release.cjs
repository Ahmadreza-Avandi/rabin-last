#!/usr/bin/env node

/**
 * اسکریپت تعویض connection.end() با connection.release()
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'app/api/admin/stats/route.ts',
  'app/api/admin/tenants/route.ts',
  'app/api/admin/tenants/[id]/route.ts',
  'app/api/admin/tenants/[id]/activate/route.ts',
  'app/api/admin/tenants/[id]/delete/route.ts',
  'app/api/admin/tenants/[id]/renew/route.ts',
  'app/api/admin/tenants/[id]/suspend/route.ts',
  'app/api/admin/plans/[id]/route.ts',
  'app/api/admin/plans/[id]/deactivate/route.ts',
];

console.log('🔧 شروع تعمیر فایل‌ها...\n');

let fixedCount = 0;
let errorCount = 0;

filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  try {
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  فایل یافت نشد: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // تعویض connection.end() با connection.release()
    content = content.replace(/await connection\.end\(\)/g, 'connection.release()');
    content = content.replace(/connection\.end\(\)/g, 'connection.release()');

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ ${filePath}`);
      fixedCount++;
    } else {
      console.log(`ℹ️  ${filePath} (تغییری نیاز نبود)`);
    }

  } catch (error) {
    console.log(`❌ خطا در ${filePath}: ${error.message}`);
    errorCount++;
  }
});

console.log(`\n✨ تعمیر کامل شد!`);
console.log(`   ✅ تعمیر شده: ${fixedCount}`);
console.log(`   ❌ خطا: ${errorCount}`);
