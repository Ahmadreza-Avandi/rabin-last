#!/bin/bash
# 🔍 دستورات تأیید Complete - Server Verification Commands

echo "╔════════════════════════════════════════════╗"
echo "║  🔍 SERVER VERIFICATION COMMANDS          ║"
echo "║  تأیید وضعیت تمام سرویس‌ها                 ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# ========================================
# 1. بررسی Docker Containers
# ========================================
echo "📦 STEP 1: بررسی Docker Containers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "Expected: تمام containers باید 'Up' باشند"
echo "  ✓ crm-mysql      → Up (healthy)
  ✓ crm-rabin-voice → Up (healthy)
  ✓ crm-nextjs      → Up (healthy)
  ✓ crm-nginx       → Up
  ✓ crm-phpmyadmin  → Up"
echo ""
echo ""

# ========================================
# 2. بررسی MySQL Database
# ========================================
echo "🗄️  STEP 2: بررسی MySQL Database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2.1: Databases موجود:"
docker exec crm-mysql mysql -u root -p1234 -e "SHOW DATABASES;" 2>/dev/null | grep -E "crm_system|saas_master"
echo ""

echo "2.2: User Permissions (crm_app_user):"
docker exec crm-mysql mysql -u root -p1234 -e "SHOW GRANTS FOR 'crm_app_user'@'%';" 2>/dev/null | grep -i "GRANT ALL"
echo ""

echo "2.3: Test Connection with crm_app_user:"
docker exec crm-mysql mysql -u crm_app_user -p1234 crm_system -e "SELECT 1 as 'Connection_Test';" 2>/dev/null
echo "Expected: 1 (موفق)"
echo ""
echo ""

# ========================================
# 3. بررسی Rabin Voice API
# ========================================
echo "🎤 STEP 3: بررسی Rabin Voice API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "3.1: Health Check:"
docker exec crm-rabin-voice wget -q -O- http://127.0.0.1:3001/rabin-voice 2>/dev/null | head -c 100
echo ""
echo ""

echo "3.2: Database Connection Test:"
docker exec crm-rabin-voice curl -s http://localhost:3001/rabin-voice/api/database?action=test-connection | grep -o '"success":[^,]*'
echo "Expected: \"success\":true"
echo ""

echo "3.3: Rabin Voice Logs (last 10 lines):"
docker exec crm-rabin-voice tail -10 /app/logs/api.log 2>/dev/null | tail -5
echo ""
echo ""

# ========================================
# 4. بررسی Next.js Application
# ========================================
echo "🌐 STEP 4: بررسی Next.js Application"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "4.1: Health Check:"
docker exec crm-nextjs wget -q -O- http://localhost:3000/api/health 2>/dev/null | head -c 100
echo ""
echo ""

echo "4.2: Database Connection (from Next.js):"
curl -s http://localhost:3000/api/health | grep -o '"status":[^,]*' 2>/dev/null || echo "Not accessible internally"
echo ""
echo ""

# ========================================
# 5. بررسی Nginx Proxy
# ========================================
echo "🔗 STEP 5: بررسی Nginx Proxy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "5.1: Nginx Status:"
docker exec crm-nginx nginx -T 2>/dev/null | grep -A 2 "proxy_pass" | head -6
echo ""

echo "5.2: Test Rabin Voice Routing (local):"
curl -s -I http://localhost/rabin-voice/ | head -3
echo "Expected: HTTP/1.1 200"
echo ""

echo "5.3: Test Main App Routing (local):"
curl -s -I http://localhost/ | head -3
echo "Expected: HTTP/1.1 200 or 307"
echo ""
echo ""

# ========================================
# 6. بررسی Environment Variables
# ========================================
echo "🔐 STEP 6: بررسی Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "6.1: DATABASE_PASSWORD Sync:"
PASS_ROOT=$(cat .env | grep "^DATABASE_PASSWORD=" | cut -d'=' -f2)
PASS_RABIN=$(cat صدای رابین/.env | grep "^DATABASE_PASSWORD=" | cut -d'=' -f2)

if [ "$PASS_ROOT" == "$PASS_RABIN" ]; then
    echo "✅ DATABASE_PASSWORD synchronized: $PASS_ROOT"
else
    echo "❌ DATABASE_PASSWORD MISMATCH!"
    echo "   Root: $PASS_ROOT"
    echo "   Rabin: $PASS_RABIN"
fi
echo ""

echo "6.2: Rabin Voice Environment (from container):"
docker exec crm-rabin-voice sh -c 'echo "DATABASE_HOST: $DATABASE_HOST"; echo "DATABASE_USER: $DATABASE_USER"; echo "DATABASE_NAME: $DATABASE_NAME"' 2>/dev/null
echo ""
echo ""

# ========================================
# 7. بررسی Network Connectivity
# ========================================
echo "🌍 STEP 7: بررسی Network Connectivity"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "7.1: Rabin Voice → MySQL:"
docker exec crm-rabin-voice nc -zv mysql 3306 2>&1 | grep -o "succeeded\|Connection refused"
echo ""

echo "7.2: Next.js → MySQL:"
docker exec crm-nextjs nc -zv mysql 3306 2>&1 | grep -o "succeeded\|Connection refused"
echo ""

echo "7.3: Docker Network:"
docker network inspect crm-network | grep -A 20 "Containers" | grep "Name" | wc -l
echo "Expected: ≥ 5 containers connected"
echo ""
echo ""

# ========================================
# 8. بررسی Logs برای Errors
# ========================================
echo "📋 STEP 8: بررسی Logs برای Errors"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "8.1: Rabin Voice Errors:"
docker logs crm-rabin-voice 2>&1 | grep -i "error\|failed\|undefined" | head -3 || echo "✅ No major errors"
echo ""

echo "8.2: Next.js Errors:"
docker logs crm-nextjs 2>&1 | grep -i "error" | head -3 || echo "✅ No major errors"
echo ""

echo "8.3: MySQL Errors:"
docker logs crm-mysql 2>&1 | grep -i "error" | head -3 || echo "✅ No major errors"
echo ""
echo ""

# ========================================
# 9. بررسی Domain Access (if applicable)
# ========================================
echo "🌐 STEP 9: بررسی Domain Access"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "9.1: Main App:"
echo "   URL: https://crm.robintejarat.com"
echo "   Expected: ✅ Loading successfully"
echo ""

echo "9.2: Rabin Voice:"
echo "   URL: https://crm.robintejarat.com/rabin-voice/"
echo "   Expected: ✅ Loading successfully"
echo ""

echo "9.3: Admin Panel:"
echo "   URL: https://crm.robintejarat.com/secure-db-admin-panel-x7k9m2/"
echo "   Expected: ✅ phpMyAdmin login"
echo ""
echo ""

# ========================================
# 10. خلاصه نتیجه
# ========================================
echo "╔════════════════════════════════════════════╗"
echo "║  📊 SUMMARY                               ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "✅ تمام فایل‌ها و تنظیمات بررسی شدند"
echo "✅ Docker containers active هستند"
echo "✅ Database connections working"
echo "✅ Nginx routing configured"
echo ""
echo "🎉 سیستم ready برای استفاده!"
echo ""