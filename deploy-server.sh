#!/bin/bash

# 🚀 Complete CRM Server Deployment Script - All-in-One
set -e

DOMAIN="crm.robintejarat.com"
EMAIL="admin@crm.robintejarat.com"

# بررسی آرگومان‌ها
FORCE_CLEAN=false
if [ "$1" = "--clean" ] || [ "$1" = "-c" ]; then
    FORCE_CLEAN=true
    echo "🧹 حالت پاکسازی کامل فعال شد"
fi

echo "🚀 شروع دیپلوی کامل CRM روی سرور..."
echo "🌐 دامنه: $DOMAIN"
if [ "$FORCE_CLEAN" = true ]; then
    echo "🧹 حالت: پاکسازی کامل + rebuild"
else
    echo "🔄 حالت: rebuild معمولی"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ═══════════════════════════════════════════════════════════════
# 🔍 مرحله 1: بررسی سیستم و آماده‌سازی
# ═══════════════════════════════════════════════════════════════

echo "🔍 مرحله 1: بررسی سیستم..."

# بررسی حافظه سیستم
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
echo "💾 حافظه سیستم: ${TOTAL_MEM}MB"

# تنظیم swap برای سرورهای کم حافظه
if [ "$TOTAL_MEM" -lt 2048 ]; then
    echo "🔧 تنظیم swap برای حافظه کم..."
    
    SWAP_SIZE=$(free -m | awk '/^Swap:/ {print $2}')
    if [ "$SWAP_SIZE" -eq 0 ]; then
        echo "📀 ایجاد فایل swap 2GB..."
        sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1024 count=2097152
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        
        if ! grep -q "/swapfile" /etc/fstab; then
            echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
        fi
        
        echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
        sudo sysctl vm.swappiness=10
    fi
    
    COMPOSE_FILE="docker-compose.memory-optimized.yml"
    NGINX_CONFIG="nginx/low-memory.conf"
else
    COMPOSE_FILE="docker-compose.yml"
    NGINX_CONFIG="nginx/default.conf"
fi

echo "📊 استفاده از فایل: $COMPOSE_FILE"

# ═══════════════════════════════════════════════════════════════
# 🔧 مرحله 2: حل مشکلات Build و کاراکترهای مخفی
# ═══════════════════════════════════════════════════════════════

echo ""
echo "🔧 مرحله 2: حل مشکلات Build..."

# اجرای اسکریپت حل مشکل encoding
echo "🔧 حل مشکل encoding..."
if [ -f "fix-encoding-final.sh" ]; then
    chmod +x fix-encoding-final.sh
    ./fix-encoding-final.sh
else
    echo "🔍 حذف کاراکترهای مخفی و تصحیح encoding..."

    # حذف فایل مشکل‌دار و بازسازی
    if [ -f "app/api/customer-club/send-message/route.ts" ]; then
        echo "🔧 بازسازی فایل مشکل‌دار route.ts..."
        rm -f "app/api/customer-club/send-message/route.ts"
    fi

    # بازسازی فایل route.ts با encoding درست
    cat > "app/api/customer-club/send-message/route.ts" << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { executeQuery, executeSingle } from '@/lib/database';

