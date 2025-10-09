#!/bin/bash

# 📊 مشاهده لاگ‌های دستیار صوتی رابین
# این اسکریپت لاگ‌های رابین را از فایل و Docker نمایش می‌دهد

echo "📊 مشاهده لاگ‌های دستیار صوتی رابین"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# بررسی آرگومان‌ها
MODE="${1:-both}"

case "$MODE" in
    "file"|"f")
        echo "📁 نمایش لاگ‌های فایل..."
        echo ""
        
        # پیدا کردن آخرین فایل لاگ
        LATEST_LOG=$(ls -t "صدای رابین/logs"/rabin-voice-*.log 2>/dev/null | head -1)
        
        if [ -z "$LATEST_LOG" ]; then
            echo "❌ هیچ فایل لاگی یافت نشد!"
            echo "💡 احتمالاً سرویس هنوز اجرا نشده یا لاگی ثبت نشده است."
            exit 1
        fi
        
        echo "📄 فایل لاگ: $LATEST_LOG"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        
        # نمایش لاگ با tail -f
        tail -f "$LATEST_LOG"
        ;;
        
    "docker"|"d")
        echo "🐳 نمایش لاگ‌های Docker..."
        echo ""
        docker-compose logs -f rabin-voice
        ;;
        
    "both"|"b")
        echo "📊 نمایش هر دو نوع لاگ..."
        echo ""
        echo "🐳 لاگ‌های Docker (آخرین 50 خط):"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        docker-compose logs --tail=50 rabin-voice
        
        echo ""
        echo "📁 لاگ‌های فایل (آخرین 50 خط):"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        LATEST_LOG=$(ls -t "صدای رابین/logs"/rabin-voice-*.log 2>/dev/null | head -1)
        
        if [ -z "$LATEST_LOG" ]; then
            echo "❌ هیچ فایل لاگی یافت نشد!"
        else
            tail -50 "$LATEST_LOG"
        fi
        
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "💡 برای مشاهده لاگ‌های زنده:"
        echo "   ./view-rabin-logs.sh file    # لاگ‌های فایل"
        echo "   ./view-rabin-logs.sh docker  # لاگ‌های Docker"
        ;;
        
    "list"|"l")
        echo "📋 لیست فایل‌های لاگ موجود:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        if [ -d "صدای رابین/logs" ]; then
            ls -lh "صدای رابین/logs"/*.log 2>/dev/null || echo "❌ هیچ فایل لاگی یافت نشد!"
        else
            echo "❌ دایرکتری logs یافت نشد!"
        fi
        ;;
        
    "clear"|"c")
        echo "🧹 پاک کردن لاگ‌های قدیمی..."
        
        # حذف لاگ‌های قدیمی‌تر از 7 روز
        find "صدای رابین/logs" -name "rabin-voice-*.log" -mtime +7 -delete 2>/dev/null
        
        echo "✅ لاگ‌های قدیمی‌تر از 7 روز پاک شدند"
        
        # نمایش لاگ‌های باقی‌مانده
        echo ""
        echo "📋 لاگ‌های باقی‌مانده:"
        ls -lh "صدای رابین/logs"/*.log 2>/dev/null || echo "هیچ فایل لاگی باقی نمانده"
        ;;
        
    "help"|"h"|*)
        echo "استفاده:"
        echo "  ./view-rabin-logs.sh [MODE]"
        echo ""
        echo "حالت‌های موجود:"
        echo "  both, b     - نمایش هر دو نوع لاگ (پیش‌فرض)"
        echo "  file, f     - نمایش لاگ‌های فایل (زنده)"
        echo "  docker, d   - نمایش لاگ‌های Docker (زنده)"
        echo "  list, l     - لیست فایل‌های لاگ"
        echo "  clear, c    - پاک کردن لاگ‌های قدیمی"
        echo "  help, h     - نمایش این راهنما"
        echo ""
        echo "مثال‌ها:"
        echo "  ./view-rabin-logs.sh          # نمایش هر دو نوع لاگ"
        echo "  ./view-rabin-logs.sh file     # نمایش لاگ‌های فایل"
        echo "  ./view-rabin-logs.sh docker   # نمایش لاگ‌های Docker"
        echo "  ./view-rabin-logs.sh list     # لیست فایل‌های لاگ"
        ;;
esac