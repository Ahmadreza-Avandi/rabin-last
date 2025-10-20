-- ==========================================
-- 🗄️ Database Initialization - Simple Mode
-- ==========================================
-- این اسکریپت دیتابیس را بدون پسورد راه‌اندازی می‌کند
-- ==========================================

-- ایجاد دیتابیس اگر وجود ندارد
CREATE DATABASE IF NOT EXISTS `crm_system` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- استفاده از دیتابیس
USE `crm_system`;

-- تنظیم timezone
SET time_zone = '+00:00';

-- ✅ همه کاربران به root بدون پسورد دسترسی دارند
-- این برای محیط توسعه و تست است
