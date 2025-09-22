#!/bin/bash

echo "🔧 رفع مشکل nginx..."

# متوقف کردن سرویس‌ها
echo "🛑 متوقف کردن سرویس‌ها..."
docker-compose -f docker-compose.deploy.yml down

# کپی nginx config درست
echo "📝 کپی nginx config درست..."
cp nginx/active.conf nginx/default.conf

# راه‌اندازی مجدد
echo "🚀 راه‌اندازی مجدد..."
docker-compose -f docker-compose.deploy.yml up -d

# انتظار
echo "⏳ انتظار برای آماده شدن..."
sleep 30

# بررسی وضعیت
echo "📊 وضعیت سرویس‌ها:"
docker-compose -f docker-compose.deploy.yml ps

echo "🧪 تست nginx..."
if curl -f -H "Host: crm.robintejarat.com" http://localhost >/dev/null 2>&1; then
    echo "✅ nginx کار می‌کند"
else
    echo "❌ nginx هنوز مشکل دارد"
    echo "🔍 لاگ nginx:"
    docker-compose -f docker-compose.deploy.yml logs nginx | tail -10
fi

echo "🎉 رفع مشکل nginx کامل شد!"