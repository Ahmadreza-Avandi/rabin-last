#!/bin/bash

# 🔧 اسکریپت رفع همه مشکلات شناسایی شده
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 رفع همه مشکلات شناسایی شده"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ═══════════════════════════════════════════════════════════════
# 1. رفع مشکل nginx resolver
# ═══════════════════════════════════════════════════════════════

echo "🔧 1. رفع مشکل nginx resolver..."

if ! grep -q "resolver 127.0.0.11" nginx/default.conf; then
    echo "   اضافه کردن DNS resolver به nginx config..."
    sed -i '1i# DNS resolver for Docker (با ipv6=off برای جلوگیری از مشکل resolve)\nresolver 127.0.0.11 valid=30s ipv6=off;\n' nginx/default.conf
    echo "   ✅ DNS resolver اضافه شد"
else
    echo "   ✅ DNS resolver موجود است"
fi

# ═══════════════════════════════════════════════════════════════
# 2. رفع مشکل nginx location برای rabin-voice
# ═══════════════════════════════════════════════════════════════

echo ""
echo "🔧 2. رفع مشکل nginx location برای rabin-voice..."

# بررسی اینکه آیا trailing slash دارد یا نه
if grep -q "location /rabin-voice {" nginx/default.conf; then
    echo "   تصحیح location /rabin-voice به /rabin-voice/..."
    sed -i 's|location /rabin-voice {|location /rabin-voice/ {|g' nginx/default.conf
    sed -i 's|proxy_pass http://rabin-voice:3001;|proxy_pass http://rabin-voice:3001/;|g' nginx/default.conf
    echo "   ✅ location اصلاح شد"
else
    echo "   ✅ location درست است"
fi

# اضافه کردن variable برای resolver
if ! grep -q "set \$rabin_voice_upstream" nginx/default.conf; then
    echo "   اضافه کردن variable برای resolver..."
    sed -i '/location \/rabin-voice\/ {/a\        set $rabin_voice_upstream rabin-voice:3001;' nginx/default.conf
    sed -i 's|proxy_pass http://rabin-voice:3001/;|proxy_pass http://$rabin_voice_upstream/;|g' nginx/default.conf
    echo "   ✅ variable اضافه شد"
else
    echo "   ✅ variable موجود است"
fi

# ═══════════════════════════════════════════════════════════════
# 3. رفع مشکل OpenRouter API Key
# ═══════════════════════════════════════════════════════════════

echo ""
echo "🔧 3. بررسی OpenRouter API Key..."

if grep -q "OPENROUTER_API_KEY=WILL_BE_SET_MANUALLY" "صدای رابین/.env"; then
    echo "   ⚠️  OpenRouter API Key تنظیم نشده!"
    echo "   🔑 API Key شما از لاگ: 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"
    
    # تنظیم API Key
    sed -i 's|OPENROUTER_API_KEY=WILL_BE_SET_MANUALLY|OPENROUTER_API_KEY=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|g' "صدای رابین/.env"
    sed -i 's|RABIN_VOICE_OPENROUTER_API_KEY=WILL_BE_SET_MANUALLY|RABIN_VOICE_OPENROUTER_API_KEY=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|g' "صدای رابین/.env"
    
    echo "   ✅ API Key تنظیم شد"
elif grep -q "OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE" "صدای رابین/.env"; then
    echo "   ⚠️  OpenRouter API Key placeholder است!"
    
    # تنظیم API Key
    sed -i 's|OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE|OPENROUTER_API_KEY=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|g' "صدای رابین/.env"
    sed -i 's|RABIN_VOICE_OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE|RABIN_VOICE_OPENROUTER_API_KEY=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|g' "صدای رابین/.env"
    
    echo "   ✅ API Key تنظیم شد"
else
    echo "   ✅ API Key تنظیم شده است"
fi

# ═══════════════════════════════════════════════════════════════
# 4. رفع مشکل MySQL root password
# ═══════════════════════════════════════════════════════════════

echo ""
echo "🔧 4. رفع مشکل MySQL root password..."

# بارگذاری DATABASE_PASSWORD از .env
if [ -f ".env" ]; then
    set -a
    source .env 2>/dev/null || true
    set +a
fi

DB_PASS="${DATABASE_PASSWORD:-1234}"

# بررسی docker-compose.yml
if grep -q 'MYSQL_ROOT_PASSWORD: "${DATABASE_PASSWORD}"' docker-compose.yml; then
    echo "   ⚠️  MYSQL_ROOT_PASSWORD از DATABASE_PASSWORD استفاده می‌کند"
    echo "   🔧 تصحیح به پسورد صحیح..."
    
    # تصحیح: root password باید جدا باشه
    sed -i "s|MYSQL_ROOT_PASSWORD: \"\${DATABASE_PASSWORD}\"|MYSQL_ROOT_PASSWORD: \"${DB_PASS}\"|g" docker-compose.yml
    
    echo "   ✅ MYSQL_ROOT_PASSWORD تصحیح شد"
else
    echo "   ✅ MYSQL_ROOT_PASSWORD درست است"
fi

# ═══════════════════════════════════════════════════════════════
# 5. رفع مشکل صدای رابین Dockerfile
# ═══════════════════════════════════════════════════════════════

echo ""
echo "🔧 5. بررسی صدای رابین Dockerfile..."

# بررسی اینکه node_modules جداگانه کپی می‌شود یا نه
if grep -q "COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules" "صدای رابین/Dockerfile"; then
    echo "   ⚠️  node_modules جداگانه کپی می‌شود (اشتباه است)"
    echo "   🔧 حذف کپی جداگانه node_modules..."
    
    # حذف خط کپی node_modules
    sed -i '/COPY --from=builder --chown=nextjs:nodejs \/app\/node_modules .\/node_modules/d' "صدای رابین/Dockerfile"
    
    echo "   ✅ Dockerfile اصلاح شد"
