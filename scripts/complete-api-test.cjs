const axios = require('axios');
const fs = require('fs');

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Test accounts for both tenants
const TENANTS = {
    rabin: {
        email: 'Robintejarat@gmail.com',
        password: 'admin123',
        name: 'رابین'
    },
    samin: {
        email: 'admin@samin.com',
        password: 'admin123',
        name: 'سامین'
    }
};

// Results storage
const results = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: [],
    slowAPIs: [],
    testsByTenant: {},
    createdResources: {
        customers: [],
        products: [],
        sales: [],
        contacts: [],
        activities: [],
        tasks: [],
        events: []
    }
};

let currentTenant = null;
let authToken = null;
let userId = null;
let userRole = null;

// Colors
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test helper function
async function testAPI(config) {
    const startTime = Date.now();
    results.total++;

    try {
        const response = await axios({
            method: config.method || 'GET',
            url: `${BASE_URL}${config.path}`,
            headers: config.headers || {},
            data: config.body,
            params: config.params,
            timeout: 30000,
            validateStatus: () => true
        });

        const responseTime = Date.now() - startTime;
        const success = config.expectedStatus.includes(response.status);

        if (success) {
            results.passed++;
            log(`✓ ${config.method} ${config.path} - ${response.status} (${responseTime}ms)`, 'green');
            if (config.logResponse && response.data) {
                log(`  Response: ${JSON.stringify(response.data).substring(0, 100)}...`, 'cyan');
            }
        } else {
            results.failed++;
            results.errors.push({
                tenant: currentTenant,
                endpoint: `${config.method} ${config.path}`,
                expected: config.expectedStatus,
                actual: response.status,
                message: response.data?.message || 'Unexpected status'
            });
            log(`✗ ${config.method} ${config.path} - Expected ${config.expectedStatus}, got ${response.status}`, 'red');
            if (response.data?.message) {
                log(`  Message: ${response.data.message}`, 'red');
            }
        }

        if (responseTime > 2000) {
            results.slowAPIs.push({
                tenant: currentTenant,
                endpoint: `${config.method} ${config.path}`,
                responseTime
            });
            log(`  ⚠ Slow: ${responseTime}ms`, 'yellow');
        }

        return { success, status: response.status, responseTime, data: response.data };
    } catch (error) {
        results.failed++;
        results.errors.push({
            tenant: currentTenant,
            endpoint: `${config.method} ${config.path}`,
            error: error.message
        });
        log(`✗ ${config.method} ${config.path} - Error: ${error.message}`, 'red');
        return { success: false, error: error.message };
    }
}

// Authentication
async function authenticate(tenantConfig) {
    log(`\n=== 🔐 Authentication (${tenantConfig.name}) ===`, 'cyan');

    const result = await testAPI({
        method: 'POST',
        path: '/api/auth/login',
        body: { email: tenantConfig.email, password: tenantConfig.password },
        expectedStatus: [200]
    });

    if (result.success && result.data?.token) {
        authToken = result.data.token;
        userId = result.data.user?.id;
        userRole = result.data.user?.role;
        log(`✓ Logged in as: ${result.data.user?.name} (${userRole})`, 'green');
        return true;
    }

    log('✗ Authentication failed', 'red');
    return false;
}

