#!/bin/bash

# ==========================================
# 🔧 اصلاح MySQL برای کار بدون پسورد
# ==========================================

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 اصلاح تنظیمات MySQL برای کار بدون پسورد"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. اصلاح docker-compose.yml
echo "📝 1. اصلاح docker-compose.yml..."
if [ -f "docker-compose.yml" ]; then
    echo "   ✅ docker-compose.yml موجود است"
else
    echo "   ❌ docker-compose.yml یافت نشد!"
    exit 1
fi

# 2. اصلاح .env files
echo ""
echo "📝 2. اصلاح فایل‌های .env..."

# اصلاح .env ریشه
if [ -f ".env" ]; then
    echo "   🔧 اصلاح .env..."
    sed -i 's|DATABASE_USER=.*|DATABASE_USER=root|g' .env
    sed -i 's|DATABASE_PASSWORD=.*|DATABASE_PASSWORD=|g' .env
    sed -i 's|DATABASE_URL=.*|DATABASE_URL=mysql://root@mysql:3306/crm_system|g' .env
    echo "   ✅ .env اصلاح شد"
fi

# اصلاح صدای رابین/.env
if [ -f "صدای رابین/.env" ]; then
    echo "   🔧 اصلاح صدای رابین/.env..."
    sed -i 's|DATABASE_USER=.*|DATABASE_USER=root|g' "صدای رابین/.env"
    sed -i 's|DATABASE_PASSWORD=.*|DATABASE_PASSWORD=|g' "صدای رابین/.env"
    echo "   ✅ صدای رابین/.env اصلاح شد"
fi

# 3. ایجاد init.sql ساده
echo ""
echo "📝 3. ایجاد init.sql ساده..."
mkdir -p database

cat > database/init.sql << 'EOF'
-- ==========================================
-- 🗄️ Database Initialization - No Password
-- ==========================================

CREATE DATABASE IF NOT EXISTS `crm_system` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `crm_system`;
SET time_zone = '+00:00';

-- ✅ Root بدون پسورد - همه دسترسی دارند
EOF

echo "   ✅ init.sql ایجاد شد"

# 4. بررسی نهایی
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ اصلاحات انجام شد!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 تنظیمات جدید:"
echo "   - DATABASE_USER: root"
echo "   - DATABASE_PASSWORD: (خالی)"
echo "   - DATABASE_URL: mysql://root@mysql:3306/crm_system"
echo ""
echo "🚀 مراحل بعدی:"
echo "   1. bash deploy-server.sh"
echo "   2. phpMyAdmin با root بدون پسورد وارد شوید"
echo ""
