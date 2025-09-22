#!/bin/bash

# 🔍 تست encoding فایل‌ها
echo "🔍 بررسی encoding فایل‌های TypeScript/JavaScript..."

PROBLEM_FILES=()

find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read -r file; do
    if [ -f "$file" ]; then
        # بررسی encoding
        ENCODING=$(file -bi "$file" | cut -d'=' -f2)
        
        if [ "$ENCODING" != "utf-8" ] && [ "$ENCODING" != "us-ascii" ]; then
            echo "⚠️  مشکل encoding: $file ($ENCODING)"
            PROBLEM_FILES+=("$file")
        fi
        
        # بررسی کاراکترهای مخفی
        if hexdump -C "$file" | grep -q "e2 80 8f\|e2 80 8e\|e2 80 8b\|e2 80 8c\|e2 80 8d\|ef bb bf"; then
            echo "⚠️  کاراکتر مخفی: $file"
            PROBLEM_FILES+=("$file")
        fi
        
        # بررسی CRLF
        if file "$file" | grep -q "CRLF"; then
            echo "⚠️  CRLF line endings: $file"
            PROBLEM_FILES+=("$file")
        fi
    fi
done

if [ ${#PROBLEM_FILES[@]} -eq 0 ]; then
    echo "✅ همه فایل‌ها encoding درستی دارند"
else
    echo "❌ ${#PROBLEM_FILES[@]} فایل مشکل دارند"
fi

# تست خاص فایل مشکل‌دار
echo ""
echo "🔍 بررسی خاص فایل route.ts..."
ROUTE_FILE="app/api/customer-club/send-message/route.ts"

if [ -f "$ROUTE_FILE" ]; then
    echo "📁 فایل وجود دارد: $ROUTE_FILE"
    echo "📊 اندازه: $(wc -c < "$ROUTE_FILE") bytes"
    echo "📊 خطوط: $(wc -l < "$ROUTE_FILE") lines"
    echo "🔤 Encoding: $(file -bi "$ROUTE_FILE")"
    
    # بررسی اولین چند کاراکتر
    echo "🔍 اولین 50 کاراکتر (hex):"
    head -c 50 "$ROUTE_FILE" | hexdump -C
    
    if hexdump -C "$ROUTE_FILE" | head -20 | grep -q "e2 80 8f\|e2 80 8e\|e2 80 8b\|e2 80 8c\|e2 80 8d\|ef bb bf"; then
        echo "❌ کاراکتر مخفی پیدا شد!"
    else
        echo "✅ کاراکتر مخفی پیدا نشد"
    fi
else
    echo "❌ فایل وجود ندارد: $ROUTE_FILE"
fi