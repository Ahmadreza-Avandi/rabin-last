#!/bin/bash
# Diagnostic Script - بررسی تمام مشکلات

set +e  # Don't exit on errors

echo "╔════════════════════════════════════════════════════════════╗"
echo "║ 🔍 Diagnostic Report - دیاگنوز تمام مشکلات              ║"
echo "╚════════════════════════════════════════════════════════════╝"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1️⃣ Docker Status
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Docker Containers Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "crm-|nginx"

# 2️⃣ Rabin Voice Build Check
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Rabin Voice Build Artifacts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if docker ps -a | grep -q "crm-rabin-voice"; then
    echo "Container exists. Checking build artifacts..."
    
    # Check .next/standalone
    if docker exec crm-rabin-voice test -d "./.next/standalone" 2>/dev/null; then
        echo -e "${GREEN}✅ .next/standalone exists${NC}"
        docker exec crm-rabin-voice ls -la ./.next/standalone/ 2>/dev/null | head -5
    else
        echo -e "${RED}❌ .next/standalone NOT FOUND${NC}"
        echo "   This is the main issue!"
    fi
    
    # Check api directory
    if docker exec crm-rabin-voice test -d "./api" 2>/dev/null; then
        echo -e "${GREEN}✅ api/ directory exists${NC}"
    else
        echo -e "${RED}❌ api/ directory NOT FOUND${NC}"
    fi
    
    # Check node_modules
    if docker exec crm-rabin-voice test -d "./node_modules" 2>/dev/null; then
        echo -e "${GREEN}✅ node_modules exists${NC}"
    else
        echo -e "${RED}❌ node_modules NOT FOUND${NC}"
    fi
else
    echo "Container not running"
fi

# 3️⃣ Rabin Voice Logs
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Rabin Voice Recent Logs (Errors only)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

docker logs crm-rabin-voice 2>&1 | grep -i -E "error|cannot find|failed" | tail -10

# 4️⃣ Database Status
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  MySQL Database Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if docker ps | grep -q "crm-mysql"; then
    echo -e "${GREEN}✅ MySQL is running${NC}"
    
    # Check databases
    echo ""
    echo "Databases:"
    docker exec crm-mysql mysql -u root -p1234 -e "SHOW DATABASES;" 2>&1 | tail -10
    
    # Check users
    echo ""
    echo "Users with crm_app_user:"
    docker exec crm-mysql mysql -u root -p1234 -e "SELECT User, Host FROM mysql.user WHERE User='crm_app_user';" 2>&1
    
    # Check grants
    echo ""
    echo "Grants for crm_app_user@'%':"
    docker exec crm-mysql mysql -u root -p1234 -e "SHOW GRANTS FOR 'crm_app_user'@'%';" 2>&1
    
    # Test connection
    echo ""
    echo "Testing connection as crm_app_user:"
    if docker exec crm-mysql mysql -u crm_app_user -p1234 crm_system -e "SELECT 1;" 2>&1 | grep -q "1"; then
        echo -e "${GREEN}✅ Connection successful${NC}"
    else
        echo -e "${RED}❌ Connection failed${NC}"
    fi
else
    echo -e "${RED}❌ MySQL is NOT running${NC}"
fi

# 5️⃣ Network Check
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  Docker Network - Service Resolution"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# List containers in network
NETWORK="rabin-last_crm-network"
if docker network inspect "$NETWORK" >/dev/null 2>&1; then
    echo "Containers in network '$NETWORK':"
    docker network inspect "$NETWORK" | grep -A 10 '"Containers"' | grep '"Name"' | sed 's/.*"Name": "\([^"]*\).*/\1/'
else
    echo "Network not found. Trying default..."
    docker network ls | grep crm
fi

# 6️⃣ Nginx Configuration
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  Nginx Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "nginx/default.conf" ]; then
    echo "Upstream definitions:"
    grep -E "upstream|server" nginx/default.conf | head -20
else
    echo "nginx/default.conf not found"
fi

# 7️⃣ Environment Variables
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Root .env DATABASE_PASSWORD:"
grep "DATABASE_PASSWORD" .env 2>/dev/null | head -1

echo ""
echo "Rabin Voice .env DATABASE_PASSWORD:"
grep "DATABASE_PASSWORD" صدای\ رابین/.env 2>/dev/null | head -1

echo ""
echo "docker-compose DATABASE_PASSWORD env:"
grep -A 5 "environment:" docker-compose.yml | grep DATABASE_PASSWORD | head -1

# 8️⃣ Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "Next Steps:"
echo "1. If .next/standalone NOT found:"
echo "   → Need to rebuild rabin-voice: docker-compose build --no-cache rabin-voice"
echo ""
echo "2. If MySQL connection failed:"
echo "   → Check DATABASE_PASSWORD sync"
echo "   → Verify users were created during init"
echo ""
echo "3. If nginx cannot resolve service:"
echo "   → Check docker network connectivity"
echo "   → Try: docker logs crm-nginx | grep -i 'resolve'"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"