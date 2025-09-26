#!/bin/bash

echo "🔧 شروع حل مشکلات دیتابیس..."

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '#' | awk '/=/ {print $1}')
fi

# Database connection details
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_NAME=${DB_NAME:-crm_system}
DB_USER=${DB_USER:-root}
DB_PASS=${DB_PASS:-}

echo "📊 اتصال به دیتابیس: $DB_HOST:$DB_PORT/$DB_NAME"

# Check if MySQL is running
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL command not found. Please install MySQL client."
    exit 1
fi

# Test database connection
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "SELECT 1;" "$DB_NAME" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Cannot connect to database. Please check your connection settings."
    exit 1
fi

echo "✅ اتصال به دیتابیس موفق بود"

# Apply database fixes
echo "🔄 اعمال تغییرات دیتابیس..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < fix-all-issues.sql

if [ $? -eq 0 ]; then
    echo "✅ تمام تغییرات دیتابیس با موفقیت اعمال شد"
else
    echo "❌ خطا در اعمال تغییرات دیتابیس"
    exit 1
fi

# Verify tables exist
echo "🔍 بررسی وجود جداول..."

TABLES=("users" "products" "sales" "sale_items" "activities" "feedback" "customers" "sales_pipeline_stages")

for table in "${TABLES[@]}"; do
    result=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "SHOW TABLES LIKE '$table';" "$DB_NAME" 2>/dev/null | grep "$table")
    if [ -n "$result" ]; then
        echo "✅ جدول $table موجود است"
    else
        echo "❌ جدول $table موجود نیست"
    fi
done

# Verify views exist
echo "🔍 بررسی وجود ویوها..."

VIEWS=("daily_interaction_stats" "interaction_summary" "sales_pipeline_report" "sales_statistics")

for view in "${VIEWS[@]}"; do
    result=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "SHOW FULL TABLES WHERE Table_Type = 'VIEW' AND Tables_in_$DB_NAME = '$view';" "$DB_NAME" 2>/dev/null | grep "$view")
    if [ -n "$result" ]; then
        echo "✅ ویو $view موجود است"
    else
        echo "❌ ویو $view موجود نیست"
    fi
done

echo "🎉 حل مشکلات دیتابیس تمام شد!"
echo ""
echo "📋 خلاصه تغییرات:"
echo "   - جداول مفقود اضافه شدند"
echo "   - ستون‌های مفقود به جدول feedback اضافه شدند"
echo "   - ویوهای مفقود ایجاد شدند"
echo "   - ایندکس‌ها برای بهبود عملکرد اضافه شدند"
echo "   - داده‌های ناسازگار اصلاح شدند"
echo ""
echo "🚀 حالا می‌توانید سرور را مجدداً راه‌اندازی کنید:"
echo "   npm run dev"