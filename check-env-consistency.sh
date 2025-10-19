#!/bin/bash

# ===========================================
# 🔍 اسکریپت بررسی یکپارچگی ENV ها
# ===========================================

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 بررسی یکپارچگی تنظیمات ENV، Docker و کد"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ERRORS=0
WARNINGS=0

# ===========================================
# 1. بررسی فایل‌های ENV
# ===========================================

echo "📋 مرحله 1: بررسی فایل‌های ENV..."
echo ""

# بررسی .env
if [ -f ".env" ]; then
    echo "✅ .env موجود است"
    
    # استخراج DATABASE_PASSWORD
    DB_PASS=$(grep "^DATABASE_PASSWORD=" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    DB_USER=$(grep "^DATABASE_USER=" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    DB_HOST=$(grep "^DATABASE_HOST=" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    DB_NAME=$(grep "^DATABASE_NAME=" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    
    echo "   📊 تنظیمات دیتابیس در .env:"
    echo "      DATABASE_HOST: ${DB_HOST:-NOT_SET}"
    echo "      DATABASE_USER: ${DB_USER:-NOT_SET}"
    echo "      DATABASE_PASSWORD: ${DB_PASS:0:4}****"
    echo "      DATABASE_NAME: ${DB_NAME:-NOT_SET}"
    
    if [ -z "$DB_PASS" ]; then
        echo "   ❌ DATABASE_PASSWORD تنظیم نشده!"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "❌ .env یافت نشد!"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# بررسی صدای رابین/.env
if [ -f "صدای رابین/.env" ]; then
    echo "✅ صدای رابین/.env موجود است"
    
    # استخراج تنظیمات
    RABIN_DB_PASS=$(grep "^DATABASE_PASSWORD=" "صدای رابین/.env" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    RABIN_DB_USER=$(grep "^DATABASE_USER=" "صدای رابین/.env" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    RABIN_API_KEY=$(grep "^OPENROUTER_API_KEY=" "صدای رابین/.env" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    
    echo "   📊 تنظیمات در صدای رابین/.env:"
    echo "      DATABASE_USER: ${RABIN_DB_USER:-NOT_SET}"
    echo "      DATABASE_PASSWORD: ${RABIN_DB_PASS:0:4}****"
    echo "      OPENROUTER_API_KEY: ${RABIN_API_KEY:0:10}..."
    
    # مقایسه با .env اصلی
    if [ "$DB_PASS" != "$RABIN_DB_PASS" ]; then
        echo "   ⚠️  هشدار: DATABASE_PASSWORD در دو فایل متفاوت است!"
        echo "      .env: ${DB_PASS:0:4}****"
        echo "      صدای رابین/.env: ${RABIN_DB_PASS:0:4}****"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    if [ -z "$RABIN_API_KEY" ] || [ "$RABIN_API_KEY" = "YOUR_OPENROUTER_API_KEY_HERE" ]; then
        echo "   ⚠️  هشدار: OPENROUTER_API_KEY تنظیم نشده!"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "❌ صدای رابین/.env یافت نشد!"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ===========================================
# 2. بررسی database/init.sql
# ===========================================

echo "📋 مرحله 2: بررسی database/init.sql..."
echo ""

if [ -f "database/init.sql" ]; then
    echo "✅ database/init.sql موجود است"
    
    # بررسی CREATE USER
    if grep -q "CREATE USER IF NOT EXISTS 'crm_app_user'" database/init.sql; then
        echo "   ✅ CREATE USER statement موجود است"
    else
        echo "   ❌ CREATE USER statement یافت نشد!"
        echo "      فایل init.sql باید کاربر را بسازد"
        ERRORS=$((ERRORS + 1))
    fi
    
    # بررسی پسورد در init.sql
    INIT_PASS=$(grep "IDENTIFIED BY" database/init.sql | head -1 | sed "s/.*IDENTIFIED BY '\(.*\)'.*/\1/")
    if [ -n "$INIT_PASS" ]; then
        echo "   📊 پسورد در init.sql: ${INIT_PASS:0:4}****"
        
        if [ "$DB_PASS" != "$INIT_PASS" ]; then
            echo "   ⚠️  هشدار: پسورد در init.sql با .env متفاوت است!"
            echo "      .env: ${DB_PASS:0:4}****"
            echo "      init.sql: ${INIT_PASS:0:4}****"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo "   ⚠️  نتوانستم پسورد را از init.sql استخراج کنم"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "❌ database/init.sql یافت نشد!"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ===========================================
# 3. بررسی کد صدای رابین
# ===========================================

echo "📋 مرحله 3: بررسی کد صدای رابین..."
echo ""

if [ -f "صدای رابین/lib/database.ts" ]; then
    echo "✅ صدای رابین/lib/database.ts موجود است"
    
    # بررسی پسورد پیش‌فرض در کد
    CODE_DEFAULT_PASS=$(grep "password:" "صدای رابین/lib/database.ts" | grep -o '"[^"]*"' | tail -1 | tr -d '"')
    
    if [ -n "$CODE_DEFAULT_PASS" ]; then
        echo "   📊 پسورد پیش‌فرض در کد: ${CODE_DEFAULT_PASS:0:4}****"
        
        if [ "$CODE_DEFAULT_PASS" != "$DB_PASS" ]; then
            echo "   ⚠️  هشدار: پسورد پیش‌فرض در کد با .env متفاوت است!"
            echo "      این می‌تواند باعث مشکل شود اگر ENV لود نشود"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
else
    echo "⚠️  صدای رابین/lib/database.ts یافت نشد"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ===========================================
# 4. بررسی docker-compose.yml
# ===========================================

echo "📋 مرحله 4: بررسی docker-compose.yml..."
echo ""

if [ -f "docker-compose.yml" ]; then
    echo "✅ docker-compose.yml موجود است"
    
    # بررسی env_file برای rabin-voice
    if grep -A 10 "rabin-voice:" docker-compose.yml | grep -q "env_file:"; then
        echo "   ✅ rabin-voice service از env_file استفاده می‌کند"
        
        # بررسی ترتیب env_file ها
        echo "   📊 ترتیب env_file ها:"
        grep -A 5 "rabin-voice:" docker-compose.yml | grep -A 3 "env_file:" | grep "^\s*-" | while read line; do
            echo "      $line"
        done
    else
        echo "   ⚠️  rabin-voice service env_file ندارد"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # بررسی MySQL environment
    if grep -A 20 "mysql:" docker-compose.yml | grep -q "MYSQL_PASSWORD"; then
        echo "   ✅ MySQL service environment variables دارد"
    else
        echo "   ⚠️  MySQL service environment variables ندارد"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "❌ docker-compose.yml یافت نشد!"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ===========================================
# 5. بررسی Dockerfile های صدای رابین
# ===========================================

echo "📋 مرحله 5: بررسی Dockerfile صدای رابین..."
echo ""

if [ -f "صدای رابین/Dockerfile" ]; then
    echo "✅ صدای رابین/Dockerfile موجود است"
    
    # بررسی CMD
    if grep -q "CMD.*start.sh" "صدای رابین/Dockerfile"; then
        echo "   ✅ Dockerfile از start.sh استفاده می‌کند"
    elif grep -q "CMD.*server.js" "صدای رابین/Dockerfile"; then
        echo "   ✅ Dockerfile از server.js استفاده می‌کند"
    else
        echo "   ⚠️  CMD در Dockerfile مشخص نیست"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "❌ صدای رابین/Dockerfile یافت نشد!"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ===========================================
# 6. بررسی start.sh
# ===========================================

echo "📋 مرحله 6: بررسی start.sh..."
echo ""

if [ -f "صدای رابین/start.sh" ]; then
    echo "✅ صدای رابین/start.sh موجود است"
    
    # بررسی executable permission
    if [ -x "صدای رابین/start.sh" ]; then
        echo "   ✅ start.sh قابل اجرا است"
    else
        echo "   ⚠️  start.sh قابل اجرا نیست"
        chmod +x "صدای رابین/start.sh"
        echo "   ✅ مجوز اجرا اضافه شد"
    fi
    
    # بررسی entry point
    if grep -q "node.*server.js" "صدای رابین/start.sh"; then
        echo "   ✅ start.sh از server.js استفاده می‌کند"
    elif grep -q "node.*standalone" "صدای رابین/start.sh"; then
        echo "   ✅ start.sh از standalone build استفاده می‌کند"
    else
        echo "   ⚠️  entry point در start.sh مشخص نیست"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "⚠️  صدای رابین/start.sh یافت نشد"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ===========================================
# نتیجه نهایی
# ===========================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ همه چیز درست است! هیچ مشکلی یافت نشد."
    echo ""
    echo "🚀 آماده برای deploy:"
    echo "   bash deploy-server.sh"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  $WARNINGS هشدار یافت شد (غیر بحرانی)"
    echo ""
    echo "💡 توصیه می‌شود این موارد را بررسی کنید:"
    echo "   - پسورد دیتابیس در همه جا یکسان باشد"
    echo "   - OpenRouter API Key تنظیم شده باشد"
    echo ""
    echo "🚀 می‌توانید deploy کنید:"
    echo "   bash deploy-server.sh"
    exit 0
else
    echo "❌ $ERRORS خطا و $WARNINGS هشدار یافت شد"
    echo ""
    echo "🔧 لطفاً ابتدا این مشکلات را برطرف کنید:"
    echo "   1. اطمینان حاصل کنید همه فایل‌های ENV موجود هستند"
    echo "   2. database/init.sql باید CREATE USER داشته باشد"
    echo "   3. پسورد دیتابیس در همه جا یکسان باشد"
    echo ""
    echo "💡 برای اصلاح خودکار:"
    echo "   bash setup-all-env.sh"
    exit 1
fi
