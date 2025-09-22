#!/bin/bash

echo "🔧 حل نهایی مشکل MySQL..."

# متوقف کردن همه کانتینرها
echo "🛑 متوقف کردن کانتینرها..."
docker-compose -f docker-compose.deploy.yml down 2>/dev/null || true

# پاک کردن volumes MySQL
echo "🧹 پاک کردن volumes MySQL..."
docker volume rm rabin-last_mysql_data 2>/dev/null || true

# بررسی فایل .env
if [ ! -f ".env" ]; then
    echo "❌ فایل .env یافت نشد!"
    exit 1
fi

echo "📋 محتویات فایل .env:"
grep -E "DATABASE_|MYSQL_" .env || echo "هیچ متغیر دیتابیس یافت نشد"

# شروع فقط MySQL
echo "🚀 شروع MySQL..."
docker-compose -f docker-compose.deploy.yml up -d mysql

# انتظار و بررسی MySQL
echo "⏳ انتظار برای MySQL..."
for i in {1..60}; do
    if docker-compose -f docker-compose.deploy.yml exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
        echo "✅ MySQL آماده است!"
        break
    else
        echo "⏳ انتظار... ($i/60)"
        if [ $i -eq 60 ]; then
            echo "❌ MySQL آماده نشد. بررسی لاگ‌ها:"
            docker-compose -f docker-compose.deploy.yml logs mysql
            echo ""
            echo "🔧 تلاش با تنظیمات ساده‌تر..."
            
            # ایجاد docker-compose ساده برای MySQL
            cat > docker-compose.simple-mysql.yml << 'EOF'
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    container_name: crm-mysql-simple
    environment:
      MYSQL_ROOT_PASSWORD: "simple_root_pass_123"
      MYSQL_DATABASE: "crm_system"
      MYSQL_USER: "crm_user"
      MYSQL_PASSWORD: "simple_pass_123"
    ports:
      - "3306:3306"
    volumes:
      - mysql_simple_data:/var/lib/mysql
    command: --default-authentication-plugin=mysql_native_password
    networks:
      - crm-network

volumes:
  mysql_simple_data:

networks:
  crm-network:
    driver: bridge
EOF
            
            echo "🔄 تلاش با MySQL ساده..."
            docker-compose -f docker-compose.simple-mysql.yml up -d
            sleep 30
            
            if docker-compose -f docker-compose.simple-mysql.yml exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
                echo "✅ MySQL ساده کار می‌کند!"
                echo "📝 لطفاً فایل .env را با این تنظیمات آپدیت کنید:"
                echo "DATABASE_HOST=mysql"
                echo "DATABASE_USER=crm_user"
                echo "DATABASE_PASSWORD=simple_pass_123"
                echo "DATABASE_NAME=crm_system"
            else
                echo "❌ حتی MySQL ساده هم کار نکرد"
                docker-compose -f docker-compose.simple-mysql.yml logs mysql
            fi
            exit 1
        fi
        sleep 2
    fi
done

# شروع بقیه سرویس‌ها
echo "🚀 شروع بقیه سرویس‌ها..."
docker-compose -f docker-compose.deploy.yml up -d

# بررسی نهایی
echo "📊 وضعیت نهایی:"
docker-compose -f docker-compose.deploy.yml ps

echo "✅ تمام!"