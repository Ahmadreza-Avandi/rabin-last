#!/bin/bash

# ===========================================
# 🚀 اسکریپت تنظیم خودکار ENV برای Production
# ===========================================
# این اسکریپت تمام فایل‌های ENV مورد نیاز را ایجاد می‌کند
# ===========================================

set -e

echo "🚀 شروع تنظیم خودکار ENV برای Production..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ===========================================
# تنظیمات ثابت (بدون سوال از کاربر)
# ===========================================

echo "📝 استفاده از تنظیمات پیش‌فرض..."
echo ""

# تنظیمات ثابت
DOMAIN="crm.robintejarat.com"
DB_PASSWORD="1234"
EMAIL_USER="ahmadrezaavandi@gmail.com"
EMAIL_PASS="lqjp rnqy rnqy lqjp"

echo "   🌐 دامنه: $DOMAIN"
echo "   🔐 پسورد دیتابیس: $DB_PASSWORD"
echo "   📧 ایمیل: $EMAIL_USER"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ===========================================
# تولید کلیدهای امنیتی تصادفی
# ===========================================

echo "🔐 تولید کلیدهای امنیتی تصادفی..."

JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
NEXTAUTH_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

echo "   ✅ JWT_SECRET: ${JWT_SECRET:0:10}..."
echo "   ✅ NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:0:10}..."
echo ""

# ===========================================
# ایجاد فایل .env در ریشه پروژه
# ===========================================

echo "📁 ایجاد فایل .env در ریشه پروژه..."

cat > .env << EOF
# ===========================================
# 🚀 CRM System - Production Environment
# ===========================================
# تولید شده توسط: setup-production-env.sh
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
# برای encrypt/decrypt کردن tenant database passwords
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
# 🎤 Rabin Voice Assistant Configuration
# ===========================================
# این متغیرها برای fallback هستند
# کلید اصلی در صدای رابین/.env قرار دارد
RABIN_VOICE_OPENROUTER_API_KEY=WILL_BE_SET_IN_RABIN_VOICE_ENV
RABIN_VOICE_OPENROUTER_MODEL=anthropic/claude-3-haiku
RABIN_VOICE_TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech
RABIN_VOICE_LOG_LEVEL=INFO

# Alternative names for compatibility
OPENROUTER_API_KEY=WILL_BE_SET_IN_RABIN_VOICE_ENV
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

# Audio Settings (for VPS)
AUDIO_ENABLED=false
VPS_MODE=true
FALLBACK_TO_MANUAL_INPUT=true

# Express Email Service (if needed)
EXPRESS_EMAIL_SERVICE_URL=http://localhost:3001

# ===========================================
# 🐳 Docker Specific
# ===========================================
PORT=3000
HOSTNAME=0.0.0.0
EOF

echo "   ✅ فایل .env ایجاد شد"
echo ""

# ===========================================
# کپی .env به .env.server
# ===========================================

echo "📁 کپی .env به .env.server..."
cp .env .env.server
echo "   ✅ فایل .env.server ایجاد شد"
echo ""

# ===========================================
# ایجاد فایل .env برای صدای رابین
# ===========================================

echo "📁 ایجاد فایل .env برای صدای رابین..."

# ایجاد پوشه اگر وجود ندارد
mkdir -p "صدای رابین"

cat > "صدای رابین/.env" << 'EOF'
# ===========================================
# 🎤 Rabin Voice Assistant - Production Environment
# ===========================================
# ⚠️ مهم: کلید OpenRouter API را باید دستی تنظیم کنید!
# ===========================================

# ===========================================
# 🤖 OpenRouter AI Configuration (الزامی!)
# ===========================================
# ⚠️ این کلید را باید از https://openrouter.ai/keys دریافت کنید
# و در اینجا قرار دهید (با sk-or-v1- شروع می‌شود)

OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE
RABIN_VOICE_OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE

# مدل هوش مصنوعی (اختیاری - پیش‌فرض: claude-3-haiku)
OPENROUTER_MODEL=anthropic/claude-3-haiku
RABIN_VOICE_OPENROUTER_MODEL=anthropic/claude-3-haiku

# ===========================================
# 🔊 TTS (Text-to-Speech) Configuration
# ===========================================
TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech
RABIN_VOICE_TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech

# ===========================================
# 🗄️ Database Configuration
# ===========================================
DATABASE_HOST=mysql
DATABASE_PORT=3306
DATABASE_USER=crm_app_user
DATABASE_PASSWORD=1234
DATABASE_NAME=crm_system

# ===========================================
# 🔧 Application Settings
# ===========================================
NODE_ENV=production
PORT=3001
LOG_LEVEL=INFO
RABIN_VOICE_LOG_LEVEL=INFO
EOF

