#!/bin/bash

echo "🔍 Database Initialization Debug Script"
echo "========================================"
echo ""

# Check 1: .env file
echo "✅ Check 1: .env file"
if [ -f ".env" ]; then
    echo "   ✓ .env موجود ہے"
    DB_PASS=$(grep "^DATABASE_PASSWORD=" .env | cut -d'=' -f2)
    echo "   📝 DATABASE_PASSWORD: $DB_PASS"
else
    echo "   ❌ .env موجود نہیں ہے!"
fi
echo ""

# Check 2: Database SQL files
echo "✅ Check 2: Database SQL files"
if [ -f "database/crm_system.sql" ]; then
    SIZE=$(wc -c < "database/crm_system.sql")
    LINES=$(wc -l < "database/crm_system.sql")
    echo "   ✓ database/crm_system.sql موجود ہے ($SIZE bytes, $LINES lines)"
else
    echo "   ❌ database/crm_system.sql موجود نہیں ہے!"
fi

if [ -f "database/saas_master.sql" ]; then
    SIZE=$(wc -c < "database/saas_master.sql")
    LINES=$(wc -l < "database/saas_master.sql")
    echo "   ✓ database/saas_master.sql موجود ہے ($SIZE bytes, $LINES lines)"
else
    echo "   ❌ database/saas_master.sql موجود نہیں ہے!"
fi
echo ""

# Check 3: Current init.sql
echo "✅ Check 3: موجودہ database/init.sql کا تجزیہ"
if [ -f "database/init.sql" ]; then
    echo "   ✓ database/init.sql موجود ہے"
    INIT_SIZE=$(wc -c < "database/init.sql")
    INIT_LINES=$(wc -l < "database/init.sql")
    echo "   📊 سائز: $INIT_SIZE bytes"
    echo "   📋 لائنیں: $INIT_LINES"
    echo ""
    echo "   📖 پہلی 20 لائنیں:"
    head -20 "database/init.sql" | sed 's/^/      /'
    echo ""
    
    # Check if CREATE USER exists
    if grep -q "CREATE USER" "database/init.sql"; then
        echo "   ✓ CREATE USER موجود ہے"
    else
        echo "   ❌ CREATE USER موجود نہیں ہے! (یہ مسئلہ ہے!)"
    fi
    
    # Check if password is set
    if grep -q "IDENTIFIED BY" "database/init.sql"; then
        echo "   ✓ IDENTIFIED BY موجود ہے"
    else
        echo "   ⚠️  IDENTIFIED BY موجود نہیں ہے!"
    fi
else
    echo "   ❌ database/init.sql موجود نہیں ہے!"
fi
echo ""

# Check 4: What deploy-server.sh SHOULD create
echo "✅ Check 4: deploy-server.sh کیا بنائے گا"
echo "   یہاں موجودہ script میں مسائل ہیں:"

# Read DB_PASS like deploy-server.sh does
if [ -f ".env" ]; then
    set -a
    source .env 2>/dev/null || true
    set +a
fi
DB_PASS="${DATABASE_PASSWORD:-1234}"

echo "   📝 Database password جو استعمال ہوگی: $DB_PASS"
echo ""
echo "   یہ script بنائے گا:"
echo "   ✓ CREATE DATABASE crm_system"
echo "   ✓ CREATE USER crm_app_user@'%' IDENTIFIED BY '$DB_PASS'"
echo "   ✓ CREATE USER crm_app_user@'localhost' IDENTIFIED BY '$DB_PASS'"
echo "   ✓ CREATE USER crm_app_user@'172.%.%.%' IDENTIFIED BY '$DB_PASS'"
echo "   ✓ GRANT ALL PRIVILEGES"
echo "   ✓ Concatenate crm_system.sql"
echo "   ✓ Concatenate saas_master.sql"
echo ""

# Check 5: Dry run - show what would be created
echo "✅ Check 5: ٹیسٹ - init.sql کیا بننی چاہیے:"
cat > /tmp/test_init.sql << EOF
-- Database initialization script for CRM System
-- This script creates the database and user if they don't exist

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS \`crm_system\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user if not exists (MariaDB syntax)
CREATE USER IF NOT EXISTS 'crm_app_user'@'%' IDENTIFIED BY '$DB_PASS';

-- Grant privileges
GRANT ALL PRIVILEGES ON \`crm_system\`.* TO 'crm_app_user'@'%';
GRANT ALL PRIVILEGES ON \`crm_system\`.* TO 'crm_app_user'@'localhost';
GRANT ALL PRIVILEGES ON \`crm_system\`.* TO 'crm_app_user'@'172.%.%.%';
FLUSH PRIVILEGES;

-- Use the database
USE \`crm_system\`;

-- Set timezone
SET time_zone = '+00:00';

EOF

echo "   پہلی 15 لائنیں:"
head -15 /tmp/test_init.sql | sed 's/^/      /'
echo ""

echo "✅ Debug مکمل!"
echo ""
echo "🔧 سفارشات:"
echo "1. اگر init.sql میں CREATE USER نہیں ہے - یہ مسئلہ ہے"
echo "2. database/crm_system.sql اور saas_master.sql موجود ہونے چاہیں"
echo "3. deploy-server.sh دوبارہ چلانا ہے تاکہ init.sql صحیح بنے"