-- Simple Database Fix - Only Essential Changes
-- This file only fixes the critical issues without creating new tables

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- 1. Add missing columns to feedback table (the main issue)
-- --------------------------------------------------------

-- Check and add assigned_to column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'feedback' 
AND column_name = 'assigned_to';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE feedback ADD COLUMN assigned_to varchar(36) DEFAULT NULL AFTER customer_id',
    'SELECT "Column assigned_to already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add resolved_by column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'feedback' 
AND column_name = 'resolved_by';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE feedback ADD COLUMN resolved_by varchar(36) DEFAULT NULL AFTER assigned_to',
    'SELECT "Column resolved_by already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add resolved_at column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'feedback' 
AND column_name = 'resolved_at';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE feedback ADD COLUMN resolved_at timestamp NULL DEFAULT NULL AFTER resolved_by',
    'SELECT "Column resolved_at already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- --------------------------------------------------------
-- 2. Create users table if it doesn't exist (needed for sales API)
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

-- Insert default users if they don't exist
INSERT IGNORE INTO `users` (`id`, `name`, `email`, `role`) VALUES
('ceo-001', 'مهندس کریمی', 'Robintejarat@gmail.com', 'ceo'),
('50fdd768-8dbb-4161-a539-e9a4da40f6d2', 'احمد', 'rockygardner89@gmail.com', 'manager');

-- --------------------------------------------------------
-- 3. Insert sample products using existing table structure
-- --------------------------------------------------------

INSERT IGNORE INTO `products` (`id`, `name`, `description`, `base_price`, `category`, `is_active`) VALUES
('prod-001', 'محصول نمونه 1', 'توضیحات محصول نمونه 1', 1000000.00, 'دسته 1', 1),
('prod-002', 'محصول نمونه 2', 'توضیحات محصول نمونه 2', 2000000.00, 'دسته 2', 1),
('prod-003', 'محصول نمونه 3', 'توضیحات محصول نمونه 3', 500000.00, 'دسته 1', 1);

-- --------------------------------------------------------
-- 4. Add essential indexes
-- --------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_feedback_customer_id ON feedback(customer_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_customer_id ON activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);

-- --------------------------------------------------------
-- 5. Fix data inconsistencies
-- --------------------------------------------------------

UPDATE customers SET status = 'prospect' WHERE status IS NULL OR status = '';
UPDATE activities SET outcome = 'completed' WHERE outcome IS NULL OR outcome = '';
UPDATE feedback SET status = 'pending' WHERE status IS NULL OR status = '';

-- --------------------------------------------------------

COMMIT;

SELECT 'Simple database fixes applied successfully!' as message;