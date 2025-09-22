#!/bin/bash

echo "🔍 تست کامل دامنه و سرویس‌ها..."

DOMAIN="crm.robintejarat.com"

echo "1️⃣ بررسی DNS..."
echo "نتیجه nslookup:"
nslookup $DOMAIN || echo "خطا در nslookup"

echo ""
echo "2️⃣ بررسی IP سرور..."
SERVER_IP=$(curl -s ifconfig.me)
echo "IP سرور: $SERVER_IP"

echo ""
echo "3️⃣ تست محلی..."
echo "تست HTTP محلی:"
curl -I http://localhost 2>/dev/null || echo "خطا در HTTP محلی"

echo ""
echo "تست با Host header:"
curl -I -H "Host: $DOMAIN" http://localhost 2>/dev/null || echo "خطا در تست Host header"

echo ""
echo "4️⃣ تست دامنه مستقیم..."
echo "تست HTTP دامنه:"
curl -I http://$DOMAIN 2>/dev/null || echo "خطا در HTTP دامنه"

echo ""
echo "تست HTTPS دامنه:"
curl -I https://$DOMAIN 2>/dev/null || echo "خطا در HTTPS دامنه"

echo ""
echo "5️⃣ بررسی وضعیت کانتینرها..."
docker-compose -f docker-compose.deploy.yml ps

echo ""
echo "6️⃣ بررسی لاگ‌های nginx..."
echo "آخرین لاگ‌های nginx:"
docker-compose -f docker-compose.deploy.yml logs --tail=10 nginx

echo ""
echo "7️⃣ بررسی لاگ‌های nextjs..."
echo "آخرین لاگ‌های nextjs:"
docker-compose -f docker-compose.deploy.yml logs --tail=10 nextjs

echo ""
echo "8️⃣ بررسی پورت‌ها..."
echo "پورت‌های باز:"
netstat -tlnp | grep -E ':80|:443' || ss -tlnp | grep -E ':80|:443'

echo ""
echo "9️⃣ بررسی فایروال..."
echo "وضعیت ufw:"
sudo ufw status || echo "ufw غیرفعال یا نصب نیست"

echo ""
echo "🔟 تست نهایی..."
echo "تست کامل دامنه:"
timeout 10 curl -v https://$DOMAIN 2>&1 | head -20

echo ""
echo "✅ تست کامل شد!"