// Test Customers API
async function testCustomersAPI() {
    log('\n=== 👥 Customers API ===', 'magenta');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET customers
    await testAPI({
        method: 'GET',
        path: '/api/customers',
        headers,
        expectedStatus: [200]
    });

    // GET with filters
    await testAPI({
        method: 'GET',
        path: '/api/customers',
        headers,
        params: { status: 'active', segment: 'enterprise', page: 1, limit: 10 },
        expectedStatus: [200]
    });

    // POST create customer
    const createResult = await testAPI({
        method: 'POST',
        path: '/api/customers',
        headers,
        body: {
            name: `مشتری تستی ${Date.now()}`,
            email: `test${Date.now()}@example.com`,
            phone: '09123456789',
            company_name: 'شرکت تستی',
            status: 'active',
            segment: 'small_business'
        },
        expectedStatus: [200, 201]
    });

    if (createResult.success && createResult.data?.data?.id) {
        const customerId = createResult.data.data.id;
        results.createdResources.customers.push(customerId);

        // GET specific customer
        await testAPI({
            method: 'GET',
            path: `/api/customers/${customerId}`,
            headers: { ...headers, 'x-user-role': userRole, 'x-user-id': userId },
            expectedStatus: [200]
        });

        // PUT update customer
        await testAPI({
            method: 'PUT',
            path: `/api/customers/${customerId}`,
            headers: { ...headers, 'x-user-role': userRole, 'x-user-id': userId },
            body: {
                name: `مشتری به‌روز شده ${Date.now()}`,
                priority: 'high'
            },
            expectedStatus: [200]
        });
    }
}

// Test Products API
async function testProductsAPI() {
    log('\n=== 📦 Products API ===', 'magenta');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET products
    await testAPI({
        method: 'GET',
        path: '/api/products',
        headers,
        expectedStatus: [200]
    });

    // POST create product
    const createResult = await testAPI({
        method: 'POST',
        path: '/api/products',
        headers,
        body: {
            name: `محصول تستی ${Date.now()}`,
            description: 'توضیحات محصول',
            category: 'software',
            price: 1000000,
            currency: 'IRR',
            sku: `SKU-${Date.now()}`
        },
        expectedStatus: [200, 201]
    });

    if (createResult.success && createResult.data?.data?.id) {
        const productId = createResult.data.data.id;
        results.createdResources.products.push(productId);

        // GET specific product
        await testAPI({
            method: 'GET',
            path: `/api/products/${productId}`,
            headers,
            expectedStatus: [200]
        });

        // PUT update product
        await testAPI({
            method: 'PUT',
            path: `/api/products/${productId}`,
            headers: { ...headers, 'x-user-role': userRole },
            body: {
                name: `محصول به‌روز شده ${Date.now()}`,
                price: 1500000
            },
            expectedStatus: [200]
        });
    }
}

// Test Sales API
async function testSalesAPI() {
    log('\n=== 💰 Sales API ===', 'magenta');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET sales
    await testAPI({
        method: 'GET',
        path: '/api/sales',
        headers,
        expectedStatus: [200]
    });

    // GET with filters
    await testAPI({
        method: 'GET',
        path: '/api/sales',
        headers,
        params: { payment_status: 'paid', start_date: '2025-01-01' },
        expectedStatus: [200]
    });

    // POST create sale (if we have customer and product)
    if (results.createdResources.customers.length > 0 && results.createdResources.products.length > 0) {
        await testAPI({
            method: 'POST',
            path: '/api/sales',
            headers,
            body: {
                customer_id: results.createdResources.customers[0],
                total_amount: 1000000,
                currency: 'IRR',
                payment_status: 'pending',
                items: [{
                    product_id: results.createdResources.products[0],
                    quantity: 2,
                    unit_price: 500000,
                    total_price: 1000000
                }]
            },
            expectedStatus: [200, 201]
        });
    }
}

// Test Contacts API
async function testContactsAPI() {
    log('\n=== 📇 Contacts API ===', 'magenta');
    const headers = { 'Authorization': `Bearer ${authToken}`, 'x-user-id': userId };

    // GET contacts
    await testAPI({
        method: 'GET',
        path: '/api/contacts',
        headers,
        expectedStatus: [200]
    });

    // POST create contact
    const createResult = await testAPI({
        method: 'POST',
        path: '/api/contacts',
        headers,
        body: {
            first_name: 'علی',
            last_name: 'احمدی',
            email: `contact${Date.now()}@example.com`,
            phone: '09123456789',
            job_title: 'مدیر فروش'
        },
        expectedStatus: [200, 201]
    });

    if (createResult.success && createResult.data?.data?.id) {
        const contactId = createResult.data.data.id;
        results.createdResources.contacts.push(contactId);

        // PUT update contact
        await testAPI({
            method: 'PUT',
            path: '/api/contacts',
            headers,
            params: { id: contactId },
            body: {
                job_title: 'مدیر ارشد فروش'
            },
            expectedStatus: [200]
        });
    }
}

