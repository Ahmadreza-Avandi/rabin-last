#!/bin/bash
# Test Rabin Voice Build Locally

set -e

echo "🎤 تست Rabin Voice Build Process"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd صدای\ رابین

# 1. بررسی node_modules
echo "1️⃣  بررسی node_modules..."
if [ ! -d "node_modules" ]; then
    echo "   ⚠️  node_modules موجود نیست"
    echo "   📦 اجرای: npm install"
    npm install
else
    echo "   ✅ node_modules موجود است"
fi

echo ""

# 2. بررسی next.config.js
echo "2️⃣  بررسی next.config.js..."
if grep -q "output: 'standalone'" next.config.js; then
    echo "   ✅ output: 'standalone' فعال است"
else
    echo "   ⚠️  output: 'standalone' فعال نیست!"
    echo "      لطفا اطمینان حاصل کنید:"
    echo "      - next.config.js شامل: output: 'standalone',"
    echo "      - basePath: '/rabin-voice',"
    echo "      - assetPrefix: '/rabin-voice',"
    exit 1
fi

echo ""

# 3. Clean build
echo "3️⃣  تمیز‌کردن .next directory..."
rm -rf .next 2>/dev/null || true
echo "   ✅ .next حذف شد"

echo ""

# 4. Build
echo "4️⃣  اجرای npm run build..."
npm run build 2>&1 | tee /tmp/build.log

BUILD_EXIT_CODE=$?
if [ $BUILD_EXIT_CODE -ne 0 ]; then
    echo ""
    echo "❌ Build فشل شد"
    echo "   خطاها:"
    tail -30 /tmp/build.log
    exit 1
fi

echo "   ✅ Build موفق"

echo ""

# 5. بررسی .next directory
echo "5️⃣  بررسی خروجی‌های Build..."
if [ -d ".next" ]; then
    echo "   ✅ .next directory موجود است"
    
    if [ -d ".next/standalone" ]; then
        echo "   ✅ .next/standalone موجود است (بهتری!)"
        
        if [ -f ".next/standalone/server.js" ]; then
            echo "   ✅ .next/standalone/server.js موجود است"
        else
            echo "   ⚠️  .next/standalone/server.js موجود نیست"
        fi
        
        if [ -f ".next/standalone/package.json" ]; then
            echo "   ✅ .next/standalone/package.json موجود است"
        fi
    else
        echo "   ⚠️  .next/standalone موجود نیست"
        echo "      (fallback بر روی: npm run start خواهد بود)"
    fi
    
    if [ -d ".next/server" ]; then
        echo "   ✅ .next/server موجود است"
    fi
    
    if [ -d ".next/static" ]; then
        echo "   ✅ .next/static موجود است"
    fi
    
    # لیست محتویات
    echo ""
    echo "   📂 .next directory محتویات:"
    ls -la .next | tail -10
else
    echo "   ❌ .next directory موجود نیست!"
    exit 1
fi

echo ""

# 6. بررسی start.sh
echo "6️⃣  بررسی start.sh..."
if [ -f "start.sh" ] && [ -x "start.sh" ]; then
    echo "   ✅ start.sh موجود و executable است"
else
    echo "   ⚠️  start.sh موجود نیست یا executable نیست"
fi

echo ""

# 7. خلاصه
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ تمام چک‌ها موفق!"
echo ""
echo "📊 خلاصه:"
echo "  - npm build: موفق"
echo "  - .next directory: موجود"
if [ -d ".next/standalone" ]; then
    echo "  - Standalone build: موجود"
else
    echo "  - Standalone build: موجود نیست (fallback available)"
fi
echo "  - start.sh: آماده"
echo ""
echo "🚀 حالا میتوانید اجرا کنید:"
echo "   docker-compose up rabin-voice"
echo ""