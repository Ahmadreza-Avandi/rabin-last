#!/bin/bash

# اسکریپت تست سریع آپلود فایل در Docker
# این اسکریپت مشکلات آپلود فایل را در محیط Docker بررسی و اصلاح می‌کند

set -e

# رنگ‌ها
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# تابع لاگ
log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_header() {
    echo -e "\n${CYAN}${'='*60}${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}${'='*60}${NC}"
}

# تعیین فایل docker-compose
COMPOSE_FILE="docker-compose.yml"
if [ ! -f "$COMPOSE_FILE" ]; then
    log_error "فایل $COMPOSE_FILE یافت نشد"
    exit 1
fi

log_header "🚀 تست و اصلاح مشکلات آپلود فایل در Docker"

# بررسی وضعیت کانتینرها
log_info "بررسی وضعیت کانتینرها..."
if ! docker-compose -f $COMPOSE_FILE ps | grep -q "Up"; then
    log_error "کانتینرها در حال اجرا نیستند. ابتدا آنها را راه‌اندازی کنید:"
    echo "docker-compose -f $COMPOSE_FILE up -d"
    exit 1
fi

log_success "کانتینرها در حال اجرا هستند"

# بررسی فولدرهای محلی
log_header "بررسی فولدرهای محلی"

for dir in "uploads" "uploads/documents" "uploads/avatars" "uploads/chat" "uploads/temp" "public/uploads" "public/uploads/documents" "public/uploads/avatars" "public/uploads/chat"; do
    if [ -d "$dir" ]; then
        log_success "فولدر $dir موجود است"
        ls -la "$dir" | head -3
    else
        log_warning "فولدر $dir موجود نیست - ایجاد می‌شود"
        mkdir -p "$dir"
        chmod 777 "$dir"
        log_success "فولدر $dir ایجاد شد"
    fi
done

# بررسی فولدرهای کانتینر
log_header "بررسی فولدرهای کانتینر"

for dir in "/app/uploads" "/app/uploads/documents" "/app/uploads/avatars" "/app/uploads/chat" "/app/uploads/temp" "/app/public/uploads" "/app/public/uploads/documents" "/app/public/uploads/avatars" "/app/public/uploads/chat"; do
    if docker-compose -f $COMPOSE_FILE exec -T nextjs ls -la "$dir" >/dev/null 2>&1; then
        log_success "فولدر $dir در کانتینر موجود است"
    else
        log_warning "فولدر $dir در کانتینر موجود نیست - ایجاد می‌شود"
        docker-compose -f $COMPOSE_FILE exec -T nextjs mkdir -p "$dir" 2>/dev/null || true
    fi
done

# بررسی مجوزهای کانتینر
log_header "بررسی و اصلاح مجوزهای کانتینر"

log_info "بررسی کاربر فعلی در کانتینر:"
docker-compose -f $COMPOSE_FILE exec -T nextjs whoami
docker-compose -f $COMPOSE_FILE exec -T nextjs id

log_info "بررسی مالکیت فولدرهای uploads:"
docker-compose -f $COMPOSE_FILE exec -T nextjs ls -la /app/ | grep uploads || true

# اصلاح مجوزها
log_info "اصلاح مجوزهای uploads در کانتینر..."
docker-compose -f $COMPOSE_FILE exec -T nextjs sh -c "
    mkdir -p /app/uploads/documents /app/uploads/avatars /app/uploads/chat /app/uploads/temp &&
    mkdir -p /app/public/uploads/documents /app/public/uploads/avatars /app/public/uploads/chat &&
    chown -R nextjs:nodejs /app/uploads /app/public/uploads &&
    chmod -R 775 /app/uploads /app/public/uploads
" 2>/dev/null || true

# تست نوشتن فایل
log_header "تست نوشتن فایل در کانتینر"

if docker-compose -f $COMPOSE_FILE exec -T nextjs touch /app/uploads/test-write.txt >/dev/null 2>&1; then
    log_success "نوشتن فایل در /app/uploads موفق"
    docker-compose -f $COMPOSE_FILE exec -T nextjs rm -f /app/uploads/test-write.txt >/dev/null 2>&1
else
    log_error "نوشتن فایل در /app/uploads ناموفق"
fi

if docker-compose -f $COMPOSE_FILE exec -T nextjs touch /app/uploads/documents/test-write.txt >/dev/null 2>&1; then
    log_success "نوشتن فایل در /app/uploads/documents موفق"
    docker-compose -f $COMPOSE_FILE exec -T nextjs rm -f /app/uploads/documents/test-write.txt >/dev/null 2>&1
else
    log_error "نوشتن فایل در /app/uploads/documents ناموفق"
fi

# تست API
log_header "تست API"

log_info "تست health API..."
if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
    log_success "API در دسترس است"
else
    log_warning "API در دسترس نیست"
fi

# بررسی لاگ‌های NextJS
log_header "بررسی لاگ‌های NextJS"
log_info "آخرین لاگ‌های NextJS:"
docker-compose -f $COMPOSE_FILE logs nextjs --tail 10

# نمایش خلاصه
log_header "📊 خلاصه وضعیت"

echo "فولدرهای محلی:"
ls -la uploads/ 2>/dev/null || echo "  فولدر uploads موجود نیست"

echo ""
echo "فولدرهای کانتینر:"
docker-compose -f $COMPOSE_FILE exec -T nextjs ls -la /app/uploads/ 2>/dev/null || echo "  فولدر uploads در کانتینر موجود نیست"

echo ""
echo "مجوزهای کانتینر:"
docker-compose -f $COMPOSE_FILE exec -T nextjs ls -la /app/ | grep uploads || echo "  اطلاعات مجوز در دسترس نیست"

log_header "✅ تست کامل شد"

echo ""
echo "برای تست کامل API، اسکریپت زیر را اجرا کنید:"
echo "node test-documents-api-complete.js"