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

# تولید پسورد قوی برای MySQL
# استفاده از پسورد موجود یا ایجاد پسورد جدید
if [ -z "$DB_PASSWORD" ]; then
    # اگر فایل .env موجود است، پسورد قدیمی را استخراج کنید
    if [ -f ".env" ]; then
        DB_PASSWORD=$(grep "^DATABASE_PASSWORD=" .env | cut -d'=' -f2 | tr -d ' ')
    fi
    
    # اگر هنوز خالی است، پسورد جدید ایجاد کنید
    if [ -z "$DB_PASSWORD" ]; then
        # پسورد 24 کاراکتری شامل حروف بزرگ، کوچک، اعداد و نمادها
        DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-24)
        echo "🔐 پسورد جدید دیتابیس ایجاد شد (خودکار)"
    fi
fi

EMAIL_USER="ahmadrezaavandi@gmail.com"
EMAIL_PASS="lqjp rnqy rnqy lqjp"

echo "📋 تنظیمات:"
echo "   🌐 دامنه: $DOMAIN"
echo "   🔐 پسورد دیتابیس: ${DB_PASSWORD:0:8}****** (پسورد محفوظ شد)"
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

# بررسی و بک‌آپ .env موجود اگر داشت
if [ -f ".env" ]; then
    echo "   ⚠️  .env موجود است، پشتیبان‌گیری..."
    cp .env ".env.backup.$(date +%s)"
    echo "   ✅ بک‌آپ ایجاد شد: .env.backup.*"
fi

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
# ✅ استفاده از root بدون پسورد برای راحتی کار
MASTER_DB_HOST=mysql
MASTER_DB_PORT=3306
MASTER_DB_USER=root
MASTER_DB_PASSWORD=

# برای Tenant Databases و Legacy
DATABASE_HOST=mysql
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_NAME=crm_system
DATABASE_URL=mysql://root@mysql:3306/crm_system

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
# 🌐 Google OAuth Configuration (اختیاری)
# ===========================================
# دریافت از: https://console.cloud.google.com/apis/credentials
# اگر نیاز دارید، این مقادیر را دستی تنظیم کنید
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=

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
# ⚠️  این فایل توسط deploy-server.sh مدیریت می‌شود
# ===========================================

# ===========================================
# 🤖 OpenRouter AI Configuration
# ===========================================
# ⚠️ اگر OpenRouter API Key تنظیم نشده باشد، API درخواست‌ها ناموفق خواهند بود
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

# اطمینان از اینکه DATABASE_PASSWORD به صورت صحیح آپدیت شد
if [ -n "$DB_PASSWORD" ]; then
    sed -i "s|DATABASE_PASSWORD=\${DB_PASSWORD}|DATABASE_PASSWORD=${DB_PASSWORD}|g" "صدای رابین/.env"
    echo "   ✅ DATABASE_PASSWORD در صدای رابین/.env تنظیم شد"
else
    echo "   ⚠️  DATABASE_PASSWORD در صدای رابین/.env آپدیت نشد - از deploy-server.sh استفاده کنید"
fi

echo "   ✅ صدای رابین/.env ایجاد شد"
echo ""

# ===========================================
# مرحله 2B: درخواست OpenRouter API Key
# ===========================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔑 دریافت OpenRouter API Key"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "OpenRouter API Key مورد نیاز است برای استفاده از Rabin Voice"
echo ""
echo "مراحل دریافت:"
echo "  1. برو به: https://openrouter.ai/keys"
echo "  2. اگر حساب ندارید، ثبت‌نام کنید"
echo "  3. 'Create New Key' را کلیک کنید"
echo "  4. کلید را کپی کنید (شبیه: sk-or-v1-xxxxx...)"
echo ""
read -p "آیا کلید OpenRouter API را دارید؟ (بله/خیر) [n]: " HAS_KEY

if [ "$HAS_KEY" = "بله" ] || [ "$HAS_KEY" = "yes" ] || [ "$HAS_KEY" = "y" ]; then
    read -p "OpenRouter API Key را وارد کنید: " API_KEY
    if [[ $API_KEY == sk-or-v1-* ]]; then
        # تنظیم در .env ریشه
        sed -i "s|OPENROUTER_API_KEY=WILL_BE_SET_MANUALLY|OPENROUTER_API_KEY=$API_KEY|g" .env
        sed -i "s|RABIN_VOICE_OPENROUTER_API_KEY=WILL_BE_SET_MANUALLY|RABIN_VOICE_OPENROUTER_API_KEY=$API_KEY|g" .env
        
        # تنظیم در صدای رابین/.env
        sed -i "s|OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE|OPENROUTER_API_KEY=$API_KEY|g" "صدای رابین/.env"
        sed -i "s|RABIN_VOICE_OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE|RABIN_VOICE_OPENROUTER_API_KEY=$API_KEY|g" "صدای رابین/.env"
        
        echo "   ✅ OpenRouter API Key تنظیم شد"
    else
        echo "   ❌ کلید نامعتبر است (باید با sk-or-v1- شروع شود)"
        echo "   ⚠️  لطفاً بعداً این کلید را دستی تنظیم کنید"
    fi
else
    echo ""
    echo "   ⚠️  بدون OpenRouter API Key، Rabin Voice کار نخواهد کرد"
    echo "   💡 توصیه: بعداً کلید را تنظیم کنید:"
    echo "      nano صدای رابین/.env"
    echo "      و این خطوط را ویرایش کنید:"
    echo "      OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE"
    echo "      RABIN_VOICE_OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE"
