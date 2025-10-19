#!/bin/bash

# ===========================================
# 🚀 اسکریپت تنظیم کامل و خودکار ENV
# ===========================================
# این اسکریپت همه چیز را خودکار تنظیم می‌کند
# ===========================================

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 تنظیم خودکار کامل ENV برای CRM و صدای رابین"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ===========================================
# تنظیمات ثابت
# ===========================================

DOMAIN="crm.robintejarat.com"
DB_PASSWORD="1234"
EMAIL_USER="ahmadrezaavandi@gmail.com"
EMAIL_PASS="lqjp rnqy rnqy lqjp"

echo "📋 تنظیمات:"
echo "   🌐 دامنه: $DOMAIN"
echo "   🔐 پسورد دیتابیس: $DB_PASSWORD"
echo "   📧 ایمیل: $EMAIL_USER"
echo ""

# ===========================================
# تولید کلیدهای امنیتی
# ===========================================

echo "🔐 تولید کلیدهای امنیتی تصادفی..."

JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
NEXTAUTH_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

echo "   ✅ JWT_SECRET: ${JWT_SECRET:0:10}..."
echo "   ✅ NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:0:10}..."
echo ""

# ===========================================
# مرحله 1: ایجاد .env در ریشه پروژه
# ===========================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 مرحله 1: ایجاد .env در ریشه پروژه..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat > .env << EOF
# ===========================================
# 🚀 CRM System - Production Environment
# ===========================================
# تولید شده توسط: setup-all-env.sh
# تاریخ: $(date)
# ===========================================

# ===========================================
# 🌐 Application Configuration
# ===========================================
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://${DOMAIN}

# NextAuth Configuration
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=https://${DOMAIN}

# JWT Configuration
JWT_SECRET=${JWT_SECRET}

# ===========================================
# 🗄️ Database Configuration (Master Database)
# ===========================================
# برای SaaS Master Database
MASTER_DB_HOST=mysql
MASTER_DB_PORT=3306
MASTER_DB_USER=root
MASTER_DB_PASSWORD=

# برای Tenant Databases و Legacy
DATABASE_HOST=mysql
DATABASE_PORT=3306
DATABASE_USER=crm_app_user
DATABASE_PASSWORD=${DB_PASSWORD}
DATABASE_NAME=crm_system
DATABASE_URL=mysql://crm_app_user:${DB_PASSWORD}@mysql:3306/crm_system

# ===========================================
# 🔐 Encryption & Security
# ===========================================
DB_ENCRYPTION_KEY=0329f3e3b5cd43ee84e81b2799f778c6d3b7d774f1a54950b9f7efc9ab2708ac

# Session & Security
SESSION_TIMEOUT=24h
MAX_LOGIN_ATTEMPTS=5
MIN_PASSWORD_LENGTH=8
REQUIRE_STRONG_PASSWORD=true

# ===========================================
# 📧 Email Configuration
# ===========================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=${EMAIL_USER}
EMAIL_PASS=${EMAIL_PASS}
EMAIL_FROM_NAME=CRM System
EMAIL_FROM_ADDRESS=noreply@${DOMAIN}

# SMTP variables (for compatibility)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=${EMAIL_USER}
SMTP_PASS=${EMAIL_PASS}

# ===========================================
# 🌐 Google OAuth Configuration
# ===========================================
GOOGLE_CLIENT_ID=264694321658-algdd3fa5u8t3pgsvv610cg4ei8m653h.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REFRESH_TOKEN=1//09kpx7rlYRlgrCgYIARAAGAkSNwF-L9IrEJNjUA0K6Afs9YOeD6kXkT-3now0m0cUNR6lGnENf8mgaf8Z1kdFES4XyEsgAUCQneM

# ===========================================
# 🎤 Rabin Voice (Fallback - اصلی در صدای رابین/.env)
# ===========================================
RABIN_VOICE_OPENROUTER_API_KEY=WILL_BE_SET_MANUALLY
RABIN_VOICE_OPENROUTER_MODEL=anthropic/claude-3-haiku
RABIN_VOICE_TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech
RABIN_VOICE_LOG_LEVEL=INFO

OPENROUTER_API_KEY=WILL_BE_SET_MANUALLY
OPENROUTER_MODEL=anthropic/claude-3-haiku
TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech
LOG_LEVEL=INFO

# ===========================================
# 📱 SMS Configuration
# ===========================================
SMS_ENABLED=true
SMS_PROVIDER=kavenegar
KAVENEGAR_API_KEY=your_kavenegar_api_key
KAVENEGAR_SENDER=10008663

# ===========================================
# 👤 Admin Configuration
# ===========================================
CEO_EMAIL=admin@${DOMAIN}
ADMIN_EMAIL=admin@${DOMAIN}
SUPPORT_EMAIL=support@${DOMAIN}
COMPANY_NAME=شرکت تجارت رابین
COMPANY_PHONE=
COMPANY_ADDRESS=تهران، ایران

# ===========================================
# 💾 Backup Configuration
# ===========================================
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
BACKUP_LOCAL_PATH=/var/backups/crm

# ===========================================
# 🚀 Performance Configuration
# ===========================================
NODE_OPTIONS=--max-old-space-size=1024
CACHE_ENABLED=true
CACHE_TTL=3600
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# ===========================================
# 📁 File Upload Configuration
# ===========================================
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# ===========================================
# 🔧 Production Settings
# ===========================================
DEBUG=false
NEXT_TELEMETRY_DISABLED=1
AUDIO_ENABLED=false
VPS_MODE=true
FALLBACK_TO_MANUAL_INPUT=true
EXPRESS_EMAIL_SERVICE_URL=http://localhost:3001

