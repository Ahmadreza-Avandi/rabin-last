#!/bin/bash

# ===========================================
# 🎤 Rabin Voice - Environment Setup Script
# ===========================================

echo "🎤 راه‌اندازی محیط صدای رابین..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# بررسی وجود فایل .env
if [ -f ".env" ]; then
    echo "⚠️  فایل .env از قبل موجود است!"
    read -p "آیا می‌خواهید آن را بازنویسی کنید؟ (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ عملیات لغو شد"
        exit 0
    fi
fi

# کپی از .env.example
if [ ! -f ".env.example" ]; then
    echo "❌ فایل .env.example یافت نشد!"
    exit 1
fi

echo "📋 کپی .env.example به .env..."
cp .env.example .env

echo ""
echo "✅ فایل .env ایجاد شد!"
echo ""
echo "📝 حالا باید کلیدهای API را تنظیم کنید:"
echo ""
echo "1️⃣  OpenRouter API Key (الزامی):"
echo "   - برو به: https://openrouter.ai/keys"
echo "   - یک API Key جدید بساز"
echo "   - در فایل .env جایگزین کن:"
echo "   OPENROUTER_API_KEY=sk-or-v1-YOUR-KEY"
echo ""
echo "2️⃣  TTS API URL (اختیاری):"
echo "   - پیش‌فرض: https://api.ahmadreza-avandi.ir/text-to-speech"
echo "   - اگر API دیگری دارید، تغییر دهید"
echo ""
echo "3️⃣  Database (اختیاری):"
echo "   - پیش‌فرض: mysql:3306"
echo "   - برای development محلی: localhost:3306"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔧 برای ویرایش فایل .env:"
echo "   nano .env"
echo "   # یا"
echo "   vim .env"
echo ""
echo "🚀 بعد از تنظیم، سرویس را اجرا کنید:"
echo "   npm run dev          # Development"
echo "   docker-compose up    # Production"
echo ""
echo "✨ موفق باشید!"
