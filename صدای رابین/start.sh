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

# ✅ Kill any existing process on port 3001
echo "🔍 بررسی پورت 3001..."
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  پورت 3001 در حال استفاده است، متوقف کردن..."
    kill -9 $(lsof -t -i:3001) 2>/dev/null || true
    sleep 2
fi

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

# اجرای Next.js Server
echo "🚀 شروع Next.js Server..."
if [ ! -f "server.js" ]; then
    echo "❌ فایل server.js یافت نشد!"
    echo "   مسیرهای موجود:"
    ls -la 2>/dev/null | head -20
    exit 1
fi

# اجرای Next.js با بهتر error handling
node server.js > logs/nextjs.log 2>&1 &
NEXTJS_PID=$!
echo "   ✅ Next.js Server شروع شد (PID: $NEXTJS_PID)"
echo ""

# منتظر شدن برای Next.js Server تا آماده شود
echo "⏳ منتظر آماده شدن Next.js Server (5 ثانیه)..."
sleep 5

# چک کردن Next.js Server
if kill -0 $NEXTJS_PID 2>/dev/null; then
    echo "✅ Next.js Server در حال اجرا است"
    # نمایش اول چند خط log
    if [ -f logs/nextjs.log ]; then
        head -n 10 logs/nextjs.log || true
    fi
else
    echo "❌ Next.js Server شروع نشد!"
    echo "📋 خطاهای Next.js Server:"
    if [ -f logs/nextjs.log ]; then
        cat logs/nextjs.log 2>/dev/null || echo "فایل log خالی است"
    else
        echo "فایل log وجود ندارد"
    fi
    # API را هم متوقف کنیم
    kill $API_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ دستیار صوتی رابین در حال اجرا است"
echo "   🌐 Next.js Web App: http://0.0.0.0:${PORT:-3001}/rabin-voice"
echo "   🔌 Express API: http://0.0.0.0:${PORT:-3001}/api"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Trap برای تمیز کردن هر دو سرویس هنگام خروج
cleanup() {
    echo "🛑 توقف دستیار رابین..."
    kill $API_PID 2>/dev/null || true
    kill $NEXTJS_PID 2>/dev/null || true
    wait $API_PID 2>/dev/null || true
    wait $NEXTJS_PID 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# منتظر بمانیم تا هر دو سرویس کار کنند
wait -n $API_PID $NEXTJS_PID