#!/bin/bash

# ===========================================
# 🔨 Rebuild Rabin Voice با Next.js Web App
# ===========================================

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔨 Rebuild دستیار صوتی رابین (با Next.js Web App)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# بررسی فایل‌های مورد نیاز
echo "🔍 بررسی فایل‌های مورد نیاز..."

if [ ! -f "صدای رابین/Dockerfile" ]; then
    echo "❌ Dockerfile یافت نشد!"
    exit 1
fi

if [ ! -f "صدای رابین/start.sh" ]; then
    echo "❌ start.sh یافت نشد!"
    exit 1
fi

if [ ! -f "صدای رابین/next.config.js" ]; then
    echo "❌ next.config.js یافت نشد!"
    exit 1
fi

echo "✅ همه فایل‌های مورد نیاز موجود است"
echo ""

# متوقف کردن کانتینر قدیمی
echo "🛑 متوقف کردن کانتینر قدیمی..."
docker stop crm_rabin_voice 2>/dev/null || true
docker rm crm_rabin_voice 2>/dev/null || true

echo ""

# حذف image قدیمی
echo "🗑️ حذف image قدیمی..."
docker rmi rabin-last-rabin-voice 2>/dev/null || true
docker rmi $(docker images --filter "reference=*rabin*voice*" -q) 2>/dev/null || true

echo ""

# پاکسازی build cache
echo "🧹 پاکسازی build cache..."
docker builder prune -f

echo ""

# Build image جدید
echo "🔨 Build image جدید (با Next.js)..."
echo "   این ممکن است چند دقیقه طول بکشد..."
echo ""

docker build -t rabin-last-rabin-voice "صدای رابین/" --no-cache

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Build ناموفق بود!"
    exit 1
fi

echo ""
echo "✅ Build موفق بود!"
echo ""

# راه‌اندازی کانتینر جدید
echo "🚀 راه‌اندازی کانتینر جدید..."

# استفاده از docker-compose برای راه‌اندازی
if [ -f "docker-compose.deploy.yml" ]; then
    COMPOSE_FILE="docker-compose.deploy.yml"
elif [ -f "docker-compose.yml" ]; then
    COMPOSE_FILE="docker-compose.yml"
else
    echo "❌ فایل docker-compose یافت نشد!"
    exit 1
fi

echo "   استفاده از: $COMPOSE_FILE"
docker-compose -f $COMPOSE_FILE up -d rabin-voice

echo ""

# انتظار برای آماده شدن
echo "⏳ انتظار برای آماده شدن سرویس (30 ثانیه)..."
sleep 30

echo ""

# بررسی وضعیت
echo "🔍 بررسی وضعیت..."
echo ""

if docker ps | grep -q crm_rabin_voice; then
    echo "✅ کانتینر در حال اجرا است"
    echo ""
    
    # نمایش لاگ‌های اخیر
    echo "📋 لاگ‌های اخیر:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    docker logs crm_rabin_voice --tail 30
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # تست endpoint
    echo "🧪 تست endpoint..."
    sleep 5
    
    # تست از داخل سرور
    echo "   تست محلی (localhost):"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/rabin-voice/ 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "   ✅ وب اپ در دسترس است (HTTP $HTTP_CODE)"
    elif [ "$HTTP_CODE" = "307" ] || [ "$HTTP_CODE" = "301" ]; then
        echo "   ⚠️  Redirect شناسایی شد (HTTP $HTTP_CODE)"
    else
        echo "   ⚠️  پاسخ غیرمنتظره (HTTP $HTTP_CODE)"
    fi
    
    echo ""
    
    # تست از بیرون
    echo "   تست عمومی (دامنه):"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://crm.robintejarat.com/rabin-voice/ 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "   ✅ وب اپ از بیرون در دسترس است (HTTP $HTTP_CODE)"
    elif [ "$HTTP_CODE" = "307" ] || [ "$HTTP_CODE" = "301" ]; then
        echo "   ⚠️  Redirect شناسایی شد (HTTP $HTTP_CODE)"
    else
        echo "   ⚠️  پاسخ غیرمنتظره (HTTP $HTTP_CODE)"
    fi
    
else
    echo "❌ کانتینر در حال اجرا نیست!"
    echo ""
    echo "📋 لاگ‌های خطا:"
    docker logs crm_rabin_voice 2>&1 || echo "لاگی یافت نشد"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Rebuild تمام شد!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 دسترسی به دستیار صوتی رابین:"
echo "   📱 وب اپ: https://crm.robintejarat.com/rabin-voice/"
echo "   🔌 API: https://crm.robintejarat.com/rabin-voice/api/"
echo ""
echo "📋 دستورات مفید:"
echo "   • مشاهده لاگ‌ها: docker logs -f crm_rabin_voice"
echo "   • راه‌اندازی مجدد: docker-compose -f $COMPOSE_FILE restart rabin-voice"
echo "   • ورود به کانتینر: docker exec -it crm_rabin_voice sh"
echo ""
