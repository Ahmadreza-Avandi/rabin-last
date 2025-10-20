#!/bin/bash

# 🧪 Comprehensive Deployment Test Script
# این اسکریپت تمام مراحل deployment را تست می‌کند

set +e  # ادامه داشته باشد حتی اگر خطا داشت

DOMAIN="crm.robintejarat.com"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

TEST_RESULTS=0
TESTS_PASSED=0
TESTS_FAILED=0

# تابع برای چاپ نتایج
print_test() {
    local test_name=$1
    local result=$2
    
    if [ $result -eq 0 ]; then
        echo -e "${GREEN}✅${NC} $test_name"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌${NC} $test_name"
        ((TESTS_FAILED++))
    fi
}

print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ═══════════════════════════════════════════════════════════════
# 🔍 بخش 1: بررسی Docker
# ═══════════════════════════════════════════════════════════════

print_section "🐳 بخش 1: بررسی Docker Infrastructure"

# بررسی Docker
docker --version > /dev/null 2>&1
print_test "Docker installed" $?

docker-compose --version > /dev/null 2>&1
print_test "Docker Compose installed" $?

# بررسی Docker daemon
docker info > /dev/null 2>&1
print_test "Docker daemon running" $?

echo ""

# ═══════════════════════════════════════════════════════════════
# 🚀 بخش 2: بررسی Containers
# ═══════════════════════════════════════════════════════════════

print_section "🚀 بخش 2: بررسی Container Status"

# بررسی اینکه containers موجود هستند
MYSQL_RUNNING=$(docker ps --filter "name=crm-mysql" --filter "status=running" -q)
print_test "MySQL container running" $([ -n "$MYSQL_RUNNING" ] && echo 0 || echo 1)

NEXTJS_RUNNING=$(docker ps --filter "name=crm-nextjs" --filter "status=running" -q)
print_test "Next.js container running" $([ -n "$NEXTJS_RUNNING" ] && echo 0 || echo 1)

RABIN_RUNNING=$(docker ps --filter "name=crm-rabin-voice" --filter "status=running" -q)
print_test "Rabin Voice container running" $([ -n "$RABIN_RUNNING" ] && echo 0 || echo 1)

NGINX_RUNNING=$(docker ps --filter "name=crm-nginx" --filter "status=running" -q)
print_test "Nginx container running" $([ -n "$NGINX_RUNNING" ] && echo 0 || echo 1)

echo ""

# ═══════════════════════════════════════════════════════════════
# 🗄️ بخش 3: بررسی Database
# ═══════════════════════════════════════════════════════════════

print_section "🗄️ بخش 3: بررسی Database"

