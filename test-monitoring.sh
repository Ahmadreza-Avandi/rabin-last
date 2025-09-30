#!/bin/bash

# 🔍 اسکریپت تست System Monitoring Dashboard
# استفاده: ./test-monitoring.sh [options]

echo "🔍 تست System Monitoring Dashboard"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# بررسی وجود Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js یافت نشد. لطفاً Node.js را نصب کنید."
    exit 1
fi

# بررسی وجود فایل تست
if [ ! -f "test-system-monitoring.js" ]; then
    echo "❌ فایل test-system-monitoring.js یافت نشد."
    exit 1
fi

# تنظیم مجوز اجرا
chmod +x test-system-monitoring.js

echo "📋 گزینه‌های موجود:"
echo "   1. تست لوکال (localhost:3000)"
echo "   2. تست سرور (crm.robintejarat.com)"
echo "   3. تست لوکال با جزئیات"
echo "   4. تست سرور با جزئیات"
echo "   5. تست سریع (بدون لاگین)"
echo "   6. تست کامل سرور"
echo "   7. تست دستی"
echo ""

# اگر آرگومان داده شده، از آن استفاده کن
if [ $# -gt 0 ]; then
    case $1 in
        "local"|"--local"|"-l")
            echo "🏠 تست لوکال..."
            node test-system-monitoring.js --local
            ;;
        "server"|"--server"|"-s")
            echo "🌐 تست سرور..."
            node test-system-monitoring.js --server
            ;;
        "verbose"|"--verbose"|"-v")
            echo "🔍 تست با جزئیات..."
            node test-system-monitoring.js --local --verbose
            ;;
        "server-verbose"|"--server-verbose"|"-sv")
            echo "🌐🔍 تست سرور با جزئیات..."
            node test-system-monitoring.js --server --verbose
            ;;
        "quick"|"--quick"|"-q")
            echo "⚡ تست سریع..."
            node test-system-monitoring.js --local --skip-login
            ;;
        "full"|"--full"|"-f")
            echo "🎯 تست کامل سرور..."
            node test-system-monitoring.js --server --verbose
            ;;
        "help"|"--help"|"-h")
            echo "📖 راهنما:"
            echo "   ./test-monitoring.sh local          - تست لوکال"
            echo "   ./test-monitoring.sh server         - تست سرور"
            echo "   ./test-monitoring.sh verbose        - تست لوکال با جزئیات"
            echo "   ./test-monitoring.sh server-verbose - تست سرور با جزئیات"
            echo "   ./test-monitoring.sh quick          - تست سریع بدون لاگین"
            echo "   ./test-monitoring.sh full           - تست کامل سرور"
            echo "   ./test-monitoring.sh help           - نمایش راهنما"
            ;;
        *)
            echo "❌ گزینه نامعتبر: $1"
            echo "💡 برای مشاهده راهنما: ./test-monitoring.sh help"
            exit 1
            ;;
    esac
else
    # انتخاب تعاملی
    read -p "انتخاب کنید (1-7): " choice
    
    case $choice in
        1)
            echo "🏠 تست لوکال..."
            node test-system-monitoring.js --local
            ;;
        2)
            echo "🌐 تست سرور..."
            node test-system-monitoring.js --server
            ;;
        3)
            echo "🏠🔍 تست لوکال با جزئیات..."
            node test-system-monitoring.js --local --verbose
            ;;
        4)
            echo "🌐🔍 تست سرور با جزئیات..."
            node test-system-monitoring.js --server --verbose
            ;;
        5)
            echo "⚡ تست سریع..."
            node test-system-monitoring.js --local --skip-login
            ;;
        6)
            echo "🎯 تست کامل سرور..."
            node test-system-monitoring.js --server --verbose
            ;;
        7)
            echo "🔧 تست دستی - وارد کردن دستور:"
            echo "node test-system-monitoring.js [--local|--server] [--verbose] [--skip-login]"
            read -p "دستور خود را وارد کنید: " manual_command
            eval $manual_command
            ;;
        *)
            echo "❌ انتخاب نامعتبر"
            exit 1
            ;;
    esac
fi

echo ""
echo "✅ تست تمام شد!"
echo ""
echo "📋 دستورات مفید:"
echo "   • تست مجدد لوکال: ./test-monitoring.sh local"
echo "   • تست مجدد سرور: ./test-monitoring.sh server"
echo "   • مشاهده لاگ‌های سرور: docker-compose logs -f nextjs"
echo "   • راه‌اندازی مجدد: docker-compose restart nextjs"
echo "   • بررسی وضعیت: docker-compose ps"