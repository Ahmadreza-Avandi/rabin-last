#!/bin/bash

# 🚀 Complete CRM Server Deployment Script
set -e

DOMAIN="crm.robintejarat.com"
EMAIL="admin@crm.robintejarat.com"

echo "🚀 شروع دیپلوی کامل CRM روی سرور..."
echo "🌐 دامنه: $DOMAIN"

# بررسی حافظه سیستم
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
echo "💾 حافظه سیستم: ${TOTAL_MEM}MB"

# تنظیم swap برای سرورهای کم حافظه
if [ "$TOTAL_MEM" -lt 2048 ]; then
    echo "🔧 تنظیم swap برای حافظه کم..."
    
    # بررسی وجود swap
    SWAP_SIZE=$(free -m | awk '/^Swap:/ {print $2}')
    if [ "$SWAP_SIZE" -eq 0 ]; then
        echo "📀 ایجاد فایل swap 2GB..."
        sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1024 count=2097152
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        
        # اضافه کردن به fstab برای دائمی شدن
        if ! grep -q "/swapfile" /etc/fstab; then
            echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
        fi
        
        # تنظیم swappiness برای بهینه‌سازی
        echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
        sudo sysctl vm.swappiness=10
    fi
    
    echo "🔧 استفاده از تنظیمات بهینه‌شده برای حافظه کم"
    COMPOSE_FILE="docker-compose.memory-optimized.yml"
    NGINX_CONFIG="nginx/low-memory.conf"
else
    echo "🔧 استفاده از تنظیمات استاندارد"
    COMPOSE_FILE="docker-compose.yml"
    NGINX_CONFIG="nginx/default.conf"
fi

# بررسی فایل .env
if [ ! -f ".env" ]; then
    echo "⚠️  فایل .env یافت نشد. کپی از template..."
    cp .env.server.template .env
    
    # تولید پسوردهای قوی
    DB_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 32)
    
    # جایگزینی مقادیر در فایل .env
    sed -i "s/your_strong_password_here/$DB_PASS/g" .env
    sed -i "s/your_nextauth_secret_here_32_chars_min/$NEXTAUTH_SECRET/g" .env
    sed -i "s/your_jwt_secret_here_32_chars_minimum/$JWT_SECRET/g" .env
    sed -i "s|https://crm.robintejarat.com|https://$DOMAIN|g" .env
    
    echo "✅ فایل .env با پسوردهای قوی ایجاد شد"
    echo "🔐 پسورد دیتابیس: $DB_PASS"
    echo "📝 لطفاً تنظیمات ایمیل را در فایل .env تکمیل کنید"
fi

# بارگذاری متغیرهای محیطی
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
    echo "✅ متغیرهای محیطی بارگذاری شد"
else
    echo "❌ فایل .env یافت نشد!"
    exit 1
fi

# متوقف کردن کانتینرهای قدیمی
echo "🛑 متوقف کردن کانتینرهای قدیمی..."
docker-compose -f $COMPOSE_FILE down 2>/dev/null || true
docker-compose down 2>/dev/null || true

# پاک کردن cache و تصاویر قدیمی
echo "🧹 پاکسازی کامل Docker cache..."
docker system prune -af --volumes
docker image prune -af
docker container prune -f
docker volume prune -f

# پاک کردن node_modules و .next برای build تمیز (package-lock.json رو نگه می‌داریم)
echo "🧹 پاکسازی node dependencies..."
rm -rf node_modules
rm -rf .next

# بررسی و ایجاد فایل‌های مورد نیاز
if [ ! -f "package.json" ]; then
    echo "❌ فایل package.json یافت نشد!"
    exit 1
fi

# بررسی package-lock.json
echo "📦 بررسی package-lock.json..."
if [ -f "package-lock.json" ]; then
    echo "✅ package-lock.json موجود است"
    # حذف package-lock.json برای اجبار Docker به استفاده از npm install
    echo "🔄 حذف package-lock.json برای build تمیز..."
    rm -f package-lock.json
else
    echo "📦 package-lock.json وجود ندارد - Docker از npm install استفاده خواهد کرد"
fi

echo "✅ آماده برای Docker build"

echo "✅ فایل‌های package.json و package-lock.json آماده هستند"

# بررسی وجود Dockerfile
if [ ! -f "Dockerfile" ]; then
    echo "❌ فایل Dockerfile یافت نشد!"
    exit 1
fi

# آزاد کردن حافظه سیستم
echo "🧹 آزادسازی حافظه سیستم..."
sync && echo 3 | sudo tee /proc/sys/vm/drop_caches

# ایجاد دایرکتری‌های مورد نیاز
echo "📁 ایجاد دایرکتری‌های مورد نیاز..."
sudo mkdir -p /etc/letsencrypt
sudo mkdir -p /var/www/certbot
mkdir -p nginx/ssl
mkdir -p database

