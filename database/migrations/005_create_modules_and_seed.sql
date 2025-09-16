-- 005_create_modules_and_seed.sql
-- Creates modules table and seeds sidebar modules for permission management
START TRANSACTION;
-- Create modules table if not exists
CREATE TABLE IF NOT EXISTS `modules` (
    `id` varchar(36) NOT NULL DEFAULT uuid(),
    `name` varchar(100) NOT NULL,
    `display_name` varchar(255) NOT NULL,
    `description` text DEFAULT NULL,
    `route` varchar(255) DEFAULT NULL,
    `icon` varchar(100) DEFAULT NULL,
    `sort_order` int(11) DEFAULT 0,
    `parent_id` varchar(36) DEFAULT NULL,
    `is_active` tinyint(1) DEFAULT 1,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    UNIQUE KEY `uniq_module_name` (`name`),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Self reference FK
ALTER TABLE `modules`
ADD CONSTRAINT `modules_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `modules` (`id`) ON DELETE
SET NULL;
-- Seed modules if table is empty
INSERT INTO `modules` (
        `id`,
        `name`,
        `display_name`,
        `description`,
        `route`,
        `icon`,
        `sort_order`,
        `is_active`
    )
SELECT *
FROM (
        SELECT UUID(),
            'dashboard',
            'داشبورد',
            'نمای کلی سیستم',
            '/dashboard',
            'LayoutDashboard',
            1,
            1
        UNION ALL
        SELECT UUID(),
            'customers',
            'مشتریان',
            'مدیریت مشتریان',
            '/dashboard/customers',
            'Users',
            2,
            1
        UNION ALL
        SELECT UUID(),
            'contacts',
            'مخاطبین',
            'مدیریت مخاطبین',
            '/dashboard/contacts',
            'UserCheck',
            3,
            1
        UNION ALL
        SELECT UUID(),
            'coworkers',
            'همکاران',
            'مدیریت همکاران و دسترسی‌ها',
            '/dashboard/coworkers',
            'Users2',
            4,
            1
        UNION ALL
        SELECT UUID(),
            'activities',
            'فعالیت‌ها',
            'ثبت و مدیریت فعالیت‌ها',
            '/dashboard/activities',
            'Activity',
            5,
            1
        UNION ALL
        SELECT UUID(),
            'interactions',
            'تعاملات',
            'ثبت و مدیریت تعاملات',
            '/dashboard/interactions',
            'MessageCircle',
            6,
            1
        UNION ALL
        SELECT UUID(),
            'chat',
            'چت',
            'گفتگوهای درون‌سازمانی',
            '/dashboard/interactions/chat',
            'MessageCircle2',
            7,
            1
        UNION ALL
        SELECT UUID(),
            'sales',
            'ثبت فروش',
            'مدیریت فروش و فرصت‌ها',
            '/dashboard/sales',
            'TrendingUp',
            8,
            1
        UNION ALL
        SELECT UUID(),
            'products',
            'محصولات',
            'مدیریت محصولات',
            '/dashboard/products',
            'Package',
            9,
            1
        UNION ALL
        SELECT UUID(),
            'feedback',
            'بازخوردها',
            'مدیریت بازخورد مشتریان',
            '/dashboard/feedback',
            'MessageSquare',
            10,
            1
        UNION ALL
        SELECT UUID(),
            'surveys',
            'نظرسنجی‌ها',
            'مدیریت نظرسنجی‌ها',
            '/dashboard/surveys',
            'ListChecks',
            11,
            1
        UNION ALL
        SELECT UUID(),
            'reports',
            'گزارش‌ها',
            'گزارش‌ها و تحلیل‌ها',
            '/dashboard/reports',
            'BarChart3',
            12,
            1
        UNION ALL
        SELECT UUID(),
            'calendar',
            'تقویم',
            'رویدادها و جلسات',
            '/dashboard/calendar',
            'Calendar',
            13,
            1
        UNION ALL
        SELECT UUID(),
            'profile',
            'پروفایل',
            'پروفایل کاربر',
            '/dashboard/profile',
            'User',
            14,
            1
        UNION ALL
        SELECT UUID(),
            'settings',
            'تنظیمات عمومی',
            'تنظیمات سیستم',
            '/dashboard/settings',
            'Settings',
            15,
            1
    ) AS seed
WHERE NOT EXISTS (
        SELECT 1
        FROM `modules`
        LIMIT 1
    );
COMMIT;