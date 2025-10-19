-- Database initialization script for CRM System
-- This script creates the database and user if they don't exist

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS `crm_system` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Drop existing users to ensure clean state
DROP USER IF EXISTS 'crm_app_user'@'%';
DROP USER IF EXISTS 'crm_app_user'@'localhost';
DROP USER IF EXISTS 'crm_app_user'@'127.0.0.1';

-- Create user with password - برای تمام connection patterns
CREATE USER 'crm_app_user'@'%' IDENTIFIED BY '1234';
CREATE USER 'crm_app_user'@'localhost' IDENTIFIED BY '1234';
CREATE USER 'crm_app_user'@'127.0.0.1' IDENTIFIED BY '1234';

-- Grant all privileges on crm_system database
GRANT ALL PRIVILEGES ON `crm_system`.* TO 'crm_app_user'@'%';
GRANT ALL PRIVILEGES ON `crm_system`.* TO 'crm_app_user'@'localhost';
GRANT ALL PRIVILEGES ON `crm_system`.* TO 'crm_app_user'@'127.0.0.1';

-- FLUSH to apply changes immediately
FLUSH PRIVILEGES;

-- Use the database
USE `crm_system`;

-- Set timezone
SET time_zone = '+00:00';