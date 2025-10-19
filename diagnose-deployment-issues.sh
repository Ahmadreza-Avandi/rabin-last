#!/bin/bash

# 🔍 Diagnostic Script - مشخص کن که مشکل کجاست!

set +e  # ادامه حتی اگر خطا رخ بدهد

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🔍 CRM & Rabin Voice Deployment Diagnostic Tool          ║"
echo "║  تشخیص مشکلات Deployment                                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

FAILED=0
PASSED=0

# =================== تابع برای چاپ نتیجه ===================
check_result() {
    if [ $1 -eq 0 ]; then
        echo "   ✅ PASSED"
        ((PASSED++))
    else
        echo "   ❌ FAILED"
        ((FAILED++))
    fi
}

# =================== بررسی فایل‌های محیط ===================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 بررسی فایل‌های محیط (Environment Files)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "1️⃣  فایل .env در ریشه پروژه: "
[ -f .env ]
check_result $?

echo -n "2️⃣  فایل .env.server موجود: "
[ -f .env.server ]
check_result $?

echo -n "3️⃣  فایل صدای رابین/.env موجود: "
[ -f "صدای رابین/.env" ]
check_result $?

echo ""

# =================== بررسی Database Password ===================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  بررسی تنظیمات Database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "4️⃣  DATABASE_PASSWORD تنظیم شده در .env: "
grep -q "DATABASE_PASSWORD=" .env
check_result $?

echo -n "5️⃣  DATABASE_USER = crm_app_user: "
grep -q "DATABASE_USER=.*crm_app_user" .env
check_result $?

echo -n "6️⃣  DATABASE_NAME = crm_system: "
grep -q "DATABASE_NAME=.*crm_system" .env
check_result $?

echo -n "7️⃣  docker-compose.yml موجود: "
[ -f docker-compose.yml ]
check_result $?

echo ""

# =================== بررسی OpenRouter API Key ===================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 بررسی OpenRouter API Key"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "OPENROUTER_API_KEY=" "صدای رابین/.env"; then
    RABIN_KEY=$(grep "OPENROUTER_API_KEY=" "صدای رابین/.env" | cut -d'"' -f2 | cut -d'=' -f2)
    if [[ $RABIN_KEY == sk-or-v1-* ]]; then
        echo "✅ 8️⃣  Rabin Voice OpenRouter API Key: صحیح ($RABIN_KEY)"
        ((PASSED++))
    else
        echo "❌ 8️⃣  Rabin Voice OpenRouter API Key: اشتباه (نباید خالی یا غلط باشد)"
        ((FAILED++))
    fi
else
    echo "❌ 8️⃣  Rabin Voice OpenRouter API Key: یافت نشد"
    ((FAILED++))
fi

echo -n "9️⃣  Root .env OpenRouter Key تنظیم شده: "
grep -q "OPENROUTER_API_KEY.*sk-or-v1-" .env
check_result $?

echo ""

# =================== بررسی فایل‌های Docker ===================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐳 بررسی Docker Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "🔟 صدای رابین/Dockerfile موجود: "
[ -f "صدای رابین/Dockerfile" ]
check_result $?

echo -n "1️⃣1️⃣  صدای رابین/start.sh موجود: "
[ -f "صدای رابین/start.sh" ]
check_result $?

echo -n "1️⃣2️⃣  start.sh قابل اجرا است: "
[ -x "صدای رابین/start.sh" ]
check_result $?

echo -n "1️⃣3️⃣  Dockerfile روی start.sh اشاره دارد: "
grep -q "CMD.*start.sh" "صدای رابین/Dockerfile"
check_result $?

echo ""

# =================== بررسی Deployment Scripts ===================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 بررسی Deployment Scripts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "1️⃣4️⃣  deploy-server.sh موجود: "
[ -f deploy-server.sh ]
check_result $?

echo -n "1️⃣5️⃣  nginx/active.conf routing برای rabin-voice: "
grep -q "/rabin-voice/" nginx/active.conf 2>/dev/null || grep -q "rabin-voice" deploy-server.sh
check_result $?

echo ""

# =================== بررسی Database Files ===================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💾 بررسی Database Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "1️⃣6️⃣  database/crm_system.sql موجود: "
[ -f "database/crm_system.sql" ] || [ -f "crm_system.sql" ]
check_result $?

echo ""

# =================== خلاصه نتایج ===================
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  📊 خلاصه نتایج                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "   ✅ موفق: $PASSED"
echo "   ❌ ناموفق: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ تمام چک‌ها موفق بودند! می‌تونید deploy کنید."
    echo ""
    echo "📝 مراحل بعدی:"
    echo "   1. bash deploy-server.sh"
    exit 0
else
    echo "❌ تعدادی از چک‌ها ناموفق بودند!"
    echo ""
    echo "🔧 راه‌حل‌های پیشنهادی:"
    echo ""
    
    if ! [ -f .env ]; then
        echo "   • فایل .env را ایجاد کنید:"
        echo "     cp .env.server .env"
        echo ""
    fi
    
    if ! grep -q "OPENROUTER_API_KEY.*sk-or-v1-" "صدای رابین/.env"; then
        echo "   • OpenRouter API Key را تنظیم کنید:"
        echo "     1. از openrouter.ai/keys کپی کنید"
        echo "     2. اجرا کنید: nano صدای رابین/.env"
        echo "     3. OPENROUTER_API_KEY را تنظیم کنید"
        echo ""
    fi
    
    if [ $FAILED -gt 0 ]; then
        echo "   • مجدد اجرا کنید: bash diagnose-deployment-issues.sh"
    fi
    
    exit 1
fi