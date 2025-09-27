#!/bin/bash

# اسکریپت تست کامل API اسناد در محیط Docker
# این اسکریپت مشکلات آپلود فایل و رویدادها را در Docker بررسی می‌کند

set -e

# رنگ‌ها
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# تابع لاگ
log() {
    echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

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
    echo -e "\n${PURPLE}${'='*60}${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}${'='*60}${NC}"
}

# بررسی وجود Docker
check_docker() {
    log_header "بررسی Docker"
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker نصب نیست"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker در حال اجرا نیست"
        exit 1
    fi
    
    log_success "Docker آماده است"
}

# بررسی کانتینرها
check_containers() {
    log_header "بررسی کانتینرها"
    
    containers=("crm-nextjs" "crm-mysql" "crm-nginx")
    
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "$container"; then
            status=$(docker inspect --format='{{.State.Status}}' "$container")
            if [ "$status" = "running" ]; then
                log_success "$container در حال اجرا است"
            else
                log_error "$container متوقف است (وضعیت: $status)"
            fi
        else
            log_error "$container وجود ندارد"
        fi
    done
}

# بررسی volumes
check_volumes() {
    log_header "بررسی Volumes"
    
    log_info "لیست volumes:"
    docker volume ls
    
    # بررسی مسیر uploads در کانتینر
    log_info "بررسی مسیر uploads در کانتینر NextJS:"
    docker exec crm-nextjs ls -la /app/uploads/ || log_warning "مسیر uploads در کانتینر وجود ندارد"
    
    # بررسی مجوزها
    log_info "بررسی مجوزهای uploads:"
    docker exec crm-nextjs ls -la /app/ | grep uploads || log_warning "پوشه uploads یافت نشد"
    
    # بررسی مسیر local
    log_info "بررسی مسیر local uploads:"
    if [ -d "./uploads" ]; then
        ls -la ./uploads/
        log_success "پوشه uploads محلی موجود است"
    else
        log_warning "پوشه uploads محلی وجود ندارد"
        mkdir -p ./uploads/documents
        log_info "پوشه uploads ایجاد شد"
    fi
}

# بررسی دیتابیس
check_database() {
    log_header "بررسی دیتابیس"
    
    # تست اتصال دیتابیس
    log_info "تست اتصال دیتابیس..."
    if docker exec crm-mysql mariadb -u crm_app_user -p1234 -e "SELECT 1;" crm_system &> /dev/null; then
        log_success "اتصال دیتابیس موفق"
    else
        log_error "اتصال دیتابیس ناموفق"
        return 1
    fi
    
    # بررسی جدول documents
    log_info "بررسی جدول documents..."
    if docker exec crm-mysql mariadb -u crm_app_user -p1234 -e "DESCRIBE documents;" crm_system &> /dev/null; then
        log_success "جدول documents موجود است"
        
        # نمایش ساختار جدول
        log_info "ساختار جدول documents:"
        docker exec crm-mysql mariadb -u crm_app_user -p1234 -e "DESCRIBE documents;" crm_system
        
        # تعداد رکوردها
        count=$(docker exec crm-mysql mariadb -u crm_app_user -p1234 -e "SELECT COUNT(*) FROM documents;" crm_system | tail -n 1)
        log_info "تعداد اسناد موجود: $count"
    else
        log_error "جدول documents وجود ندارد"
        return 1
    fi
}

# بررسی لاگ‌های کانتینر
check_logs() {
    log_header "بررسی لاگ‌های کانتینر"
    
    containers=("crm-nextjs" "crm-mysql" "crm-nginx")
    
    for container in "${containers[@]}"; do
        log_info "آخرین لاگ‌های $container:"
        echo "----------------------------------------"
        docker logs "$container" --tail 10 2>&1 || log_warning "نمی‌توان لاگ $container را دریافت کرد"
        echo "----------------------------------------"
    done
}

