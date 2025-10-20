#!/bin/bash

# ==========================================
# 🔍 بررسی کامل تمام تنظیمات
# ==========================================

set -e

ERRORS=0
WARNINGS=0

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 بررسی کامل تنظیمات پروژه"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ==========================================
# 1. بررسی docker-compose.yml
# ==========================================
echo "1️⃣  بررسی docker-compose.yml..."

if [ ! -f "docker-compose.yml" ]; then
    echo "   ❌ docker-compose.yml یافت نشد!"
    ERRORS=$((ERRORS + 1))
else
    # MySQL
    if grep -q "MYSQL_ALLOW_EMPTY_PASSWORD.*yes" docker-compose.yml; then
        echo "   ✅ MySQL: ALLOW_EMPTY_PASSWORD = yes"
    else
        echo "   ❌ MySQL: ALLOW_EMPTY_PASSWORD نیست"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q "skip-grant-tables" docker-compose.yml; then
        echo "   ✅ MySQL: --skip-grant-tables فعال است"
    else
        echo "   ⚠️  MySQL: --skip-grant-tables نیست"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # Container names
    if grep -q "container_name: crm_mysql" docker-compose.yml; then
        echo "   ✅ Container names: crm_mysql"
    else
        echo "   ⚠️  Container name: crm_mysql نیست (شاید crm-mysql باشد)"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    if grep -q "container_name: crm_rabin_voice" docker-compose.yml; then
        echo "   ✅ Container names: crm_rabin_voice"
    else
        echo "   ⚠️  Container name: crm_rabin_voice نیست"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

# ==========================================
# 2. بررسی .env
# ==========================================
echo ""
echo "2️⃣  بررسی .env..."

if [ ! -f ".env" ]; then
    echo "   ❌ .env یافت نشد!"
    ERRORS=$((ERRORS + 1))
else
    if grep -q "DATABASE_USER=root" .env; then
        echo "   ✅ .env: DATABASE_USER = root"
    else
        echo "   ❌ .env: DATABASE_USER != root"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check if password is empty
    if grep -E "^DATABASE_PASSWORD=$|^DATABASE_PASSWORD=\"\"$|^DATABASE_PASSWORD=''$" .env >/dev/null; then
        echo "   ✅ .env: DATABASE_PASSWORD = (خالی)"
    else
        echo "   ❌ .env: DATABASE_PASSWORD دارد مقدار"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q "DATABASE_URL=mysql://root@mysql" .env; then
        echo "   ✅ .env: DATABASE_URL با root"
    else
        echo "   ⚠️  .env: DATABASE_URL شاید درست نباشد"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

# ==========================================
# 3. بررسی صدای رابین/.env
# ==========================================
echo ""
echo "3️⃣  بررسی صدای رابین/.env..."

if [ ! -f "صدای رابین/.env" ]; then
    echo "   ❌ صدای رابین/.env یافت نشد!"
    ERRORS=$((ERRORS + 1))
else
    if grep -q "DATABASE_USER=root" "صدای رابین/.env"; then
        echo "   ✅ صدای رابین/.env: DATABASE_USER = root"
    else
        echo "   ❌ صدای رابین/.env: DATABASE_USER != root"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -E "^DATABASE_PASSWORD=$|^DATABASE_PASSWORD=\"\"$|^DATABASE_PASSWORD=''$" "صدای رابین/.env" >/dev/null; then
        echo "   ✅ صدای رابین/.env: DATABASE_PASSWORD = (خالی)"
    else
        echo "   ❌ صدای رابین/.env: DATABASE_PASSWORD دارد مقدار"
        ERRORS=$((ERRORS + 1))
    fi
fi

# ==========================================
# 4. بررسی Dockerfiles
# ==========================================
echo ""
echo "4️⃣  بررسی Dockerfiles..."

# Main Dockerfile
if [ ! -f "Dockerfile" ]; then
    echo "   ❌ Dockerfile یافت نشد!"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ Dockerfile موجود است"
fi

# Rabin Voice Dockerfile
if [ ! -f "صدای رابین/Dockerfile" ]; then
    echo "   ❌ صدای رابین/Dockerfile یافت نشد!"
    ERRORS=$((ERRORS + 1))
