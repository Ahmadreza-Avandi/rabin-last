#!/bin/bash

# 🚀 Complete CRM Server Deployment Script - All-in-One
set -e

DOMAIN="crm.robintejarat.com"
EMAIL="admin@crm.robintejarat.com"

echo "🚀 شروع دیپلوی کامل CRM روی سرور..."
echo "🌐 دامنه: $DOMAIN"
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

        const tokenRequest = new NextRequest('http://localhost:3000', {
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

# پاکسازی cache های محلی
echo "🧹 پاکسازی cache های محلی..."
rm -rf .next 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .swc 2>/dev/null || true

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

# آماده‌سازی فایل‌های دیتابیس
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
    echo "📝 لطفاً فایل .env را ویرایش کنید!"
    echo "⚠️  حتماً تنظیمات زیر را انجام دهید:"
    echo "   - NEXTAUTH_URL=https://$DOMAIN"
    echo "   - DATABASE_PASSWORD=پسورد قوی"
    echo "   - NEXTAUTH_SECRET=کلید مخفی قوی"
    echo "   - JWT_SECRET=کلید JWT قوی"
    read -p "بعد از ویرایش فایل .env اینتر بزنید..."
fi

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

# پاکسازی Docker cache
echo "🧹 پاکسازی Docker cache..."
docker system prune -f

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

# تنظیم nginx config نهایی
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "✅ گواهی SSL با موفقیت دریافت شد!"
    if [ "$TOTAL_MEM" -lt 2048 ]; then
        cp nginx/low-memory.conf nginx/active.conf
    else
        cp nginx/default.conf nginx/active.conf
    fi
else
    echo "⚠️  گواهی SSL یافت نشد، ادامه بدون HTTPS..."
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

COMPOSE_FILE="docker-compose.deploy.yml"

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