#!/bin/bash

# ===========================================
# 🔍 اسکریپت بررسی ENV قبل از Deploy
# ===========================================

echo "🔍 بررسی تنظیمات ENV قبل از Deploy..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ERRORS=0
WARNINGS=0

# ===========================================
# بررسی فایل .env در ریشه
# ===========================================
echo "1️⃣  بررسی .env در ریشه پروژه..."

if [ ! -f ".env" ]; then
    echo "   ❌ فایل .env یافت نشد!"
    echo "   💡 راه‌حل: cp .env.unified .env"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ فایل .env موجود است"
    
    # بررسی متغیرهای مهم
    if ! grep -q "^DATABASE_PASSWORD=" .env || grep -q "^DATABASE_PASSWORD=$" .env; then
        echo "   ⚠️  DATABASE_PASSWORD خالی است"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    if ! grep -q "^JWT_SECRET=" .env; then
        echo "   ❌ JWT_SECRET تنظیم نشده"
        ERRORS=$((ERRORS + 1))
    fi
    
    if ! grep -q "^NEXTAUTH_SECRET=" .env; then
        echo "   ❌ NEXTAUTH_SECRET تنظیم نشده"
        ERRORS=$((ERRORS + 1))
    fi
    
    if ! grep -q "^NEXTAUTH_URL=" .env; then
        echo "   ⚠️  NEXTAUTH_URL تنظیم نشده"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

echo ""

# ===========================================
# بررسی فایل .env در صدای رابین
# ===========================================
echo "2️⃣  بررسی .env در صدای رابین..."

if [ ! -f "صدای رابین/.env" ]; then
    echo "   ❌ فایل صدای رابین/.env یافت نشد!"
    echo "   💡 راه‌حل:"
    echo "      cd 'صدای رابین'"
    echo "      bash setup-env.sh"
    echo "      cd .."
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ فایل صدای رابین/.env موجود است"
    
    # بررسی OpenRouter API Key
    OPENROUTER_KEY=$(grep "^OPENROUTER_API_KEY=" "صدای رابین/.env" | cut -d= -f2-)
    RABIN_KEY=$(grep "^RABIN_VOICE_OPENROUTER_API_KEY=" "صدای رابین/.env" | cut -d= -f2-)
    
    if [[ "$OPENROUTER_KEY" == "YOUR_OPENROUTER_API_KEY_HERE" ]] || [ -z "$OPENROUTER_KEY" ]; then
        echo "   ⚠️  OPENROUTER_API_KEY تنظیم نشده (ضروری برای عملکرد AI)"
        echo "   💡 باید درخواست OpenRouter API Key را جایگزین کنید"
        WARNINGS=$((WARNINGS + 1))
    elif [[ "$OPENROUTER_KEY" == sk-or-v1-* ]]; then
        echo "   ✅ OPENROUTER_API_KEY تنظیم شده (sk-or-v1-***)"
    else
        echo "   ⚠️  OPENROUTER_API_KEY ممکنه نامعتبر باشد"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    if [[ "$RABIN_KEY" == "YOUR_OPENROUTER_API_KEY_HERE" ]] || [ -z "$RABIN_KEY" ]; then
        echo "   ⚠️  RABIN_VOICE_OPENROUTER_API_KEY تنظیم نشده"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

echo ""

# ===========================================
# بررسی .gitignore
# ===========================================
echo "3️⃣  بررسی .gitignore..."

if [ ! -f ".gitignore" ]; then
    echo "   ⚠️  فایل .gitignore یافت نشد"
    WARNINGS=$((WARNINGS + 1))
else
    if ! grep -q "^\.env$" .gitignore; then
        echo "   ⚠️  .env در .gitignore نیست"
        echo "   💡 راه‌حل: echo '.env' >> .gitignore"
        WARNINGS=$((WARNINGS + 1))
    else
        echo "   ✅ .env در .gitignore است"
    fi
fi

if [ -f "صدای رابین/.gitignore" ]; then
    if ! grep -q "^\.env$" "صدای رابین/.gitignore"; then
        echo "   ⚠️  .env در صدای رابین/.gitignore نیست"
        WARNINGS=$((WARNINGS + 1))
    else
        echo "   ✅ .env در صدای رابین/.gitignore است"
    fi
fi

echo ""

# ===========================================
# بررسی Docker
# ===========================================
echo "4️⃣  بررسی Docker..."

if ! command -v docker &> /dev/null; then
    echo "   ❌ Docker نصب نیست"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ Docker نصب است"
    
    if ! docker ps &> /dev/null; then
        echo "   ⚠️  Docker در حال اجرا نیست"
        WARNINGS=$((WARNINGS + 1))
    else
        echo "   ✅ Docker در حال اجرا است"
    fi
fi

if ! command -v docker-compose &> /dev/null; then
    echo "   ❌ docker-compose نصب نیست"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ docker-compose نصب است"
fi

echo ""

# ===========================================
# بررسی فایل‌های مورد نیاز
# ===========================================
echo "5️⃣  بررسی فایل‌های مورد نیاز..."

REQUIRED_FILES=(
    "docker-compose.yml"
    "Dockerfile"
    "package.json"
    "صدای رابین/Dockerfile"
    "صدای رابین/package.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "   ❌ فایل $file یافت نشد"
        ERRORS=$((ERRORS + 1))
    fi
done

if [ $ERRORS -eq 0 ]; then
    echo "   ✅ همه فایل‌های مورد نیاز موجود است"
fi

echo ""

# ===========================================
# نتیجه نهایی
# ===========================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ همه چیز آماده است! می‌توانید deploy کنید:"
    echo ""
    echo "   bash deploy-server.sh"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  $WARNINGS هشدار یافت شد، اما می‌توانید ادامه دهید"
    echo ""
    echo "   bash deploy-server.sh"
    echo ""
    exit 0
else
    echo "❌ $ERRORS خطا و $WARNINGS هشدار یافت شد"
    echo ""
    echo "لطفاً خطاها را برطرف کنید و دوباره تلاش کنید."
    echo ""
    echo "📖 راهنما:"
    echo "   cat DEPLOYMENT-ENV-SETUP.md"
    echo ""
    exit 1
fi
