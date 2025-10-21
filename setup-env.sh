#!/bin/bash

# ===========================================
# 🔧 CRM Environment Setup Script
# ===========================================
# این اسکریپت فایل .env رو به درستی می‌سازه
# برای هر دو محیط لوکال و سرور
# ===========================================

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 CRM Environment Configuration Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# تشخیص محیط
echo "🔍 تشخیص محیط اجرا..."
if [ -f "/etc/hostname" ] && grep -q "id-" /etc/hostname 2>/dev/null; then
    ENVIRONMENT="server"
    echo "✅ محیط: سرور (Production)"
    DB_USER="crm_app_user"
else
    ENVIRONMENT="local"
    echo "✅ محیط: لوکال (Development)"
    DB_USER="crm_user"
fi

# پشتیبان‌گیری از .env قبلی
if [ -f ".env" ]; then
    BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"
    echo "📦 پشتیبان‌گیری از .env قبلی به: $BACKUP_FILE"
    cp .env "$BACKUP_FILE"
fi

# تولید رمزهای امن
echo ""
echo "🔐 تولید رمزهای امن..."
DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-20)
JWT_SECRET=$(openssl rand -base64 48 | tr -d "=+/")
NEXTAUTH_SECRET=$(openssl rand -base64 48 | tr -d "=+/")

echo "✅ رمزهای امن تولید شدند"

# تنظیم متغیرهای بر اساس محیط
if [ "$ENVIRONMENT" = "server" ]; then
    NODE_ENV="production"
    DATABASE_HOST="mysql"
    NEXTAUTH_URL="http://crm.robintejarat.com"
    APP_URL="https://crm.robintejarat.com"
else
    NODE_ENV="development"
    DATABASE_HOST="localhost"
    NEXTAUTH_URL="http://localhost:3000"
    APP_URL="http://localhost:3000"
fi

# ایجاد فایل .env جدید
echo ""
echo "📝 ایجاد فایل .env جدید..."

cat > .env << EOF
# ===========================================
# 🔧 CRM Environment Configuration
# ===========================================
# Generated automatically by setup-env.sh
# Environment: $ENVIRONMENT
# Date: $(date '+%Y-%m-%d %H:%M:%S')
# ===========================================

# ===========================================
# 🌍 Application Configuration
# ===========================================
NODE_ENV=$NODE_ENV
NEXT_PUBLIC_APP_URL=$APP_URL

# ===========================================
# 🗄️ Database Configuration
# ===========================================
# Database Host: 
#   - Local: localhost
#   - Docker: mysql (service name)
DATABASE_HOST=$DATABASE_HOST
DATABASE_USER=$DB_USER
DATABASE_PASSWORD=$DB_PASSWORD

# CRM System Database (دیتابیس اصلی CRM)
DATABASE_NAME=crm_system
DB_NAME=crm_system

# SaaS Master Database (دیتابیس مدیریت تنانت‌ها)
SAAS_DATABASE_NAME=saas_master

# Legacy support (برای سازگاری با کدهای قدیمی)
DB_HOST=$DATABASE_HOST
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# Database URL for Prisma/ORM (if needed)
DATABASE_URL=mysql://$DB_USER:$DB_PASSWORD@$DATABASE_HOST:3306/crm_system

# ===========================================
# 🔐 Authentication & Security
# ===========================================
# JWT Secret for token signing
JWT_SECRET=$JWT_SECRET

# NextAuth Configuration
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=$NEXTAUTH_URL

# ===========================================
# 📧 Email Configuration
# ===========================================
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS="your_app_password_here"
EMAIL_USER=your_email@gmail.com
EMAIL_PASS="your_app_password_here"

# Google OAuth 2.0 (Optional - for Gmail API)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token

# ===========================================
# 📁 File Upload Configuration
# ===========================================
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# ===========================================
# 🎤 Rabin Voice Assistant Configuration
# ===========================================
RABIN_VOICE_OPENROUTER_API_KEY=your_openrouter_api_key_here
RABIN_VOICE_OPENROUTER_MODEL=anthropic/claude-3-haiku
RABIN_VOICE_TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech
RABIN_VOICE_LOG_LEVEL=INFO

# ===========================================
# 🐳 Docker & Production Settings
# ===========================================
# Audio settings for VPS
AUDIO_ENABLED=false
VPS_MODE=true
FALLBACK_TO_MANUAL_INPUT=true

# Development bypass (only for development)
ALLOW_DEV_FALLBACK=0
EOF

echo "✅ فایل .env ایجاد شد"

# به‌روزرسانی فایل init.sql دیتابیس
echo ""
echo "🗄️ به‌روزرسانی فایل init.sql دیتابیس..."