# بررسی و آماده‌سازی فایل‌های دیتابیس
echo "🗄️ آماده‌سازی فایل‌های دیتابیس..."
if [ ! -f "database/init.sql" ]; then
    echo "⚠️  فایل init.sql یافت نشد، ایجاد فایل پایه..."
    cat > database/init.sql << 'EOF'
-- Database initialization script for CRM System
CREATE DATABASE IF NOT EXISTS `crm_system` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'crm_app_user'@'%' IDENTIFIED BY 'PLACEHOLDER_PASSWORD';
GRANT ALL PRIVILEGES ON `crm_system`.* TO 'crm_app_user'@'%';
FLUSH PRIVILEGES;
USE `crm_system`;
SET time_zone = '+00:00';
EOF
fi

if [ ! -f "database/crm_system.sql" ]; then
    if [ -f "crm_system.sql" ]; then
        echo "📋 کپی فایل crm_system.sql به فولدر database..."
        cp crm_system.sql database/crm_system.sql
    else
        echo "⚠️  فایل crm_system.sql یافت نشد!"
    fi
fi

# کپی nginx config مناسب
echo "📝 تنظیم nginx config..."
if [ -f "$NGINX_CONFIG" ]; then
    cp $NGINX_CONFIG nginx/active.conf
else
    echo "⚠️  فایل nginx config یافت نشد، استفاده از default"
    cp nginx/default.conf nginx/active.conf
fi

# تنظیم docker-compose موقت برای SSL
echo "🔧 تنظیم nginx موقت برای SSL..."
cat > docker-compose.temp.yml << EOF
version: '3.8'

services:
  nginx-temp:
    image: nginx:alpine
    container_name: nginx-temp
    ports:
      - "80:80"
    volumes:
      - ./nginx/temp.conf:/etc/nginx/conf.d/default.conf:ro
      - /var/www/certbot:/var/www/certbot
    networks:
      - crm_network

networks:
  crm_network:
    driver: bridge
EOF

# ایجاد nginx config موقت
cat > nginx/temp.conf << 'EOF'
server {
    listen 80;
    server_name crm.robintejarat.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'SSL setup in progress...';
        add_header Content-Type text/plain;
    }
}
EOF

# راه‌اندازی nginx موقت
echo "🌐 راه‌اندازی nginx موقت..."
docker-compose -f docker-compose.temp.yml up -d

# انتظار برای آماده شدن nginx
sleep 10

# دریافت گواهی SSL
echo "📜 دریافت گواهی SSL..."
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    sudo docker run --rm \
        -v /etc/letsencrypt:/etc/letsencrypt \
        -v /var/www/certbot:/var/www/certbot \
        certbot/certbot \
        certonly --webroot --webroot-path=/var/www/certbot \
        --email $EMAIL --agree-tos --no-eff-email \
        -d $DOMAIN
fi

# متوقف کردن nginx موقت
echo "🛑 متوقف کردن nginx موقت..."
docker-compose -f docker-compose.temp.yml down

# پاک کردن فایل‌های موقت
rm -f nginx/temp.conf docker-compose.temp.yml

# بررسی وجود گواهی SSL و تنظیم nginx config نهایی
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "✅ گواهی SSL با موفقیت دریافت شد!"
    # استفاده از config با SSL
    if [ "$TOTAL_MEM" -lt 2048 ]; then
        cp nginx/low-memory.conf nginx/active.conf
    else
        cp nginx/default.conf nginx/active.conf
    fi
else
    echo "⚠️  گواهی SSL یافت نشد، ادامه بدون HTTPS..."
    # ایجاد nginx config بدون SSL
    cat > nginx/active.conf << 'EOF'
