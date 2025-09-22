#!/bin/bash

# 🔧 حل مشکلات Deploy
set -e

echo "🔧 حل مشکلات Deploy..."

# تشخیص فایل compose
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
if [ "$TOTAL_MEM" -lt 2048 ]; then
    COMPOSE_FILE="docker-compose.deploy.yml"
else
    COMPOSE_FILE="docker-compose.deploy.yml"
fi

echo "📊 استفاده از فایل: $COMPOSE_FILE"

# 1. حل مشکل nginx config
echo "🔧 حل مشکل nginx config..."
if [ -f "nginx/low-memory-fixed.conf" ]; then
    cp nginx/low-memory-fixed.conf nginx/active.conf
    echo "✅ nginx config جدید کپی شد"
else
    echo "❌ فایل nginx/low-memory-fixed.conf یافت نشد"
fi

# 2. حل مشکل MariaDB - پاک کردن volume قدیمی
echo "🗄️ حل مشکل MariaDB..."
echo "⚠️  پاک کردن volume قدیمی MySQL..."
docker-compose -f $COMPOSE_FILE down -v 2>/dev/null || true
docker volume rm rabin-last_mysql_data 2>/dev/null || true
docker volume prune -f

# 3. راه‌اندازی مجدد
echo "🚀 راه‌اندازی مجدد سرویس‌ها..."
docker-compose -f $COMPOSE_FILE up -d

# 4. انتظار برای آماده شدن
echo "⏳ انتظار برای آماده شدن سرویس‌ها..."
sleep 45

# 5. بررسی وضعیت
echo "📊 وضعیت سرویس‌ها:"
docker-compose -f $COMPOSE_FILE ps

# 6. تست سرویس‌ها
echo ""
echo "🧪 تست سرویس‌ها..."

# تست nginx
if docker-compose -f $COMPOSE_FILE exec -T nginx nginx -t >/dev/null 2>&1; then
    echo "✅ nginx config درست است"
else
    echo "❌ nginx config مشکل دارد"
    docker-compose -f $COMPOSE_FILE logs nginx | tail -10
fi

# تست دیتابیس
echo "🗄️ تست دیتابیس..."
sleep 10
if docker-compose -f $COMPOSE_FILE exec -T mysql mariadb -u root -p${DATABASE_PASSWORD}_ROOT -e "SELECT VERSION();" >/dev/null 2>&1; then
    echo "✅ دیتابیس MariaDB کار می‌کند"
    
    # بررسی دیتابیس crm_system
    if docker-compose -f $COMPOSE_FILE exec -T mysql mariadb -u root -p${DATABASE_PASSWORD}_ROOT -e "USE crm_system; SHOW TABLES;" >/dev/null 2>&1; then
        echo "✅ دیتابیس crm_system آماده است"
    else
        echo "⚠️  دیتابیس crm_system هنوز آماده نیست"
    fi
else
    echo "❌ دیتابیس مشکل دارد"
    docker-compose -f $COMPOSE_FILE logs mysql | tail -10
fi

# تست NextJS
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ NextJS کار می‌کند"
else
    echo "❌ NextJS مشکل دارد"
fi

# تست دامنه
echo "🌐 تست دامنه..."
if curl -f -H "Host: crm.robintejarat.com" http://localhost >/dev/null 2>&1; then
    echo "✅ دامنه از طریق nginx کار می‌کند"
else
    echo "❌ دامنه مشکل دارد"
    echo "🔍 بررسی nginx logs:"
    docker-compose -f $COMPOSE_FILE logs nginx | tail -5
fi

echo ""
echo "🎉 بررسی مشکلات کامل شد!"
echo "📋 برای مشاهده لاگ‌های کامل:"
echo "   docker-compose -f $COMPOSE_FILE logs -f"