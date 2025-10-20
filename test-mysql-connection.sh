#!/bin/bash

# ===========================================
# 🧪 تست اتصال MySQL و phpMyAdmin
# ===========================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 تست اتصال MySQL و phpMyAdmin"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# بررسی کانتینر MySQL
echo "🔍 بررسی کانتینر MySQL..."
if docker ps | grep -q crm_mysql; then
    echo "✅ کانتینر MySQL در حال اجرا است"
else
    echo "❌ کانتینر MySQL در حال اجرا نیست!"
    exit 1
fi

echo ""

# تست اتصال MySQL با root بدون پسورد
echo "🧪 تست اتصال MySQL با root (بدون پسورد)..."
if docker exec crm_mysql mariadb -u root -e "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ اتصال MySQL موفق (root بدون پسورد)"
else
    echo "❌ اتصال MySQL ناموفق!"
    echo ""
    echo "📋 جزئیات خطا:"
    docker exec crm_mysql mariadb -u root -e "SELECT 1;" 2>&1
    exit 1
fi

echo ""

# نمایش دیتابیس‌ها
echo "📊 لیست دیتابیس‌ها:"
docker exec crm_mysql mariadb -u root -e "SHOW DATABASES;"

echo ""

# بررسی دیتابیس crm_system
echo "🔍 بررسی دیتابیس crm_system..."
if docker exec crm_mysql mariadb -u root -e "USE crm_system; SHOW TABLES;" > /dev/null 2>&1; then
    echo "✅ دیتابیس crm_system موجود است"
    echo ""
    echo "📋 تعداد جداول:"
    docker exec crm_mysql mariadb -u root -e "USE crm_system; SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'crm_system';"
else
    echo "⚠️  دیتابیس crm_system موجود نیست یا خالی است"
fi

echo ""

# بررسی کاربران MySQL
echo "🔍 بررسی کاربران MySQL..."
docker exec crm_mysql mariadb -u root -e "SELECT User, Host FROM mysql.user;"

echo ""

# تست اتصال از NextJS
echo "🧪 تست اتصال از NextJS..."
if docker exec crm_nextjs sh -c 'command -v mariadb' > /dev/null 2>&1; then
    docker exec crm_nextjs mariadb -h mysql -u root -e "SELECT 1;" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ NextJS می‌تواند به MySQL متصل شود"
    else
        echo "⚠️  NextJS نمی‌تواند به MySQL متصل شود"
    fi
else
    echo "⚠️  mariadb client در NextJS نصب نیست (طبیعی است)"
fi

echo ""

# تست اتصال از Rabin Voice
echo "🧪 تست اتصال از Rabin Voice..."
if docker exec crm_rabin_voice sh -c 'command -v mariadb' > /dev/null 2>&1; then
    docker exec crm_rabin_voice mariadb -h mysql -u root -e "SELECT 1;" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Rabin Voice می‌تواند به MySQL متصل شود"
    else
        echo "⚠️  Rabin Voice نمی‌تواند به MySQL متصل شود"
    fi
else
    echo "⚠️  mariadb client در Rabin Voice نصب نیست (طبیعی است)"
fi

echo ""

# بررسی phpMyAdmin
echo "🔍 بررسی phpMyAdmin..."
if docker ps | grep -q crm_phpmyadmin; then
    echo "✅ کانتینر phpMyAdmin در حال اجرا است"
    
    echo ""
    echo "🧪 تست دسترسی به phpMyAdmin..."
    
    # تست از داخل سرور
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/secure-db-admin-panel-x7k9m2/)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ phpMyAdmin در دسترس است (HTTP $HTTP_CODE)"
    else
        echo "⚠️  phpMyAdmin پاسخ غیرمنتظره داد (HTTP $HTTP_CODE)"
    fi
    
    echo ""
    echo "📋 لاگ‌های اخیر phpMyAdmin:"
    docker logs crm_phpmyadmin --tail 10
else
    echo "❌ کانتینر phpMyAdmin در حال اجرا نیست!"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ تست‌ها تمام شد"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 اطلاعات دسترسی phpMyAdmin:"
echo "   🌐 آدرس: https://crm.robintejarat.com/secure-db-admin-panel-x7k9m2/"
echo "   👤 نام کاربری: root"
echo "   🔐 رمز عبور: (خالی - بدون پسورد)"
echo ""
