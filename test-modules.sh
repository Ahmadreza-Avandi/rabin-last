#!/bin/bash

echo "🔍 Testing CRM modules..."

# Test if server is running
echo "1. Testing server connection..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Server is running"
else
    echo "❌ Server is not running. Please start with: npm run dev"
    exit 1
fi

# Test authentication
echo "2. Testing authentication..."
AUTH_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"Robintejarat@gmail.com","password":"admin123"}')

if echo "$AUTH_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Authentication works"
    TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
else
    echo "❌ Authentication failed"
    echo "Response: $AUTH_RESPONSE"
    exit 1
fi

# Test users API
echo "3. Testing users API..."
USERS_RESPONSE=$(curl -s http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN")

if echo "$USERS_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Users API works"
else
    echo "❌ Users API failed"
    echo "Response: $USERS_RESPONSE"
fi

# Test sales API
echo "4. Testing sales API..."
SALES_RESPONSE=$(curl -s http://localhost:3000/api/sales \
  -H "Authorization: Bearer $TOKEN")

if echo "$SALES_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Sales API works"
else
    echo "❌ Sales API failed"
    echo "Response: $SALES_RESPONSE"
fi

# Test products API
echo "5. Testing products API..."
PRODUCTS_RESPONSE=$(curl -s http://localhost:3000/api/products \
  -H "Authorization: Bearer $TOKEN")

if echo "$PRODUCTS_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Products API works"
else
    echo "❌ Products API failed"
    echo "Response: $PRODUCTS_RESPONSE"
fi

# Test customers API
echo "6. Testing customers API..."
CUSTOMERS_RESPONSE=$(curl -s http://localhost:3000/api/customers \
  -H "Authorization: Bearer $TOKEN")

if echo "$CUSTOMERS_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Customers API works"
else
    echo "❌ Customers API failed"
    echo "Response: $CUSTOMERS_RESPONSE"
fi

echo "🎉 Module testing completed!"