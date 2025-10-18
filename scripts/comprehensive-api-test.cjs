const axios = require('axios');
const fs = require('fs');

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@rabin.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Results storage
const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    slowAPIs: [],
    testDetails: []
};

let authToken = null;
let testCustomerId = null;
let testDealId = null;
let testProductId = null;

// Helper function
async function testAPI(config) {
    const startTime = Date.now();
    results.total++;

    const testDetail = {
        endpoint: `${config.method} ${config.path}`,
        params: config.params || {},
        expectedStatus: config.expectedStatus,
        actualStatus: null,
        responseTime: 0,
        status: 'pending',
        error: null
    };

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
        testDetail.responseTime = responseTime;
        testDetail.actualStatus = response.status;

        const success = config.expectedStatus.includes(response.status);

        if (success) {
            results.passed++;
            testDetail.status = 'passed';
            console.log(`✓ ${config.method} ${config.path} - ${response.status} (${responseTime}ms)`);
        } else {
            results.failed++;
            testDetail.status = 'failed';
            testDetail.error = response.data?.message || 'Unexpected status code';
            results.errors.push({
                endpoint: `${config.method} ${config.path}`,
                expected: config.expectedStatus,
                actual: response.status,
                responseTime,
                message: response.data?.message || 'Unexpected status code',
                response: response.data
            });
            console.log(`✗ ${config.method} ${config.path} - Expected ${config.expectedStatus}, got ${response.status}`);
        }

        if (responseTime > 2000) {
            results.slowAPIs.push({
                endpoint: `${config.method} ${config.path}`,
                responseTime
            });
            console.log(`  ⚠ Slow response: ${responseTime}ms`);
        }

        results.testDetails.push(testDetail);
        return { success, status: response.status, responseTime, data: response.data };
    } catch (error) {
        results.failed++;
        testDetail.status = 'error';
        testDetail.error = error.message;
        testDetail.responseTime = Date.now() - startTime;

        results.errors.push({
            endpoint: `${config.method} ${config.path}`,
            error: error.message,
            responseTime: testDetail.responseTime
        });

        results.testDetails.push(testDetail);
        console.log(`✗ ${config.method} ${config.path} - Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Authentication
async function authenticate() {
    console.log('\n=== 1. Authentication APIs ===');

    const loginResult = await testAPI({
        method: 'POST',
        path: '/api/auth/login',
        body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
        expectedStatus: [200]
    });

    if (loginResult.success && loginResult.data?.token) {
        authToken = loginResult.data.token;
        console.log('✓ Authentication successful');
    }

    // Test /api/auth/me
    await testAPI({
        method: 'GET',
        path: '/api/auth/me',
        headers: { 'Authorization': `Bearer ${authToken}` },
        expectedStatus: [200]
    });

    // Test /api/auth/permissions
    await testAPI({
        method: 'GET',
        path: '/api/auth/permissions',
        headers: { 'Authorization': `Bearer ${authToken}` },
        expectedStatus: [200]
    });

    return authToken;
}

// Test Customer APIs
async function testCustomerAPIs() {
    console.log('\n=== 2. Customer APIs ===');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET all customers
    await testAPI({
        method: 'GET',
        path: '/api/customers',
        headers,
        expectedStatus: [200]
    });

    // GET with pagination
    await testAPI({
        method: 'GET',
        path: '/api/customers',
        headers,
        params: { page: 1, limit: 10 },
        expectedStatus: [200]
    });

    // GET with search
    await testAPI({
        method: 'GET',
        path: '/api/customers',
        headers,
        params: { search: 'test' },
        expectedStatus: [200]
    });

    // GET with filters
    await testAPI({
        method: 'GET',
        path: '/api/customers',
        headers,
        params: { status: 'active', segment: 'enterprise', priority: 'high' },
        expectedStatus: [200]
    });

    // GET customer stats
    await testAPI({
        method: 'GET',
        path: '/api/customers/stats',
        headers,
        expectedStatus: [200]
    });

    // GET filter options
    await testAPI({
        method: 'GET',
        path: '/api/customers/filter-options',
        headers,
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
            segment: 'small_business',
            priority: 'medium'
        },
        expectedStatus: [200, 201]
    });

    if (createResult.success && createResult.data?.data?.id) {
        testCustomerId = createResult.data.data.id;
    }

    // Test without auth
    await testAPI({
        method: 'GET',
        path: '/api/customers',
        expectedStatus: [401]
    });
}

// Test Deals APIs
async function testDealsAPIs() {
    console.log('\n=== 3. Deals APIs ===');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET all deals
    await testAPI({
        method: 'GET',
        path: '/api/deals',
        headers,
        expectedStatus: [200]
    });

    // GET with search
    await testAPI({
        method: 'GET',
        path: '/api/deals',
        headers,
        params: { search: 'test' },
        expectedStatus: [200]
    });

    // POST create deal (if we have a customer)
    if (testCustomerId) {
        const createResult = await testAPI({
            method: 'POST',
            path: '/api/deals',
            headers,
            body: {
                title: `معامله تستی ${Date.now()}`,
                customer_id: testCustomerId,
                total_value: 10000000,
                currency: 'IRR',
                probability: 50,
                expected_close_date: '2025-12-31'
            },
            expectedStatus: [200, 201]
        });

        if (createResult.success && createResult.data?.data?.id) {
            testDealId = createResult.data.data.id;
        }
    }
}

// Test Tasks APIs
async function testTasksAPIs() {
    console.log('\n=== 4. Tasks APIs ===');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET all tasks
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
        params: { status: 'pending', priority: 'high' },
        expectedStatus: [200]
    });

    // GET task users
    await testAPI({
        method: 'GET',
        path: '/api/tasks/users',
        headers,
        expectedStatus: [200]
    });

    // POST create task
    await testAPI({
        method: 'POST',
        path: '/api/tasks',
        headers,
        body: {
            title: `وظیفه تستی ${Date.now()}`,
            description: 'توضیحات تستی',
            due_date: '2025-12-31',
            priority: 'medium',
            status: 'pending'
        },
        expectedStatus: [200, 201]
    });
}

// Test Products APIs
async function testProductsAPIs() {
    console.log('\n=== 5. Products APIs ===');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET all products
    await testAPI({
        method: 'GET',
        path: '/api/products',
        headers,
        expectedStatus: [200]
    });

    // GET with pagination
    await testAPI({
        method: 'GET',
        path: '/api/products',
        headers,
        params: { page: 1, limit: 20 },
        expectedStatus: [200]
    });

    // GET with search
    await testAPI({
        method: 'GET',
        path: '/api/products',
        headers,
        params: { search: 'test' },
        expectedStatus: [200]
    });

    // GET with filters
    await testAPI({
        method: 'GET',
        path: '/api/products',
        headers,
        params: { status: 'active', category: 'software' },
        expectedStatus: [200]
    });

    // POST create product
    const createResult = await testAPI({
        method: 'POST',
        path: '/api/products',
        headers,
        body: {
            name: `محصول تستی ${Date.now()}`,
            description: 'توضیحات محصول تستی',
            category: 'software',
            price: 1000000,
            currency: 'IRR',
            sku: `SKU-${Date.now()}`
        },
        expectedStatus: [200, 201]
    });

    if (createResult.success && createResult.data?.data?.id) {
        testProductId = createResult.data.data.id;
    }
}

// Test Dashboard APIs
async function testDashboardAPIs() {
    console.log('\n=== 6. Dashboard APIs ===');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET dashboard stats
    await testAPI({
        method: 'GET',
        path: '/api/dashboard/stats',
        headers,
        expectedStatus: [200]
    });

    // GET with period filter
    await testAPI({
        method: 'GET',
        path: '/api/dashboard/stats',
        headers,
        params: { period: 'week' },
        expectedStatus: [200]
    });

    await testAPI({
        method: 'GET',
        path: '/api/dashboard/stats',
        headers,
        params: { period: 'month' },
        expectedStatus: [200]
    });

    await testAPI({
        method: 'GET',
        path: '/api/dashboard/stats',
        headers,
        params: { period: 'year' },
        expectedStatus: [200]
    });
}

// Test Users APIs
async function testUsersAPIs() {
    console.log('\n=== 7. Users APIs ===');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET all users
    await testAPI({
        method: 'GET',
        path: '/api/users',
        headers,
        expectedStatus: [200]
    });

    // GET coworkers
    await testAPI({
        method: 'GET',
        path: '/api/coworkers',
        headers,
        expectedStatus: [200]
    });
}

// Test Documents APIs
async function testDocumentsAPIs() {
    console.log('\n=== 8. Documents APIs ===');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET all documents
    await testAPI({
        method: 'GET',
        path: '/api/documents',
        headers,
        expectedStatus: [200]
    });

    // GET document stats
    await testAPI({
        method: 'GET',
        path: '/api/documents/stats',
        headers,
        expectedStatus: [200]
    });

    // GET document categories
    await testAPI({
        method: 'GET',
        path: '/api/document-categories',
        headers,
        expectedStatus: [200]
    });
}

// Test Notifications APIs
async function testNotificationsAPIs() {
    console.log('\n=== 9. Notifications APIs ===');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET notifications
    await testAPI({
        method: 'GET',
        path: '/api/notifications',
        headers,
        expectedStatus: [200]
    });
}

// Test Activities APIs
async function testActivitiesAPIs() {
    console.log('\n=== 10. Activities APIs ===');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET activities
    await testAPI({
        method: 'GET',
        path: '/api/activities',
        headers,
        expectedStatus: [200]
    });
}

// Test Events APIs
async function testEventsAPIs() {
    console.log('\n=== 11. Events APIs ===');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET events
    await testAPI({
        method: 'GET',
        path: '/api/events',
        headers,
        expectedStatus: [200]
    });
}

// Test Search APIs
async function testSearchAPIs() {
    console.log('\n=== 12. Search APIs ===');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET search results
    await testAPI({
        method: 'GET',
        path: '/api/search',
        headers,
        params: { q: 'test' },
        expectedStatus: [200]
    });

    // Empty search
    await testAPI({
        method: 'GET',
        path: '/api/search',
        headers,
        params: { q: '' },
        expectedStatus: [200]
    });
}

// Test Reports APIs
async function testReportsAPIs() {
    console.log('\n=== 13. Reports APIs ===');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET reports
    await testAPI({
        method: 'GET',
        path: '/api/reports',
        headers,
        expectedStatus: [200]
    });

    // GET today's report
    await testAPI({
        method: 'GET',
        path: '/api/reports/today',
        headers,
        expectedStatus: [200]
    });

    // GET reports analysis
    await testAPI({
        method: 'GET',
        path: '/api/reports-analysis',
        headers,
        expectedStatus: [200]
    });
}

// Test Sales APIs
async function testSalesAPIs() {
    console.log('\n=== 14. Sales APIs ===');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET sales
    await testAPI({
        method: 'GET',
        path: '/api/sales',
        headers,
        expectedStatus: [200]
    });
}

// Test Permissions APIs
async function testPermissionsAPIs() {
    console.log('\n=== 15. Permissions APIs ===');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET permissions
    await testAPI({
        method: 'GET',
        path: '/api/permissions',
        headers,
        expectedStatus: [200]
    });

    // GET modules
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

// Test Settings APIs
async function testSettingsAPIs() {
    console.log('\n=== 16. Settings APIs ===');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET settings status
    await testAPI({
        method: 'GET',
        path: '/api/settings/status',
        headers,
        expectedStatus: [200]
    });

    // GET system stats
    await testAPI({
        method: 'GET',
        path: '/api/settings/system-stats',
        headers,
        expectedStatus: [200]
    });
}

// Test Profile APIs
async function testProfileAPIs() {
    console.log('\n=== 17. Profile APIs ===');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET profile
    await testAPI({
        method: 'GET',
        path: '/api/profile',
        headers,
        expectedStatus: [200]
    });
}

// Test Contacts APIs
async function testContactsAPIs() {
    console.log('\n=== 18. Contacts APIs ===');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET contacts
    await testAPI({
        method: 'GET',
        path: '/api/contacts',
        headers,
        expectedStatus: [200]
    });
}

// Test Companies APIs
async function testCompaniesAPIs() {
    console.log('\n=== 19. Companies APIs ===');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET companies
    await testAPI({
        method: 'GET',
        path: '/api/companies',
        headers,
        expectedStatus: [200]
    });
}

// Test Feedback APIs
async function testFeedbackAPIs() {
    console.log('\n=== 20. Feedback APIs ===');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET feedback
    await testAPI({
        method: 'GET',
        path: '/api/feedback',
        headers,
        expectedStatus: [200]
    });

    // GET feedback forms
    await testAPI({
        method: 'GET',
        path: '/api/feedback/forms',
        headers,
        expectedStatus: [200]
    });
}

// Test Health API
async function testHealthAPI() {
    console.log('\n=== 21. Health Check ===');

    await testAPI({
        method: 'GET',
        path: '/api/health',
        expectedStatus: [200]
    });
}

// Test Sidebar Menu API
async function testSidebarMenuAPI() {
    console.log('\n=== 22. Sidebar Menu ===');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    await testAPI({
        method: 'GET',
        path: '/api/sidebar-menu',
        headers,
        expectedStatus: [200]
    });
}

// Test System APIs
async function testSystemAPIs() {
    console.log('\n=== 23. System APIs ===');
    const headers = { 'Authorization': `Bearer ${authToken}` };

    // GET system stats
    await testAPI({
        method: 'GET',
        path: '/api/system/stats',
        expectedStatus: [200]
    });

    // GET system monitoring
    await testAPI({
        method: 'GET',
        path: '/api/system/monitoring',
        headers,
        expectedStatus: [200]
    });
}

// Generate Report
function generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('API TESTING REPORT');
    console.log('='.repeat(80));

    console.log(`\n📊 Summary:`);
    console.log(`   Total Tests: ${results.total}`);
    console.log(`   ✓ Passed: ${results.passed} (${((results.passed / results.total) * 100).toFixed(1)}%)`);
    console.log(`   ✗ Failed: ${results.failed} (${((results.failed / results.total) * 100).toFixed(1)}%)`);

    if (results.slowAPIs.length > 0) {
        console.log(`\n⚠️  Slow APIs (>2s): ${results.slowAPIs.length}`);
        results.slowAPIs.forEach(api => {
            console.log(`   - ${api.endpoint}: ${api.responseTime}ms`);
        });
    }

    if (results.errors.length > 0) {
        console.log(`\n❌ Failed Tests: ${results.errors.length}`);
        results.errors.forEach((error, index) => {
            console.log(`\n${index + 1}. ${error.endpoint}`);
            if (error.expected) {
                console.log(`   Expected: ${error.expected.join(', ')}`);
                console.log(`   Actual: ${error.actual}`);
            }
            if (error.error) {
                console.log(`   Error: ${error.error}`);
            }
            if (error.message) {
                console.log(`   Message: ${error.message}`);
            }
        });
    }

    console.log('\n' + '='.repeat(80));

    // Save detailed report to file
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
        testDetails: results.testDetails
    };

    fs.writeFileSync('API-TEST-REPORT.json', JSON.stringify(reportData, null, 2));
    console.log('\n📄 Detailed report saved to: API-TEST-REPORT.json');

    // Generate Markdown report
    generateMarkdownReport(reportData);
}

function generateMarkdownReport(reportData) {
    let md = '# API Testing Report\n\n';
    md += `**Generated:** ${new Date().toLocaleString('fa-IR')}\n\n`;

    md += '## Summary\n\n';
    md += `- **Total Tests:** ${reportData.summary.total}\n`;
    md += `- **✓ Passed:** ${reportData.summary.passed} (${reportData.summary.passRate})\n`;
    md += `- **✗ Failed:** ${reportData.summary.failed}\n\n`;

    if (reportData.slowAPIs.length > 0) {
        md += '## ⚠️ Slow APIs (>2s)\n\n';
        md += '| Endpoint | Response Time |\n';
        md += '|----------|---------------|\n';
        reportData.slowAPIs.forEach(api => {
            md += `| ${api.endpoint} | ${api.responseTime}ms |\n`;
        });
        md += '\n';
    }

    if (reportData.errors.length > 0) {
        md += '## ❌ Failed Tests\n\n';
        reportData.errors.forEach((error, index) => {
            md += `### ${index + 1}. ${error.endpoint}\n\n`;
            if (error.expected) {
                md += `- **Expected:** ${error.expected.join(', ')}\n`;
                md += `- **Actual:** ${error.actual}\n`;
            }
            if (error.error) {
                md += `- **Error:** ${error.error}\n`;
            }
            if (error.message) {
                md += `- **Message:** ${error.message}\n`;
            }
            md += '\n';
        });
    }

    md += '## Test Details\n\n';
    md += '| Endpoint | Status | Response Time | Result |\n';
    md += '|----------|--------|---------------|--------|\n';
    reportData.testDetails.forEach(test => {
        const statusIcon = test.status === 'passed' ? '✓' : '✗';
        md += `| ${test.endpoint} | ${test.actualStatus || 'N/A'} | ${test.responseTime}ms | ${statusIcon} ${test.status} |\n`;
    });

    fs.writeFileSync('API-TEST-REPORT.md', md);
    console.log('📄 Markdown report saved to: API-TEST-REPORT.md\n');
}

// Main execution
async function main() {
    console.log('🚀 Starting Comprehensive API Testing...');
    console.log(`📍 Base URL: ${BASE_URL}\n`);

    try {
        await authenticate();

        if (!authToken) {
            console.log('\n❌ Cannot proceed without authentication');
            return;
        }

        // Run all tests
        await testHealthAPI();
        await testCustomerAPIs();
        await testDealsAPIs();
        await testTasksAPIs();
        await testProductsAPIs();
        await testDashboardAPIs();
        await testUsersAPIs();
        await testDocumentsAPIs();
        await testNotificationsAPIs();
        await testActivitiesAPIs();
        await testEventsAPIs();
        await testSearchAPIs();
        await testReportsAPIs();
        await testSalesAPIs();
        await testPermissionsAPIs();
        await testSettingsAPIs();
        await testProfileAPIs();
        await testContactsAPIs();
        await testCompaniesAPIs();
        await testFeedbackAPIs();
        await testSidebarMenuAPI();
        await testSystemAPIs();

        // Generate final report
        generateReport();

    } catch (error) {
        console.log(`\n❌ Fatal error: ${error.message}`);
        console.error(error);
    }
}

// Run tests
main();
