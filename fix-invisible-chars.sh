#!/bin/bash

# 🔧 حذف کاراکترهای مخفی از فایل‌های TypeScript و JavaScript
echo "🔍 جستجو و حذف کاراکترهای مخفی..."

# کاراکترهای مخفی رایج
INVISIBLE_CHARS=(
    $'\u200f'  # Right-to-Left Mark
    $'\u200e'  # Left-to-Right Mark  
    $'\u200b'  # Zero Width Space
    $'\u200c'  # Zero Width Non-Joiner
    $'\u200d'  # Zero Width Joiner
    $'\ufeff'  # Byte Order Mark
)

# پیدا کردن فایل‌های TypeScript و JavaScript
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read -r file; do
    if [ -f "$file" ]; then
        # بررسی وجود کاراکترهای مخفی
        has_invisible=false
        for char in "${INVISIBLE_CHARS[@]}"; do
            if grep -q "$char" "$file" 2>/dev/null; then
                has_invisible=true
                break
            fi
        done
        
        if [ "$has_invisible" = true ]; then
            echo "🔧 پاکسازی: $file"
            
            # ایجاد backup
            cp "$file" "$file.backup"
            
            # حذف کاراکترهای مخفی
            for char in "${INVISIBLE_CHARS[@]}"; do
                sed -i "s/$char//g" "$file" 2>/dev/null || true
            done
            
            echo "✅ پاکسازی شد: $file"
        fi
    fi
done

echo ""
echo "🎉 پاکسازی کاراکترهای مخفی کامل شد!"
echo "📁 فایل‌های backup با پسوند .backup ذخیره شدند"