# جایگزینی پسورد دیتابیس
sed -i "s/DATABASE_PASSWORD=1234/DATABASE_PASSWORD=${DB_PASSWORD}/g" "صدای رابین/.env"

echo "   ✅ فایل صدای رابین/.env ایجاد شد"
echo ""

# ===========================================
# نمایش پیام هشدار برای OpenRouter API Key
# ===========================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  مهم: کلید OpenRouter API را باید دستی تنظیم کنید!"
echo ""
echo "📝 مراحل:"
echo ""
echo "1️⃣  برو به: https://openrouter.ai/keys"
echo "2️⃣  یک API Key جدید بساز"
echo "3️⃣  کلید را کپی کن (شبیه: sk-or-v1-...)"
echo "4️⃣  فایل زیر را ویرایش کن:"
echo ""
echo "   nano \"صدای رابین/.env\""
echo ""
echo "5️⃣  این خطوط را پیدا کن و کلید واقعی را جایگزین کن:"
echo ""
echo "   OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE"
echo "   RABIN_VOICE_OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ===========================================
# ایجاد اسکریپت کمکی برای تنظیم API Key
# ===========================================

cat > "set-openrouter-key.sh" << 'EOF'
#!/bin/bash

echo "🔑 تنظیم OpenRouter API Key..."
echo ""

read -p "لطفاً OpenRouter API Key خود را وارد کنید: " API_KEY

if [ -z "$API_KEY" ]; then
    echo "❌ کلید وارد نشد!"
    exit 1
fi

if [[ ! $API_KEY == sk-or-v1-* ]]; then
    echo "⚠️  هشدار: کلید باید با sk-or-v1- شروع شود"
    read -p "آیا مطمئن هستید که می‌خواهید ادامه دهید؟ (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# تنظیم در فایل صدای رابین/.env
if [ -f "صدای رابین/.env" ]; then
    sed -i "s|OPENROUTER_API_KEY=.*|OPENROUTER_API_KEY=${API_KEY}|g" "صدای رابین/.env"
    sed -i "s|RABIN_VOICE_OPENROUTER_API_KEY=.*|RABIN_VOICE_OPENROUTER_API_KEY=${API_KEY}|g" "صدای رابین/.env"
    echo "✅ کلید در صدای رابین/.env تنظیم شد"
else
    echo "❌ فایل صدای رابین/.env یافت نشد!"
    exit 1
fi

# تنظیم در فایل .env ریشه (برای fallback)
if [ -f ".env" ]; then
    sed -i "s|OPENROUTER_API_KEY=.*|OPENROUTER_API_KEY=${API_KEY}|g" .env
    sed -i "s|RABIN_VOICE_OPENROUTER_API_KEY=.*|RABIN_VOICE_OPENROUTER_API_KEY=${API_KEY}|g" .env
    echo "✅ کلید در .env تنظیم شد"
fi

echo ""
echo "🎉 کلید با موفقیت تنظیم شد!"
echo ""
echo "🔍 بررسی:"
grep "OPENROUTER_API_KEY=" "صدای رابین/.env" | sed 's/=.*/=***/'
echo ""
EOF

chmod +x set-openrouter-key.sh

echo "✅ اسکریپت کمکی ایجاد شد: set-openrouter-key.sh"
echo ""

# ===========================================
# خلاصه نهایی
# ===========================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ تنظیمات ENV با موفقیت ایجاد شد!"
echo ""
echo "📁 فایل‌های ایجاد شده:"
echo "   ✅ .env (ریشه پروژه)"
echo "   ✅ .env.server (ریشه پروژه)"
echo "   ✅ صدای رابین/.env"
echo "   ✅ set-openrouter-key.sh (اسکریپت کمکی)"
echo ""
echo "📋 تنظیمات:"
echo "   🌐 دامنه: ${DOMAIN}"
echo "   🔐 پسورد دیتابیس: ${DB_PASSWORD}"
echo "   📧 ایمیل: ${EMAIL_USER}"
echo "   🔑 JWT Secret: ${JWT_SECRET:0:10}..."
echo "   🔑 NextAuth Secret: ${NEXTAUTH_SECRET:0:10}..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 مراحل بعدی:"
echo ""
echo "1️⃣  تنظیم OpenRouter API Key:"
echo "   bash set-openrouter-key.sh"
echo ""
echo "2️⃣  بررسی تنظیمات:"
echo "   bash check-env-before-deploy.sh"
echo ""
echo "3️⃣  Deploy:"
echo "   bash deploy-server.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ موفق باشید!"
echo ""
