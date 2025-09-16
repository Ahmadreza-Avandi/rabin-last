-- جداول مدیریت اسناد
-- Document Management System Tables

-- جدول دسته‌بندی اسناد
CREATE TABLE `document_categories` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `parent_id` varchar(36) DEFAULT NULL,
  `color` varchar(7) DEFAULT '#3B82F6',
  `icon` varchar(50) DEFAULT 'folder',
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_created_by` (`created_by`),
  FOREIGN KEY (`parent_id`) REFERENCES `document_categories` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='دسته‌بندی اسناد';

-- جدول اصلی اسناد
CREATE TABLE `documents` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `original_filename` varchar(255) NOT NULL,
  `stored_filename` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` bigint(20) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `file_extension` varchar(10) NOT NULL,
  `category_id` varchar(36) DEFAULT NULL,
  `access_level` enum('public','private','restricted','confidential') DEFAULT 'private',
  `status` enum('active','archived','deleted') DEFAULT 'active',
  `version` int(11) DEFAULT 1,
  `parent_document_id` varchar(36) DEFAULT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `persian_date` varchar(20) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `is_shared` tinyint(1) DEFAULT 0,
  `download_count` int(11) DEFAULT 0,
  `view_count` int(11) DEFAULT 0,
  `uploaded_by` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_uploaded_by` (`uploaded_by`),
  KEY `idx_parent_document_id` (`parent_document_id`),
  KEY `idx_access_level` (`access_level`),
  KEY `idx_status` (`status`),
  FULLTEXT KEY `idx_title_description` (`title`,`description`),
  FOREIGN KEY (`category_id`) REFERENCES `document_categories` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`parent_document_id`) REFERENCES `documents` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='اسناد اصلی';

-- جدول مجوزهای دسترسی به اسناد
CREATE TABLE `document_permissions` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `document_id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  `permission_type` enum('view','download','edit','delete','share','admin') NOT NULL,
  `granted_by` varchar(36) NOT NULL,
  `granted_at` timestamp NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_document_permission` (`document_id`,`user_id`,`permission_type`),
  KEY `idx_document_id` (`document_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_granted_by` (`granted_by`),
  FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='مجوزهای دسترسی اسناد';

-- جدول اشتراک‌گذاری اسناد
CREATE TABLE `document_shares` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `document_id` varchar(36) NOT NULL,
  `shared_by` varchar(36) NOT NULL,
  `shared_with_email` varchar(255) NOT NULL,
  `shared_with_user_id` varchar(36) DEFAULT NULL,
  `share_token` varchar(100) NOT NULL,
  `permission_type` enum('view','download') DEFAULT 'view',
  `message` text DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `access_count` int(11) DEFAULT 0,
  `last_accessed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_share_token` (`share_token`),
  KEY `idx_document_id` (`document_id`),
  KEY `idx_shared_by` (`shared_by`),
  KEY `idx_shared_with_user_id` (`shared_with_user_id`),
  FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`shared_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`shared_with_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='اشتراک‌گذاری اسناد';

-- جدول تاریخچه فعالیت‌های اسناد
CREATE TABLE `document_activity_log` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `document_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `action` enum('upload','view','download','edit','delete','share','rename','move','restore') NOT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_document_id` (`document_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='تاریخچه فعالیت‌های اسناد';

-- جدول نظرات و یادداشت‌های اسناد
CREATE TABLE `document_comments` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `document_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `comment` text NOT NULL,
  `parent_comment_id` varchar(36) DEFAULT NULL,
  `is_private` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_document_id` (`document_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_parent_comment_id` (`parent_comment_id`),
  FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`parent_comment_id`) REFERENCES `document_comments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='نظرات اسناد';

-- جدول برچسب‌های اسناد
CREATE TABLE `document_tags` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `name` varchar(100) NOT NULL,
  `color` varchar(7) DEFAULT '#6B7280',
  `description` text DEFAULT NULL,
  `usage_count` int(11) DEFAULT 0,
  `created_by` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_tag_name` (`name`),
  KEY `idx_created_by` (`created_by`),
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='برچسب‌های اسناد';

-- جدول رابطه اسناد و برچسب‌ها
CREATE TABLE `document_tag_relations` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `document_id` varchar(36) NOT NULL,
  `tag_id` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_document_tag` (`document_id`,`tag_id`),
  KEY `idx_document_id` (`document_id`),
  KEY `idx_tag_id` (`tag_id`),
  FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tag_id`) REFERENCES `document_tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='رابطه اسناد و برچسب‌ها';

-- درج دسته‌بندی‌های پیش‌فرض
INSERT INTO `document_categories` (`id`, `name`, `description`, `parent_id`, `color`, `icon`, `sort_order`, `created_by`) VALUES
('cat-contracts', 'قراردادها', 'قراردادهای مختلف شرکت', NULL, '#10B981', 'file-contract', 1, 'ceo-001'),
('cat-invoices', 'فاکتورها', 'فاکتورهای فروش و خرید', NULL, '#F59E0B', 'receipt', 2, 'ceo-001'),
('cat-reports', 'گزارشات', 'گزارشات مختلف', NULL, '#3B82F6', 'chart-bar', 3, 'ceo-001'),
('cat-policies', 'سیاست‌ها', 'سیاست‌ها و رویه‌های شرکت', NULL, '#8B5CF6', 'shield-check', 4, 'ceo-001'),
('cat-presentations', 'ارائه‌ها', 'فایل‌های ارائه و پرزنتیشن', NULL, '#EF4444', 'presentation-chart-bar', 5, 'ceo-001'),
('cat-images', 'تصاویر', 'تصاویر و عکس‌ها', NULL, '#06B6D4', 'photograph', 6, 'ceo-001'),
('cat-other', 'سایر', 'سایر اسناد', NULL, '#6B7280', 'document', 7, 'ceo-001');

-- درج برچسب‌های پیش‌فرض
INSERT INTO `document_tags` (`id`, `name`, `color`, `description`, `created_by`) VALUES
('tag-urgent', 'فوری', '#EF4444', 'اسناد فوری', 'ceo-001'),
('tag-confidential', 'محرمانه', '#7C2D12', 'اسناد محرمانه', 'ceo-001'),
('tag-draft', 'پیش‌نویس', '#F59E0B', 'اسناد در حال تدوین', 'ceo-001'),
('tag-approved', 'تایید شده', '#10B981', 'اسناد تایید شده', 'ceo-001'),
('tag-archived', 'بایگانی', '#6B7280', 'اسناد بایگانی شده', 'ceo-001');