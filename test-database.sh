#!/bin/bash

# 🧪 اسکریپت تست دیتابیس CRM
set -e

echo "🧪 تست اتصال دیتابیس CRM..."

# بارگذاری متغیرهای محیطی
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "❌ فایل .env یافت نشد!"
    exit 1
fi

# تشخیص فایل docker-compose
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
if [ "$TOTAL_MEM" -lt 2048 ]; then
    COMPOSE_FILE="docker-compose.memory-optimized.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

echo "📊 استفاده از فایل: $COMPOSE_FILE"

# تست اتصال دیتابیس
echo "🔌 تست اتصال MariaDB..."
if docker-compose -f $COMPOSE_FILE exec -T mysql mariadb -u root -p${DATABASE_PASSWORD}_ROOT -e "SELECT VERSION();" 2>/dev/null; then
    echo "✅ اتصال MariaDB موفق"
else
    echo "❌ اتصال MariaDB ناموفق"
    exit 1
fi

# تست دیتابیس crm_system
echo "🗄️ تست دیتابیس crm_system..."
if docker-compose -f $COMPOSE_FILE exec -T mysql mariadb -u root -p${DATABASE_PASSWORD}_ROOT -e "USE crm_system; SHOW TABLES;" 2>/dev/null; then
    echo "✅ دیتابیس crm_system آماده است"
    
    # شمارش جداول
    TABLE_COUNT=$(docker-compose -f $COMPOSE_FILE exec -T mysql mariadb -u root -p${DATABASE_PASSWORD}_ROOT -e "USE crm_system; SHOW TABLES;" 2>/dev/null | wc -l)
    echo "📊 تعداد جداول: $((TABLE_COUNT - 1))"
    
    # تست کاربر اپلیکیشن
    echo "👤 تست کاربر اپلیکیشن..."
    if docker-compose -f $COMPOSE_FILE exec -T mysql mariadb -u ${DATABASE_USER:-crm_app_user} -p${DATABASE_PASSWORD} -e "USE crm_system; SELECT COUNT(*) FROM customers;" 2>/dev/null; then
        echo "✅ کاربر اپلیکیشن دسترسی دارد"
    else
        echo "⚠️  کاربر اپلیکیشن مشکل دسترسی دارد"
    fi
else
    echo "❌ دیتابیس crm_system یافت نشد"
    exit 1
fi

echo ""
echo "🎉 تست دیتابیس کامل شد!"