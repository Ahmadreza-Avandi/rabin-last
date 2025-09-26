-- Essential Database Fixes Only
-- Copy and paste these commands one by one in phpMyAdmin

-- 1. Add missing columns to feedback table
ALTER TABLE `feedback` ADD COLUMN `assigned_to` varchar(36) DEFAULT NULL;
ALTER TABLE `feedback` ADD COLUMN `resolved_by` varchar(36) DEFAULT NULL;
ALTER TABLE `feedback` ADD COLUMN `resolved_at` timestamp NULL DEFAULT NULL;

-- 2. Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL DEFAULT '$2b$10$example',
  `role` enum('ceo','manager','employee','user') DEFAULT 'user',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Insert default users
INSERT IGNORE INTO `users` (`id`, `name`, `email`, `role`) VALUES
('ceo-001', 'مهندس کریمی', 'Robintejarat@gmail.com', 'ceo'),
('50fdd768-8dbb-4161-a539-e9a4da40f6d2', 'احمد', 'rockygardner89@gmail.com', 'manager');

-- 4. Insert sample products
INSERT IGNORE INTO `products` (`id`, `name`, `base_price`, `category`, `is_active`) VALUES
('prod-001', 'محصول نمونه 1', 1000000.00, 'دسته 1', 1),
('prod-002', 'محصول نمونه 2', 2000000.00, 'دسته 2', 1),
('prod-003', 'محصول نمونه 3', 500000.00, 'دسته 1', 1);

-- 5. Fix data
UPDATE `customers` SET `status` = 'prospect' WHERE `status` IS NULL OR `status` = '';
UPDATE `activities` SET `outcome` = 'completed' WHERE `outcome` IS NULL OR `outcome` = '';
UPDATE `feedback` SET `status` = 'pending' WHERE `status` IS NULL OR `status` = '';

-- 6. Add permissions for CEO
INSERT IGNORE INTO `user_permissions` (`user_id`, `resource`, `action`, `granted`) VALUES
('ceo-001', 'sales', 'manage', 1),
('ceo-001', 'customers', 'manage', 1),
('ceo-001', 'activities', 'manage', 1),
('ceo-001', 'feedback', 'manage', 1);