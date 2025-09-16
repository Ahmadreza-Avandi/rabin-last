-- 004_add_document_file_blobs.sql
-- Store document binary content in DB for reliable emailing and backups
-- Up
CREATE TABLE IF NOT EXISTS `document_files` (
    `document_id` varchar(36) NOT NULL,
    `content` LONGBLOB NOT NULL,
    `stored_at` timestamp NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`document_id`),
    CONSTRAINT `fk_document_files_document` FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Binary content for documents';
-- Optional helper trigger to auto-populate from disk if content is empty (manual backfill recommended)
-- DELIMITER //
-- CREATE TRIGGER trg_document_files_backfill AFTER INSERT ON documents
-- FOR EACH ROW BEGIN
--   -- Intentionally left for manual scripts to backfill from disk to avoid server FS dependency inside DB
-- END;//
-- DELIMITER ;
-- Down
-- DROP TABLE IF EXISTS `document_files`;