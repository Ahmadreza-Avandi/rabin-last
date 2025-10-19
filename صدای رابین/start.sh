#!/bin/bash
# Script برای اجرای Express API و Next.js Server همزمان

set -e

echo "🎤 شروع دستیار صوتی رابین..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# بررسی متغیرهای محیطی
echo "🔍 بررسی متغیرهای محیطی..."
if [ -z "$OPENROUTER_API_KEY" ] && [ -z "$RABIN_VOICE_OPENROUTER_API_KEY" ]; then
    echo "⚠️  هشدار: OPENROUTER_API_KEY تنظیم نشده!"
    echo "   فقط درخواست‌های API بدون کلید امکان‌پذیر نیست"
fi

echo "✅ متغیرهای محیطی:"
echo "   - NODE_ENV: ${NODE_ENV:-production}"
echo "   - PORT: ${PORT:-3001}"
echo "   - DATABASE_HOST: ${DATABASE_HOST:-mysql}"
echo ""

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
else
    echo "❌ API Server شروع نشد!"
    cat logs/api.log
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 شروع Next.js Server (روی پورت 3001)..."
echo ""

# اجرای Next.js Server
exec node server.js

# اگر Next.js شروع شود و متوقف شود، API Server هم متوقف شود
trap "kill $API_PID 2>/dev/null || true" EXIT INT TERM