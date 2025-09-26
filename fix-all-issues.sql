-- Fix all database issues

-- 1. Add missing tables if they don't exist

-- Check if sales_pipeline_stages table exists, if not create it
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

-- Check if users table exists, if not create it
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

-- Check if products table exists, if not create it
CREATE TABLE IF NOT EXISTS `products` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `cost` decimal(15,2) DEFAULT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `unit` varchar(50) DEFAULT 'عدد',
  `stock_quantity` int(11) DEFAULT 0,
  `min_stock_level` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `image_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample products if they don't exist
INSERT IGNORE INTO `products` (`id`, `name`, `description`, `price`, `category`, `is_active`) VALUES
('prod-001', 'محصول نمونه 1', 'توضیحات محصول نمونه 1', 1000000.00, 'دسته 1', 1),
('prod-002', 'محصول نمونه 2', 'توضیحات محصول نمونه 2', 2000000.00, 'دسته 2', 1),
('prod-003', 'محصول نمونه 3', 'توضیحات محصول نمونه 3', 500000.00, 'دسته 1', 1);

-- 2. Fix existing table structures

-- Add missing columns to feedback table if they don't exist
ALTER TABLE `feedback` 
ADD COLUMN IF NOT EXISTS `assigned_to` varchar(36) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `resolved_by` varchar(36) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `resolved_at` timestamp NULL DEFAULT NULL;

-- 3. Create missing views

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
    AVG(30) as avg_duration
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
    duration,
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
    sentiment,
    NULL as user_id
FROM feedback;

-- Create sales_pipeline_report view
CREATE VIEW `sales_pipeline_report` AS
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
WHERE d.stage_id NOT IN ('stage-006', 'stage-007');

-- Create sales_statistics view
CREATE VIEW `sales_statistics` AS
SELECT 
    DATE(sale_date) as sale_date,
    COUNT(*) as total_sales,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_sale_value
FROM sales
GROUP BY DATE(sale_date);

-- 4. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_customer_id ON feedback(customer_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_customer_id ON activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);

-- 5. Update existing data to fix inconsistencies
UPDATE customers SET status = 'prospect' WHERE status IS NULL;
UPDATE activities SET outcome = 'completed' WHERE outcome IS NULL;
UPDATE feedback SET status = 'pending' WHERE status IS NULL;

COMMIT;