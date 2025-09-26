-- مرحله 1: ایجاد جدول users
-- اجرا کنید: mysql -u root -p crm_system < step1-create-users.sql

CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL DEFAULT '$2b$10$example',
  `role` enum('ceo','manager','employee','user') DEFAULT 'user',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- اضافه کردن کاربران پیش‌فرض
INSERT IGNORE INTO `users` (`id`, `name`, `email`, `role`) VALUES
('ceo-001', 'مهندس کریمی', 'Robintejarat@gmail.com', 'ceo'),
('50fdd768-8dbb-4161-a539-e9a4da40f6d2', 'احمد', 'rockygardner89@gmail.com', 'manager');

SELECT 'مرحله 1 تمام شد: جدول users ایجاد شد' as message;