const axios = require('axios');

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'Robintejarat@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const TEST_TENANT_KEY = 'rabin';

// Results storage
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  slowAPIs: [],
  categories: {}
};

// Color codes for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
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
      timeout: 30000,
      validateStatus: () => true // Don't throw on any status
    });
    
    const responseTime = Date.now() - startTime;
    const success = config.expectedStatus.includes(response.status);
    
    if (success) {
      results.passed++;
      log(`✓ ${config.method} ${config.path} - ${response.status} (${responseTime}ms)`, 'green');
    } else {
      results.failed++;
      const error = {
        endpoint: `${config.method} ${config.path}`,
        expected: config.expectedStatus,
        actual: response.status,
        responseTime,
        message: response.data?.message || 'Unexpected status code'
      };
      results.errors.push(error);
      log(`✗ ${config.method} ${config.path} - Expected ${config.expectedStatus}, got ${response.status}`, 'red');
    }
    
    // Track slow APIs
    if (responseTime > 2000) {
      results.slowAPIs.push({
        endpoint: `${config.method} ${config.path}`,
        responseTime
      });
      log(`  ⚠ Slow response: ${responseTime}ms`, 'yellow');
    }
    
    return { success, status: response.status, responseTime, data: response.data };
  } catch (error) {
    results.failed++;
    const err = {
      endpoint: `${config.method} ${config.path}`,
      error: error.message,
      responseTime: Date.now() - startTime
    };
    results.errors.push(err);
    log(`✗ ${config.method} ${config.path} - Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// Authentication
let authToken = null;
let tenantToken = null;

async function authenticate() {
  log('\n=== Authentication ===', 'cyan');
  
  // Test admin login
  const loginResult = await testAPI({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    expectedStatus: [200]
  });
  
  if (loginResult.success && loginResult.data?.token) {
    authToken = loginResult.data.token;
    log('✓ Admin authentication successful', 'green');
  } else {
    log('✗ Admin authentication failed', 'red');
  }
  
  return authToken;
}

// Test Categories
async function testCustomerAPIs() {
  log('\n=== Customer APIs ===', 'cyan');
  
  const headers = { 'Authorization': `Bearer ${authToken}` };
  
  // GET customers
  await testAPI({
    method: 'GET',
    path: '/api/customers',
    headers,
    expectedStatus: [200]
  });
  
  // GET customers with pagination
  await testAPI({
    method: 'GET',
    path: '/api/customers?page=1&limit=10',
    headers,
    expectedStatus: [200]
  });
  
  // GET customers with search
  await testAPI({
    method: 'GET',
    path: '/api/customers?search=test',
    headers,
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
      name: 'مشتری تستی',
      email: `test${Date.now()}@example.com`,
      phone: '09123456789',
      status: 'active'
    },
    expectedStatus: [200, 201]
  });
  
  // Test without auth
  await testAPI({
    method: 'GET',
    path: '/api/customers',
    expectedStatus: [401]
  });
}

async function testDealsAPIs() {
  log('\n=== Deals APIs ===', 'cyan');
  
  const headers = { 'Authorization': `Bearer ${authToken}` };
  
  await testAPI({
    method: 'GET',
    path: '/api/deals',
    headers,
    expectedStatus: [200]
  });
  
  await testAPI({
    method: 'GET',
    path: '/api/deals?status=open',
    headers,
    expectedStatus: [200]
  });
}

async function testTasksAPIs() {
  log('\n=== Tasks APIs ===', 'cyan');
  
  const headers = { 'Authorization': `Bearer ${authToken}` };
  
  await testAPI({
    method: 'GET',
    path: '/api/tasks',
    headers,
    expectedStatus: [200]
  });
  
  await testAPI({
    method: 'GET',
    path: '/api/tasks?status=pending',
    headers,
    expectedStatus: [200]
  });
}

async function testDashboardAPIs() {
  log('\n=== Dashboard APIs ===', 'cyan');
  
  const headers = { 'Authorization': `Bearer ${authToken}` };
  
  await testAPI({
    method: 'GET',
    path: '/api/dashboard/stats',
    headers,
    expectedStatus: [200]
  });
}

async function testProductsAPIs() {
  log('\n=== Products APIs ===', 'cyan');
  
  const headers = { 'Authorization': `Bearer ${authToken}` };
  
  await testAPI({
    method: 'GET',
    path: '/api/products',
    headers,
    expectedStatus: [200]
  });
}

async function testUsersAPIs() {
  log('\n=== Users APIs ===', 'cyan');
  
  const headers = { 'Authorization': `Bearer ${authToken}` };
  
  await testAPI({
    method: 'GET',
    path: '/api/users',
    headers,
    expectedStatus: [200]
  });
  
  await testAPI({
    method: 'GET',
    path: '/api/coworkers',
    headers,
    expectedStatus: [200]
  });
}

async function testDocumentsAPIs() {
  log('\n=== Documents APIs ===', 'cyan');
  
  const headers = { 'Authorization': `Bearer ${authToken}` };
  
  await testAPI({
    method: 'GET',
    path: '/api/documents',
    headers,
    expectedStatus: [200]
  });
  
  await testAPI({
    method: 'GET',
    path: '/api/documents/stats',
    headers,
    expectedStatus: [200]
  });
  
  await testAPI({
    method: 'GET',
    path: '/api/document-categories',
    headers,
    expectedStatus: [200]
  });
}

async function testNotificationsAPIs() {
  log('\n=== Notifications APIs ===', 'cyan');
  
  const headers = { 'Authorization': `Bearer ${authToken}` };
  
  await testAPI({
    method: 'GET',
    path: '/api/notifications',
    headers,
    expectedStatus: [200]
  });
}

async function testActivitiesAPIs() {
  log('\n=== Activities APIs ===', 'cyan');
  
  const headers = { 'Authorization': `Bearer ${authToken}` };
  
  await testAPI({
    method: 'GET',
    path: '/api/activities',
    headers,
    expectedStatus: [200]
  });
}

async function testEventsAPIs() {
  log('\n=== Events APIs ===', 'cyan');
  
  const headers = { 'Authorization': `Bearer ${authToken}` };
  
  await testAPI({
    method: 'GET',
    path: '/api/events',
    headers,
    expectedStatus: [200]
  });
}

async function testSearchAPIs() {
  log('\n=== Search APIs ===', 'cyan');
  
  const headers = { 'Authorization': `Bearer ${authToken}` };
  
  await testAPI({
    method: 'GET',
    path: '/api/search?q=test',
    headers,
    expectedStatus: [200]
  });
}

async function testReportsAPIs() {
  log('\n=== Reports APIs ===', 'cyan');
  
  const headers = { 'Authorization': `Bearer ${authToken}` };
  
  await testAPI({
    method: 'GET',
    path: '/api/reports',
    headers,
    expectedStatus: [200]
  });
  
  await testAPI({
    method: 'GET',
    path: '/api/reports/today',
    headers,
    expectedStatus: [200]
  });
}

async function testSalesAPIs() {
  log('\n=== Sales APIs ===', 'cyan');
  
  const headers = { 'Authorization': `Bearer ${authToken}` };
  
  await testAPI({
    method: 'GET',
    path: '/api/sales',
    headers,
    expectedStatus: [200]
  });
}

async function testPermissionsAPIs() {
  log('\n=== Permissions APIs ===', 'cyan');
  
  const headers = { 'Authorization': `Bearer ${authToken}` };
  
  await testAPI({
    method: 'GET',
    path: '/api/permissions',
    headers,
    expectedStatus: [200]
  });
  
  await testAPI({
    method: 'GET',
    path: '/api/permissions/modules',
    headers,
    expectedStatus: [200]
  });
}

async function testSettingsAPIs() {
  log('\n=== Settings APIs ===', 'cyan');
  
  const headers = { 'Authorization': `Bearer ${authToken}` };
  
  await testAPI({
    method: 'GET',
    path: '/api/settings/status',
    headers,
    expectedStatus: [200]
  });
  
  await testAPI({
    method: 'GET',
    path: '/api/settings/system-stats',
    headers,
    expectedStatus: [200]
  });
}

async function testProfileAPIs() {
  log('\n=== Profile APIs ===', 'cyan');
  
  const headers = { 'Authorization': `Bearer ${authToken}` };
  
  await testAPI({
    method: 'GET',
    path: '/api/profile',
    headers,
    expectedStatus: [200]
  });
}

async function testContactsAPIs() {
  log('\n=== Contacts APIs ===', 'cyan');
  
  const headers = { 'Authorization': `Bearer ${authToken}` };
  
  await testAPI({
    method: 'GET',
    path: '/api/contacts',
    headers,
    expectedStatus: [200]
  });
}

async function testCompaniesAPIs() {
  log('\n=== Companies APIs ===', 'cyan');
  
  const headers = { 'Authorization': `Bearer ${authToken}` };
  
  await testAPI({
    method: 'GET',
    path: '/api/companies',
    headers,
    expectedStatus: [200]
  });
}

async function testFeedbackAPIs() {
  log('\n=== Feedback APIs ===', 'cyan');
  
  const headers = { 'Authorization': `Bearer ${authToken}` };
  
  await testAPI({
    method: 'GET',
    path: '/api/feedback',
    headers,
    expectedStatus: [200]
  });
  
  await testAPI({
    method: 'GET',
    path: '/api/feedback/forms',
    headers,
    expectedStatus: [200]
  });
}

async function testHealthAPI() {
  log('\n=== Health Check ===', 'cyan');
  
  await testAPI({
    method: 'GET',
    path: '/api/health',
    expectedStatus: [200]
  });
}

async function testTenantAPIs() {
  log('\n=== Tenant APIs ===', 'cyan');
  
  const headers = { 
    'Authorization': `Bearer ${authToken}`,
    'x-tenant-key': TEST_TENANT_KEY
  };
  
  await testAPI({
    method: 'GET',
    path: '/api/tenant/info',
    headers,
    expectedStatus: [200]
  });
  
  await testAPI({
    method: 'GET',
    path: '/api/tenant/dashboard',
    headers,
    expectedStatus: [200]
  });
  
  await testAPI({
    method: 'GET',
    path: '/api/tenant/customers',
    headers,
    expectedStatus: [200]
  });
}

async function testAdminAPIs() {
  log('\n=== Admin APIs ===', 'cyan');
  
  const headers = { 'Authorization': `Bearer ${authToken}` };
  
  await testAPI({
    method: 'GET',
    path: '/api/admin/stats',
    headers,
    expectedStatus: [200]
  });
  
  await testAPI({
    method: 'GET',
    path: '/api/admin/tenants',
    headers,
    expectedStatus: [200]
  });
}

// Generate Report
function generateReport() {
  log('\n' + '='.repeat(60), 'cyan');
  log('API Testing Report', 'cyan');
  log('='.repeat(60), 'cyan');
  
  log(`\nTotal Tests: ${results.total}`, 'blue');
  log(`Passed: ${results.passed} (${((results.passed/results.total)*100).toFixed(1)}%)`, 'green');
  log(`Failed: ${results.failed} (${((results.failed/results.total)*100).toFixed(1)}%)`, 'red');
  
  if (results.slowAPIs.length > 0) {
    log(`\n⚠ Slow APIs (>2s): ${results.slowAPIs.length}`, 'yellow');
    results.slowAPIs.forEach(api => {
      log(`  - ${api.endpoint}: ${api.responseTime}ms`, 'yellow');
    });
  }
  
  if (results.errors.length > 0) {
    log(`\n✗ Failed Tests: ${results.errors.length}`, 'red');
    results.errors.forEach((error, index) => {
      log(`\n${index + 1}. ${error.endpoint}`, 'red');
      if (error.expected) {
        log(`   Expected: ${error.expected.join(', ')}`, 'red');
        log(`   Actual: ${error.actual}`, 'red');
      }
      if (error.error) {
        log(`   Error: ${error.error}`, 'red');
      }
      if (error.message) {
        log(`   Message: ${error.message}`, 'red');
      }
    });
  }
  
  log('\n' + '='.repeat(60), 'cyan');
}

// Main execution
async function main() {
  log('Starting API Testing...', 'cyan');
  log(`Base URL: ${BASE_URL}\n`, 'blue');
  
  try {
    // Authenticate first
    await authenticate();
    
    if (!authToken) {
      log('\n✗ Cannot proceed without authentication', 'red');
      return;
    }
    
    // Test all API categories
    await testHealthAPI();
    await testCustomerAPIs();
    await testDealsAPIs();
    await testTasksAPIs();
    await testDashboardAPIs();
    await testProductsAPIs();
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
    await testTenantAPIs();
    await testAdminAPIs();
    
    // Generate final report
    generateReport();
    
  } catch (error) {
    log(`\nFatal error: ${error.message}`, 'red');
    console.error(error);
  }
}

// Run tests
main();
