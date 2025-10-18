#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function copyRecursive(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursive(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    // Skip certain files
    if (src.endsWith('.css') || src.endsWith('layout.tsx') || src.endsWith('page.tsx.backup')) {
      return;
    }
    fs.copyFileSync(src, dest);
  }
}

const dashboardPath = path.join(process.cwd(), 'app/dashboard');
const tenantDashboardPath = path.join(process.cwd(), 'app/[tenant_key]/dashboard');

console.log('📦 کپی کردن صفحات dashboard...\n');

// لیست پوشه‌های مهم
const folders = [
  'customers',
  'contacts',
  'coworkers',
  'activities',
  'chat',
  'deals',
  'feedback',
  'reports',
  'insights',
  'settings',
  'profile'
];

folders.forEach(folder => {
  const sourcePath = path.join(dashboardPath, folder);
  const targetPath = path.join(tenantDashboardPath, folder);
  
  if (fs.existsSync(sourcePath)) {
    try {
      copyRecursive(sourcePath, targetPath);
      console.log(`✅ ${folder}/`);
    } catch (error) {
      console.log(`❌ ${folder}/ - ${error.message}`);
    }
  } else {
    console.log(`⏭️  ${folder}/ (not found)`);
  }
});

console.log('\n✨ کپی کامل شد!');
