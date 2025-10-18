#!/usr/bin/env node

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TENANT_KEY = 'rabin';

// Sample test data
const tests = [];
let testResults = [];

// Helper to make requests
async function makeRequest(method, path, headers = {}, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const options = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-Key': TENANT_KEY,
                ...headers
            }
        };

        if (body) {
            options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: JSON.parse(data)
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: data
                    });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

// Test functions
async function testProductsAPI() {
    console.log('\n📦 Testing /api/tenant/products endpoint...');
    try {
        const response = await makeRequest('GET', '/api/tenant/products');

        if (response.status === 401) {
            console.log('❌ FAILED: 401 Unauthorized - Missing or invalid auth token');
            console.log('   Fix: Make sure you\'re logged in and have valid auth-token cookie');
            return false;
        }

        if (response.status === 200 && response.body.success) {
            console.log('✅ PASSED: Products API is working');
            console.log(`   Found ${(response.body.data || []).length} products`);
            return true;
        }

        console.log('❌ FAILED:', response.status, response.body);
        return false;
    } catch (error) {
        console.log('❌ FAILED: Connection error -', error.message);
        return false;
    }
}

async function testActivitiesAPI() {
    console.log('\n📋 Testing /api/tenant/activities endpoint...');
    try {
        const response = await makeRequest('GET', '/api/tenant/activities');

        if (response.status === 401) {
            console.log('❌ FAILED: 401 Unauthorized');
            return false;
        }

        if (response.status === 200 && response.body.success) {
            console.log('✅ PASSED: Activities API is working');
            console.log(`   Found ${(response.body.data || []).length} activities`);
            return true;
        }

        console.log('❌ FAILED:', response.status, response.body);
        return false;
    } catch (error) {
        console.log('❌ FAILED: Connection error -', error.message);
        return false;
    }
}

async function testCustomersAPI() {
    console.log('\n👥 Testing /api/tenant/customers endpoint...');
    try {
        const response = await makeRequest('GET', '/api/tenant/customers');

        if (response.status === 401) {
            console.log('❌ FAILED: 401 Unauthorized');
            return false;
        }

        if (response.status === 200 && response.body.success) {
            console.log('✅ PASSED: Customers API is working');
            const customers = response.body.customers || [];
            console.log(`   Found ${customers.length} customers`);
            return customers.length > 0 ? { customers } : false;
        }

        console.log('❌ FAILED:', response.status, response.body);
        return false;
    } catch (error) {
        console.log('❌ FAILED: Connection error -', error.message);
        return false;
    }
}

async function testCustomerDetailAPI(customerId) {
    console.log(`\n👤 Testing /api/tenant/customers/${customerId} endpoint...`);
    try {
        const response = await makeRequest('GET', `/api/tenant/customers/${customerId}`);

        if (response.status === 401) {
            console.log('❌ FAILED: 401 Unauthorized');
            return false;
        }

        if (response.status === 404) {
            console.log('❌ FAILED: 404 Customer not found');
            return false;
        }

        if (response.status === 200 && response.body.success) {
            console.log('✅ PASSED: Customer detail API is working');
            console.log(`   Customer: ${response.body.data.name}`);
            console.log(`   Activities: ${(response.body.data.activities || []).length}`);
            console.log(`   Contacts: ${(response.body.data.contacts || []).length}`);
            return true;
        }

        console.log('❌ FAILED:', response.status, response.body);
        return false;
    } catch (error) {
        console.log('❌ FAILED: Connection error -', error.message);
        return false;
    }
}

async function testSalesAPI() {
    console.log('\n💰 Testing /api/tenant/sales endpoint...');
    try {
        const response = await makeRequest('GET', '/api/tenant/sales');

        if (response.status === 401) {
            console.log('❌ FAILED: 401 Unauthorized');
            return false;
        }

        if (response.status === 200 && response.body.success) {
            console.log('✅ PASSED: Sales API is working');
            const sales = response.body.data || response.body.sales || [];
            console.log(`   Found ${sales.length} sales`);
            return true;
        }

        console.log('❌ FAILED:', response.status, response.body);
        return false;
    } catch (error) {
        console.log('❌ FAILED: Connection error -', error.message);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('🧪 Running API Tests...\n');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Tenant Key: ${TENANT_KEY}\n`);

    try {
        const productsResult = await testProductsAPI();
        const activitiesResult = await testActivitiesAPI();
        const customersResult = await testCustomersAPI();
        const salesResult = await testSalesAPI();

        if (customersResult && customersResult.customers && customersResult.customers.length > 0) {
            const customerId = customersResult.customers[0].id;
            await testCustomerDetailAPI(customerId);
        }

        console.log('\n' + '='.repeat(50));
        console.log('📊 Test Summary:');
        console.log('='.repeat(50));

        const allPassed = [productsResult, activitiesResult, customersResult, salesResult].every(r => r);

        if (allPassed) {
            console.log('✅ All tests passed!');
        } else {
            console.log('❌ Some tests failed. Check the output above.');
        }

    } catch (error) {
        console.error('❌ Test runner error:', error);
    }
}

// Run tests
runAllTests().catch(console.error);