# تست API health
test_health_api() {
    log_header "تست API Health"
    
    # تست local
    log_info "تست health API محلی..."
    if curl -s http://localhost:3000/api/health > /dev/null; then
        log_success "API محلی پاسخ می‌دهد"
    else
        log_warning "API محلی پاسخ نمی‌دهد"
    fi
    
    # تست production
    log_info "تست health API production..."
    if curl -s https://crm.robintejarat.com/api/health > /dev/null; then
        log_success "API production پاسخ می‌دهد"
    else
        log_warning "API production پاسخ نمی‌دهد"
    fi
}

# تست آپلود فایل در کانتینر
test_file_upload_in_container() {
    log_header "تست آپلود فایل در کانتینر"
    
    # ایجاد فایل تست در کانتینر
    log_info "ایجاد فایل تست در کانتینر..."
    docker exec crm-nextjs sh -c 'echo "test file content" > /tmp/test-upload.txt'
    
    # بررسی مجوزهای نوشتن
    log_info "بررسی مجوزهای نوشتن در /app/uploads..."
    docker exec crm-nextjs sh -c 'touch /app/uploads/test-write-permission.txt && rm /app/uploads/test-write-permission.txt' && \
        log_success "مجوز نوشتن در uploads موجود است" || \
        log_error "مجوز نوشتن در uploads وجود ندارد"
    
    # بررسی مجوزهای کاربر nextjs
    log_info "بررسی کاربر فعلی در کانتینر:"
    docker exec crm-nextjs whoami
    docker exec crm-nextjs id
    
    # بررسی مالکیت پوشه uploads
    log_info "بررسی مالکیت پوشه uploads:"
    docker exec crm-nextjs ls -la /app/ | grep uploads
}

# اجرای تست JavaScript
run_js_test() {
    log_header "اجرای تست JavaScript"
    
    # نصب dependencies اگر نیاز باشد
    if [ ! -d "node_modules" ]; then
        log_info "نصب dependencies..."
        npm install
    fi
    
    # اجرای تست
    log_info "اجرای تست کامل API..."
    if node test-documents-api-complete.js; then
        log_success "تست JavaScript موفق بود"
    else
        log_error "تست JavaScript ناموفق بود"
    fi
}

# تابع اصلاح مشکلات
fix_common_issues() {
    log_header "اصلاح مشکلات رایج"
    
    # اصلاح مجوزهای uploads
    log_info "اصلاح مجوزهای uploads..."
    docker exec crm-nextjs chown -R nextjs:nodejs /app/uploads/ || log_warning "نمی‌توان مجوزها را تغییر داد"
    docker exec crm-nextjs chmod -R 755 /app/uploads/ || log_warning "نمی‌توان مجوزها را تغییر داد"
    
    # ایجاد پوشه‌های مورد نیاز
    log_info "ایجاد پوشه‌های مورد نیاز..."
    docker exec crm-nextjs mkdir -p /app/uploads/documents
    docker exec crm-nextjs mkdir -p /app/uploads/avatars
    docker exec crm-nextjs mkdir -p /app/uploads/chat
    
    # restart کانتینر nextjs
    log_info "راه‌اندازی مجدد کانتینر NextJS..."
    docker restart crm-nextjs
    
    # انتظار برای آماده شدن
    log_info "انتظار برای آماده شدن کانتینر..."
    sleep 10
}

# تابع اصلی
main() {
    log_header "🚀 شروع تست کامل API اسناد در Docker"
    
    # بررسی‌های اولیه
    check_docker
    check_containers
    check_volumes
    check_database
    
    # بررسی لاگ‌ها
    check_logs
    
    # تست API
    test_health_api
    test_file_upload_in_container
    
    # اصلاح مشکلات
    fix_common_issues
    
    # اجرای تست JavaScript
    run_js_test
    
    log_header "✅ تست کامل به پایان رسید"
}

# اجرای اسکریپت
main "$@"