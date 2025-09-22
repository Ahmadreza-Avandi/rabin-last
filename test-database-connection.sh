#!/bin/bash

# 🧪 Test database connection and tables
echo "🧪 Testing database connection..."

# Load environment variables
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "❌ .env file not found!"
    exit 1
fi

# Test MariaDB connection
echo "🗄️ Testing MariaDB connection..."
if docker-compose -f docker-compose.deploy.yml exec -T mysql mariadb -u ${DATABASE_USER} -p${DATABASE_PASSWORD} -e "SELECT VERSION();" 2>/dev/null; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    echo "🔍 Checking database logs:"
    docker-compose -f docker-compose.deploy.yml logs --tail=10 mysql
    exit 1
fi

# Test database exists
echo "📊 Testing database crm_system..."
if docker-compose -f docker-compose.deploy.yml exec -T mysql mariadb -u ${DATABASE_USER} -p${DATABASE_PASSWORD} -e "USE crm_system; SELECT 'Database exists' as status;" 2>/dev/null; then
    echo "✅ Database crm_system exists"
else
    echo "❌ Database crm_system not found"
    exit 1
fi

# Test important tables
echo "📋 Testing important tables..."
TABLES=("users" "customers" "documents" "activities")

for table in "${TABLES[@]}"; do
    if docker-compose -f docker-compose.deploy.yml exec -T mysql mariadb -u ${DATABASE_USER} -p${DATABASE_PASSWORD} -e "USE crm_system; DESCRIBE $table;" >/dev/null 2>&1; then
        echo "✅ Table $table exists"
    else
        echo "⚠️  Table $table not found"
    fi
done

# Show table count
echo "📊 Database statistics:"
docker-compose -f docker-compose.deploy.yml exec -T mysql mariadb -u ${DATABASE_USER} -p${DATABASE_PASSWORD} -e "USE crm_system; SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'crm_system';" 2>/dev/null

echo ""
echo "🎉 Database test completed!"