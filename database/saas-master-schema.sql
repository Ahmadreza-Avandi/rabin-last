-- =====================================================
-- SaaS Master Database Schema
-- =====================================================
-- این دیتابیس برای مدیریت تمام tenants استفاده می‌شود
-- هر tenant یک دیتابیس جداگانه خواهد داشت

CREATE DATABASE IF NOT EXISTS saas_master
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE saas_master;

-- =====================================================
-- جدول Tenants (شرکت‌های مشتری)
-- =====================================================
CREATE TABLE IF NOT EXISTS tenants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- اطلاعات شناسایی
    tenant_key VARCHAR(50) UNIQUE NOT NULL COMMENT 'کلید یکتا برای شناسایی tenant (مثل: irankhodro, rabin)',
    company_name VARCHAR(255) NOT NULL COMMENT 'نام شرکت',
    
    -- اطلاعات دیتابیس
    db_name VARCHAR(100) UNIQUE NOT NULL COMMENT 'نام دیتابیس اختصاصی',
    db_host VARCHAR(255) DEFAULT 'mysql' COMMENT 'هاست دیتابیس',
    db_port INT DEFAULT 3306 COMMENT 'پورت دیتابیس',
    db_user VARCHAR(100) NOT NULL COMMENT 'کاربر دیتابیس',
    db_password VARCHAR(255) NOT NULL COMMENT 'رمز دیتابیس (encrypted)',
    
    -- اطلاعات تماس
    admin_name VARCHAR(255) COMMENT 'نام مدیر شرکت',
    admin_email VARCHAR(255) NOT NULL COMMENT 'ایمیل مدیر',
    admin_phone VARCHAR(20) COMMENT 'تلفن مدیر',
    
    -- وضعیت اشتراک
    subscription_status ENUM('active', 'expired', 'suspended', 'trial') DEFAULT 'trial' COMMENT 'وضعیت اشتراک',
    subscription_plan ENUM('basic', 'professional', 'enterprise', 'custom') DEFAULT 'basic' COMMENT 'نوع پلن',
    subscription_start DATE COMMENT 'تاریخ شروع اشتراک',
    subscription_end DATE COMMENT 'تاریخ پایان اشتراک',
    
    -- محدودیت‌ها
    max_users INT DEFAULT 10 COMMENT 'حداکثر تعداد کاربران',
    max_customers INT DEFAULT 1000 COMMENT 'حداکثر تعداد مشتریان',
    max_storage_mb INT DEFAULT 1024 COMMENT 'حداکثر فضای ذخیره‌سازی (MB)',
    
    -- ویژگی‌های فعال
    features JSON COMMENT 'ویژگی‌های فعال (voice_assistant, advanced_reports, etc.)',
    
    -- تنظیمات
    settings JSON COMMENT 'تنظیمات اختصاصی tenant',
    
    -- وضعیت
    is_active BOOLEAN DEFAULT TRUE COMMENT 'فعال/غیرفعال',
    is_deleted BOOLEAN DEFAULT FALSE COMMENT 'حذف شده (soft delete)',
    
    -- زمان‌ها
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- ایندکس‌ها
    INDEX idx_tenant_key (tenant_key),
    INDEX idx_subscription_status (subscription_status),
    INDEX idx_is_active (is_active),
    INDEX idx_subscription_end (subscription_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- جدول Super Admins (ادمین‌های سیستم SaaS)
-- =====================================================
CREATE TABLE IF NOT EXISTS super_admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- اطلاعات کاربری
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL COMMENT 'bcrypt hash',
    
    -- اطلاعات شخصی
    full_name VARCHAR(255),
    phone VARCHAR(20),
    
    -- سطح دسترسی
    role ENUM('super_admin', 'admin', 'support') DEFAULT 'admin',
    permissions JSON COMMENT 'دسترسی‌های خاص',
    
    -- وضعیت
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    
    -- زمان‌ها
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- جدول Subscription Plans (پلن‌های اشتراک)
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- اطلاعات پلن
    plan_key VARCHAR(50) UNIQUE NOT NULL COMMENT 'کلید یکتا (basic, pro, enterprise)',
    plan_name VARCHAR(100) NOT NULL COMMENT 'نام فارسی پلن',
    plan_name_en VARCHAR(100) COMMENT 'نام انگلیسی پلن',
    
    -- قیمت
    price_monthly DECIMAL(15,2) DEFAULT 0 COMMENT 'قیمت ماهانه (تومان)',
    price_yearly DECIMAL(15,2) DEFAULT 0 COMMENT 'قیمت سالانه (تومان)',
    
    -- محدودیت‌ها
    max_users INT DEFAULT 10,
    max_customers INT DEFAULT 1000,
    max_storage_mb INT DEFAULT 1024,
    
    -- ویژگی‌ها
    features JSON COMMENT 'لیست ویژگی‌های پلن',
    
    -- توضیحات
    description TEXT COMMENT 'توضیحات پلن',
    
    -- وضعیت
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0 COMMENT 'ترتیب نمایش',
    
    -- زمان‌ها
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_plan_key (plan_key),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- جدول Subscription History (تاریخچه اشتراک‌ها)
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- ارتباط با tenant
    tenant_id INT NOT NULL,
    
    -- اطلاعات اشتراک
    plan_key VARCHAR(50) NOT NULL,
    subscription_type ENUM('monthly', 'yearly', 'custom') NOT NULL,
    
    -- تاریخ‌ها
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- مبلغ
    amount DECIMAL(15,2) NOT NULL COMMENT 'مبلغ پرداختی (تومان)',
    
    -- وضعیت
    status ENUM('active', 'expired', 'cancelled', 'refunded') DEFAULT 'active',
    
    -- یادداشت
    notes TEXT,
    
    -- زمان‌ها
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT COMMENT 'ID super admin که ایجاد کرده',
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- جدول Tenant Activity Logs (لاگ فعالیت‌های tenant)
-- =====================================================
CREATE TABLE IF NOT EXISTS tenant_activity_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- ارتباط با tenant
    tenant_id INT NOT NULL,
    
    -- نوع فعالیت
    activity_type ENUM('created', 'activated', 'suspended', 'expired', 'deleted', 'updated', 'login', 'other') NOT NULL,
    
    -- جزئیات
    description TEXT,
    metadata JSON COMMENT 'اطلاعات اضافی',
    
    -- کاربر انجام‌دهنده
    performed_by INT COMMENT 'ID super admin',
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- زمان
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- جدول System Settings (تنظیمات سیستم)
-- =====================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE COMMENT 'قابل نمایش برای tenants',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- داده‌های اولیه
-- =====================================================

-- ایجاد Super Admin پیش‌فرض
-- Password: Ahmadreza.avandi (باید در production تغییر کند)
INSERT IGNORE INTO super_admins (username, email, password_hash, full_name, role, is_active) VALUES
('Ahmadreza.avandi', 'ahmadrezaavandi@gmail.com', '$2b$10$rKZWvXqVxH5kGX5kGX5kGeuKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK', 'احمدرضا اوندی', 'super_admin', TRUE);

-- ایجاد پلن‌های پیش‌فرض
INSERT IGNORE INTO subscription_plans (plan_key, plan_name, plan_name_en, price_monthly, price_yearly, max_users, max_customers, max_storage_mb, features, description, display_order) VALUES
('basic', 'پایه', 'Basic', 500000, 5000000, 5, 500, 512, 
 '["crm_basic", "customer_management", "task_management"]',
 'پلن پایه برای کسب‌وکارهای کوچک', 1),

('professional', 'حرفه‌ای', 'Professional', 1500000, 15000000, 20, 5000, 2048,
 '["crm_basic", "customer_management", "task_management", "advanced_reports", "api_access"]',
 'پلن حرفه‌ای برای کسب‌وکارهای متوسط', 2),

('enterprise', 'سازمانی', 'Enterprise', 5000000, 50000000, 100, 50000, 10240,
 '["crm_basic", "customer_management", "task_management", "advanced_reports", "api_access", "voice_assistant", "custom_integration", "priority_support"]',
 'پلن سازمانی برای شرکت‌های بزرگ', 3);

-- تنظیمات سیستم پیش‌فرض
INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('default_trial_days', '14', 'number', 'تعداد روزهای دوره آزمایشی پیش‌فرض'),
('max_tenants', '1000', 'number', 'حداکثر تعداد tenants مجاز'),
('maintenance_mode', 'false', 'boolean', 'حالت تعمیر و نگهداری'),
('default_db_host', 'mysql', 'string', 'هاست پیش‌فرض دیتابیس');

-- =====================================================
-- Views (نماها)
-- =====================================================

-- نمای خلاصه tenants فعال
CREATE OR REPLACE VIEW active_tenants_summary AS
SELECT 
    t.id,
    t.tenant_key,
    t.company_name,
    t.admin_email,
    t.subscription_status,
    t.subscription_plan,
    t.subscription_end,
    DATEDIFF(t.subscription_end, CURDATE()) AS days_remaining,
    t.max_users,
    t.created_at
FROM tenants t
WHERE t.is_active = TRUE AND t.is_deleted = FALSE
ORDER BY t.subscription_end ASC;

-- نمای tenants منقضی شده
CREATE OR REPLACE VIEW expired_tenants AS
SELECT 
    t.id,
    t.tenant_key,
    t.company_name,
    t.admin_email,
    t.subscription_end,
    DATEDIFF(CURDATE(), t.subscription_end) AS days_expired
FROM tenants t
WHERE t.subscription_status = 'expired' 
  AND t.is_active = TRUE 
  AND t.is_deleted = FALSE
ORDER BY t.subscription_end DESC;

-- =====================================================
-- تمام!
-- =====================================================
-- نوت: Stored procedures باید به‌صورت جداگانه از طریق MySQL client اجرا شوند
