#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(process.cwd(), 'app/dashboard');
const tenantDashboardPath = path.join(process.cwd(), 'app/[tenant_key]/dashboard');

console.log('📦 انتقال صفحات dashboard به ساختار tenant...\n');

// لیست پوشه‌های dashboard
const items = fs.readdirSync(dashboardPath, { withFileTypes: true });

items.forEach(item => {
  if (item.isDirectory()) {
    const sourcePath = path.join(dashboardPath, item.name);
    const targetPath = path.join(tenantDashboardPath, item.name);

    // کپی کردن پوشه
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });

      // کپی فایل‌های داخل پوشه
      const files = fs.readdirSync(sourcePath);
      files.forEach(file => {
        const sourceFile = path.join(sourcePath, file);
        const targetFile = path.join(targetPath, file);
        fs.copyFileSync(sourceFile, targetFile);
      });

      console.log(`✅ ${item.name}/`);
    } else {
      console.log(`⏭️  ${item.name}/ (already exists)`);
    }
  }
});

console.log('\n✨ انتقال کامل شد!');
console.log('نوت: صفحات قدیمی در app/dashboard باقی مانده‌اند و به tenant پیش‌فرض redirect می‌شوند.');