else
    # بررسی که Next.js build نداشته باشد
    if grep -q "npm run build" "صدای رابین/Dockerfile"; then
        echo "   ⚠️  صدای رابین/Dockerfile: هنوز npm run build دارد"
        WARNINGS=$((WARNINGS + 1))
    else
        echo "   ✅ صدای رابین/Dockerfile: بدون Next.js build"
    fi
    
    # بررسی که .next کپی نشود
    if grep -q "COPY.*\.next" "صدای رابین/Dockerfile"; then
        echo "   ⚠️  صدای رابین/Dockerfile: هنوز .next کپی می‌شود"
        WARNINGS=$((WARNINGS + 1))
    else
        echo "   ✅ صدای رابین/Dockerfile: بدون .next directory"
    fi
fi

# ==========================================
# 5. بررسی lib/database.ts
# ==========================================
echo ""
echo "5️⃣  بررسی lib/database.ts..."

if [ ! -f "lib/database.ts" ]; then
    echo "   ❌ lib/database.ts یافت نشد!"
    ERRORS=$((ERRORS + 1))
else
    if grep -q "user.*'root'" lib/database.ts || grep -q 'user.*"root"' lib/database.ts; then
        echo "   ✅ database.ts: user = root"
    else
        echo "   ❌ database.ts: user != root"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q "password.*''" lib/database.ts || grep -q 'password.*""' lib/database.ts; then
        echo "   ✅ database.ts: password = (خالی)"
    else
        echo "   ❌ database.ts: password دارد مقدار"
        ERRORS=$((ERRORS + 1))
    fi
fi

# ==========================================
# 6. بررسی صدای رابین/api/services/database.js
# ==========================================
echo ""
echo "6️⃣  بررسی صدای رابین/api/services/database.js..."

if [ ! -f "صدای رابین/api/services/database.js" ]; then
    echo "   ❌ صدای رابین/api/services/database.js یافت نشد!"
    ERRORS=$((ERRORS + 1))
else
    if grep -q 'user.*"root"' "صدای رابین/api/services/database.js"; then
        echo "   ✅ database.js: user = root"
    else
        echo "   ❌ database.js: user != root"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q 'password.*""' "صدای رابین/api/services/database.js"; then
        echo "   ✅ database.js: password = (خالی)"
    else
        echo "   ❌ database.js: password دارد مقدار"
        ERRORS=$((ERRORS + 1))
    fi
fi

# ==========================================
# 7. بررسی nginx configs
# ==========================================
echo ""
echo "7️⃣  بررسی nginx configs..."

# default.conf
if [ -f "nginx/default.conf" ]; then
    if grep -q "location /rabin-voice/" nginx/default.conf; then
        echo "   ✅ nginx/default.conf: Rabin Voice location دارد"
    else
        echo "   ❌ nginx/default.conf: Rabin Voice location ندارد"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ⚠️  nginx/default.conf یافت نشد"
    WARNINGS=$((WARNINGS + 1))
fi

# simple.conf
if [ -f "nginx/simple.conf" ]; then
    if grep -q "location /rabin-voice/" nginx/simple.conf; then
        echo "   ✅ nginx/simple.conf: Rabin Voice location دارد"
    else
        echo "   ❌ nginx/simple.conf: Rabin Voice location ندارد"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ⚠️  nginx/simple.conf یافت نشد"
    WARNINGS=$((WARNINGS + 1))
fi

# ==========================================
# 8. بررسی صدای رابین/start.sh
# ==========================================
echo ""
echo "8️⃣  بررسی صدای رابین/start.sh..."

if [ ! -f "صدای رابین/start.sh" ]; then
    echo "   ❌ صدای رابین/start.sh یافت نشد!"
    ERRORS=$((ERRORS + 1))
else
    if grep -q "lsof.*3001" "صدای رابین/start.sh"; then
        echo "   ✅ start.sh: Kill پورت 3001 دارد"
    else
        echo "   ⚠️  start.sh: Kill پورت 3001 ندارد"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    if grep -q "wait.*API_PID" "صدای رابین/start.sh"; then
        echo "   ✅ start.sh: فقط Express API (بدون Next.js)"
    else
        echo "   ⚠️  start.sh: شاید هنوز Next.js داشته باشد"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