# Load environment
if [ -f ".env" ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

DB_PASS="${DATABASE_PASSWORD:-1234}"

# بررسی MySQL connectivity
MYSQL_TEST=$(docker exec crm-mysql mysql -u root -p$DB_PASS -e "SELECT 1;" 2>/dev/null)
print_test "MySQL root user accessible" $([ -n "$MYSQL_TEST" ] && echo 0 || echo 1)

# بررسی crm_app_user
APP_USER_TEST=$(docker exec crm-mysql mysql -u crm_app_user -p$DB_PASS -e "SELECT 1;" 2>/dev/null)
print_test "crm_app_user accessible" $([ -n "$APP_USER_TEST" ] && echo 0 || echo 1)

# بررسی databases
CRM_DB=$(docker exec crm-mysql mysql -u root -p$DB_PASS -e "SHOW DATABASES LIKE 'crm_system';" 2>/dev/null)
print_test "crm_system database exists" $([ -n "$CRM_DB" ] && echo 0 || echo 1)

SAAS_DB=$(docker exec crm-mysql mysql -u root -p$DB_PASS -e "SHOW DATABASES LIKE 'saas_master';" 2>/dev/null)
print_test "saas_master database exists" $([ -n "$SAAS_DB" ] && echo 0 || echo 1)

# بررسی tables
TABLES_COUNT=$(docker exec crm-mysql mysql -u crm_app_user -p$DB_PASS crm_system -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='crm_system';" 2>/dev/null | tail -1)
print_test "Database tables imported ($TABLES_COUNT tables)" $([ "$TABLES_COUNT" -gt 5 ] && echo 0 || echo 1)

echo ""

# ═══════════════════════════════════════════════════════════════
# 🌐 بخش 4: بررسی Network و Connectivity
# ═══════════════════════════════════════════════════════════════

print_section "🌐 بخش 4: بررسی Network Connectivity"

# بررسی database connection از Rabin Voice
RABIN_DB_TEST=$(docker exec crm-rabin-voice curl -s http://localhost:3001/rabin-voice/api/database?action=test-connection 2>/dev/null | grep -o "success.*true")
print_test "Rabin Voice → Database connection" $([ -n "$RABIN_DB_TEST" ] && echo 0 || echo 1)

# بررسی database connection از Next.js
NEXTJS_DB_TEST=$(docker exec crm-nextjs curl -s http://localhost:3000/api/health 2>/dev/null | grep -o "ok\|success")
print_test "Next.js → Health API responding" $([ -n "$NEXTJS_DB_TEST" ] && echo 0 || echo 1)

# بررسی Nginx
NGINX_TEST=$(docker exec crm-nginx curl -s http://localhost/health 2>/dev/null)
print_test "Nginx health check" $([ $? -eq 0 ] && echo 0 || echo 1)

echo ""

# ═══════════════════════════════════════════════════════════════
# 🔐 بخش 5: بررسی ENV Files
# ═══════════════════════════════════════════════════════════════

print_section "🔐 بخش 5: بررسی Environment Files"

# بررسی .env
[ -f ".env" ]
print_test "Root .env file exists" $?

# بررسی صدای رابین/.env
[ -f "صدای رابین/.env" ]
print_test "Rabin Voice .env exists" $?

# بررسی DATABASE_PASSWORD sync
ROOT_DB_PASS=$(grep "^DATABASE_PASSWORD=" .env | cut -d'=' -f2 | tr -d ' ')
RABIN_DB_PASS=$(grep "^DATABASE_PASSWORD=" "صدای رابین/.env" | cut -d'=' -f2 | tr -d ' ')

if [ "$ROOT_DB_PASS" = "$RABIN_DB_PASS" ] && [ -n "$ROOT_DB_PASS" ]; then
    print_test "DATABASE_PASSWORD synced between .env files" 0
else
    print_test "DATABASE_PASSWORD synced between .env files" 1
fi

# بررسی NEXTAUTH_SECRET
grep -q "NEXTAUTH_SECRET=" .env
print_test "NEXTAUTH_SECRET configured" $?

# بررسی JWT_SECRET
grep -q "JWT_SECRET=" .env
print_test "JWT_SECRET configured" $?

echo ""

# ═══════════════════════════════════════════════════════════════
# 🔊 بخش 6: بررسی Rabin Voice Configuration
# ═══════════════════════════════════════════════════════════════

print_section "🎤 بخش 6: بررسی Rabin Voice Configuration"

# بررسی OPENROUTER_API_KEY
OPENROUTER_KEY=$(grep "^OPENROUTER_API_KEY=" "صدای رابین/.env" | cut -d'=' -f2 | tr -d ' ')
if [[ $OPENROUTER_KEY == sk-or-v1-* ]]; then
    print_test "OPENROUTER_API_KEY configured (valid format)" 0
else
    print_test "OPENROUTER_API_KEY configured (valid format)" 1
    echo "   ⚠️  Current value: $OPENROUTER_KEY"
fi

# بررسی TTS_API_URL
grep -q "TTS_API_URL=" "صدای رابین/.env"
print_test "TTS_API_URL configured" $?

# بررسی Rabin Voice health
RABIN_HEALTH=$(curl -s http://localhost:3001/rabin-voice/api/health 2>/dev/null)
print_test "Rabin Voice health endpoint responding" $([ -n "$RABIN_HEALTH" ] && echo 0 || echo 1)

echo ""

# ═══════════════════════════════════════════════════════════════
# 🌍 بخش 7: بررسی Domain و SSL
# ═══════════════════════════════════════════════════════════════

print_section "🌍 بخش 7: بررسی Domain Access"

# بررسی DNS resolution
nslookup $DOMAIN > /dev/null 2>&1
print_test "Domain DNS resolution" $?

# بررسی SSL certificate
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    CERT_EXPIRY=$(sudo openssl x509 -enddate -noout -in "/etc/letsencrypt/live/$DOMAIN/cert.pem" 2>/dev/null | cut -d= -f2)
    echo -e "${GREEN}✅${NC} SSL certificate exists (expires: $CERT_EXPIRY)"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️ ${NC} SSL certificate not found (expected for new deployment)"
    ((TESTS_FAILED++))
fi

# بررسی اگر domain accessible است (از داخل سرور)
CURL_TEST=$(curl -s -I http://localhost 2>/dev/null | head -1)
print_test "Web server responding locally" $([ -n "$CURL_TEST" ] && echo 0 || echo 1)

echo ""

# ═══════════════════════════════════════════════════════════════
# 📁 بخش 8: بررسی File Structure
# ═══════════════════════════════════════════════════════════════

print_section "📁 بخش 8: بررسی File Structure"

# بررسی database directory
[ -d "database" ] && [ -f "database/crm_system.sql" ]
print_test "Database files present" $?

# بررسی uploads directory
[ -d "uploads" ] && [ -d "uploads/documents" ] && [ -d "uploads/avatars" ]
print_test "Upload directories created" $?

# بررسی Rabin Voice build
[ -d "صدای رابین/.next" ]
print_test "Rabin Voice build exists" $?

# بررسی Next.js build
[ -d "app" ] && [ -f "package.json" ]
print_test "Main app source files present" $?

echo ""

# ═══════════════════════════════════════════════════════════════
# 🔧 بخش 9: Performance و Resource Usage
# ═══════════════════════════════════════════════════════════════

print_section "🔧 بخش 9: Performance Checks"

# بررسی memory usage
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%d", $2}')
USED_MEM=$(free -m | awk 'NR==2{printf "%d", $3}')
MEM_PERCENT=$((USED_MEM * 100 / TOTAL_MEM))

if [ $MEM_PERCENT -lt 80 ]; then
    echo -e "${GREEN}✅${NC} Memory usage: $MEM_PERCENT% ($USED_MEM/$TOTAL_MEM MB)"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️ ${NC} High memory usage: $MEM_PERCENT% ($USED_MEM/$TOTAL_MEM MB)"
    ((TESTS_FAILED++))
fi

# بررسی disk usage
DISK_USAGE=$(df -h / | awk 'NR==2{printf "%s", $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "${GREEN}✅${NC} Disk usage: $DISK_USAGE%"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌${NC} High disk usage: $DISK_USAGE%"
    ((TESTS_FAILED++))
fi

# بررسی Docker disk usage
DOCKER_IMAGES=$(docker images | wc -l)
echo -e "${BLUE}ℹ️ ${NC} Docker images: $((DOCKER_IMAGES - 1))"

echo ""

# ═══════════════════════════════════════════════════════════════
# 📊 بخش 10: Log Analysis
# ═══════════════════════════════════════════════════════════════

print_section "📊 بخش 10: Log Analysis"

# بررسی MySQL logs برای errors
MYSQL_ERRORS=$(docker logs crm-mysql 2>&1 | grep -i "error" | head -1)
if [ -z "$MYSQL_ERRORS" ]; then
    echo -e "${GREEN}✅${NC} MySQL: No errors in logs"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️ ${NC} MySQL: Some warnings found"
    ((TESTS_FAILED++))
fi

# بررسی Rabin Voice logs
RABIN_ERRORS=$(docker logs crm-rabin-voice 2>&1 | grep -i "error" | head -1)
if [ -z "$RABIN_ERRORS" ]; then
    echo -e "${GREEN}✅${NC} Rabin Voice: No critical errors"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️ ${NC} Rabin Voice: Some issues detected"
    ((TESTS_FAILED++))
fi

# بررسی Next.js logs
NEXTJS_ERRORS=$(docker logs crm-nextjs 2>&1 | grep -i "error" | grep -v "UnhandledPromiseRejectionWarning" | head -1)
if [ -z "$NEXTJS_ERRORS" ]; then
    echo -e "${GREEN}✅${NC} Next.js: No critical errors"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️ ${NC} Next.js: Some issues detected"
    ((TESTS_FAILED++))
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 📝 خلاصه نتایج
# ═══════════════════════════════════════════════════════════════

print_section "📝 خلاصه نتایج"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))

echo ""
echo -e "  ${GREEN}✅ موفق: $TESTS_PASSED${NC}"
echo -e "  ${RED}❌ ناموفق: $TESTS_FAILED${NC}"
echo -e "  📊 نرخ موفقیت: $SUCCESS_RATE%"
echo ""

# تعیین نتیجه نهایی
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 تمام تست‌ها موفق بودند!${NC}"
    echo -e "${GREEN}✅ Deployment آماده برای Production است!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
elif [ $TESTS_FAILED -le 3 ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠️ تعدادی از تست‌ها ناموفق بود${NC}"
    echo -e "${YELLOW}👉 نتایج بالا را بررسی کنید${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ خطاهای متعدد! Deployment موفق نبوده${NC}"
    echo -e "${RED}👉 مراحل troubleshooting را اجرا کنید${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
fi