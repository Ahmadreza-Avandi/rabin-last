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

# اطمینان از وجود پوشه logs با دسترسی مناسب
mkdir -p logs 2>/dev/null || true
chmod 777 logs 2>/dev/null || true
chmod 755 logs 2>/dev/null || true

# اجرای Express API Server در پس‌زمینه
echo "🚀 شروع Express API Server..."
if [ ! -f "api/index.js" ]; then
    echo "❌ فایل api/index.js یافت نشد!"
    echo "   مسیرهای موجود:"
    ls -la 2>/dev/null | head -20
    exit 1
fi

# چک کن که node_modules موجود است
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules یافت نشد! npm install اجرا نشده"
    exit 1
fi

# اجرای Express با بهتر error handling
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
    if [ -f logs/api.log ]; then
        head -n 10 logs/api.log || true
    fi
else
    echo "❌ API Server شروع نشد!"
    echo "📋 خطاهای API Server:"
    if [ -f logs/api.log ]; then
        cat logs/api.log 2>/dev/null || echo "فایل log خالی است"
    else
        echo "فایل log وجود ندارد"
    fi
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
# برای standalone build استفاده می‌کنیم
echo ""

# ابتدا بررسی کنیم که standalone موجود است
if [ -d ".next/standalone" ] && [ -f ".next/standalone/server.js" ]; then
    echo "✅ استفاده از Next.js standalone build"
    exec node .next/standalone/server.js
elif [ -d ".next/standalone" ] && [ -f ".next/standalone/index.js" ]; then
    echo "✅ استفاده از Next.js app از standalone"
    exec node .next/standalone/index.js
elif [ -f "server.js" ]; then
    echo "✅ استفاده از custom server.js"
    exec node server.js
else
    echo "⚠️  Standalone files نیافت شدند، استفاده از next start"
    echo "   اطمینان حاصل کنید: output: 'standalone' در next.config.js موجود است"
    # اجرای next server از node_modules
    exec node node_modules/.bin/next start --port ${PORT:-3001} --hostname 0.0.0.0
fi