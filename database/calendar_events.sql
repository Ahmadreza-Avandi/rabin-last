-- Calendar Events Tables

-- Main events table
CREATE TABLE IF NOT EXISTS `calendar_events` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime DEFAULT NULL,
  `all_day` boolean DEFAULT FALSE,
  `type` enum('meeting','call','reminder','task') DEFAULT 'meeting',
  `location` varchar(255) DEFAULT NULL,
  `status` enum('confirmed','tentative','cancelled') DEFAULT 'confirmed',
  `customer_id` varchar(36) DEFAULT NULL,
  `created_by` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_start_date` (`start_date`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_created_by` (`created_by`),
  FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Event participants table
CREATE TABLE IF NOT EXISTS `event_participants` (
  `id` varchar(36) NOT NULL,
  `event_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `response` enum('pending','accepted','declined','tentative') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_event_participant` (`event_id`, `user_id`),
  KEY `idx_event_id` (`event_id`),
  KEY `idx_user_id` (`user_id`),
  FOREIGN KEY (`event_id`) REFERENCES `calendar_events` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Event reminders table
CREATE TABLE IF NOT EXISTS `event_reminders` (
  `id` varchar(36) NOT NULL,
  `event_id` varchar(36) NOT NULL,
  `method` enum('popup','email','sms') DEFAULT 'popup',
  `minutes_before` int NOT NULL DEFAULT 15,
  `sent` boolean DEFAULT FALSE,
  `sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_event_id` (`event_id`),
  KEY `idx_method` (`method`),
  KEY `idx_sent` (`sent`),
  FOREIGN KEY (`event_id`) REFERENCES `calendar_events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data
INSERT INTO `calendar_events` (`id`, `title`, `description`, `start_date`, `end_date`, `all_day`, `type`, `location`, `status`, `customer_id`, `created_by`) VALUES
('event-001', 'جلسه با تیم فروش', 'بررسی عملکرد ماهانه تیم فروش', '2025-09-12 09:00:00', '2025-09-12 10:30:00', FALSE, 'meeting', 'اتاق جلسات اول', 'confirmed', NULL, 'ceo-001'),
('event-002', 'تماس با مشتری جدید', 'معرفی محصولات و خدمات', '2025-09-12 14:00:00', '2025-09-12 14:30:00', FALSE, 'call', NULL, 'confirmed', 'fa490a71-75b6-11f0-9306-e35500020927', 'ceo-001'),
('event-003', 'یادآوری ارسال گزارش', 'ارسال گزارش ماهانه به مدیریت', '2025-09-13 16:00:00', NULL, FALSE, 'reminder', NULL, 'confirmed', NULL, 'ceo-001'),
('event-004', 'جلسه طراحی محصول', 'بررسی ویژگی‌های جدید محصول', '2025-09-14 10:00:00', '2025-09-14 12:00:00', FALSE, 'meeting', 'اتاق طراحی', 'tentative', NULL, 'ceo-001'),
('event-005', 'پیگیری پروژه', 'بررسی پیشرفت پروژه فعلی', '2025-09-15 11:00:00', '2025-09-15 11:30:00', FALSE, 'task', NULL, 'confirmed', 'fa49480a-75b6-11f0-9306-e35500020927', 'ceo-001');

-- Sample participants
INSERT INTO `event_participants` (`id`, `event_id`, `user_id`, `response`) VALUES
('part-001', 'event-001', 'ceo-001', 'accepted'),
('part-002', 'event-002', 'ceo-001', 'accepted'),
('part-003', 'event-004', 'ceo-001', 'pending');

-- Sample reminders
INSERT INTO `event_reminders` (`id`, `event_id`, `method`, `minutes_before`) VALUES
('rem-001', 'event-001', 'popup', 15),
('rem-002', 'event-001', 'email', 60),
('rem-003', 'event-002', 'popup', 10),
('rem-004', 'event-003', 'popup', 5),
('rem-005', 'event-004', 'popup', 30);