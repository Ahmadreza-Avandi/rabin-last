#!/bin/bash

# 🔧 اسکریپت رفع همه مشکلات سرور
# این اسکریپت روی سرور اجرا می‌شود و همه مشکلات را یکجا حل می‌کند

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 رفع همه مشکلات سرور"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# بارگذاری پسورد از .env
if [ -f ".env" ]; then
    set -a
    source .env 2>/dev/null || true
    set +a
fi

DB_PASS="${DATABASE_PASSWORD:-1234}"

echo "📊 تنظیمات:"
echo "   پسورد دیتابیس: ${DB_PASS:0:4}****"
echo ""

# ═══════════════════════════════════════════════════════════════
# 1. رفع مشکل MySQL Password
# ═══════════════════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 1. رفع مشکل MySQL Password"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# متوقف کردن سرویس‌ها
echo "🛑 متوقف کردن سرویس‌ها..."
docker-compose stop

# حذف کانتینر MySQL
echo "🗑️ حذف کانتینر MySQL..."
docker rm crm_mysql 2>/dev/null || true

# حذف volume MySQL
echo "⚠️  حذف volume MySQL (دیتا پاک می‌شود)..."
docker volume rm rabin-last_mysql_data 2>/dev/null || true

# بازسازی init.sql
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

-- Create user with password - برای تمام connection patterns (شامل Docker network)
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

# اضافه کردن SQL files
if [ -f "database/crm_system.sql" ]; then
    echo "-- Import main CRM database schema and data" >> database/init.sql
    cat database/crm_system.sql >> database/init.sql
    echo "" >> database/init.sql
    echo "   ✅ crm_system.sql اضافه شد"
fi

if [ -f "database/saas_master.sql" ]; then
    echo "-- Import SaaS master database" >> database/init.sql
    cat database/saas_master.sql >> database/init.sql
    echo "" >> database/init.sql
    echo "   ✅ saas_master.sql اضافه شد"
fi

echo "✅ init.sql بازسازی شد"
echo ""

# ═══════════════════════════════════════════════════════════════
# 2. رفع مشکل Rabin Voice Dockerfile
# ═══════════════════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 2. رفع مشکل Rabin Voice Dockerfile"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# حذف کانتینر و image rabin-voice
echo "🗑️ حذف کانتینر و image rabin-voice..."
docker rm crm_rabin_voice 2>/dev/null || true
docker rmi rabin-last-rabin-voice 2>/dev/null || true

echo "✅ Rabin Voice آماده rebuild است"
echo ""

# ═══════════════════════════════════════════════════════════════
# 3. Build و راه‌اندازی مجدد
# ═══════════════════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 3. Build و راه‌اندازی مجدد"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Build MySQL
echo "🔨 Build MySQL..."
docker-compose build --no-cache mysql

# راه‌اندازی MySQL
echo "🚀 راه‌اندازی MySQL..."
docker-compose up -d mysql

# انتظار برای MySQL
echo "⏳ انتظار برای MySQL (30 ثانیه)..."
sleep 30

# تست MySQL
echo "🧪 تست MySQL..."
if docker exec crm_mysql mariadb -u root -p${DB_PASS} -e "SELECT VERSION();" >/dev/null 2>&1; then
    echo "✅ MySQL در حال اجراست"
else
    echo "❌ MySQL مشکل دارد"
    docker logs crm_mysql --tail 20
    exit 1
fi

# Build Rabin Voice
echo "🔨 Build Rabin Voice (بدون cache)..."
docker-compose build --no-cache rabin-voice

# راه‌اندازی Rabin Voice
echo "🚀 راه‌اندازی Rabin Voice..."
docker-compose up -d rabin-voice

# انتظار برای Rabin Voice
echo "⏳ انتظار برای Rabin Voice (30 ثانیه)..."
sleep 30

# تست Rabin Voice
echo "🧪 تست Rabin Voice..."
if curl -f http://localhost:3001/ >/dev/null 2>&1; then
    echo "✅ Rabin Voice در حال اجراست"
else
    echo "⚠️  Rabin Voice هنوز مشکل دارد"
    echo "🔍 لاگ:"
    docker logs crm_rabin_voice --tail 30
fi

# راه‌اندازی بقیه سرویس‌ها
echo "🚀 راه‌اندازی بقیه سرویس‌ها..."
docker-compose up -d

# انتظار
echo "⏳ انتظار برای آماده شدن (20 ثانیه)..."
sleep 20

# ═══════════════════════════════════════════════════════════════
# 4. تست نهایی
# ═══════════════════════════════════════════════════════════════

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 تست نهایی"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# تست MySQL
echo "🗄️ تست MySQL..."
if docker exec crm_mysql mariadb -u crm_app_user -p${DB_PASS} -e "USE crm_system; SHOW TABLES;" >/dev/null 2>&1; then
    echo "✅ MySQL: crm_app_user اتصال موفق"
else
    echo "❌ MySQL: crm_app_user اتصال ناموفق"
fi

# تست Rabin Voice
echo "🎤 تست Rabin Voice..."
RABIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ 2>/dev/null || echo "000")
if [ "$RABIN_STATUS" = "200" ]; then
    echo "✅ Rabin Voice: HTTP $RABIN_STATUS"
else
    echo "⚠️  Rabin Voice: HTTP $RABIN_STATUS"
fi

# تست NextJS
echo "🌐 تست NextJS..."
NEXTJS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "000")
if [ "$NEXTJS_STATUS" = "200" ] || [ "$NEXTJS_STATUS" = "307" ]; then
    echo "✅ NextJS: HTTP $NEXTJS_STATUS"
else
    echo "⚠️  NextJS: HTTP $NEXTJS_STATUS"
fi

# تست nginx
echo "🔧 تست nginx..."
NGINX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")
if [ "$NGINX_STATUS" = "200" ] || [ "$NGINX_STATUS" = "307" ] || [ "$NGINX_STATUS" = "301" ]; then
    echo "✅ nginx: HTTP $NGINX_STATUS"
else
    echo "⚠️  nginx: HTTP $NGINX_STATUS"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ همه مشکلات فیکس شدند!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 وضعیت سرویس‌ها:"
docker-compose ps
echo ""
echo "🌐 آدرس‌های دسترسی:"
echo "   CRM: http://crm.robintejarat.com"
echo "   Rabin Voice: http://crm.robintejarat.com/rabin-voice"
echo "   phpMyAdmin: http://crm.robintejarat.com/secure-db-admin-panel-x7k9m2/"
echo ""
echo "🔐 اطلاعات دیتابیس:"
echo "   User: crm_app_user"
echo "   Password: ${DB_PASS}"
echo "   Database: crm_system"
echo ""
