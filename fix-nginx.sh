#!/bin/bash

echo "🔧 حل مشکل nginx..."

# متوقف کردن nginx
echo "🛑 متوقف کردن nginx..."
docker-compose -f docker-compose.deploy.yml stop nginx

# کپی config درست
echo "📝 کپی nginx config درست..."
cp nginx/low-memory-fixed.conf nginx/active.conf

# شروع مجدد nginx
echo "🚀 شروع مجدد nginx..."
docker-compose -f docker-compose.deploy.yml up -d nginx

# انتظار برای آماده شدن
echo "⏳ انتظار برای nginx..."
sleep 5

# بررسی وضعیت
echo "📊 وضعیت nginx:"
docker-compose -f docker-compose.deploy.yml logs --tail=10 nginx

# تست
echo "🧪 تست nginx:"
curl -I http://localhost 2>/dev/null || echo "خطا در تست HTTP"

echo "✅ تمام!"