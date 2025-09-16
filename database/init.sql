-- Secure Database initialization script
-- This file will be automatically executed when MySQL container starts
-- Create database if not exists (MySQL image also creates it via env, but keep idempotent)
CREATE DATABASE IF NOT EXISTS crm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Use the database
USE crm_system;
-- Note: All *.sql files in /docker-entrypoint-initdb.d are executed automatically by MySQL image.
-- crm_system.sql will be imported automatically on first container startup.
-- Final privilege flush
FLUSH PRIVILEGES;
-- Verify tables were created
SHOW TABLES;