// Test Activities API
async function testActivitiesAPI() {
    log('\n=== 📋 Activities API ===', 'magenta');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET activities
    await testAPI({
        method: 'GET',
        path: '/api/activities',
        headers,
        expectedStatus: [200]
    });

    // GET with filters
    await testAPI({
        method: 'GET',
        path: '/api/activities',
        headers,
        params: { type: 'call', page: 1, limit: 10 },
        expectedStatus: [200]
    });

    // POST create activity (if we have customer)
    if (results.createdResources.customers.length > 0) {
        await testAPI({
            method: 'POST',
            path: '/api/activities',
            headers,
            body: {
                customer_id: results.createdResources.customers[0],
                type: 'call',
                title: 'تماس تستی',
                description: 'توضیحات تماس',
                outcome: 'completed'
            },
            expectedStatus: [200, 201]
        });
    }
}

// Test Tasks API
async function testTasksAPI() {
    log('\n=== ✅ Tasks API ===', 'magenta');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET tasks
    await testAPI({
        method: 'GET',
        path: '/api/tasks',
        headers,
        expectedStatus: [200]
    });

    // GET with filters
    await testAPI({
        method: 'GET',
        path: '/api/tasks',
        headers,
        params: { priority: 'high' },
        expectedStatus: [200]
    });

    // POST create task
    await testAPI({
        method: 'POST',
        path: '/api/tasks',
        headers,
        body: {
            title: `وظیفه تستی ${Date.now()}`,
            description: 'توضیحات وظیفه',
            due_date: '2025-12-31',
            priority: 'medium',
            status: 'pending',
            assigned_to: [userId] // Add current user as assignee (API expects assigned_to not assignees)
        },
        expectedStatus: [200, 201]
    });
}

// Test Events API
async function testEventsAPI() {
    log('\n=== 📅 Events API ===', 'magenta');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET events
    await testAPI({
        method: 'GET',
        path: '/api/events',
        headers,
        expectedStatus: [200]
    });
}

// Test Coworkers API
async function testCoworkersAPI() {
    log('\n=== 👨‍💼 Coworkers API ===', 'magenta');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET coworkers
    await testAPI({
        method: 'GET',
        path: '/api/coworkers',
        headers,
        expectedStatus: [200]
    });

    // GET users
    await testAPI({
        method: 'GET',
        path: '/api/users',
        headers,
        expectedStatus: [200]
    });
}

// Test System Monitoring
async function testSystemMonitoring() {
    log('\n=== 🔍 System Monitoring ===', 'magenta');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET system stats
    await testAPI({
        method: 'GET',
        path: '/api/system/stats',
        headers,
        expectedStatus: [200]
    });

    // GET system monitoring
    await testAPI({
        method: 'GET',
        path: '/api/system/monitoring',
        headers,
        expectedStatus: [200]
    });

    // GET settings status
    await testAPI({
        method: 'GET',
        path: '/api/settings/status',
        headers,
        expectedStatus: [200]
    });
}

// Test Dashboard APIs
async function testDashboardAPIs() {
    log('\n=== 📊 Dashboard APIs ===', 'magenta');
    const headers = {
        'Authorization': `Bearer ${authToken}`,
        'x-user-role': userRole,
        'x-user-id': userId
    };

    // GET dashboard stats
    await testAPI({
        method: 'GET',
        path: '/api/dashboard/stats',
        headers,
        expectedStatus: [200]
    });

    // GET dashboard admin
    await testAPI({
        method: 'GET',
        path: '/api/dashboard/admin',
        headers: { 'Authorization': `Bearer ${authToken}` },
        expectedStatus: [200]
    });
}

