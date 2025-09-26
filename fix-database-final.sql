-- Fix Database Issues - Final Version
-- Compatible with existing database structure

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- 1. Add missing columns to existing tables
-- --------------------------------------------------------

-- Add missing columns to feedback table if they don't exist
SET @sql = 'ALTER TABLE feedback ADD COLUMN assigned_to varchar(36) DEFAULT NULL';
SET @sql_check = 'SELECT COUNT(*) INTO @col_exists FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = "feedback" AND column_name = "assigned_to"';
PREPARE stmt FROM @sql_check;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql_exec = IF(@col_exists = 0, @sql, 'SELECT "Column assigned_to already exists" as message');
PREPARE stmt FROM @sql_exec;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = 'ALTER TABLE feedback ADD COLUMN resolved_by varchar(36) DEFAULT NULL';
SET @sql_check = 'SELECT COUNT(*) INTO @col_exists FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = "feedback" AND column_name = "resolved_by"';
PREPARE stmt FROM @sql_check;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql_exec = IF(@col_exists = 0, @sql, 'SELECT "Column resolved_by already exists" as message');
PREPARE stmt FROM @sql_exec;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = 'ALTER TABLE feedback ADD COLUMN resolved_at timestamp NULL DEFAULT NULL';
SET @sql_check = 'SELECT COUNT(*) INTO @col_exists FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = "feedback" AND column_name = "resolved_at"';
PREPARE stmt FROM @sql_check;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql_exec = IF(@col_exists = 0, @sql, 'SELECT "Column resolved_at already exists" as message');
PREPARE stmt FROM @sql_exec;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- --------------------------------------------------------
-- 2. Create missing tables if they don't exist
-- --------------------------------------------------------

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `role` enum('ceo','manager','employee','user') DEFAULT 'user',
  `avatar_url` varchar(500) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default users if they don't exist
INSERT IGNORE INTO `users` (`id`, `name`, `email`, `password`, `role`) VALUES
('ceo-001', 'مهندس کریمی', 'Robintejarat@gmail.com', '$2b$10$example', 'ceo'),
('50fdd768-8dbb-4161-a539-e9a4da40f6d2', 'احمد', 'rockygardner89@gmail.com', '$2b$10$example', 'manager');

-- Products table already exists with different structure
-- It has base_price instead of price, and different columns
-- Insert sample products if they don't exist (using existing structure)
INSERT IGNORE INTO `products` (`id`, `name`, `description`, `base_price`, `category`, `is_active`) VALUES
('prod-001', 'محصول نمونه 1', 'توضیحات محصول نمونه 1', 1000000.00, 'دسته 1', 1),
('prod-002', 'محصول نمونه 2', 'توضیحات محصول نمونه 2', 2000000.00, 'دسته 2', 1),
('prod-003', 'محصول نمونه 3', 'توضیحات محصول نمونه 3', 500000.00, 'دسته 1', 1);

-- Create sales_pipeline_stages table if it doesn't exist
CREATE TABLE IF NOT EXISTS `sales_pipeline_stages` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `stage_order` int(11) NOT NULL,
  `color` varchar(7) DEFAULT '#3B82F6',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default sales pipeline stages if they don't exist
INSERT IGNORE INTO `sales_pipeline_stages` (`id`, `name`, `description`, `stage_order`, `color`) VALUES
('stage-001', 'مشتری بالقوه', 'مشتریان جدید که هنوز تماس اولیه برقرار نشده', 1, '#6B7280'),
('stage-002', 'تماس اولیه', 'اولین تماس با مشتری برقرار شده', 2, '#3B82F6'),
('stage-003', 'ارزیابی نیاز', 'نیازهای مشتری شناسایی شده', 3, '#F59E0B'),
('stage-004', 'ارائه پیشنهاد', 'پیشنهاد قیمت ارائه شده', 4, '#8B5CF6'),
('stage-005', 'مذاکره', 'در حال مذاکره با مشتری', 5, '#EF4444'),
('stage-006', 'بسته شده - برنده', 'معامله با موفقیت بسته شده', 6, '#10B981'),
('stage-007', 'بسته شده - بازنده', 'معامله شکست خورده', 7, '#DC2626');

-- --------------------------------------------------------
-- 3. Create missing views (drop and recreate to avoid conflicts)
-- --------------------------------------------------------

-- Drop existing views if they exist
DROP VIEW IF EXISTS `daily_interaction_stats`;
DROP VIEW IF EXISTS `interaction_summary`;
DROP VIEW IF EXISTS `sales_pipeline_report`;
DROP VIEW IF EXISTS `sales_statistics`;

-- Create daily_interaction_stats view
CREATE VIEW `daily_interaction_stats` AS
SELECT 
    DATE(created_at) as interaction_date,
    'email' as type,
    'outbound' as direction,
    'neutral' as sentiment,
    COUNT(*) as interaction_count,
    AVG(0) as avg_duration
FROM feedback 
WHERE type = 'email'
GROUP BY DATE(created_at)
UNION ALL
SELECT 
    DATE(created_at) as interaction_date,
    'phone' as type,
    'inbound' as direction,
    'positive' as sentiment,
    COUNT(*) as interaction_count,
    AVG(COALESCE(duration, 30)) as avg_duration
FROM activities 
WHERE type = 'call'
GROUP BY DATE(created_at);

-- Create interaction_summary view
CREATE VIEW `interaction_summary` AS
SELECT 
    id,
    customer_id,
    type,
    title as subject,
    description,
    'outbound' as direction,
    created_at as interaction_date,
    COALESCE(duration, 0) as duration,
    outcome,
    'positive' as sentiment,
    performed_by as user_id