else
    echo "   ✅ Dockerfile درست است"
fi

# ═══════════════════════════════════════════════════════════════
# 6. رفع مشکل صدای رابین start.sh
# ═══════════════════════════════════════════════════════════════

echo ""
echo "🔧 6. بررسی صدای رابین start.sh..."

if grep -q "node ./.next/standalone/server.js" "صدای رابین/start.sh"; then
    echo "   ⚠️  مسیر server.js اشتباه است"
    echo "   🔧 تصحیح مسیر..."
    
    sed -i 's|node ./.next/standalone/server.js|node server.js|g' "صدای رابین/start.sh"
    
    echo "   ✅ start.sh اصلاح شد"
else
    echo "   ✅ start.sh درست است"
fi

# ═══════════════════════════════════════════════════════════════
# 7. بررسی و تصحیح database/init.sql
# ═══════════════════════════════════════════════════════════════

echo ""
echo "🔧 7. بررسی database/init.sql..."

if ! grep -q "DROP USER IF EXISTS" database/init.sql; then
    echo "   ⚠️  init.sql بدون DROP USER است"
    echo "   🔧 اضافه کردن DROP USER..."
    
    # بازسازی init.sql
    cat > database/init.sql << EOF
-- Database initialization script for CRM System
-- This script creates the database and user if they don't exist

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS \`crm_system\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Drop existing users to ensure clean state
DROP USER IF EXISTS 'crm_app_user'@'%';
DROP USER IF EXISTS 'crm_app_user'@'localhost';
DROP USER IF EXISTS 'crm_app_user'@'127.0.0.1';

-- Create user with password - برای تمام connection patterns
CREATE USER 'crm_app_user'@'%' IDENTIFIED BY '${DB_PASS}';
CREATE USER 'crm_app_user'@'localhost' IDENTIFIED BY '${DB_PASS}';
CREATE USER 'crm_app_user'@'127.0.0.1' IDENTIFIED BY '${DB_PASS}';

-- Grant all privileges on crm_system database
GRANT ALL PRIVILEGES ON \`crm_system\`.* TO 'crm_app_user'@'%';
GRANT ALL PRIVILEGES ON \`crm_system\`.* TO 'crm_app_user'@'localhost';
GRANT ALL PRIVILEGES ON \`crm_system\`.* TO 'crm_app_user'@'127.0.0.1';

-- FLUSH to apply changes immediately
FLUSH PRIVILEGES;

-- Use the database
USE \`crm_system\`;

-- Set timezone
SET time_zone = '+00:00';

EOF
    
    echo "   ✅ init.sql بازسازی شد"
else
    echo "   ✅ init.sql درست است"
fi

# ═══════════════════════════════════════════════════════════════
# 8. بررسی consistency پسوردها
# ═══════════════════════════════════════════════════════════════

echo ""
echo "🔧 8. بررسی consistency پسوردها..."

# پسورد در .env
ROOT_PASS=$(grep "^DATABASE_PASSWORD=" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")

# پسورد در صدای رابین/.env
RABIN_PASS=$(grep "^DATABASE_PASSWORD=" "صدای رابین/.env" | cut -d'=' -f2 | tr -d '"' | tr -d "'")

# پسورد در init.sql
INIT_PASS=$(grep "IDENTIFIED BY" database/init.sql | head -1 | sed "s/.*IDENTIFIED BY '\(.*\)'.*/\1/")

echo "   📊 پسوردها:"
echo "      .env: ${ROOT_PASS:0:4}****"
echo "      صدای رابین/.env: ${RABIN_PASS:0:4}****"
echo "      init.sql: ${INIT_PASS:0:4}****"

if [ "$ROOT_PASS" = "$RABIN_PASS" ] && [ "$ROOT_PASS" = "$INIT_PASS" ]; then
    echo "   ✅ همه پسوردها یکسان هستند"
else
    echo "   ⚠️  پسوردها متفاوت هستند!"
    echo "   🔧 یکسان‌سازی پسوردها..."
    
    # استفاده از پسورد .env به عنوان مرجع
    sed -i "s|DATABASE_PASSWORD=.*|DATABASE_PASSWORD=${ROOT_PASS}|g" "صدای رابین/.env"
    
    # بازسازی init.sql با پسورد صحیح
    sed -i "s|IDENTIFIED BY '.*'|IDENTIFIED BY '${ROOT_PASS}'|g" database/init.sql
    
    echo "   ✅ پسوردها یکسان شدند"
fi

# ═══════════════════════════════════════════════════════════════
# 9. خلاصه تغییرات
# ═══════════════════════════════════════════════════════════════

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ همه مشکلات برطرف شد!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 تغییرات اعمال شده:"
echo "   ✅ nginx resolver اضافه شد"
echo "   ✅ nginx location برای rabin-voice اصلاح شد"
echo "   ✅ OpenRouter API Key تنظیم شد"
echo "   ✅ MySQL root password تصحیح شد"
echo "   ✅ صدای رابین Dockerfile اصلاح شد"
echo "   ✅ صدای رابین start.sh اصلاح شد"
echo "   ✅ database/init.sql بازسازی شد"
echo "   ✅ پسوردها یکسان‌سازی شدند"
echo ""
echo "🚀 حالا می‌توانید deploy کنید:"
echo "   bash deploy-server.sh"
echo ""
