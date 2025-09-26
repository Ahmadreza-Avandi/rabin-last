#!/bin/bash

# 🧪 Complete API Testing Script for CRM System
# Tests both local and Docker container environments with authentication

set -e

DOMAIN="crm.robintejarat.com"
LOCAL_URL="http://localhost:3000"
DOCKER_URL="http://$DOMAIN"

# Login credentials
LOGIN_EMAIL="Robintejarat@gmail.com"
LOGIN_PASSWORD="admin123"

# Global variables for tokens
LOCAL_TOKEN=""
DOCKER_TOKEN=""

echo "🧪 شروع تست کامل API های CRM با احراز هویت..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to log with timestamp
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
}

# Function to perform login and get token
login_and_get_token() {
    local base_url=$1
    local description=$2
    
    log "🔐 Attempting login: $description"
    log "URL: $base_url/api/auth/login"
    log "Email: $LOGIN_EMAIL"
    
    local login_data="{\"email\":\"$LOGIN_EMAIL\",\"password\":\"$LOGIN_PASSWORD\"}"
    
    local response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$login_data" \
        "$base_url/api/auth/login" \
        --connect-timeout 15 || echo -e "\n000")
    
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)
    
    echo "Login Response Code: $http_code"
    echo "Login Response Body: $body" | head -c 300
    
    if [ "$http_code" = "200" ]; then
        # Extract token from response
        local token=$(echo "$body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$token" ]; then
            success "Login successful - Token obtained"
            echo "$token"
            return 0
        else
            error "Login successful but no token found"
            return 1
        fi
    else
        error "Login failed ($http_code)"
        return 1
    fi
}

