#!/bin/bash

# 🔧 حل مشکلات Build در Next.js
set -e

echo "🔧 حل مشکلات Build Next.js..."

# 1. پاکسازی کاراکترهای مخفی
echo "🔍 پاکسازی کاراکترهای مخفی..."
./fix-invisible-chars.sh

# 2. پاکسازی cache های Next.js
echo "🧹 پاکسازی cache..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .swc

# 3. بررسی فایل‌های مشکل‌دار
echo "🔍 بررسی فایل‌های مشکل‌دار..."

PROBLEM_FILES=(
    "app/api/customer-club/send-message/route.ts"
    "app/api/customer-club/send-message/route.ts.new"
)

for file in "${PROBLEM_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "🔧 بررسی: $file"
        
        # بررسی encoding
        if file "$file" | grep -q "UTF-8"; then
            echo "✅ Encoding درست: $file"
        else
            echo "⚠️  مشکل Encoding: $file"
            # تبدیل به UTF-8
            iconv -f ISO-8859-1 -t UTF-8 "$file" > "$file.utf8" && mv "$file.utf8" "$file"
        fi
        
        # بررسی line endings
        if file "$file" | grep -q "CRLF"; then
            echo "🔧 تبدیل CRLF به LF: $file"
            sed -i 's/\r$//' "$file"
        fi
    fi
done

# 4. حذف فایل‌های اضافی
echo "🗑️ حذف فایل‌های اضافی..."
find . -name "*.new" -delete
find . -name "*.backup" -delete

# 5. تست build محلی
echo "🧪 تست build محلی..."
if command -v npm >/dev/null 2>&1; then
    echo "📦 نصب dependencies..."
    npm install --prefer-offline --no-audit
    
    echo "🔨 تست build..."
    NODE_OPTIONS='--max-old-space-size=2048' npm run build || {
        echo "❌ Build ناموفق - تلاش با تنظیمات کم‌تر..."
        NODE_OPTIONS='--max-old-space-size=1024' npm run build || {
            echo "❌ Build ناموفق - تلاش با حداقل تنظیمات..."
            NODE_OPTIONS='--max-old-space-size=768' npm run build
        }
    }
else
    echo "⚠️  npm یافت نشد، تست build انجام نشد"
fi

echo ""
echo "🎉 حل مشکلات Build کامل شد!"
echo "📝 اگر هنوز مشکل دارید:"
echo "   1. فایل‌های .backup را بررسی کنید"
echo "   2. Docker cache را پاک کنید: docker system prune -f"
echo "   3. مجدداً deploy کنید"