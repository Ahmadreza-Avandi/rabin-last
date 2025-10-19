#!/bin/bash
# Script برای اجرای Express API و Next.js Server همزمان

set -e

echo "🎤 شروع دستیار صوتی رابین..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# بررسی متغیرهای محیطی
echo "🔍 بررسی متغیرهای محیطی..."
if [ -z "$OPENROUTER_API_KEY" ] && [ -z "$RABIN_VOICE_OPENROUTER_API_KEY" ]; then
    echo "⚠️  هشدار: OPENROUTER_API_KEY تنظیم نشده!"
    echo "   AI درخواست‌ها بدون کلید کار نمی‌کنند"
fi

echo "✅ متغیرهای محیطی:"
echo "   - NODE_ENV: ${NODE_ENV:-production}"
echo "   - PORT: ${PORT:-3001}"
echo "   - DATABASE_HOST: ${DATABASE_HOST:-mysql}"
echo "   - OPENROUTER_API_KEY: ${OPENROUTER_API_KEY:0:10}..." 
echo ""

# اطمینان از وجود پوشه logs
mkdir -p logs

# اجرای Express API Server در پس‌زمینه
echo "🚀 شروع Express API Server..."
node api/index.js > logs/api.log 2>&1 &
API_PID=$!
echo "   ✅ API Server شروع شد (PID: $API_PID)"
echo ""

# منتظر شدن برای API Server تا آماده شود
echo "⏳ منتظر آماده شدن API Server (5 ثانیه)..."
sleep 5

# چک کردن API Server
if kill -0 $API_PID 2>/dev/null; then
    echo "✅ API Server در حال اجرا است"
    # نمایش اول چند خط log
    head -n 5 logs/api.log || true
else
    echo "❌ API Server شروع نشد!"
    echo "📋 خطاهای API Server:"
    cat logs/api.log 2>/dev/null || echo "فایل log نیافت"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 شروع Next.js Server (روی پورت ${PORT:-3001})..."
echo ""

# Trap برای تمیز کردن API Server هنگام خروج
cleanup() {
    echo "🛑 توقف دستیار رابین..."
    kill $API_PID 2>/dev/null || true
    wait $API_PID 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# اجرای Next.js Server
# برای standalone build از node .next/standalone/server.js استفاده می‌کنیم
exec node ./.next/standalone/server.js