# Function to test API endpoint with authentication
test_api() {
    local url=$1
    local method=${2:-GET}
    local data=${3:-""}
    local expected_status=${4:-200}
    local description=$5
    local token=$6
    
    log "Testing: $description"
    log "URL: $url"
    log "Method: $method"
    
    local auth_header=""
    if [ -n "$token" ]; then
        auth_header="-H \"Authorization: Bearer $token\""
        info "Using authentication token"
    else
        warning "No authentication token provided"
    fi
    
    local response
    if [ "$method" = "GET" ]; then
        if [ -n "$token" ]; then
            response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $token" "$url" --connect-timeout 10 || echo -e "\n000")
        else
            response=$(curl -s -w "\n%{http_code}" "$url" --connect-timeout 10 || echo -e "\n000")
        fi
    elif [ "$method" = "POST" ] && [ -n "$data" ]; then
        if [ -n "$token" ]; then
            response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d "$data" "$url" --connect-timeout 10 || echo -e "\n000")
        else
            response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$url" --connect-timeout 10 || echo -e "\n000")
        fi
    else
        if [ -n "$token" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Authorization: Bearer $token" "$url" --connect-timeout 10 || echo -e "\n000")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" --connect-timeout 10 || echo -e "\n000")
        fi
    fi
    
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)
    
    echo "Response Code: $http_code"
    echo "Response Body: $body" | head -c 200
    if [ ${#body} -gt 200 ]; then
        echo "... (truncated)"
    fi
    
    if [ "$http_code" = "$expected_status" ] || [ "$http_code" = "200" ]; then
        success "$description - OK ($http_code)"
    elif [ "$http_code" = "401" ] && [ -z "$token" ]; then
        warning "$description - Unauthorized (expected without token) ($http_code)"
    else
        error "$description - Failed ($http_code)"
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Function to test file upload with authentication
test_file_upload() {
    local url=$1
    local description=$2
    local token=$3
    
    log "Testing File Upload: $description"
    log "URL: $url"
    
    # Create a test file
    echo "This is a test document for API testing - $(date)" > /tmp/test-document.txt
    
    local response
    if [ -n "$token" ]; then
        info "Using authentication token for upload"
        response=$(curl -s -w "\n%{http_code}" \
            -X POST \
            -H "Authorization: Bearer $token" \
            -F "file=@/tmp/test-document.txt" \
            -F "title=Test Document $(date +%H%M%S)" \
            -F "description=Test upload from script at $(date)" \
            -F "accessLevel=public" \
            "$url" --connect-timeout 15 || echo -e "\n000")
    else
        warning "No authentication token provided for upload"
        response=$(curl -s -w "\n%{http_code}" \
            -X POST \
            -F "file=@/tmp/test-document.txt" \
            -F "title=Test Document $(date +%H%M%S)" \
            -F "description=Test upload from script at $(date)" \
            -F "accessLevel=public" \
            "$url" --connect-timeout 15 || echo -e "\n000")
    fi
    
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)
    
    echo "Response Code: $http_code"
    echo "Response Body: $body"
    
    if [ "$http_code" = "200" ]; then
        success "$description - Upload successful ($http_code)"
    elif [ "$http_code" = "401" ] && [ -z "$token" ]; then
        warning "$description - Unauthorized (expected without token) ($http_code)"
    else
        error "$description - Upload failed ($http_code)"
    fi
    
    # Clean up
    rm -f /tmp/test-document.txt
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Function to test user info with token
test_user_info() {
    local base_url=$1
    local description=$2
    local token=$3
    
    if [ -z "$token" ]; then
        warning "No token available for user info test: $description"
        return 1
    fi
    
    log "Testing User Info: $description"
    
    local response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $token" \
        "$base_url/api/auth/me" \
        --connect-timeout 10 || echo -e "\n000")
    
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)
    
    echo "User Info Response Code: $http_code"
    echo "User Info Response: $body"
    
    if [ "$http_code" = "200" ]; then
        success "User info retrieved successfully"
        # Extract user details
        local user_name=$(echo "$body" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
        local user_email=$(echo "$body" | grep -o '"email":"[^"]*"' | cut -d'"' -f4)
        local user_role=$(echo "$body" | grep -o '"role":"[^"]*"' | cut -d'"' -f4)
        
        if [ -n "$user_name" ]; then
            info "User: $user_name ($user_email) - Role: $user_role"
        fi
    else
        error "Failed to retrieve user info ($http_code)"
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# ═══════════════════════════════════════════════════════════════
# 🔍 مرحله 1: بررسی وضعیت سرویس‌ها
# ═══════════════════════════════════════════════════════════════

echo ""
log "🔍 مرحله 1: بررسی وضعیت سرویس‌ها"

# Check Docker containers
log "بررسی کانتینرهای Docker..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(crm|nextjs|nginx|mysql)"

echo ""

# Check if services are running
log "بررسی دسترسی به سرویس‌ها..."

# Test local NextJS
if curl -f -s "$LOCAL_URL" >/dev/null 2>&1; then
    success "NextJS محلی در دسترس است"
else
    warning "NextJS محلی در دسترس نیست"
fi

# Test domain
if curl -f -s "$DOCKER_URL" >/dev/null 2>&1; then
    success "دامنه $DOMAIN در دسترس است"
else
    warning "دامنه $DOMAIN در دسترس نیست"
fi

# ═══════════════════════════════════════════════════════════════
# 🔐 مرحله 2: احراز هویت (Login)
# ═══════════════════════════════════════════════════════════════

echo ""
log "🔐 مرحله 2: احراز هویت و دریافت توکن"

# Login to local environment
if LOCAL_TOKEN=$(login_and_get_token "$LOCAL_URL" "Local Environment"); then
    success "Local login successful"
    info "Local Token: ${LOCAL_TOKEN:0:20}..."
else
    error "Local login failed"
    LOCAL_TOKEN=""
fi

echo ""

# Login to Docker environment
if DOCKER_TOKEN=$(login_and_get_token "$DOCKER_URL" "Docker Environment"); then
    success "Docker login successful"
    info "Docker Token: ${DOCKER_TOKEN:0:20}..."
else
    error "Docker login failed"
    DOCKER_TOKEN=""
fi

# ═══════════════════════════════════════════════════════════════
# 👤 مرحله 3: تست اطلاعات کاربر
# ═══════════════════════════════════════════════════════════════

echo ""
log "👤 مرحله 3: تست اطلاعات کاربر"

# Test user info with local token
test_user_info "$LOCAL_URL" "Local Environment" "$LOCAL_TOKEN"

# Test user info with Docker token
test_user_info "$DOCKER_URL" "Docker Environment" "$DOCKER_TOKEN"

# ═══════════════════════════════════════════════════════════════
# 🧪 مرحله 4: تست API های اصلی (محلی)
# ═══════════════════════════════════════════════════════════════

echo ""
log "🧪 مرحله 4: تست API های اصلی (محلی)"

# Test Documents API
test_api "$LOCAL_URL/api/documents" "GET" "" "200" "Documents API - GET (Local)" "$LOCAL_TOKEN"
test_file_upload "$LOCAL_URL/api/documents" "Documents Upload (Local)" "$LOCAL_TOKEN"

# Test Events API
test_api "$LOCAL_URL/api/events" "GET" "" "200" "Events API - GET (Local)" "$LOCAL_TOKEN"

event_data='{"title":"Test Event Local","description":"Test event from script","start":"2024-12-01T10:00:00Z","end":"2024-12-01T11:00:00Z","type":"meeting"}'
test_api "$LOCAL_URL/api/events" "POST" "$event_data" "200" "Events API - POST (Local)" "$LOCAL_TOKEN"

# Test other APIs
test_api "$LOCAL_URL/api/activities" "GET" "" "200" "Activities API (Local)" "$LOCAL_TOKEN"
test_api "$LOCAL_URL/api/feedback" "GET" "" "200" "Feedback API (Local)" "$LOCAL_TOKEN"
test_api "$LOCAL_URL/api/sales" "GET" "" "200" "Sales API (Local)" "$LOCAL_TOKEN"
test_api "$LOCAL_URL/api/system/stats" "GET" "" "200" "System Stats API (Local)" "$LOCAL_TOKEN"

# Test without authentication (should fail)
echo ""
log "🔒 تست بدون احراز هویت (باید ناموفق باشد)"
test_api "$LOCAL_URL/api/documents" "GET" "" "401" "Documents API - No Auth (Local)" ""

# ═══════════════════════════════════════════════════════════════
# 🐳 مرحله 5: تست API های اصلی (داکر)
# ═══════════════════════════════════════════════════════════════

echo ""
log "🐳 مرحله 5: تست API های اصلی (داکر)"

# Test Documents API
test_api "$DOCKER_URL/api/documents" "GET" "" "200" "Documents API - GET (Docker)" "$DOCKER_TOKEN"
test_file_upload "$DOCKER_URL/api/documents" "Documents Upload (Docker)" "$DOCKER_TOKEN"

# Test Events API
test_api "$DOCKER_URL/api/events" "GET" "" "200" "Events API - GET (Docker)" "$DOCKER_TOKEN"

event_data_docker='{"title":"Test Event Docker","description":"Test event from script on Docker","start":"2024-12-01T14:00:00Z","end":"2024-12-01T15:00:00Z","type":"meeting"}'
test_api "$DOCKER_URL/api/events" "POST" "$event_data_docker" "200" "Events API - POST (Docker)" "$DOCKER_TOKEN"

# Test other APIs
test_api "$DOCKER_URL/api/activities" "GET" "" "200" "Activities API (Docker)" "$DOCKER_TOKEN"
test_api "$DOCKER_URL/api/feedback" "GET" "" "200" "Feedback API (Docker)" "$DOCKER_TOKEN"
test_api "$DOCKER_URL/api/sales" "GET" "" "200" "Sales API (Docker)" "$DOCKER_TOKEN"
test_api "$DOCKER_URL/api/system/stats" "GET" "" "200" "System Stats API (Docker)" "$DOCKER_TOKEN"

# Test without authentication (should fail)
echo ""
log "🔒 تست بدون احراز هویت (باید ناموفق باشد)"
test_api "$DOCKER_URL/api/documents" "GET" "" "401" "Documents API - No Auth (Docker)" ""

# ═══════════════════════════════════════════════════════════════
# 🔍 مرحله 6: تست از داخل کانتینر
# ═══════════════════════════════════════════════════════════════

echo ""
log "🔍 مرحله 6: تست از داخل کانتینر"

# Test from inside NextJS container
log "تست از داخل کانتینر NextJS..."

# Check if uploads directory exists in container
log "بررسی فولدرهای آپلود در کانتینر..."
docker exec crm-nextjs ls -la /app/uploads/ 2>/dev/null && success "فولدر uploads موجود است" || error "فولدر uploads موجود نیست"
docker exec crm-nextjs ls -la /app/public/uploads/ 2>/dev/null && success "فولدر public/uploads موجود است" || error "فولدر public/uploads موجود نیست"

# Test write permissions
log "تست مجوز نوشتن در کانتینر..."
if docker exec crm-nextjs touch /app/uploads/test-write.txt 2>/dev/null; then
    success "مجوز نوشتن در uploads موجود است"
    docker exec crm-nextjs rm -f /app/uploads/test-write.txt 2>/dev/null
else
    error "مجوز نوشتن در uploads وجود ندارد"
fi

# Test API from inside container
log "تست API از داخل کانتینر..."
docker exec crm-nextjs curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/documents 2>/dev/null && success "API documents از داخل کانتینر قابل دسترس است" || error "API documents از داخل کانتینر قابل دسترس نیست"

# Check database connection from container
log "تست اتصال دیتابیس از کانتینر..."
docker exec crm-nextjs node -e "
const mysql = require('mysql2/promise');
const config = {
  host: process.env.DATABASE_HOST || 'mysql',
  user: process.env.DATABASE_USER || 'crm_app_user',
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || 'crm_system'
};
mysql.createConnection(config).then(() => {
  console.log('Database connection successful');
  process.exit(0);
}).catch(err => {
  console.error('Database connection failed:', err.message);
  process.exit(1);
});
" 2>/dev/null && success "اتصال دیتابیس از کانتینر موفق است" || error "اتصال دیتابیس از کانتینر ناموفق است"

# ═══════════════════════════════════════════════════════════════
# 📊 مرحله 7: بررسی لاگ‌ها و خطاها
# ═══════════════════════════════════════════════════════════════

echo ""
log "📊 مرحله 7: بررسی لاگ‌ها و خطاها"

# Check NextJS logs
log "لاگ‌های NextJS (آخرین 20 خط):"
docker logs crm-nextjs --tail=20 2>/dev/null || warning "نمی‌توان لاگ NextJS را خواند"

echo ""

# Check MySQL logs
log "لاگ‌های MySQL (آخرین 10 خط):"
docker logs crm-mysql --tail=10 2>/dev/null || warning "نمی‌توان لاگ MySQL را خواند"

echo ""

# Check Nginx logs
log "لاگ‌های Nginx (آخرین 10 خط):"
docker logs crm-nginx --tail=10 2>/dev/null || warning "نمی‌توان لاگ Nginx را خواند"

# ═══════════════════════════════════════════════════════════════
# 🔧 مرحله 8: تست مسیرهای فایل و volumes
# ═══════════════════════════════════════════════════════════════

echo ""
log "🔧 مرحله 8: تست مسیرهای فایل و volumes"

# Check volume mounts
log "بررسی volume mounts..."
docker inspect crm-nextjs | grep -A 10 -B 5 "Mounts" || warning "نمی‌توان اطلاعات volumes را خواند"

# Test file creation and access
log "تست ایجاد و دسترسی فایل..."

# Create test file on host
mkdir -p uploads/documents
echo "Test file from host" > uploads/documents/host-test.txt

# Check if file is visible in container
if docker exec crm-nextjs cat /app/uploads/documents/host-test.txt 2>/dev/null; then
    success "فایل از host در کانتینر قابل مشاهده است"
else
    error "فایل از host در کانتینر قابل مشاهده نیست"
fi

# Create file in container
docker exec crm-nextjs sh -c 'echo "Test file from container" > /app/uploads/documents/container-test.txt' 2>/dev/null

# Check if file is visible on host
if [ -f "uploads/documents/container-test.txt" ]; then
    success "فایل از کانتینر در host قابل مشاهده است"
else
    error "فایل از کانتینر در host قابل مشاهده نیست"
fi

# Clean up test files
rm -f uploads/documents/host-test.txt uploads/documents/container-test.txt 2>/dev/null
docker exec crm-nextjs rm -f /app/uploads/documents/host-test.txt /app/uploads/documents/container-test.txt 2>/dev/null

# ═══════════════════════════════════════════════════════════════
# 📋 خلاصه نتایج
# ═══════════════════════════════════════════════════════════════

echo ""
log "📋 خلاصه نتایج تست"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Authentication status
log "وضعیت احراز هویت:"
if [ -n "$LOCAL_TOKEN" ]; then
    success "Local authentication: موفق"
else
    error "Local authentication: ناموفق"
fi

if [ -n "$DOCKER_TOKEN" ]; then
    success "Docker authentication: موفق"
else
    error "Docker authentication: ناموفق"
fi

echo ""

# System info
log "اطلاعات سیستم:"
echo "- تاریخ و زمان: $(date)"
echo "- دامنه: $DOMAIN"
echo "- URL محلی: $LOCAL_URL"
echo "- URL داکر: $DOCKER_URL"
echo "- ایمیل تست: $LOGIN_EMAIL"

echo ""

# Container status
log "وضعیت کانتینرها:"
docker ps --format "{{.Names}}: {{.Status}}" | grep -E "(crm|nextjs|nginx|mysql)" || warning "هیچ کانتینر CRM یافت نشد"

echo ""

# Token info (first 20 chars for security)
if [ -n "$LOCAL_TOKEN" ]; then
    log "Local Token: ${LOCAL_TOKEN:0:20}..."
fi
if [ -n "$DOCKER_TOKEN" ]; then
    log "Docker Token: ${DOCKER_TOKEN:0:20}..."
fi

echo ""

# Recommendations
log "توصیه‌ها:"
echo "1. اگر login ناموفق است، اطلاعات کاربری را بررسی کنید"
echo "2. اگر API documents خطای 500 می‌دهد، جدول documents را بررسی کنید"
echo "3. اگر آپلود فایل کار نمی‌کند، مجوزهای فولدر uploads را بررسی کنید"
echo "4. اگر volumes کار نمی‌کند، docker-compose را restart کنید"
echo "5. برای مشاهده جزئیات بیشتر، لاگ‌های کانتینرها را بررسی کنید"

echo ""

# Final status
if [ -n "$LOCAL_TOKEN" ] || [ -n "$DOCKER_TOKEN" ]; then
    success "تست کامل API ها با احراز هویت به پایان رسید"
else
    warning "تست کامل شد اما مشکل در احراز هویت وجود دارد"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"