if [ ! -d "database" ]; then
    mkdir -p database
fi

cat > database/init.sql << EOF
-- ===========================================
-- Database Initialization Script
-- Generated automatically by setup-env.sh
-- Date: $(date '+%Y-%m-%d %H:%M:%S')
-- ===========================================

-- Create CRM System Database
CREATE DATABASE IF NOT EXISTS \`crm_system\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create SaaS Master Database
CREATE DATABASE IF NOT EXISTS \`saas_master\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Drop existing users to ensure clean state
DROP USER IF EXISTS '$DB_USER'@'%';
DROP USER IF EXISTS '$DB_USER'@'localhost';
DROP USER IF EXISTS '$DB_USER'@'127.0.0.1';
DROP USER IF EXISTS '$DB_USER'@'172.%.%.%';

-- Create user with password
CREATE USER '$DB_USER'@'%' IDENTIFIED BY '$DB_PASSWORD';
CREATE USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
CREATE USER '$DB_USER'@'127.0.0.1' IDENTIFIED BY '$DB_PASSWORD';
CREATE USER '$DB_USER'@'172.%.%.%' IDENTIFIED BY '$DB_PASSWORD';

-- Grant privileges on crm_system database
GRANT ALL PRIVILEGES ON \`crm_system\`.* TO '$DB_USER'@'%';
GRANT ALL PRIVILEGES ON \`crm_system\`.* TO '$DB_USER'@'localhost';
GRANT ALL PRIVILEGES ON \`crm_system\`.* TO '$DB_USER'@'127.0.0.1';
GRANT ALL PRIVILEGES ON \`crm_system\`.* TO '$DB_USER'@'172.%.%.%';

-- Grant privileges on saas_master database
GRANT ALL PRIVILEGES ON \`saas_master\`.* TO '$DB_USER'@'%';
GRANT ALL PRIVILEGES ON \`saas_master\`.* TO '$DB_USER'@'localhost';
GRANT ALL PRIVILEGES ON \`saas_master\`.* TO '$DB_USER'@'127.0.0.1';
GRANT ALL PRIVILEGES ON \`saas_master\`.* TO '$DB_USER'@'172.%.%.%';

-- Apply changes
FLUSH PRIVILEGES;

-- Set timezone
SET time_zone = '+00:00';
EOF

echo "✅ فایل init.sql به‌روزرسانی شد"

# تست و بررسی فایل .env
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 بررسی و تست فایل .env"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# بررسی وجود متغیرهای ضروری
REQUIRED_VARS=(
    "NODE_ENV"
    "DATABASE_HOST"
    "DATABASE_USER"
    "DATABASE_PASSWORD"
    "DATABASE_NAME"
    "JWT_SECRET"
    "NEXTAUTH_SECRET"
    "NEXTAUTH_URL"
)

MISSING_VARS=0
VALID_VARS=0

for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^${var}=" .env && ! grep -q "^${var}=$" .env && ! grep -q "^${var}=your_" .env; then
        echo "✅ $var - تنظیم شده"
        VALID_VARS=$((VALID_VARS + 1))
    else
        echo "❌ $var - تنظیم نشده یا مقدار پیش‌فرض دارد"
        MISSING_VARS=$((MISSING_VARS + 1))
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# نمایش اطلاعات مهم
echo ""
echo "📋 اطلاعات مهم:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌍 محیط: $ENVIRONMENT"
echo "🗄️ Database Host: $DATABASE_HOST"
echo "👤 Database User: $DB_USER"
echo "🔑 Database Password: $DB_PASSWORD"
echo "🌐 App URL: $APP_URL"
echo ""

# نتیجه نهایی
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $MISSING_VARS -eq 0 ]; then
    echo "✅ فایل .env با موفقیت ایجاد و تست شد!"
    echo "✅ همه متغیرهای ضروری تنظیم شده‌اند"
    echo ""
    echo "⚠️  توجه: متغیرهای زیر را باید دستی تنظیم کنید:"
    echo "   - SMTP_USER و SMTP_PASS (برای ارسال ایمیل)"
    echo "   - RABIN_VOICE_OPENROUTER_API_KEY (برای دستیار صوتی)"
    echo "   - GOOGLE_CLIENT_ID و GOOGLE_CLIENT_SECRET (اختیاری)"
    echo ""
    echo "📝 برای ویرایش: nano .env"
    EXIT_CODE=0
else
    echo "⚠️  فایل .env ایجاد شد اما $MISSING_VARS متغیر نیاز به تنظیم دارد"
    echo ""
    echo "📝 لطفاً فایل .env را ویرایش کنید: nano .env"
    EXIT_CODE=1
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit $EXIT_CODE
