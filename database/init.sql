-- Database initialization script for CRM System
-- This script creates the database and user if they don't exist

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS `crm_system` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user if not exists (MariaDB syntax)
CREATE USER IF NOT EXISTS 'crm_app_user'@'%' IDENTIFIED BY 'PLACEHOLDER_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON `crm_system`.* TO 'crm_app_user'@'%';
FLUSH PRIVILEGES;

-- Use the database
USE `crm_system`;

-- Set timezone
SET time_zone = '+00:00';

-- Import main CRM database schema and data
SOURCE /docker-entrypoint-initdb.d/crm_system.sql;

-- Import SaaS master database if exists
SOURCE /docker-entrypoint-initdb.d/saas_master.sql;