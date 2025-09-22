#!/bin/bash

# 🧪 تست Build محلی
echo "🧪 تست Build محلی Next.js..."

# پاکسازی
echo "🧹 پاکسازی..."
rm -rf .next
rm -rf node_modules/.cache

# حذف کاراکترهای مخفی
echo "🔧 حذف کاراکترهای مخفی..."
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read -r file; do
    if [ -f "$file" ]; then
        # حذف کاراکترهای مخفی
        sed -i 's/\x{200f}//g; s/\x{200e}//g; s/\x{200b}//g; s/\x{200c}//g; s/\x{200d}//g; s/\x{feff}//g' "$file" 2>/dev/null || true
    fi
done

# تست build
echo "🔨 تست build..."
NODE_OPTIONS='--max-old-space-size=2048' npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build موفق!"
else
    echo "❌ Build ناموفق!"
    exit 1
fi