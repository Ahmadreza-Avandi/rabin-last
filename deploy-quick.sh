#!/bin/bash

# ==========================================
# 🚀 دیپلوی سریع - یک دستوری
# ==========================================

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 دیپلوی سریع CRM System"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ==========================================
# مرحله 1: بررسی پیش‌نیازها
# ==========================================
echo "1️⃣  بررسی پیش‌نیازها..."

if ! command -v docker &> /dev/null; then
    echo "   ❌ Docker نصب نیست!"
    exit 1
fi
echo "   ✅ Docker نصب است"

if ! command -v docker-compose &> /dev/null; then
    echo "   ❌ Docker Compose نصب نیست!"
    exit 1
fi
echo "   ✅ Docker Compose نصب است"

# ==========================================
# مرحله 2: تنظیم .env
# ==========================================
echo ""
echo "2️⃣  تنظیم فایل‌های .env..."

if [ ! -f ".env" ]; then
    echo "   📝 ایجاد .env..."
    bash setup-all-env.sh
else
    echo "   ✅ .env موجود است"
    read -p "   آیا می‌خواهید .env را دوباره بسازید؟ (y/N): " RECREATE_ENV
    if [ "$RECREATE_ENV" = "y" ] || [ "$RECREATE_ENV" = "Y" ]; then
        bash setup-all-env.sh
    fi
fi

# ==========================================
# مرحله 3: بررسی تنظیمات
# ==========================================
echo ""
echo "3️⃣  بررسی تنظیمات..."

if bash verify-all-configs.sh; then
    echo "   ✅ همه تنظیمات درست است"
else
    echo "   ❌ خطا در تنظیمات!"
    echo ""
    echo "لطفاً خطاها را اصلاح کنید و دوباره اجرا کنید:"
    echo "   bash deploy-quick.sh"
    exit 1
fi

# ==========================================
# مرحله 4: انتخاب نوع دیپلوی
# ==========================================
echo ""
echo "4️⃣  انتخاب نوع دیپلوی..."
echo ""
echo "   1) دیپلوی معمولی (سریع‌تر)"
echo "   2) دیپلوی با پاکسازی کامل (کندتر ولی مطمئن‌تر)"
echo ""
read -p "   انتخاب کنید (1 یا 2) [1]: " DEPLOY_TYPE
DEPLOY_TYPE=${DEPLOY_TYPE:-1}

# ==========================================
# مرحله 5: دیپلوی
# ==========================================
echo ""
echo "5️⃣  شروع دیپلوی..."
echo ""

if [ "$DEPLOY_TYPE" = "2" ]; then
    echo "   🧹 دیپلوی با پاکسازی کامل..."
    bash deploy-server.sh --clean
else
    echo "   🚀 دیپلوی معمولی..."
    bash deploy-server.sh
fi

# ==========================================
# مرحله 6: انتظار برای آماده شدن
# ==========================================
echo ""
echo "6️⃣  انتظار برای آماده شدن سرویس‌ها..."
echo "   ⏳ صبر کنید 30 ثانیه..."
sleep 30

# ==========================================
# مرحله 7: بررسی وضعیت
# ==========================================
echo ""
echo "7️⃣  بررسی وضعیت کانتینرها..."
echo ""

docker-compose ps

# ==========================================
# مرحله 8: تست سرویس‌ها
# ==========================================
echo ""
echo "8️⃣  تست سرویس‌ها..."
echo ""

# MySQL
echo "   🗄️  تست MySQL..."
if docker exec crm_mysql mariadb -u root -e "SELECT 1;" >/dev/null 2>&1; then
    echo "      ✅ MySQL کار می‌کند"
else
    echo "      ❌ MySQL مشکل دارد"
fi

# Rabin Voice
echo "   🎤 تست Rabin Voice..."
if curl -s http://localhost:3001/health >/dev/null 2>&1; then
    echo "      ✅ Rabin Voice کار می‌کند"
else
    echo "      ⚠️  Rabin Voice هنوز آماده نیست"
fi

# NextJS
echo "   🌐 تست NextJS..."
if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
    echo "      ✅ NextJS کار می‌کند"
else
    echo "      ⚠️  NextJS هنوز آماده نیست"
fi

# ==========================================
# نتیجه نهایی
# ==========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 دیپلوی کامل شد!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 آدرس‌های دسترسی:"
echo ""
echo "   🌐 Main App:"
echo "      http://crm.robintejarat.com/"
echo ""
echo "   🎤 Rabin Voice:"
echo "      http://crm.robintejarat.com/rabin-voice/"
echo ""
echo "   🔐 phpMyAdmin:"
echo "      http://crm.robintejarat.com/secure-db-admin-panel-x7k9m2/"
echo "      Username: root"
echo "      Password: (خالی)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 دستورات مفید:"
echo ""
echo "   • مشاهده لاگ‌ها:"
echo "     docker-compose logs -f"
echo ""
echo "   • بررسی وضعیت:"
echo "     docker-compose ps"
echo ""
echo "   • ری‌استارت:"
echo "     docker-compose restart"
echo ""
echo "   • تست کامل:"
echo "     bash quick-test.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