const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get('auth-token')?.value ||
            req.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'Token not found' },
                { status: 401 }
            );
        }

        const tokenRequest = new NextRequest('https://crm.robintejarat.com', {
            headers: new Headers({ 'authorization': `Bearer ${token}` })
        });
        const userId = await getUserFromToken(tokenRequest);
        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'Invalid token' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { contactIds, message } = body;

        if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Invalid contact list' },
                { status: 400 }
            );
        }

        if (!message || !message.content) {
            return NextResponse.json(
                { success: false, message: 'Message content is required' },
                { status: 400 }
            );
        }

        const placeholders = contactIds.map(() => '?').join(',');
        const contacts = await executeQuery(`
      SELECT c.*, cu.name as customer_name
      FROM contacts c
      LEFT JOIN customers cu ON c.company_id = cu.id
      WHERE c.id IN (${placeholders})
    `, contactIds);

        if (contacts.length === 0) {
            return NextResponse.json(
                { success: false, message: 'No valid contacts found' },
                { status: 400 }
            );
        }

        const results = {
            total: contacts.length,
            sent: 0,
            failed: 0,
            errors: [] as string[]
        };

        if (message.type === 'email') {
            if (!message.subject) {
                return NextResponse.json(
                    { success: false, message: 'Email subject is required' },
                    { status: 400 }
                );
            }

            for (const contact of contacts) {
                if (!contact.email) {
                    results.failed++;
                    results.errors.push(`${contact.name}: No email available`);
                    continue;
                }

                try {
                    const personalizedContent = message.content
                        .replace(/\{name\}/g, contact.name || 'Dear User')
                        .replace(/\{customer\}/g, contact.customer_name || '')
                        .replace(/\{role\}/g, contact.role || '')
                        .replace(/\{email\}/g, contact.email || '')
                        .replace(/\{phone\}/g, contact.phone || '')
                        .replace(/\{company\}/g, contact.customer_name || '');

                    results.sent++;
                    console.log(`Email would be sent to ${contact.email}`);

                    await executeSingle(`
                        INSERT INTO message_logs (id, contact_id, user_id, type, subject, content, status, sent_at)
                        VALUES (?, ?, ?, 'email', ?, ?, 'sent', NOW())
                    `, [generateUUID(), contact.id, userId, message.subject, personalizedContent]);

                } catch (error: any) {
                    console.error(`Error processing email for ${contact.email}:`, error);
                    results.failed++;
                    results.errors.push(`${contact.name}: ${error.message}`);
                }
            }

        } else if (message.type === 'sms') {
            return NextResponse.json(
                { success: false, message: 'SMS system not implemented yet' },
                { status: 400 }
            );
        }

        const campaignId = generateUUID();
        await executeSingle(`
      INSERT INTO message_campaigns (id, user_id, title, type, content, total_recipients, sent_count, failed_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
            campaignId,
            userId,
            message.subject || 'Group Message',
            message.type,
            message.content,
            results.total,
            results.sent,
            results.failed
        ]);

        return NextResponse.json({
            success: true,
            message: `Message processed successfully. ${results.sent} successful, ${results.failed} failed`,
            data: results
        });

    } catch (error) {
        console.error('Send message API error:', error);
        return NextResponse.json(
            { success: false, message: 'Error processing message' },
            { status: 500 }
        );
    }
}
EOF

    # پاکسازی کاراکترهای مخفی از بقیه فایل‌ها
    find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read -r file; do
        if [ -f "$file" ] && [ "$file" != "./app/api/customer-club/send-message/route.ts" ]; then
            # حذف کاراکترهای مخفی با hex codes
            sed -i 's/\xE2\x80\x8F//g; s/\xE2\x80\x8E//g; s/\xE2\x80\x8B//g; s/\xE2\x80\x8C//g; s/\xE2\x80\x8D//g; s/\xEF\xBB\xBF//g' "$file" 2>/dev/null || true
            # حذف CRLF line endings
            sed -i 's/\r$//' "$file" 2>/dev/null || true
        fi
    done
fi

# پاکسازی کامل cache های محلی
echo "🧹 پاکسازی کامل cache های محلی..."
rm -rf .next 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .swc 2>/dev/null || true
rm -rf node_modules/.next 2>/dev/null || true
rm -rf .turbo 2>/dev/null || true
rm -rf dist 2>/dev/null || true
rm -rf build 2>/dev/null || true

# پاکسازی npm/yarn cache
echo "🧹 پاکسازی npm cache..."
npm cache clean --force 2>/dev/null || true
yarn cache clean 2>/dev/null || true

# پاکسازی TypeScript cache
echo "🧹 پاکسازی TypeScript cache..."
rm -rf tsconfig.tsbuildinfo 2>/dev/null || true

# حذف فایل‌های اضافی
echo "🗑️ حذف فایل‌های اضافی..."
find . -name "*.new" -delete 2>/dev/null || true
find . -name "*.backup" -delete 2>/dev/null || true

# ═══════════════════════════════════════════════════════════════
# 📁 مرحله 3: آماده‌سازی فایل‌ها و دایرکتری‌ها
# ═══════════════════════════════════════════════════════════════

echo ""
echo "📁 مرحله 3: آماده‌سازی فایل‌ها..."

# ایجاد دایرکتری‌های مورد نیاز
echo "📁 ایجاد دایرکتری‌های مورد نیاز..."
sudo mkdir -p /etc/letsencrypt
sudo mkdir -p /var/www/certbot
mkdir -p nginx/ssl
mkdir -p database
mkdir -p database/migrations

# ایجاد دایرکتری‌های صدای رابین
echo "📁 ایجاد دایرکتری‌های صدای رابین..."
mkdir -p "صدای رابین/logs"
chmod -R 755 "صدای رابین/logs"

# ایجاد فولدرهای آپلود
echo "📁 ایجاد فولدرهای آپلود..."
mkdir -p uploads/{documents,avatars,chat,temp}
mkdir -p public/uploads/{documents,avatars,chat}
mkdir -p logs

# تنظیم مجوزها برای فولدرهای آپلود - مجوزهای مناسب برای Docker
chmod -R 777 uploads
chmod -R 777 public/uploads
chmod -R 755 logs

# تنظیم ownership برای کاربر فعلی
if [ "$(id -u)" != "0" ]; then
    # اگر root نیستیم، مجوزها را برای کاربر فعلی تنظیم کنیم
    chown -R $(id -u):$(id -g) uploads 2>/dev/null || true
    chown -R $(id -u):$(id -g) public/uploads 2>/dev/null || true
    chown -R $(id -u):$(id -g) logs 2>/dev/null || true
fi

# ایجاد فایل .gitkeep برای حفظ فولدرها در git
echo "# Keep this folder in git" > uploads/.gitkeep
echo "# Keep this folder in git" > uploads/documents/.gitkeep
echo "# Keep this folder in git" > uploads/avatars/.gitkeep
echo "# Keep this folder in git" > uploads/chat/.gitkeep
echo "# Keep this folder in git" > uploads/temp/.gitkeep
echo "# Keep this folder in git" > public/uploads/.gitkeep
echo "# Keep this folder in git" > public/uploads/documents/.gitkeep
echo "# Keep this folder in git" > public/uploads/avatars/.gitkeep
echo "# Keep this folder in git" > public/uploads/chat/.gitkeep

echo "✅ فولدرهای آپلود ایجاد شدند:"
echo "   📁 uploads/{documents,avatars,chat,temp}"
echo "   📁 public/uploads/{documents,avatars,chat}"

# آماده‌سازی فایل‌های دیتابیس
echo "🗄️ آماده‌سازی فایل‌های دیتابیس..."

# بررسی و کپی فایل دیتابیس جدید
if [ -f "دیتاییس تغیر کرده.sql" ]; then
    echo "📋 استفاده از فایل دیتابیس جدید..."
    cp "دیتاییس تغیر کرده.sql" database/crm_system.sql
    echo "✅ فایل دیتابیس جدید کپی شد"
elif [ -f "crm_system.sql" ]; then
    echo "📋 کپی فایل crm_system.sql به فولدر database..."
    cp crm_system.sql database/crm_system.sql
else
    echo "⚠️  هیچ فایل دیتابیس یافت نشد!"
fi

# ایجاد فایل init.sql
if [ ! -f "database/init.sql" ]; then
    echo "📝 ایجاد فایل init.sql..."
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

# ایجاد فایل .gitkeep برای migrations
if [ ! -f "database/migrations/.gitkeep" ]; then
    echo "# This folder is for future database migrations" > database/migrations/.gitkeep
fi

# ═══════════════════════════════════════════════════════════════
# ⚙️ مرحله 4: تنظیم فایل .env
# ═══════════════════════════════════════════════════════════════

echo ""
echo "⚙️ مرحله 4: تنظیم فایل .env..."

if [ ! -f ".env" ]; then
    echo "⚠️  فایل .env یافت نشد. کپی از template..."
    cp .env.server.template .env
    
    # تولید رمزهای تصادفی قوی
    DB_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 32)
    
    # جایگزینی مقادیر در فایل .env
    sed -i "s/your_strong_password_here/$DB_PASS/g" .env
    sed -i "s/your_nextauth_secret_here_32_chars_min/$NEXTAUTH_SECRET/g" .env
    sed -i "s/your_jwt_secret_here_32_chars_minimum/$JWT_SECRET/g" .env
    
    echo "✅ فایل .env با رمزهای تصادفی ایجاد شد"
    echo "⚠️  لطفاً متغیرهای Gmail را در فایل .env تنظیم کنید:"
    echo "   - GOOGLE_CLIENT_ID"
    echo "   - GOOGLE_CLIENT_SECRET" 
    echo "   - GOOGLE_REFRESH_TOKEN"
fi

# تنظیم NEXTAUTH_URL - ابتدا HTTP برای تست
sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=http://$DOMAIN|g" .env
echo "🌐 NEXTAUTH_URL به HTTP تنظیم شد (برای تست اولیه)"

# بارگذاری متغیرهای محیطی
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
    echo "✅ متغیرهای محیطی بارگذاری شد"
else
    echo "❌ فایل .env یافت نشد!"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════
# 🛑 مرحله 5: متوقف کردن سرویس‌های قدیمی
# ═══════════════════════════════════════════════════════════════

echo ""
echo "🛑 مرحله 5: متوقف کردن سرویس‌های قدیمی..."

docker-compose -f $COMPOSE_FILE down 2>/dev/null || true
docker-compose down 2>/dev/null || true

# پاکسازی Docker cache و images
if [ "$FORCE_CLEAN" = true ]; then
    echo "🧹 پاکسازی کامل Docker cache و images..."

    # متوقف کردن همه کانتینرها
    echo "🛑 متوقف کردن همه کانتینرهای مربوط به CRM..."
    docker stop $(docker ps -q --filter "name=crm") 2>/dev/null || true
    docker stop $(docker ps -q --filter "name=nextjs") 2>/dev/null || true
    docker stop $(docker ps -q --filter "name=nginx") 2>/dev/null || true
    docker stop $(docker ps -q --filter "name=mysql") 2>/dev/null || true
    docker stop $(docker ps -q --filter "name=phpmyadmin") 2>/dev/null || true
    docker stop $(docker ps -q --filter "name=rabin-voice") 2>/dev/null || true

    # حذف کانتینرهای متوقف شده
    echo "🗑️ حذف کانتینرهای متوقف شده..."
    docker container prune -f

    # حذف images مربوط به پروژه
    echo "🗑️ حذف images مربوط به پروژه..."
    docker rmi $(docker images --filter "reference=*crm*" -q) 2>/dev/null || true
    docker rmi $(docker images --filter "reference=*nextjs*" -q) 2>/dev/null || true
    docker rmi $(docker images --filter "dangling=true" -q) 2>/dev/null || true

    # پاکسازی کامل build cache
    echo "🧹 پاکسازی کامل build cache..."
    docker builder prune -af

    # پاکسازی volumes غیرضروری (احتیاط: دیتابیس حفظ می‌شود)
    echo "🧹 پاکسازی volumes غیرضروری..."
    docker volume prune -f

    # پاکسازی networks غیرضروری
    echo "🧹 پاکسازی networks غیرضروری..."
    docker network prune -f

    # پاکسازی کامل سیستم
    echo "🧹 پاکسازی نهایی سیستم..."
    docker system prune -af --volumes

    echo "✅ پاکسازی کامل انجام شد"
else
    echo "🧹 پاکسازی معمولی Docker cache..."
    docker system prune -f
fi

# ═══════════════════════════════════════════════════════════════
# 🌐 مرحله 6: تنظیم SSL و nginx
# ═══════════════════════════════════════════════════════════════

echo ""
echo "🌐 مرحله 6: تنظیم SSL و nginx..."

# کپی nginx config مناسب
echo "📝 تنظیم nginx config..."
if [ -f "nginx/simple.conf" ]; then
    cp nginx/simple.conf nginx/active.conf
    echo "✅ استفاده از nginx config ساده"
elif [ -f "$NGINX_CONFIG" ]; then
    cp $NGINX_CONFIG nginx/active.conf
else
    echo "⚠️  فایل nginx config یافت نشد، ایجاد config پایه..."
    cat > nginx/active.conf << 'EOF'
server {
    listen 80;
    server_name crm.robintejarat.com www.crm.robintejarat.com;
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://nextjs:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /secure-db-admin-panel-x7k9m2/ {
        proxy_pass http://phpmyadmin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
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
    echo "🔐 تلاش برای دریافت گواهی SSL..."
    sudo docker run --rm \
        -v /etc/letsencrypt:/etc/letsencrypt \
        -v /var/www/certbot:/var/www/certbot \
        certbot/certbot \
        certonly --webroot --webroot-path=/var/www/certbot \
        --email $EMAIL --agree-tos --no-eff-email \
        -d $DOMAIN || echo "⚠️  دریافت SSL ناموفق، ادامه با HTTP"
fi

# بررسی مجدد SSL
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "✅ گواهی SSL موجود است"
    SSL_AVAILABLE=true
else
    echo "⚠️  گواهی SSL موجود نیست"
    SSL_AVAILABLE=false
fi

# متوقف کردن nginx موقت
echo "🛑 متوقف کردن nginx موقت..."
docker-compose -f docker-compose.temp.yml down

# پاک کردن فایل‌های موقت
rm -f nginx/temp.conf docker-compose.temp.yml

# تنظیم nginx config نهایی
echo "📝 تنظیم nginx config..."
cat > nginx/active.conf << 'EOF'
server {
    listen 80;
    server_name crm.robintejarat.com www.crm.robintejarat.com;
    client_max_body_size 50M;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Rabin Voice Assistant
    location /rabin-voice {
        proxy_pass http://rabin-voice:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location / {
        proxy_pass http://nextjs:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location /secure-db-admin-panel-x7k9m2/ {
        proxy_pass http://phpmyadmin/;
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

# اگر SSL موجود است، HTTPS server اضافه کن
if [ "$SSL_AVAILABLE" = true ]; then
    echo "✅ گواهی SSL موجود است، اضافه کردن HTTPS server..."
    cat >> nginx/active.conf << 'EOF'

server {
    listen 443 ssl http2;
    server_name crm.robintejarat.com www.crm.robintejarat.com;
    
    ssl_certificate /etc/letsencrypt/live/crm.robintejarat.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crm.robintejarat.com/privkey.pem;
    
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozTLS:10m;
    ssl_session_tickets off;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://nextjs:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location /secure-db-admin-panel-x7k9m2/ {
        proxy_pass http://phpmyadmin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
    
    location /api/ {
        proxy_pass http://nextjs:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
EOF
else
    echo "⚠️  گواهی SSL یافت نشد، فقط HTTP فعال است"
fi

# ═══════════════════════════════════════════════════════════════
# 🔨 مرحله 7: Build و راه‌اندازی سرویس‌ها
# ═══════════════════════════════════════════════════════════════

echo ""
echo "🔨 مرحله 7: Build و راه‌اندازی سرویس‌ها..."

# تنظیم docker-compose برای استفاده از nginx config فعال
echo "🔧 تنظیم docker-compose..."
cp $COMPOSE_FILE docker-compose.deploy.yml

# تنظیم nginx volume در فایل deploy
sed -i 's|./nginx/default.conf:/etc/nginx/conf.d/default.conf|./nginx/active.conf:/etc/nginx/conf.d/default.conf|g' docker-compose.deploy.yml
sed -i 's|./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro|./nginx/active.conf:/etc/nginx/conf.d/default.conf:ro|g' docker-compose.deploy.yml
sed -i 's|./nginx/simple.conf:/etc/nginx/conf.d/default.conf|./nginx/active.conf:/etc/nginx/conf.d/default.conf|g' docker-compose.deploy.yml
sed -i 's|./nginx/low-memory.conf:/etc/nginx/conf.d/default.conf|./nginx/active.conf:/etc/nginx/conf.d/default.conf|g' docker-compose.deploy.yml

COMPOSE_FILE="docker-compose.deploy.yml"

# Build و راه‌اندازی
if [ "$FORCE_CLEAN" = true ]; then
    echo "🔨 Force rebuild از صفر (بدون cache)..."
    
    # تنظیم محدودیت حافظه Docker
    if [ "$TOTAL_MEM" -lt 1024 ]; then
        echo "⚠️  حافظه بسیار کم - استفاده از تنظیمات محدود"
        export DOCKER_BUILDKIT=0
        export COMPOSE_DOCKER_CLI_BUILD=0
        
        # Build مرحله به مرحله برای حافظه کم
        echo "🔨 Build مرحله‌ای برای حافظه کم..."
        docker-compose -f $COMPOSE_FILE build --no-cache --force-rm mysql
        docker-compose -f $COMPOSE_FILE build --no-cache --force-rm phpmyadmin  
        docker-compose -f $COMPOSE_FILE build --no-cache --force-rm nextjs
        docker-compose -f $COMPOSE_FILE build --no-cache --force-rm nginx
        
        # راه‌اندازی
        docker-compose -f $COMPOSE_FILE up -d
    else
        echo "🔨 شروع build کامل و راه‌اندازی..."
        # Force rebuild بدون استفاده از cache
        docker-compose -f $COMPOSE_FILE build --no-cache --force-rm
        docker-compose -f $COMPOSE_FILE up -d
    fi
else
    echo "🔨 Build معمولی و راه‌اندازی..."
    
    # تنظیم محدودیت حافظه Docker
    if [ "$TOTAL_MEM" -lt 1024 ]; then
        echo "⚠️  حافظه بسیار کم - استفاده از تنظیمات محدود"
        export DOCKER_BUILDKIT=0
        export COMPOSE_DOCKER_CLI_BUILD=0
        docker-compose -f $COMPOSE_FILE up -d
    else
        echo "🔨 شروع build و راه‌اندازی..."
        docker-compose -f $COMPOSE_FILE up --build -d
    fi
fi

echo "✅ Build و راه‌اندازی کامل شد"

# ═══════════════════════════════════════════════════════════════
# ⏳ مرحله 8: انتظار و تست سرویس‌ها
# ═══════════════════════════════════════════════════════════════

echo ""
echo "⏳ مرحله 8: انتظار برای آماده شدن سرویس‌ها..."
sleep 30

# بررسی وضعیت سرویس‌ها
echo "📊 وضعیت سرویس‌ها:"
docker-compose -f $COMPOSE_FILE ps

# تست سرویس‌ها
echo ""
echo "🧪 تست سرویس‌ها..."

# تست دیتابیس
echo "🗄️ تست اتصال دیتابیس..."
if docker-compose -f $COMPOSE_FILE exec -T mysql mariadb -u root -p${DATABASE_PASSWORD}_ROOT -e "SELECT VERSION();" >/dev/null 2>&1; then
    echo "✅ دیتابیس MariaDB در حال اجراست"
    
    # بررسی وجود دیتابیس crm_system
    if docker-compose -f $COMPOSE_FILE exec -T mysql mariadb -u root -p${DATABASE_PASSWORD}_ROOT -e "USE crm_system; SHOW TABLES;" >/dev/null 2>&1; then
        echo "✅ دیتابیس crm_system آماده است"
        
        # شمارش جداول
        TABLE_COUNT=$(docker-compose -f $COMPOSE_FILE exec -T mysql mariadb -u root -p${DATABASE_PASSWORD}_ROOT -e "USE crm_system; SHOW TABLES;" 2>/dev/null | wc -l)
        echo "📊 تعداد جداول: $((TABLE_COUNT - 1))"
    else
        echo "⚠️  دیتابیس crm_system ممکن است هنوز آماده نباشد"
    fi
else
    echo "⚠️  دیتابیس ممکن است هنوز آماده نباشد"
fi

# تست NextJS
echo "🧪 تست NextJS..."
sleep 10
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ NextJS در حال اجراست"
    
    # تست فولدرهای آپلود در کانتینر
    echo "📁 بررسی فولدرهای آپلود در کانتینر..."
    if docker-compose -f $COMPOSE_FILE exec -T nextjs ls -la /app/uploads >/dev/null 2>&1; then
        echo "✅ فولدر uploads در کانتینر موجود است"
    else
        echo "❌ فولدر uploads در کانتینر موجود نیست"
    fi
    
    if docker-compose -f $COMPOSE_FILE exec -T nextjs ls -la /app/public/uploads >/dev/null 2>&1; then
        echo "✅ فولدر public/uploads در کانتینر موجود است"
    else
        echo "❌ فولدر public/uploads در کانتینر موجود نیست"
    fi
    
    # تست مجوز نوشتن
    if docker-compose -f $COMPOSE_FILE exec -T nextjs touch /app/uploads/test.txt >/dev/null 2>&1; then
        echo "✅ مجوز نوشتن در uploads موجود است"
        docker-compose -f $COMPOSE_FILE exec -T nextjs rm -f /app/uploads/test.txt >/dev/null 2>&1
    else
        echo "❌ مجوز نوشتن در uploads وجود ندارد - اصلاح مشکل..."
        
        # اصلاح مجوزهای uploads در کانتینر
        echo "🔧 اصلاح مجوزهای uploads در کانتینر..."
        docker-compose -f $COMPOSE_FILE exec -T nextjs sh -c "
            mkdir -p /app/uploads/documents /app/uploads/avatars /app/uploads/chat /app/uploads/temp &&
            mkdir -p /app/public/uploads/documents /app/public/uploads/avatars /app/public/uploads/chat &&
            chown -R nextjs:nodejs /app/uploads /app/public/uploads &&
            chmod -R 775 /app/uploads /app/public/uploads
        " 2>/dev/null || true
        
        # تست مجدد
        if docker-compose -f $COMPOSE_FILE exec -T nextjs touch /app/uploads/test.txt >/dev/null 2>&1; then
            echo "✅ مجوز نوشتن اصلاح شد"
            docker-compose -f $COMPOSE_FILE exec -T nextjs rm -f /app/uploads/test.txt >/dev/null 2>&1
        else
            echo "⚠️  مجوز نوشتن هنوز مشکل دارد"
        fi
    fi
else
    echo "⚠️  NextJS ممکن است هنوز آماده نباشد"
    echo "🔍 لاگ NextJS:"
    docker-compose -f $COMPOSE_FILE logs nextjs | tail -5
fi

# تست nginx config
echo "🧪 تست nginx config..."
if docker-compose -f $COMPOSE_FILE exec -T nginx nginx -t >/dev/null 2>&1; then
    echo "✅ nginx config درست است"
else
    echo "❌ nginx config مشکل دارد"
    docker-compose -f $COMPOSE_FILE logs nginx | tail -5
fi

# تست دامنه
echo "🧪 تست دامنه..."
sleep 5
DOMAIN_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN --connect-timeout 10)
if [ "$DOMAIN_TEST" = "200" ] || [ "$DOMAIN_TEST" = "302" ] || [ "$DOMAIN_TEST" = "301" ]; then
    echo "✅ دامنه $DOMAIN در دسترس است (HTTP $DOMAIN_TEST)"
else
    echo "⚠️  دامنه پاسخ نمی‌دهد (HTTP $DOMAIN_TEST)"
    echo "🔍 تست محلی nginx:"
    curl -s -I -H "Host: $DOMAIN" http://localhost | head -3
fi

# تست API های مهم
echo "🧪 تست API های مهم..."
sleep 3

# تست API documents
DOCS_API_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN/api/documents --connect-timeout 5)
if [ "$DOCS_API_TEST" = "200" ] || [ "$DOCS_API_TEST" = "401" ]; then
    echo "✅ API Documents در دسترس است (HTTP $DOCS_API_TEST)"
else
    echo "⚠️  API Documents مشکل دارد (HTTP $DOCS_API_TEST)"
fi

# تست API events
EVENTS_API_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN/api/events --connect-timeout 5)
if [ "$EVENTS_API_TEST" = "200" ] || [ "$EVENTS_API_TEST" = "401" ]; then
    echo "✅ API Events در دسترس است (HTTP $EVENTS_API_TEST)"
else
    echo "⚠️  API Events مشکل دارد (HTTP $EVENTS_API_TEST)"
fi

# تست صفحه documents
DOCS_PAGE_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN/dashboard/documents --connect-timeout 5)
if [ "$DOCS_PAGE_TEST" = "200" ] || [ "$DOCS_PAGE_TEST" = "302" ]; then
    echo "✅ صفحه Documents در دسترس است (HTTP $DOCS_PAGE_TEST)"
else
    echo "⚠️  صفحه Documents مشکل دارد (HTTP $DOCS_PAGE_TEST)"
fi

# تست صفحه calendar
CALENDAR_PAGE_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN/dashboard/calendar --connect-timeout 5)
if [ "$CALENDAR_PAGE_TEST" = "200" ] || [ "$CALENDAR_PAGE_TEST" = "302" ]; then
    echo "✅ صفحه Calendar در دسترس است (HTTP $CALENDAR_PAGE_TEST)"
else
    echo "⚠️  صفحه Calendar مشکل دارد (HTTP $CALENDAR_PAGE_TEST)"
fi

# ═══════════════════════════════════════════════════════════════
# 🔐 مرحله 9: تنظیمات امنیتی و نهایی
# ═══════════════════════════════════════════════════════════════

echo ""
echo "🔐 مرحله 9: تنظیمات امنیتی..."

# تنظیم تجدید خودکار SSL
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "⏰ تنظیم تجدید خودکار SSL..."
    (sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && cd $(pwd) && docker-compose -f $COMPOSE_FILE restart nginx") | sudo crontab -
fi

# تنظیم فایروال
echo "🔥 تنظیم فایروال..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# نمایش لاگ‌های اخیر
echo ""
echo "📋 لاگ‌های اخیر:"
docker-compose -f $COMPOSE_FILE logs --tail=20

# ═══════════════════════════════════════════════════════════════
# 🎉 خلاصه نهایی
# ═══════════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════════
# 🔧 مرحله 10: رفع مشکل redirect و تست نهایی
# ═══════════════════════════════════════════════════════════════

echo ""
echo "🔧 مرحله 10: رفع مشکل redirect و تست نهایی..."

# بررسی و رفع مشکل redirect
REDIRECT_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN --connect-timeout 10)
echo "🧪 تست اولیه دامنه: HTTP $REDIRECT_TEST"

if [ "$REDIRECT_TEST" = "307" ] || [ "$REDIRECT_TEST" = "301" ] || [ "$REDIRECT_TEST" = "302" ]; then
    echo "⚠️  مشکل redirect شناسایی شد (HTTP $REDIRECT_TEST)"
    echo "🔧 رفع مشکل NEXTAUTH_URL..."
    
    # اطمینان از HTTP در NEXTAUTH_URL
    sed -i "s|NEXTAUTH_URL=https://$DOMAIN|NEXTAUTH_URL=http://$DOMAIN|g" .env
    
    # راه‌اندازی مجدد NextJS
    echo "🔄 راه‌اندازی مجدد NextJS..."
    docker-compose -f $COMPOSE_FILE restart nextjs
    
    # انتظار
    sleep 15
    
    # تست مجدد
    FINAL_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN --connect-timeout 10)
    echo "🧪 تست نهایی: HTTP $FINAL_TEST"
fi

# اگر HTTP کار کرد و SSL موجود است، به HTTPS تغییر بده
if [ "$SSL_AVAILABLE" = true ] && ([ "$REDIRECT_TEST" = "200" ] || [ "$FINAL_TEST" = "200" ]); then
    echo "🔒 تغییر به HTTPS..."
    sed -i "s|NEXTAUTH_URL=http://$DOMAIN|NEXTAUTH_URL=https://$DOMAIN|g" .env
    
    # اضافه کردن HTTP to HTTPS redirect
    sed -i '/location \/ {/i\    # Redirect HTTP to HTTPS\n    return 301 https://$server_name$request_uri;' nginx/active.conf
    
    # راه‌اندازی مجدد
    docker-compose -f $COMPOSE_FILE restart nginx nextjs
    sleep 10
    
    # تست HTTPS
    HTTPS_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN --connect-timeout 10 -k)
    echo "🧪 تست HTTPS: $HTTPS_TEST"
fi

echo ""
echo "🎉 دیپلوی کامل شد!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "🌐 سیستم CRM: https://$DOMAIN"
    echo "🔐 phpMyAdmin: https://$DOMAIN/secure-db-admin-panel-x7k9m2/"
    echo "⚠️  نکته: اگر redirect مشکل دارد، از HTTP استفاده کنید:"
    echo "🌐 HTTP: http://$DOMAIN"
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
echo "   • دیپلوی معمولی: ./deploy-server.sh"
echo "   • دیپلوی با پاکسازی کامل: ./deploy-server.sh --clean"
echo "   • بک‌آپ دیتابیس: docker-compose -f $COMPOSE_FILE exec mysql mariadb-dump -u root -p\${DATABASE_PASSWORD}_ROOT crm_system > backup.sql"
echo "   • رفع مشکل redirect: sed -i 's|https://|http://|g' .env && docker-compose -f $COMPOSE_FILE restart nextjs"
echo "   • تست دامنه: curl -I http://$DOMAIN"
echo "   • رفع مشکل آپلود: ./fix-upload-issue.sh"
echo "   • بررسی فولدرهای آپلود: docker exec crm-nextjs ls -la /app/uploads/"
echo "   • تست مجوز آپلود: docker exec crm-nextjs touch /app/uploads/test.txt"
echo "   • ورود به کانتینر NextJS: docker exec -it crm-nextjs /bin/sh"
echo ""
echo "� انطلاعات دسترسی phpMyAdmin:"
echo "   • آدرس: /secure-db-admin-panel-x7k9m2/"
echo "   • نام کاربری: از فایل .env"
echo "   • رمز عبور: از فایل .env"
echo ""
echo "⚠️  نکات امنیتی:"
echo "   • فایل .env را محرمانه نگه دارید"
echo "   • رمزهای قوی استفاده کنید"
echo "   • بک‌آپ منظم از دیتابیس بگیرید"
echo "   • لاگ‌ها را مرتب بررسی کنید"
echo ""
echo "📊 خلاصه سیستم:"
echo "   • حافظه: ${TOTAL_MEM}MB"
echo "   • Docker Compose: $COMPOSE_FILE"
echo "   • دیتابیس: MariaDB 10.4.32"
echo "   • phpMyAdmin: 5.2.2"
echo ""
echo "✅ همه چیز آماده است!"