# ===========================================
# 🐳 Docker Specific
# ===========================================
PORT=3000
HOSTNAME=0.0.0.0
EOF

echo "   ✅ .env ایجاد شد"

# کپی به .env.server
cp .env .env.server
echo "   ✅ .env.server ایجاد شد"
echo ""

# ===========================================
# مرحله 2: ایجاد .env برای صدای رابین
# ===========================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 مرحله 2: ایجاد .env برای صدای رابین..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ایجاد پوشه اگر وجود ندارد
mkdir -p "صدای رابین"

cat > "صدای رابین/.env" << EOF
# ===========================================
# 🎤 Rabin Voice Assistant - Production Environment
# ===========================================
# تولید شده توسط: setup-all-env.sh
# تاریخ: $(date)
# ===========================================

# ===========================================
# 🤖 OpenRouter AI Configuration
# ===========================================
# ⚠️ این کلید را باید دستی تنظیم کنید!
# دریافت از: https://openrouter.ai/keys

OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE
RABIN_VOICE_OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE

# مدل هوش مصنوعی
OPENROUTER_MODEL=anthropic/claude-3-haiku
RABIN_VOICE_OPENROUTER_MODEL=anthropic/claude-3-haiku

# ===========================================
# 🔊 TTS Configuration
# ===========================================
TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech
RABIN_VOICE_TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech

# ===========================================
# 🗄️ Database Configuration
# ===========================================
DATABASE_HOST=mysql
DATABASE_PORT=3306
DATABASE_USER=crm_app_user
DATABASE_PASSWORD=${DB_PASSWORD}
DATABASE_NAME=crm_system

# ===========================================
# 🔧 Application Settings
# ===========================================
NODE_ENV=production
PORT=3001
LOG_LEVEL=INFO
RABIN_VOICE_LOG_LEVEL=INFO
EOF

echo "   ✅ صدای رابین/.env ایجاد شد"
echo ""

# ===========================================
# مرحله 3: بررسی فایل‌ها
# ===========================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 مرحله 3: بررسی فایل‌های ایجاد شده..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ERRORS=0

# بررسی .env
if [ -f ".env" ]; then
    echo "   ✅ .env موجود است"
    
    # بررسی متغیرهای مهم
    if grep -q "^DATABASE_PASSWORD=${DB_PASSWORD}" .env; then
        echo "   ✅ DATABASE_PASSWORD تنظیم شده"
    else
        echo "   ❌ DATABASE_PASSWORD تنظیم نشده"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q "^JWT_SECRET=" .env; then
        echo "   ✅ JWT_SECRET تنظیم شده"
    else
        echo "   ❌ JWT_SECRET تنظیم نشده"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q "^NEXTAUTH_SECRET=" .env; then
        echo "   ✅ NEXTAUTH_SECRET تنظیم شده"
    else
        echo "   ❌ NEXTAUTH_SECRET تنظیم نشده"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ❌ .env یافت نشد"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# بررسی صدای رابین/.env
if [ -f "صدای رابین/.env" ]; then
    echo "   ✅ صدای رابین/.env موجود است"
    
    if grep -q "^DATABASE_PASSWORD=${DB_PASSWORD}" "صدای رابین/.env"; then
        echo "   ✅ DATABASE_PASSWORD تنظیم شده"
    else
        echo "   ❌ DATABASE_PASSWORD تنظیم نشده"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q "^OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE" "صدای رابین/.env"; then
        echo "   ⚠️  OPENROUTER_API_KEY هنوز تنظیم نشده (باید دستی تنظیم شود)"
    fi
else
    echo "   ❌ صدای رابین/.env یافت نشد"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ===========================================
# نتیجه نهایی
# ===========================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo "✅ همه فایل‌های ENV با موفقیت ایجاد شدند!"
    echo ""
    echo "📁 فایل‌های ایجاد شده:"
    echo "   ✅ .env (ریشه پروژه)"
    echo "   ✅ .env.server (ریشه پروژه)"
    echo "   ✅ صدای رابین/.env"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "⚠️  مهم: حالا باید OpenRouter API Key را تنظیم کنید!"
    echo ""
    echo "📝 مراحل بعدی:"
    echo ""
    echo "1️⃣  دریافت OpenRouter API Key:"
    echo "   - برو به: https://openrouter.ai/keys"
    echo "   - Create New Key"
    echo "   - کپی کن (شبیه: sk-or-v1-...)"
    echo ""
    echo "2️⃣  ویرایش فایل صدای رابین/.env:"
    echo "   nano \"صدای رابین/.env\""
    echo ""
    echo "   این خطوط را پیدا کن:"
    echo "   OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE"
    echo "   RABIN_VOICE_OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE"
    echo ""
    echo "   و کلید واقعی را جایگزین کن"
    echo ""
    echo "3️⃣  بررسی تنظیمات:"
    echo "   bash check-env-before-deploy.sh"
    echo ""
    echo "4️⃣  Deploy:"
    echo "   bash deploy-server.sh"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "✨ موفق باشید!"
    echo ""
    exit 0
else
    echo "❌ $ERRORS خطا در ایجاد فایل‌ها"
    echo ""
    echo "لطفاً خطاها را بررسی کنید و دوباره تلاش کنید."
    echo ""
    exit 1
fi
