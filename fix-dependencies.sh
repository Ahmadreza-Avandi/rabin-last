#!/bin/bash

echo "🔧 حل مشکل dependencies..."

# حذف فایل‌های قدیمی
echo "🧹 پاک کردن فایل‌های قدیمی..."
rm -rf node_modules
rm -f package-lock.json

# ایجاد package-lock.json جدید
echo "📦 ایجاد package-lock.json جدید..."
npm install --package-lock-only

# بررسی نتیجه
if [ -f "package-lock.json" ]; then
    echo "✅ package-lock.json با موفقیت ایجاد شد"
    echo "📊 تعداد dependencies: $(cat package-lock.json | grep -c '"resolved":')"
else
    echo "❌ خطا در ایجاد package-lock.json"
    exit 1
fi

echo "🚀 حالا می‌توانید deploy script را اجرا کنید:"
echo "./deploy-server.sh"