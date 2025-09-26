-- مرحله 2: اصلاح جدول feedback
-- اجرا کنید: mysql -u root -p crm_system < step2-fix-feedback.sql

-- اضافه کردن ستون assigned_to
ALTER TABLE `feedback` ADD COLUMN `assigned_to` varchar(36) DEFAULT NULL;

-- اضافه کردن ستون resolved_by  
ALTER TABLE `feedback` ADD COLUMN `resolved_by` varchar(36) DEFAULT NULL;

-- اضافه کردن ستون resolved_at
ALTER TABLE `feedback` ADD COLUMN `resolved_at` timestamp NULL DEFAULT NULL;

SELECT 'مرحله 2 تمام شد: جدول feedback اصلاح شد' as message;