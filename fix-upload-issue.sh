#!/bin/bash

# اسکریپت رفع مشکل آپلود در داکر

echo "🔧 رفع مشکل آپلود در داکر..."

# مرحله 1: ایجاد فولدرهای آپلود در سیستم میزبان
echo "📁 ایجاد فولدرهای آپلود در سیستم میزبان..."
mkdir -p uploads/{documents,avatars,chat,temp}
mkdir -p public/uploads/{documents,avatars,chat}

# تنظیم مجوزها
chmod -R 755 uploads
chmod -R 755 public/uploads

# مرحله 2: متوقف کردن کانتینر NextJS
echo "🛑 متوقف کردن کانتینر NextJS..."
docker-compose stop nextjs 2>/dev/null || true

# مرحله 3: حذف کانتینر قدیمی
echo "🗑️ حذف کانتینر قدیمی..."
docker rm crm-nextjs 2>/dev/null || true

# مرحله 4: rebuild کانتینر NextJS
echo "🔨 Rebuild کانتینر NextJS..."
docker-compose build --no-cache nextjs

# مرحله 5: راه‌اندازی مجدد
echo "🚀 راه‌اندازی مجدد..."
docker-compose up -d nextjs

# انتظار برای آماده شدن
echo "⏳ انتظار برای آماده شدن..."
sleep 15

# مرحله 6: تست فولدرهای آپلود در کانتینر
echo "🧪 تست فولدرهای آپلود در کانتینر..."
docker exec crm-nextjs ls -la /app/ | grep uploads || echo "❌ فولدر uploads یافت نشد"
docker exec crm-nextjs ls -la /app/uploads/ 2>/dev/null || echo "❌ زیرفولدرهای uploads یافت نشد"
docker exec crm-nextjs ls -la /app/public/uploads/ 2>/dev/null || echo "❌ فولدر public/uploads یافت نشد"

# مرحله 7: تست مجوزها
echo "🔐 بررسی مجوزها..."
docker exec crm-nextjs whoami
docker exec crm-nextjs ls -la /app/uploads/
docker exec crm-nextjs touch /app/uploads/test.txt 2>/dev/null && echo "✅ مجوز نوشتن در uploads موجود است" || echo "❌ مجوز نوشتن در uploads وجود ندارد"

# مرحله 8: تست API آپلود
echo "🧪 تست API آپلود..."
sleep 5
curl -f http://localhost:3000/api/documents >/dev/null 2>&1 && echo "✅ API documents در دسترس است" || echo "❌ API documents در دسترس نیست"

echo ""
echo "✅ رفع مشکل آپلود تکمیل شد!"
echo "🌐 تست کنید: https://crm.robintejarat.com/dashboard/documents"
echo ""
echo "📋 دستورات مفید:"
echo "   • مشاهده لاگ NextJS: docker logs crm-nextjs"
echo "   • ورود به کانتینر: docker exec -it crm-nextjs /bin/sh"
echo "   • بررسی فولدرها: docker exec crm-nextjs ls -la /app/uploads/"
echo "   • تست مجوزها: docker exec crm-nextjs touch /app/uploads/test.txt"