// Test Permissions
async function testPermissionsAPI() {
    log('\n=== 🔐 Permissions API ===', 'magenta');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET permissions modules
    await testAPI({
        method: 'GET',
        path: '/api/permissions/modules',
        headers,
        expectedStatus: [200]
    });

    // GET user permissions
    await testAPI({
        method: 'GET',
        path: '/api/user-permissions',
        headers,
        expectedStatus: [200]
    });
}

// Generate Report
function generateReport() {
    log('\n' + '='.repeat(80), 'cyan');
    log('📋 COMPLETE API TESTING REPORT', 'cyan');
    log('='.repeat(80), 'cyan');

    log(`\n📊 Overall Summary:`, 'blue');
    log(`   Total Tests: ${results.total}`, 'blue');
    log(`   ✓ Passed: ${results.passed} (${((results.passed / results.total) * 100).toFixed(1)}%)`, 'green');
    log(`   ✗ Failed: ${results.failed} (${((results.failed / results.total) * 100).toFixed(1)}%)`, 'red');

    if (results.slowAPIs.length > 0) {
        log(`\n⚠️  Slow APIs (>2s): ${results.slowAPIs.length}`, 'yellow');
        results.slowAPIs.forEach(api => {
            log(`   [${api.tenant}] ${api.endpoint}: ${api.responseTime}ms`, 'yellow');
        });
    }

    if (results.errors.length > 0) {
        log(`\n❌ Failed Tests: ${results.errors.length}`, 'red');
        results.errors.forEach((error, index) => {
            log(`\n${index + 1}. [${error.tenant}] ${error.endpoint}`, 'red');
            if (error.expected) {
                log(`   Expected: ${error.expected.join(', ')}`, 'red');
                log(`   Actual: ${error.actual}`, 'red');
            }
            if (error.message) {
                log(`   Message: ${error.message}`, 'red');
            }
        });
    }

    log('\n' + '='.repeat(80), 'cyan');

    // Save report
    const reportData = {
        timestamp: new Date().toISOString(),
        summary: {
            total: results.total,
            passed: results.passed,
            failed: results.failed,
            passRate: ((results.passed / results.total) * 100).toFixed(1) + '%'
        },
        slowAPIs: results.slowAPIs,
        errors: results.errors,
        createdResources: results.createdResources
    };

    fs.writeFileSync('COMPLETE-API-TEST-REPORT.json', JSON.stringify(reportData, null, 2));
    log('\n📄 Report saved to: COMPLETE-API-TEST-REPORT.json', 'green');
}

// Main execution
async function main() {
    log('🚀 Starting Complete API Testing...', 'cyan');
    log(`📍 Base URL: ${BASE_URL}\n`, 'blue');

    try {
        // Test for each tenant
        for (const [tenantKey, tenantConfig] of Object.entries(TENANTS)) {
            currentTenant = tenantKey;
            log(`\n${'='.repeat(80)}`, 'magenta');
            log(`🏢 Testing Tenant: ${tenantConfig.name} (${tenantKey})`, 'magenta');
            log(`${'='.repeat(80)}`, 'magenta');

            const authenticated = await authenticate(tenantConfig);
            if (!authenticated) {
                log(`⚠️  Skipping ${tenantConfig.name} - authentication failed`, 'yellow');
                continue;
            }

            // Run all tests for this tenant
            await testCustomersAPI();
            await testProductsAPI();
            await testSalesAPI();
            await testContactsAPI();
            await testActivitiesAPI();
            await testTasksAPI();
            await testEventsAPI();
            await testCoworkersAPI();
            await testSystemMonitoring();
            await testDashboardAPIs();
            await testPermissionsAPI();
        }

        // Generate final report
        generateReport();

    } catch (error) {
        log(`\n❌ Fatal error: ${error.message}`, 'red');
        console.error(error);
    }
}

// Run tests
main();