fi

echo ""

# ===========================================
# مرحله 3: آماده‌سازی فایل‌های Database
# ===========================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💾 مرحله 3: آماده‌سازی فایل‌های Database..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

mkdir -p database
mkdir -p database/migrations

# کپی فایل‌های Database اگر در جای‌های دیگر باشند
if [ -f "crm_system.sql" ]; then
    cp crm_system.sql database/crm_system.sql
    echo "   ✅ crm_system.sql کپی شد"
fi

if [ -f "saas_master.sql" ]; then
    cp saas_master.sql database/saas_master.sql
    echo "   ✅ saas_master.sql کپی شد"
fi

# بررسی در دایرکتوری دیتابیس فارسی
if [ -f "دیتابیس/crm_system.sql" ]; then
    cp "دیتابیس/crm_system.sql" database/crm_system.sql
    echo "   ✅ crm_system.sql از دیتابیس/ کپی شد"
fi

if [ -f "دیتابیس/saas_master.sql" ]; then
    cp "دیتابیس/saas_master.sql" database/saas_master.sql
    echo "   ✅ saas_master.sql از دیتابیس/ کپی شد"
fi

echo ""

# ===========================================
# مرحله 4: ایجاد دایرکتوری‌های مورد نیاز
# ===========================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 مرحله 4: ایجاد دایرکتوری‌های مورد نیاز..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

mkdir -p uploads/{documents,avatars,chat,temp}
echo "   ✅ uploads/* دایرکتوری‌ها ایجاد شدند"

mkdir -p public/uploads/{documents,avatars,chat}
echo "   ✅ public/uploads/* دایرکتوری‌ها ایجاد شدند"

mkdir -p logs
echo "   ✅ logs دایرکتوری ایجاد شد"

mkdir -p "صدای رابین/logs"
echo "   ✅ صدای رابین/logs دایرکتوری ایجاد شد"

echo ""

# ===========================================
# مرحله 5: تنظیم Permissions
# ===========================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 مرحله 5: تنظیم Permissions..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

chmod -R 755 uploads 2>/dev/null || true
chmod -R 755 public/uploads 2>/dev/null || true
chmod -R 755 logs 2>/dev/null || true
chmod -R 755 "صدای رابین/logs" 2>/dev/null || true
chmod +x deploy-server.sh 2>/dev/null || true
chmod +x "صدای رابین/start.sh" 2>/dev/null || true

echo "   ✅ Permissions تنظیم شدند"
echo ""

# ===========================================
# مرحله 6: تنظیم start.sh برای صدای رابین
# ===========================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎤 مرحله 6: تنظیم صدای رابین start.sh..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# بررسی و اصلاح start.sh اگر لازم باشد
if [ -f "صدای رابین/start.sh" ]; then
    if grep -q "node server.js" "صدای رابین/start.sh"; then
        echo "   🔧 تصحیح entry point در start.sh..."
        sed -i 's|node server\.js|node ./.next/standalone/server.js|g' "صدای رابین/start.sh"
        echo "   ✅ start.sh تصحیح شد"
    else
        echo "   ✅ start.sh آماده است"
    fi
else
    echo "   ⚠️  start.sh یافت نشد، بررسی Dockerfile..."
fi

echo ""

# ===========================================
# مرحله 7: بررسی فایل‌ها
# ===========================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 مرحله 7: بررسی فایل‌های ایجاد شده..."
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
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║  ✅ همه فایل‌های ENV با موفقیت ایجاد و تنظیم شدند!        ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "📁 فایل‌های و دایرکتوری‌های ایجاد شده:"
    echo ""
    echo "   ✅ .env (ریشه پروژه)"
    echo "   ✅ .env.server (ریشه پروژه)"
    echo "   ✅ صدای رابین/.env"
    echo "   ✅ database/ (دایرکتوری)"
    echo "   ✅ uploads/ (دایرکتوری)"
    echo "   ✅ logs/ (دایرکتوری)"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📝 مراحل بعدی برای Deploy:"
    echo ""
    echo "1️⃣  بررسی تمام تنظیمات:"
    echo "    bash diagnose-deployment-issues.sh"
    echo ""
    echo "2️⃣  اگر تمام چک‌ها pass شدند، Deploy کنید:"
    echo "    bash deploy-server.sh"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "⚠️  یادداشت مهم:"
    echo ""
    if grep -q "OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE" "صدای رابین/.env"; then
        echo "   ⚠️  هنوز OpenRouter API Key تنظیم نشده است!"
        echo ""
        echo "   اگر می‌خواهید Rabin Voice کار کند:"
        echo "     1. برو به: https://openrouter.ai/keys"
        echo "     2. کلید را دریافت کنید"
        echo "     3. اجرا کنید: nano \"صدای رابین/.env\""
        echo "     4. OPENROUTER_API_KEY و RABIN_VOICE_OPENROUTER_API_KEY را تنظیم کنید"
        echo ""
    elif grep -q "OPENROUTER_API_KEY=sk-or-v1-" "صدای رابین/.env"; then
        echo "   ✅ OpenRouter API Key موفقیت‌آمیز تنظیم شد!"
        echo ""
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "✨ سیستم آماده برای Deploy است!"
    echo ""
    exit 0
else
    echo "❌ $ERRORS خطا در ایجاد فایل‌ها"
    echo ""
    echo "لطفاً خطاها را بررسی کنید و دوباره تلاش کنید."
    echo ""
    exit 1
fi
