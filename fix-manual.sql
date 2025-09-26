-- Manual Database Fix - Simple SQL without dynamic queries
-- Run this manually in phpMyAdmin or MySQL client

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- 1. Add missing columns to feedback table
-- --------------------------------------------------------

-- Add assigned_to column (ignore error if exists)
ALTER TABLE `feedback` ADD COLUMN `assigned_to` varchar(36) DEFAULT NULL;

-- Add resolved_by column (ignore error if exists)  
ALTER TABLE `feedback` ADD COLUMN `resolved_by` varchar(36) DEFAULT NULL;

-- Add resolved_at column (ignore error if exists)
ALTER TABLE `feedback` ADD COLUMN `resolved_at` timestamp NULL DEFAULT NULL;

-- --------------------------------------------------------
-- 2. Create users table if needed
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL DEFAULT '$2b$10$example',
  `role` enum('ceo','manager','employee','user') DEFAULT 'user',
  `avatar_url` varchar(500) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. Insert default users
-- --------------------------------------------------------

INSERT IGNORE INTO `users` (`id`, `name`, `email`, `role`) VALUES
('ceo-001', 'مهندس کریمی', 'Robintejarat@gmail.com', 'ceo'),
('50fdd768-8dbb-4161-a539-e9a4da40f6d2', 'احمد', 'rockygardner89@gmail.com', 'manager');

-- --------------------------------------------------------
-- 4. Insert sample products (using existing structure)
-- --------------------------------------------------------

INSERT IGNORE INTO `products` (`id`, `name`, `description`, `base_price`, `category`, `is_active`) VALUES
('prod-001', 'محصول نمونه 1', 'توضیحات محصول نمونه 1', 1000000.00, 'دسته 1', 1),
('prod-002', 'محصول نمونه 2', 'توضیحات محصول نمونه 2', 2000000.00, 'دسته 2', 1),
('prod-003', 'محصول نمونه 3', 'توضیحات محصول نمونه 3', 500000.00, 'دسته 1', 1);

-- --------------------------------------------------------
-- 5. Add indexes (ignore errors if they exist)
-- --------------------------------------------------------

CREATE INDEX `idx_feedback_customer_id` ON `feedback`(`customer_id`);
CREATE INDEX `idx_feedback_created_at` ON `feedback`(`created_at`);
CREATE INDEX `idx_feedback_assigned_to` ON `feedback`(`assigned_to`);

CREATE INDEX `idx_activities_customer_id` ON `activities`(`customer_id`);
CREATE INDEX `idx_activities_created_at` ON `activities`(`created_at`);
CREATE INDEX `idx_activities_performed_by` ON `activities`(`performed_by`);

CREATE INDEX `idx_sales_customer_id` ON `sales`(`customer_id`);
CREATE INDEX `idx_sales_sale_date` ON `sales`(`sale_date`);
CREATE INDEX `idx_sales_sales_person_id` ON `sales`(`sales_person_id`);

CREATE INDEX `idx_user_permissions_user_id` ON `user_permissions`(`user_id`);
CREATE INDEX `idx_user_permissions_resource` ON `user_permissions`(`resource`);

-- --------------------------------------------------------
-- 6. Fix data inconsistencies
-- --------------------------------------------------------

UPDATE `customers` SET `status` = 'prospect' WHERE `status` IS NULL OR `status` = '';
UPDATE `activities` SET `outcome` = 'completed' WHERE `outcome` IS NULL OR `outcome` = '';
UPDATE `feedback` SET `status` = 'pending' WHERE `status` IS NULL OR `status` = '';

-- --------------------------------------------------------
-- 7. Insert permissions for CEO users
-- --------------------------------------------------------

INSERT IGNORE INTO `user_permissions` (`user_id`, `resource`, `action`, `granted`) VALUES
('ceo-001', 'sales', 'manage', 1),
('ceo-001', 'customers', 'manage', 1),
('ceo-001', 'activities', 'manage', 1),
('ceo-001', 'feedback', 'manage', 1),
('ceo-001', 'products', 'manage', 1);

-- --------------------------------------------------------

COMMIT;

-- Success message
SELECT 'Manual database fixes completed!' as message;