# ==========================================
# 9. بررسی database/init.sql
# ==========================================
echo ""
echo "9️⃣  بررسی database/init.sql..."

if [ -f "database/init.sql" ]; then
    if grep -q "CREATE USER" database/init.sql; then
        echo "   ⚠️  init.sql: هنوز CREATE USER دارد (باید ساده باشد)"
        WARNINGS=$((WARNINGS + 1))
    else
        echo "   ✅ init.sql: ساده است (بدون CREATE USER)"
    fi
else
    echo "   ⚠️  database/init.sql یافت نشد"
    WARNINGS=$((WARNINGS + 1))
fi

# ==========================================
# 10. بررسی کانتینرهای در حال اجرا
# ==========================================
echo ""
echo "🔟 بررسی کانتینرهای در حال اجرا..."

if command -v docker &> /dev/null; then
    if docker ps | grep -q "crm_mysql\|crm-mysql"; then
        echo "   ✅ MySQL container در حال اجرا"
        
        # تست اتصال
        MYSQL_CONTAINER=$(docker ps --format '{{.Names}}' | grep -E 'crm_mysql|crm-mysql' | head -1)
        if docker exec "$MYSQL_CONTAINER" mariadb -u root -e "SELECT 1;" >/dev/null 2>&1; then
            echo "   ✅ اتصال به MySQL با root بدون پسورد موفق"
        else
            echo "   ❌ اتصال به MySQL ناموفق"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo "   ⚠️  MySQL container در حال اجرا نیست"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    if docker ps | grep -q "crm_rabin_voice\|crm-rabin-voice"; then
        echo "   ✅ Rabin Voice container در حال اجرا"
        
        # بررسی خطای پورت
        RABIN_CONTAINER=$(docker ps --format '{{.Names}}' | grep -E 'crm_rabin_voice|crm-rabin-voice' | head -1)
        if docker logs "$RABIN_CONTAINER" 2>&1 | tail -20 | grep -q "EADDRINUSE"; then
            echo "   ❌ خطای EADDRINUSE در Rabin Voice"
            ERRORS=$((ERRORS + 1))
        else
            echo "   ✅ Rabin Voice بدون خطای پورت"
        fi
    else
        echo "   ⚠️  Rabin Voice container در حال اجرا نیست"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    if docker ps | grep -q "crm_nextjs\|crm-nextjs"; then
        echo "   ✅ NextJS container در حال اجرا"
    else
        echo "   ⚠️  NextJS container در حال اجرا نیست"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    if docker ps | grep -q "crm_phpmyadmin\|crm-phpmyadmin"; then
        echo "   ✅ phpMyAdmin container در حال اجرا"
    else
        echo "   ⚠️  phpMyAdmin container در حال اجرا نیست"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    if docker ps | grep -q "crm_nginx\|crm-nginx"; then
        echo "   ✅ Nginx container در حال اجرا"
    else
        echo "   ⚠️  Nginx container در حال اجرا نیست"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "   ⚠️  Docker command یافت نشد"
    WARNINGS=$((WARNINGS + 1))
fi

# ==========================================
# نتیجه نهایی
# ==========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 نتیجه نهایی"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   ❌ خطاها: $ERRORS"
echo "   ⚠️  هشدارها: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo "✅ همه چیز آماده برای دیپلوی است!"
    echo ""
    echo "🚀 مراحل بعدی:"
    echo "   1. bash deploy-server.sh"
    echo "   2. بررسی لاگ‌ها: docker-compose logs -f"
    echo ""
    exit 0
else
    echo "❌ $ERRORS خطا یافت شد!"
    echo ""
    echo "🔧 لطفاً خطاها را اصلاح کنید و دوباره تلاش کنید."
    echo ""
    if [ $WARNINGS -gt 0 ]; then
        echo "⚠️  $WARNINGS هشدار نیز وجود دارد که ممکن است نیاز به بررسی داشته باشند."
        echo ""
    fi
    exit 1
fi
