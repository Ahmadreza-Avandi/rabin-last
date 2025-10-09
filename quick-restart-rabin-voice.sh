#!/bin/bash

# 🔄 اسکریپت ری‌استارت سریع صدای رابین (بدون rebuild)
set -e

DOMAIN="crm.robintejarat.com"
VOICE_SUBDOMAIN="rabin-voice"
VOICE_PORT=3001

echo "⚡ ری‌استارت سریع صدای رابین..."
echo "🌐 دامنه: $DOMAIN/$VOICE_SUBDOMAIN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ری‌استارت کانتینر rabin-voice
echo "🔄 ری‌استارت کانتینر rabin-voice..."
docker-compose restart rabin-voice

# صبر برای آماده شدن
echo "⏳ صبر برای آماده شدن rabin-voice (10 ثانیه)..."
sleep 10

# ری‌استارت Nginx (ضروری برای اتصال به دامنه)
echo ""
echo "🔄 ری‌استارت Nginx..."
docker-compose restart nginx

# صبر برای آماده شدن Nginx
echo "⏳ صبر برای آماده شدن Nginx (5 ثانیه)..."
sleep 5

# نمایش وضعیت
echo ""
echo "📊 وضعیت کانتینرها:"
docker-compose ps | grep -E "rabin-voice|nginx"

# نمایش لاگ‌های اخیر
echo ""
echo "📋 لاگ‌های اخیر rabin-voice:"
docker-compose logs --tail=15 rabin-voice

# تست اتصال
echo ""
echo "🧪 تست اتصال..."
if nc -z localhost $VOICE_PORT 2>/dev/null; then
    echo "   ✅ پورت $VOICE_PORT در دسترس است"
else
    echo "   ⚠️  پورت $VOICE_PORT در دسترس نیست"
fi

# تست اتصال شبکه
NETWORK_TEST=$(docker exec crm-nginx wget -q -O- --timeout=5 "http://rabin-voice:3001/rabin-voice" 2>/dev/null && echo "OK" || echo "FAIL")
if [ "$NETWORK_TEST" = "OK" ]; then
    echo "   ✅ اتصال شبکه Nginx -> Rabin Voice: موفق"
else
    echo "   ⚠️  اتصال شبکه: ناموفق (ممکن است نیاز به rebuild داشته باشید)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ری‌استارت سریع انجام شد!"
echo ""
echo "📍 دسترسی‌ها:"
echo "   🌐 وب: https://$DOMAIN/$VOICE_SUBDOMAIN"
echo "   🔌 پورت محلی: http://localhost:$VOICE_PORT"
echo ""
echo "💡 اگر مشکلی وجود دارد، از اسکریپت rebuild کامل استفاده کنید:"
echo "   ./restart-rabin-voice.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"