#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// خواندن فایل backup
const backupPath = path.join(process.cwd(), 'app/dashboard/page.tsx.backup');
const content = fs.readFileSync(backupPath, 'utf8');

// حذف خطوط redirect و comment
const lines = content.split('\n');
const startIndex = lines.findIndex(line => line.includes("'use client';"));

if (startIndex === -1) {
  console.log('❌ خط "use client" یافت نشد');
  process.exit(1);
}

// گرفتن محتوای اصلی
const originalContent = lines.slice(startIndex).join('\n');

// نوشتن به فایل جدید
const targetPath = path.join(process.cwd(), 'app/[tenant_key]/dashboard/page.tsx');
fs.writeFileSync(targetPath, originalContent, 'utf8');

console.log('✅ Dashboard کپی شد به app/[tenant_key]/dashboard/page.tsx');