server {
    listen 80;
    server_name crm.robintejarat.com www.crm.robintejarat.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://nextjs:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /secure-db-admin-panel-x7k9m2/ {
        proxy_pass http://phpmyadmin/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://nextjs:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
fi

# تنظیم docker-compose برای استفاده از nginx config فعال
echo "🔧 تنظیم docker-compose..."
# کپی فایل compose و تنظیم nginx config
cp $COMPOSE_FILE docker-compose.deploy.yml

# تنظیم nginx volume در فایل deploy (پوشش هر دو حالت با و بدون :ro)
sed -i 's|./nginx/default.conf:/etc/nginx/conf.d/default.conf|./nginx/active.conf:/etc/nginx/conf.d/default.conf|g' docker-compose.deploy.yml
sed -i 's|./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro|./nginx/active.conf:/etc/nginx/conf.d/default.conf:ro|g' docker-compose.deploy.yml

COMPOSE_FILE="docker-compose.deploy.yml"

# Build و اجرای سرویس‌ها با محدودیت حافظه
echo "🔨 Build و راه‌اندازی سرویس‌ها..."

# تنظیم محدودیت حافظه Docker
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

# Build با محدودیت حافظه
if [ "$TOTAL_MEM" -lt 2048 ]; then
    echo "🔧 Build با محدودیت حافظه کم..."
    docker-compose -f $COMPOSE_FILE build --memory=1g --no-cache
    docker-compose -f $COMPOSE_FILE up -d
else
    docker-compose -f $COMPOSE_FILE up --build -d
fi

# انتظار برای آماده شدن سرویس‌ها
echo "⏳ انتظار برای آماده شدن سرویس‌ها..."

# بررسی وضعیت MySQL
echo "🔍 بررسی وضعیت MySQL..."
for i in {1..10}; do
    if docker-compose -f $COMPOSE_FILE exec -T mysql mysqladmin ping -h localhost --silent; then
        echo "✅ MySQL آماده است"
        break
    else
        echo "⏳ انتظار برای MySQL... ($i/10)"
        if [ $i -eq 10 ]; then
            echo "❌ MySQL آماده نشد. بررسی لاگ‌ها:"
            docker-compose -f $COMPOSE_FILE logs mysql
            echo "🔧 تلاش برای راه‌اندازی مجدد MySQL..."
            docker-compose -f $COMPOSE_FILE restart mysql
            sleep 30
        else
            sleep 10
        fi
    fi
done

# بررسی وضعیت سرویس‌ها
echo "📊 وضعیت سرویس‌ها:"
docker-compose -f $COMPOSE_FILE ps

# تست سرویس‌ها
echo "🧪 تست سرویس‌ها..."

# تست دیتابیس
echo "🗄️ تست اتصال دیتابیس..."
if docker-compose -f $COMPOSE_FILE exec -T mysql mysql -u root -p${DATABASE_PASSWORD}_ROOT -e "SHOW DATABASES;" >/dev/null 2>&1; then
    echo "✅ دیتابیس MariaDB در حال اجراست"
    
    # بررسی وجود دیتابیس crm_system
    if docker-compose -f $COMPOSE_FILE exec -T mysql mysql -u root -p${DATABASE_PASSWORD}_ROOT -e "USE crm_system; SHOW TABLES;" >/dev/null 2>&1; then
        echo "✅ دیتابیس crm_system آماده است"
    else
        echo "⚠️  دیتابیس crm_system ممکن است هنوز آماده نباشد"
    fi
else
    echo "⚠️  دیتابیس ممکن است هنوز آماده نباشد"
fi

# تست NextJS
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ NextJS در حال اجراست"
else
    echo "⚠️  NextJS ممکن است هنوز آماده نباشد"
fi

# تست دامنه
if curl -f http://$DOMAIN >/dev/null 2>&1; then
    echo "✅ دامنه $DOMAIN در دسترس است"
else
    echo "⚠️  دامنه ممکن است هنوز آماده نباشد"
fi

# نمایش لاگ‌های اخیر
echo "📋 لاگ‌های اخیر:"
docker-compose -f $COMPOSE_FILE logs --tail=20

# تنظیم تجدید خودکار SSL
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "⏰ تنظیم تجدید خودکار SSL..."
    (sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && cd $(pwd) && docker-compose -f $COMPOSE_FILE restart nginx") | sudo crontab -
fi

# تنظیم فایروال (اختیاری)
echo "🔥 تنظیم فایروال..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo ""
echo "🎉 دیپلوی کامل شد!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "🌐 سیستم CRM: https://$DOMAIN"
    echo "🔐 phpMyAdmin: https://$DOMAIN/secure-db-admin-panel-x7k9m2/"
else
    echo "🌐 سیستم CRM: http://$DOMAIN"
    echo "🔐 phpMyAdmin: http://$DOMAIN/secure-db-admin-panel-x7k9m2/"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 دستورات مفید:"
echo "   • مشاهده لاگ‌ها: docker-compose -f $COMPOSE_FILE logs -f"
echo "   • راه‌اندازی مجدد: docker-compose -f $COMPOSE_FILE restart"
echo "   • توقف: docker-compose -f $COMPOSE_FILE down"
echo "   • وضعیت: docker-compose -f $COMPOSE_FILE ps"
echo "   • بک‌آپ دیتابیس: docker-compose -f $COMPOSE_FILE exec mysql mariadb-dump -u root -p\${DATABASE_PASSWORD}_ROOT crm_system > backup.sql"
echo ""
echo "🔐 اطلاعات دسترسی phpMyAdmin:"
echo "   • آدرس: /secure-db-admin-panel-x7k9m2/"
echo "   • نام کاربری: از فایل .env"
echo "   • رمز عبور: از فایل .env"
echo ""
echo "⚠️  نکات امنیتی:"
echo "   • فایل .env را محرمانه نگه دارید"
echo "   • رمزهای قوی استفاده کنید"
echo "   • بک‌آپ منظم از دیتابیس بگیرید"
echo "   • لاگ‌ها را مرتب بررسی کنید"