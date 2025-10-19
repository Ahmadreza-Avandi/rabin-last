#!/bin/bash

# ===========================================
# 🔧 اسکریپت یکپارچه‌سازی فایل‌های ENV
# ===========================================
# این اسکریپت تمام فایل‌های .env را با یک فایل واحد جایگزین می‌کند
# ===========================================

set -e

echo "🔧 شروع یکپارچه‌سازی فایل‌های ENV..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# بررسی وجود فایل unified
if [ ! -f ".env.unified" ]; then
    echo "❌ فایل .env.unified یافت نشد!"
    exit 1
fi

# پشتیبان‌گیری از فایل‌های قدیمی
echo "📦 پشتیبان‌گیری از فایل‌های قدیمی..."
BACKUP_DIR="env_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# پشتیبان‌گیری از فایل‌های موجود
for file in .env .env.local .env.server; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/"
        echo "  ✅ $file -> $BACKUP_DIR/"
    fi
done

echo ""
echo "🔄 جایگزینی فایل‌های ENV..."

# جایگزینی فایل‌های اصلی
cp .env.unified .env
echo "  ✅ .env.unified -> .env"

cp .env.unified .env.server
echo "  ✅ .env.unified -> .env.server"

# برای development، یک نسخه local هم بسازیم
cat > .env.local << 'EOF'
# ===========================================
# 🔧 Local Development Configuration
# ===========================================
# این فایل برای development محلی استفاده می‌شود
# ===========================================

NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# ===========================================
# 🗄️ Database Configuration (Local)
# ===========================================
MASTER_DB_HOST=localhost
MASTER_DB_PORT=3306
MASTER_DB_USER=root
MASTER_DB_PASSWORD=

DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_NAME=crm_system
DATABASE_URL=mysql://root:@localhost:3306/crm_system

# ===========================================
# 🔐 Encryption & Security
# ===========================================
DB_ENCRYPTION_KEY=0329f3e3b5cd43ee84e81b2799f778c6d3b7d774f1a54950b9f7efc9ab2708ac
JWT_SECRET=crm_jwt_secret_key_development_2024_ahmadreza_avandi
NEXTAUTH_SECRET=crm_nextauth_secret_development_2024_ahmadreza_avandi

# ===========================================
# 📧 Email Configuration
# ===========================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=ahmadrezaavandi@gmail.com
EMAIL_PASS=lqjp rnqy rnqy lqjp
EMAIL_FROM_NAME=CRM System Dev
EMAIL_FROM_ADDRESS=noreply@localhost

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ahmadrezaavandi@gmail.com
SMTP_PASS=lqjp rnqy rnqy lqjp

# ===========================================
# 🌐 Google OAuth Configuration
# ===========================================
GOOGLE_CLIENT_ID=264694321658-algdd3fa5u8t3pgsvv610cg4ei8m653h.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REFRESH_TOKEN=1//09kpx7rlYRlgrCgYIARAAGAkSNwF-L9IrEJNjUA0K6Afs9YOeD6kXkT-3now0m0cUNR6lGnENf8mgaf8Z1kdFES4XyEsgAUCQneM

# ===========================================
# 🎤 Rabin Voice Assistant Configuration
# ===========================================
RABIN_VOICE_OPENROUTER_API_KEY=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
RABIN_VOICE_OPENROUTER_MODEL=anthropic/claude-3-haiku
RABIN_VOICE_TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech
RABIN_VOICE_LOG_LEVEL=DEBUG

OPENROUTER_API_KEY=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
OPENROUTER_MODEL=anthropic/claude-3-haiku
TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech
LOG_LEVEL=DEBUG

# ===========================================
# 🔧 Development Settings
# ===========================================
DEBUG=true
NEXT_TELEMETRY_DISABLED=1
AUDIO_ENABLED=false
VPS_MODE=false
FALLBACK_TO_MANUAL_INPUT=true

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
EXPRESS_EMAIL_SERVICE_URL=http://localhost:3001
EOF

echo "  ✅ .env.local (development) ایجاد شد"

echo ""
echo "✅ یکپارچه‌سازی کامل شد!"
echo ""
echo "📋 خلاصه:"
echo "  ✅ .env - برای production و همه ماژول‌ها"
echo "  ✅ .env.server - برای Docker deployment"
echo "  ✅ .env.local - برای development محلی"
echo "  📦 پشتیبان‌ها در: $BACKUP_DIR/"
echo ""
echo "🎯 حالا تمام پروژه از یک فایل ENV استفاده می‌کند:"
echo "  ✅ Next.js CRM"
echo "  ✅ SaaS Admin Panel"
echo "  ✅ Rabin Voice Assistant"
echo "  ✅ Docker Deployment"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ موفق باشید!"
