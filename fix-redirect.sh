#!/bin/bash

echo "🔧 حل مشکل redirect..."

# بررسی فایل .env
if [ -f ".env" ]; then
    echo "📝 تغییر NEXTAUTH_URL به HTTP..."
    
    # تغییر HTTPS به HTTP در فایل .env
    sed -i 's|NEXTAUTH_URL=https://crm.robintejarat.com|NEXTAUTH_URL=http://crm.robintejarat.com|g' .env
    
    echo "✅ فایل .env تغییر کرد"
    
    # نمایش تغییرات
    echo "🔍 تنظیمات فعلی:"
    grep "NEXTAUTH_URL" .env
    
    # راه‌اندازی مجدد NextJS
    echo "🔄 راه‌اندازی مجدد NextJS..."
    docker-compose -f docker-compose.deploy.yml restart nextjs
    
    # انتظار
    echo "⏳ انتظار برای آماده شدن..."
    sleep 15
    
    # تست
    echo "🧪 تست دامنه..."
    curl -L http://crm.robintejarat.com --connect-timeout 10 | head -20
    
else
    echo "❌ فایل .env یافت نشد!"
    echo "📋 فایل‌های موجود:"
    ls -la | grep env
fi

echo "✅ کامل شد!"