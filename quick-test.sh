#!/bin/bash

# ==========================================
# 🧪 تست سریع تنظیمات
# ==========================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 تست سریع تنظیمات MySQL بدون پسورد"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. بررسی docker-compose.yml
echo "1️⃣  بررسی docker-compose.yml..."
if grep -q "MYSQL_ALLOW_EMPTY_PASSWORD.*yes" docker-compose.yml; then
    echo "   ✅ MySQL: ALLOW_EMPTY_PASSWORD = yes"
else
    echo "   ❌ MySQL: ALLOW_EMPTY_PASSWORD نیست"
fi

if grep -q "DATABASE_USER=root" docker-compose.yml; then
    echo "   ✅ Services: DATABASE_USER = root"
else
    echo "   ⚠️  Services: DATABASE_USER شاید root نباشد"
fi

# 2. بررسی .env
echo ""
echo "2️⃣  بررسی .env..."
if [ -f ".env" ]; then
    if grep -q "DATABASE_USER=root" .env; then
        echo "   ✅ .env: DATABASE_USER = root"
    else
        echo "   ❌ .env: DATABASE_USER != root"
    fi
    
    if grep -q "DATABASE_PASSWORD=$" .env || grep -q 'DATABASE_PASSWORD=""' .env || grep -q "DATABASE_PASSWORD=''" .env; then
        echo "   ✅ .env: DATABASE_PASSWORD = (خالی)"
    else
        echo "   ⚠️  .env: DATABASE_PASSWORD دارد مقدار"
    fi
else
    echo "   ❌ .env یافت نشد"
fi

# 3. بررسی صدای رابین/.env
echo ""
echo "3️⃣  بررسی صدای رابین/.env..."
if [ -f "صدای رابین/.env" ]; then
    if grep -q "DATABASE_USER=root" "صدای رابین/.env"; then
        echo "   ✅ صدای رابین/.env: DATABASE_USER = root"
    else
        echo "   ❌ صدای رابین/.env: DATABASE_USER != root"
    fi
else
    echo "   ❌ صدای رابین/.env یافت نشد"
fi

# 4. بررسی lib/database.ts
echo ""
echo "4️⃣  بررسی lib/database.ts..."
if grep -q 'user.*root' lib/database.ts; then
    echo "   ✅ database.ts: user = root"
else
    echo "   ❌ database.ts: user != root"
fi

if grep -q "password.*''" lib/database.ts || grep -q 'password.*""' lib/database.ts; then
    echo "   ✅ database.ts: password = (خالی)"
else
    echo "   ⚠️  database.ts: password دارد مقدار"
fi

# 5. بررسی صدای رابین/api/services/database.js
echo ""
echo "5️⃣  بررسی صدای رابین/api/services/database.js..."
if grep -q 'user.*"root"' "صدای رابین/api/services/database.js"; then
    echo "   ✅ database.js: user = root"
else
    echo "   ❌ database.js: user != root"
fi

if grep -q 'password.*""' "صدای رابین/api/services/database.js"; then
    echo "   ✅ database.js: password = (خالی)"
else
    echo "   ⚠️  database.js: password دارد مقدار"
fi

# 6. بررسی کانتینرها (اگر در حال اجرا هستند)
echo ""
echo "6️⃣  بررسی کانتینرهای در حال اجرا..."
if docker ps | grep -q "crm_mysql"; then
    echo "   ✅ MySQL container در حال اجرا"
    
    # تست اتصال
    if docker exec crm_mysql mariadb -u root -e "SELECT 1;" >/dev/null 2>&1; then
        echo "   ✅ اتصال به MySQL با root بدون پسورد موفق"
    else
        echo "   ❌ اتصال به MySQL ناموفق"
    fi
else
    echo "   ⚠️  MySQL container در حال اجرا نیست"
fi

if docker ps | grep -q "crm_rabin_voice"; then
    echo "   ✅ Rabin Voice container در حال اجرا"
    
    # بررسی لاگ برای خطای پورت
    if docker logs crm_rabin_voice 2>&1 | tail -20 | grep -q "EADDRINUSE"; then
        echo "   ❌ خطای EADDRINUSE در Rabin Voice"
    else
        echo "   ✅ Rabin Voice بدون خطای پورت"
    fi
else
    echo "   ⚠️  Rabin Voice container در حال اجرا نیست"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ تست کامل شد!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
