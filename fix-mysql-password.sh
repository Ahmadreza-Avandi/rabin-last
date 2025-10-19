#!/bin/bash

# 🔧 اسکریپت رفع مشکل MySQL Password
# این اسکریپت روی سرور اجرا می‌شود

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 رفع مشکل MySQL Password"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# بارگذاری پسورد از .env
if [ -f ".env" ]; then
    set -a
    source .env 2>/dev/null || true
    set +a
fi

DB_PASS="${DATABASE_PASSWORD:-1234}"

echo "📊 پسورد فعلی: ${DB_PASS:0:4}****"
echo ""

# متوقف کردن MySQL
echo "🛑 متوقف کردن MySQL..."
docker-compose stop mysql

# حذف کانتینر MySQL
echo "🗑️ حذف کانتینر MySQL..."
docker rm crm_mysql 2>/dev/null || true

# حذف volume MySQL (⚠️ این دیتا را پاک می‌کند!)
echo "⚠️  حذف volume MySQL (دیتا پاک می‌شود)..."
read -p "آیا مطمئن هستید؟ (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ لغو شد"
    exit 1
fi

docker volume rm rabin-last_mysql_data 2>/dev/null || true

# بازسازی init.sql با پسورد صحیح
echo "📝 بازسازی init.sql..."
cat > database/init.sql << EOF
-- Database initialization script for CRM System
-- This script creates the database and user if they don't exist

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS \`crm_system\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Drop existing users to ensure clean state
DROP USER IF EXISTS 'crm_app_user'@'%';
DROP USER IF EXISTS 'crm_app_user'@'localhost';
DROP USER IF EXISTS 'crm_app_user'@'127.0.0.1';
DROP USER IF EXISTS 'crm_app_user'@'172.%.%.%';

-- Create user with password - برای تمام connection patterns
CREATE USER 'crm_app_user'@'%' IDENTIFIED BY '${DB_PASS}';
CREATE USER 'crm_app_user'@'localhost' IDENTIFIED BY '${DB_PASS}';
CREATE USER 'crm_app_user'@'127.0.0.1' IDENTIFIED BY '${DB_PASS}';
CREATE USER 'crm_app_user'@'172.%.%.%' IDENTIFIED BY '${DB_PASS}';

-- Grant all privileges on crm_system database
GRANT ALL PRIVILEGES ON \`crm_system\`.* TO 'crm_app_user'@'%';
GRANT ALL PRIVILEGES ON \`crm_system\`.* TO 'crm_app_user'@'localhost';
GRANT ALL PRIVILEGES ON \`crm_system\`.* TO 'crm_app_user'@'127.0.0.1';
GRANT ALL PRIVILEGES ON \`crm_system\`.* TO 'crm_app_user'@'172.%.%.%';

-- FLUSH to apply changes immediately
FLUSH PRIVILEGES;

-- Use the database
USE \`crm_system\`;

-- Set timezone
SET time_zone = '+00:00';

EOF

# اضافه کردن SQL files اگر وجود داشته باشند
if [ -f "database/crm_system.sql" ]; then
    echo "-- Import main CRM database schema and data" >> database/init.sql
    cat database/crm_system.sql >> database/init.sql
    echo "" >> database/init.sql
fi

if [ -f "database/saas_master.sql" ]; then
    echo "-- Import SaaS master database" >> database/init.sql
    cat database/saas_master.sql >> database/init.sql
    echo "" >> database/init.sql
fi

echo "✅ init.sql بازسازی شد"

# راه‌اندازی مجدد MySQL
echo "🚀 راه‌اندازی مجدد MySQL..."
docker-compose up -d mysql

# انتظار برای آماده شدن MySQL
echo "⏳ انتظار برای آماده شدن MySQL (30 ثانیه)..."
sleep 30

# تست اتصال
echo "🧪 تست اتصال..."
if docker exec crm_mysql mariadb -u root -p${DB_PASS} -e "SELECT VERSION();" >/dev/null 2>&1; then
    echo "✅ اتصال root موفق بود"
else
    echo "❌ اتصال root ناموفق"
    echo "🔍 لاگ MySQL:"
    docker logs crm_mysql --tail 20
    exit 1
fi

# تست اتصال crm_app_user
if docker exec crm_mysql mariadb -u crm_app_user -p${DB_PASS} -e "USE crm_system; SHOW TABLES;" >/dev/null 2>&1; then
    echo "✅ اتصال crm_app_user موفق بود"
else
    echo "❌ اتصال crm_app_user ناموفق"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ MySQL Password فیکس شد!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔐 اطلاعات دسترسی:"
echo "   User: root"
echo "   Password: ${DB_PASS}"
echo "   User: crm_app_user"
echo "   Password: ${DB_PASS}"
echo ""
echo "🚀 حالا phpMyAdmin و nextjs را ریستارت کنید:"
echo "   docker-compose restart phpmyadmin nextjs"
echo ""
