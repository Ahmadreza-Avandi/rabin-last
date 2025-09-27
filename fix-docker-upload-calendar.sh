#!/bin/bash

# 🔧 Fix uploads and calendar events in Docker environment
set -e

echo "🔧 رفع مشکل آپلود و رویدادهای تقویم در داکر..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# مرحله 1: تنظیم مجوزها و ساختار فولدرها
setup_folders() {
    echo "📁 تنظیم فولدرها و مجوزها..."
    
    # ایجاد فولدرها
    mkdir -p uploads/{documents,avatars,chat,temp}
    mkdir -p public/uploads/{documents,avatars,chat}
    
    # تنظیم مجوزها
    find uploads -type d -exec chmod 775 {} \;
    find public/uploads -type d -exec chmod 775 {} \;
    find uploads -type f -exec chmod 664 {} \;
    find public/uploads -type f -exec chmod 664 {} \;
    
    # تنظیم مالکیت برای داکر
    if [ -x "$(command -v docker)" ]; then
        CONTAINER_USER=$(docker run --rm node:18-alpine id -u node)
        chown -R $CONTAINER_USER:$CONTAINER_USER uploads public/uploads
    fi
}

# مرحله 2: بروزرسانی docker-compose
update_docker_compose() {
    echo "🐳 بروزرسانی تنظیمات Docker..."
    
    cat > docker-compose.yml << 'EOL'
version: '3.8'

services:
  nextjs:
    build: .
    container_name: crm-nextjs
    env_file:
      - .env
    environment:
      - NODE_ENV=${NODE_ENV:-production}
      - DATABASE_HOST=${DATABASE_HOST:-mysql}
      - DATABASE_USER=${DATABASE_USER:-crm_app_user}
      - DATABASE_PASSWORD=${DATABASE_PASSWORD}
      - DATABASE_NAME=${DATABASE_NAME:-crm_system}
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_URL=${NEXTAUTH_URL:-http://localhost:3000}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    volumes:
      - ./uploads:/app/uploads:rw
      - ./public/uploads:/app/public/uploads:rw
      - ./tmp:/app/tmp:rw
    user: "node"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - crm-network

  mysql:
    image: mariadb:10.4.32
    container_name: crm-mysql
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - MYSQL_ROOT_PASSWORD=${DATABASE_PASSWORD}_ROOT
      - MYSQL_DATABASE=${DATABASE_NAME}
      - MYSQL_USER=${DATABASE_USER}
      - MYSQL_PASSWORD=${DATABASE_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - crm-network

volumes:
  mysql_data:

networks:
  crm-network:
    driver: bridge
EOL
}

# مرحله 3: تست API ها
test_apis() {
    local domain=${1:-"localhost:3000"}
    local email="Robintejarat@gmail.com"
    local password="admin123"
    
    echo "🧪 تست API های اصلی..."
    
    # دریافت توکن
    echo "🔑 دریافت توکن..."
    LOGIN_RESPONSE=$(curl -s -X POST "http://$domain/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$TOKEN" ]; then
        echo "✅ ورود موفق"
        
        # تست API اسناد
        echo "📄 تست API اسناد..."
        DOCS_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer $TOKEN" \
            "http://$domain/api/documents")
        if [ "$DOCS_TEST" = "200" ]; then
            echo "✅ API اسناد کار می‌کند"
        else
            echo "❌ مشکل در API اسناد: $DOCS_TEST"
        fi
        
        # تست API تقویم
        echo "📅 تست API تقویم..."
        CALENDAR_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer $TOKEN" \
            "http://$domain/api/events")
        if [ "$CALENDAR_TEST" = "200" ]; then
            echo "✅ API تقویم کار می‌کند"
        else
            echo "❌ مشکل در API تقویم: $CALENDAR_TEST"
        fi
        
        # تست آپلود فایل
        echo "📤 تست آپلود فایل..."
        echo "Test file content" > test.txt
        UPLOAD_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer $TOKEN" \
            -F "file=@test.txt" \
            "http://$domain/api/documents")
        rm test.txt
        if [ "$UPLOAD_TEST" = "200" ]; then
            echo "✅ آپلود فایل کار می‌کند"
        else
            echo "❌ مشکل در آپلود فایل: $UPLOAD_TEST"
        fi
        
    else
        echo "❌ خطا در ورود"
        echo "پاسخ: $LOGIN_RESPONSE"
    fi
}

# اجرای مراحل
setup_folders
update_docker_compose

# بازسازی و راه‌اندازی مجدد
echo "🔄 بازسازی و راه‌اندازی مجدد کانتینرها..."
docker-compose down
docker-compose build --no-cache nextjs
docker-compose up -d

# انتظار برای آماده شدن سرویس‌ها
echo "⏳ انتظار برای آماده شدن سرویس‌ها..."
sleep 30

# تست نهایی
test_apis

echo ""
echo "✅ عملیات تعمیر کامل شد!"
echo ""
echo "📋 گام‌های بعدی:"
echo "1. بررسی لاگ‌ها: docker logs crm-nextjs"
echo "2. تست دستی در مرورگر:"
echo "   • https://crm.robintejarat.com/dashboard/documents"
echo "   • https://crm.robintejarat.com/dashboard/calendar"
echo "3. بررسی مجوزها: ls -la uploads/ public/uploads/"