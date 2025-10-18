const fs = require('fs');
const path = require('path');

const sourceDashboard = 'app/dashboard';
const targetDashboard = 'app/[tenant_key]/dashboard';

// صفحاتی که باید migrate بشن
const pagesToMigrate = [
  'customers',
  'coworkers',
  'activities',
  'contacts',
  'deals',
  'calendar',
  'chat',
  'feedback',
  'reports',
  'products',
  'tasks',
  'insights',
  'customer-club',
  'documents',
  'profile',
  'settings'
];

function copyDirectory(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);

  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(sourcePath, 'utf8');
      
      // تبدیل API calls
      content = transformApiCalls(content);
      
      fs.writeFileSync(targetPath, content, 'utf8');
      console.log(`✅ Copied: ${file}`);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}

function transformApiCalls(content) {
  // تبدیل fetch calls به tenant API
  content = content.replace(
    /fetch\(['"`]\/api\/(?!tenant\/|admin\/|internal\/)([^'"`]+)['"`]/g,
    (match, apiPath) => {
      // اگر auth یا public API نیست، به tenant تبدیل کن
      if (apiPath.startsWith('auth/') || apiPath.startsWith('feedback/form/')) {
        return match;
      }
      return `fetch('/api/tenant/${apiPath}'`;
    }
  );

  // اضافه کردن X-Tenant-Key header
  content = content.replace(
    /headers:\s*{([^}]+)}/g,
    (match, headers) => {
      if (!headers.includes('X-Tenant-Key')) {
        // اضافه کردن tenant key از params
        const newHeaders = headers.trim() + ",\n        'X-Tenant-Key': params?.tenant_key || tenantKey";
        return `headers: {${newHeaders}}`;
      }
      return match;
    }
  );

  // تبدیل auth-token به tenant_token
  content = content.replace(/['"`]auth-token['"`]/g, "'tenant_token'");
  
  // اضافه کردن useParams اگر نداره
  if (content.includes('tenant_key') && !content.includes('useParams')) {
    content = content.replace(
      /from 'next\/navigation';/,
      "from 'next/navigation';\nimport { useParams } from 'next/navigation';"
    );
  }

  return content;
}

console.log('🚀 شروع migration صفحات dashboard...\n');

let successCount = 0;
let errorCount = 0;

pagesToMigrate.forEach(page => {
  const sourcePath = path.join(sourceDashboard, page);
  const targetPath = path.join(targetDashboard, page);

  if (!fs.existsSync(sourcePath)) {
    console.log(`⚠️  ${page}: پوشه منبع وجود ندارد`);
    errorCount++;
    return;
  }

  try {
    console.log(`\n📁 در حال کپی ${page}...`);
    copyDirectory(sourcePath, targetPath);
    successCount++;
  } catch (error) {
    console.error(`❌ خطا در کپی ${page}:`, error.message);
    errorCount++;
  }
});

console.log('\n' + '='.repeat(50));
console.log(`✅ موفق: ${successCount}`);
console.log(`❌ خطا: ${errorCount}`);
console.log('='.repeat(50));

console.log('\n⚠️  توجه: این فایل‌ها نیاز به بررسی و تست دارند:');
console.log('1. API calls ممکنه نیاز به تنظیمات بیشتری داشته باشند');
console.log('2. برخی components ممکنه نیاز به import های اضافی داشته باشند');
console.log('3. حتماً هر صفحه رو تست کنید');