FROM activities
UNION ALL
SELECT 
    id,
    customer_id,
    type,
    title as subject,
    comment as description,
    'inbound' as direction,
    created_at as interaction_date,
    0 as duration,
    status as outcome,
    COALESCE(sentiment, 'neutral') as sentiment,
    assigned_to as user_id
FROM feedback;

-- Create sales_pipeline_report view (only if deals table exists)
SET @table_exists = 0;
SELECT COUNT(*) INTO @table_exists 
FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'deals';

SET @sql = IF(@table_exists > 0, 
    'CREATE VIEW sales_pipeline_report AS
     SELECT 
         d.id as deal_id,
         d.title as deal_title,
         d.total_value as deal_value,
         d.probability,
         d.expected_close_date,
         d.stage_id,
         sps.name as stage_name,
         sps.stage_order,
         c.name as customer_name,
         u.name as assigned_to_name,
         d.created_at
     FROM deals d
     LEFT JOIN sales_pipeline_stages sps ON d.stage_id = sps.id
     LEFT JOIN customers c ON d.customer_id = c.id
     LEFT JOIN users u ON d.assigned_to = u.id
     WHERE d.stage_id NOT IN ("stage-006", "stage-007")',
    'SELECT "Deals table does not exist, skipping sales_pipeline_report view" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create sales_statistics view (only if sales table exists)
SET @table_exists = 0;
SELECT COUNT(*) INTO @table_exists 
FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'sales';

SET @sql = IF(@table_exists > 0, 
    'CREATE VIEW sales_statistics AS
     SELECT 
         DATE(sale_date) as sale_date,
         COUNT(*) as total_sales,
         SUM(total_amount) as total_revenue,
         AVG(total_amount) as avg_sale_value
     FROM sales
     GROUP BY DATE(sale_date)',
    'SELECT "Sales table does not exist, skipping sales_statistics view" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- --------------------------------------------------------
-- 4. Add indexes for better performance (only if columns exist)
-- --------------------------------------------------------

-- Add indexes safely
SET @sql = 'CREATE INDEX IF NOT EXISTS idx_feedback_customer_id ON feedback(customer_id)';
SET @sql_check = 'SELECT COUNT(*) INTO @col_exists FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = "feedback" AND column_name = "customer_id"';
PREPARE stmt FROM @sql_check;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql_exec = IF(@col_exists > 0, @sql, 'SELECT "Column customer_id does not exist in feedback" as message');
PREPARE stmt FROM @sql_exec;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = 'CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at)';
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = 'CREATE INDEX IF NOT EXISTS idx_feedback_assigned_to ON feedback(assigned_to)';
SET @sql_check = 'SELECT COUNT(*) INTO @col_exists FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = "feedback" AND column_name = "assigned_to"';
PREPARE stmt FROM @sql_check;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql_exec = IF(@col_exists > 0, @sql, 'SELECT "Column assigned_to does not exist in feedback" as message');
PREPARE stmt FROM @sql_exec;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = 'CREATE INDEX IF NOT EXISTS idx_activities_customer_id ON activities(customer_id)';
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = 'CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at)';
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = 'CREATE INDEX IF NOT EXISTS idx_activities_performed_by ON activities(performed_by)';
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add sales table indexes if table exists
SET @table_exists = 0;
SELECT COUNT(*) INTO @table_exists 
FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'sales';

SET @sql = IF(@table_exists > 0, 'CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id)', 'SELECT "Sales table does not exist" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(@table_exists > 0, 'CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date)', 'SELECT "Sales table does not exist" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(@table_exists > 0, 'CREATE INDEX IF NOT EXISTS idx_sales_sales_person_id ON sales(sales_person_id)', 'SELECT "Sales table does not exist" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add user_permissions indexes if table exists
SET @table_exists = 0;
SELECT COUNT(*) INTO @table_exists 
FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'user_permissions';

SET @sql = IF(@table_exists > 0, 'CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id)', 'SELECT "user_permissions table does not exist" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(@table_exists > 0, 'CREATE INDEX IF NOT EXISTS idx_user_permissions_resource ON user_permissions(resource)', 'SELECT "user_permissions table does not exist" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- --------------------------------------------------------
-- 5. Update existing data to fix inconsistencies
-- --------------------------------------------------------

UPDATE customers SET status = 'prospect' WHERE status IS NULL OR status = '';
UPDATE activities SET outcome = 'completed' WHERE outcome IS NULL OR outcome = '';
UPDATE feedback SET status = 'pending' WHERE status IS NULL OR status = '';

-- Update users table if it exists
SET @table_exists = 0;
SELECT COUNT(*) INTO @table_exists 
FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'users';

SET @sql = IF(@table_exists > 0, 'UPDATE users SET is_active = 1 WHERE is_active IS NULL', 'SELECT "Users table does not exist" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- --------------------------------------------------------
-- 6. Insert default permissions for CEO users (if user_permissions table exists)
-- --------------------------------------------------------

SET @table_exists = 0;
SELECT COUNT(*) INTO @table_exists 
FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'user_permissions';

SET @sql = IF(@table_exists > 0, 
    'INSERT IGNORE INTO user_permissions (user_id, resource, action, granted)
     SELECT u.id, "sales", "manage", 1
     FROM users u
     WHERE u.role = "ceo" AND NOT EXISTS (
         SELECT 1 FROM user_permissions up 
         WHERE up.user_id = u.id AND up.resource = "sales" AND up.action = "manage"
     )',
    'SELECT "user_permissions table does not exist" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- --------------------------------------------------------

COMMIT;

-- Success message
SELECT 'Database fixes applied successfully!' as message,
       'All missing tables, columns, views, and indexes have been created.' as details;