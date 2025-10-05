#!/bin/bash

# 📋 Setup Environment File
# این اسکریپت فایل .env را برای دیپلوی آماده می‌کند

set -e

echo "📋 تنظیم فایل Environment..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# تعیین مسیر اصلی پروژه
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📂 مسیر پروژه: $SCRIPT_DIR"
echo ""

# بررسی فایل‌های موجود
echo "🔍 بررسی فایل‌های .env موجود:"
ls -la | grep -E "\.env" || echo "   هیچ فایل .env یافت نشد"
echo ""

# کپی فایل .env.server به .env
if [ -f ".env.server" ]; then
    echo "✅ فایل .env.server یافت شد"
    cp .env.server .env
    echo "✅ فایل .env کپی شد"
    echo ""
    echo "📄 محتوای فایل .env (10 خط اول):"
    head -10 .env
else
    echo "❌ فایل .env.server یافت نشد!"
    echo ""
    echo "💡 راه‌حل:"
    echo "   1. اگر فایل .env.server.template دارید، آن را کپی کنید:"
    echo "      cp .env.server.template .env.server"
    echo "   2. فایل .env.server را ویرایش کنید و تنظیمات را وارد کنید"
    echo "   3. دوباره این اسکریپت را اجرا کنید"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ فایل .env آماده است!"
echo ""
echo "🚀 حالا می‌توانید دیپلوی را اجرا کنید:"
echo "   ./quick-deploy.sh"
echo "   یا"
echo "   ./deploy-server.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"