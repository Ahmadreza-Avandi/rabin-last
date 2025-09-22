#!/bin/bash

echo "🔧 حل مشکل MySQL..."

# متوقف کردن کانتینرهای قدیمی
echo "🛑 متوقف کردن کانتینرهای قدیمی..."
docker-compose -f docker-compose.deploy.yml down 2>/dev/null || true

# پاک کردن volume MySQL (برای شروع تمیز)
echo "🧹 پاک کردن volume MySQL قدیمی..."
docker volume rm rabin-last_mysql_data 2>/dev/null || true

# شروع مجدد MySQL
echo "🚀 شروع مجدد MySQL با تنظیمات جدید..."
docker-compose -f docker-compose.deploy.yml up -d mysql

# انتظار برای آماده شدن MySQL
echo "⏳ انتظار برای آماده شدن MySQL..."
for i in {1..30}; do
    if docker-compose -f docker-compose.deploy.yml exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
        echo "✅ MySQL آماده است!"
        break
    else
        echo "⏳ انتظار... ($i/30)"
        if [ $i -eq 30 ]; then
            echo "❌ MySQL آماده نشد. بررسی لاگ‌ها:"
            docker-compose -f docker-compose.deploy.yml logs mysql
            exit 1
        fi
        sleep 2
    fi
done

# شروع بقیه سرویس‌ها
echo "🚀 شروع بقیه سرویس‌ها..."
docker-compose -f docker-compose.deploy.yml up -d

echo "✅ تمام!"