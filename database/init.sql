-- Database initialization script for CRM System
-- This script creates the database and user if they don't exist
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS `crm_system` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Create user if not exists (MariaDB 10.4+ syntax)
-- Create for all three host patterns to support Docker networking
CREATE USER IF NOT EXISTS 'crm_app_user' @'%' IDENTIFIED BY '1234';
CREATE USER IF NOT EXISTS 'crm_app_user' @'localhost' IDENTIFIED BY '1234';
CREATE USER IF NOT EXISTS 'crm_app_user' @'172.%.%.%' IDENTIFIED BY '1234';
-- Grant privileges for crm_app_user (NO IDENTIFIED BY here!)
GRANT ALL PRIVILEGES ON `crm_system`.* TO 'crm_app_user' @'%';
GRANT ALL PRIVILEGES ON `crm_system`.* TO 'crm_app_user' @'localhost';
GRANT ALL PRIVILEGES ON `crm_system`.* TO 'crm_app_user' @'172.%.%.%';
FLUSH PRIVILEGES;
-- Use the database
USE `crm_system`;
-- Set timezone
SET time_zone = '+00:00';