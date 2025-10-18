const axios = require('axios');

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'Robintejarat@gmail.com';
const TEST_PASSWORD = 'admin123';

// Results storage
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  slowAPIs: [],
  testDetails: []
};

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
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test helper function
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
    error: null,
    response: null
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
    testDetail.response = response.data;
    
    const success = config.expectedStatus.includes(response.status);
    
    if (success) {
      results.passed++;
      testDetail.status = 'passed';
      log(`✓ ${config.method} ${config.path} - ${response.status} (${responseTime}ms)`, 'green');
      
      // Log response summary
      if (config.logResponse && response.data) {
        log(`  Response keys: ${Object.keys(response.data).join(', ')}`, 'cyan');
      }
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
      log(`✗ ${config.method} ${config.path} - Expected ${config.expectedStatus}, got ${response.status}`, 'red');
      if (response.data?.message) {
        log(`  Message: ${response.data.message}`, 'red');
      }
    }
    
    if (responseTime > 2000) {
      results.slowAPIs.push({
        endpoint: `${config.method} ${config.path}`,
        responseTime
      });
      log(`  ⚠ Slow response: ${responseTime}ms`, 'yellow');
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
    log(`✗ ${config.method} ${config.path} - Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// Authentication
async function authenticate() {
  log('\n=== 🔐 Authentication ===', 'cyan');
  
  const loginResult = await testAPI({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: TEST_EMAIL, password: TEST_PASSWORD },
    expectedStatus: [200],
    logResponse: true
  });
  
  if (loginResult.success && loginResult.data?.token) {
    authToken = loginResult.data.token;
    userId = loginResult.data.user?.id;
    userRole = loginResult.data.user?.role;
    log(`✓ Authentication successful`, 'green');
    log(`  User: ${loginResult.data.user?.name}`, 'cyan');
    log(`  Role: ${userRole}`, 'cyan');
    log(`  User ID: ${userId}`, 'cyan');
  } else {
    log('✗ Authentication failed', 'red');
  }
  
  return authToken;
}

// Test Dashboard Stats API
async function testDashboardStatsAPI() {
  log('\n=== 📊 Dashboard Stats API ===', 'cyan');
  const headers = { 
    'Authorization': `Bearer ${authToken}`,
    'x-user-role': userRole,
    'x-user-id': userId
  };
  
  // Test 1: Get dashboard stats (default period)
  log('\n1. GET /api/dashboard/stats (default period)', 'blue');
  const result1 = await testAPI({
    method: 'GET',
    path: '/api/dashboard/stats',
    headers,
    expectedStatus: [200],
    logResponse: true
  });
  
  if (result1.success && result1.data?.data) {
    const data = result1.data.data;
    log(`  ✓ Customers: ${JSON.stringify(data.customers)}`, 'cyan');
    log(`  ✓ Deals: ${JSON.stringify(data.deals)}`, 'cyan');
    log(`  ✓ Period: ${data.period}`, 'cyan');
  }
  
  // Test 2: Get dashboard stats (week)
  log('\n2. GET /api/dashboard/stats?period=week', 'blue');
  const result2 = await testAPI({
    method: 'GET',
    path: '/api/dashboard/stats',
    headers,
    params: { period: 'week' },
    expectedStatus: [200],
    logResponse: true
  });
  
  if (result2.success && result2.data?.data) {
    log(`  ✓ Period: ${result2.data.data.period}`, 'cyan');
  }
  
  // Test 3: Get dashboard stats (month)
  log('\n3. GET /api/dashboard/stats?period=month', 'blue');
  await testAPI({
    method: 'GET',
    path: '/api/dashboard/stats',
    headers,
    params: { period: 'month' },
    expectedStatus: [200],
    logResponse: true
  });
  
  // Test 4: Get dashboard stats (quarter)
  log('\n4. GET /api/dashboard/stats?period=quarter', 'blue');
  await testAPI({
    method: 'GET',
    path: '/api/dashboard/stats',
    headers,
    params: { period: 'quarter' },
    expectedStatus: [200],
    logResponse: true
  });
  
  // Test 5: Get dashboard stats (year)
  log('\n5. GET /api/dashboard/stats?period=year', 'blue');
  await testAPI({
    method: 'GET',
    path: '/api/dashboard/stats',
    headers,
    params: { period: 'year' },
    expectedStatus: [200],
    logResponse: true
  });
  
  // Test 6: Test without authentication
  log('\n6. GET /api/dashboard/stats (without auth)', 'blue');
  await testAPI({
    method: 'GET',
    path: '/api/dashboard/stats',
    expectedStatus: [401, 500]
  });
}

// Test Dashboard Admin API
async function testDashboardAdminAPI() {
  log('\n=== 👨‍💼 Dashboard Admin API ===', 'cyan');
  const headers = { 
    'Authorization': `Bearer ${authToken}`
  };
  
  // Test 1: Get admin dashboard
  log('\n1. GET /api/dashboard/admin', 'blue');
  const result = await testAPI({
    method: 'GET',
    path: '/api/dashboard/admin',
    headers,
    expectedStatus: [200],
    logResponse: true
  });
  
  if (result.success && result.data?.data) {
    const data = result.data.data;
    log(`  ✓ Current User: ${data.currentUser?.name} (${data.currentUser?.role})`, 'cyan');
    log(`  ✓ Is Admin: ${data.currentUser?.isAdmin}`, 'cyan');
    log(`  ✓ Team Activities: ${data.teamActivities?.length || 0} items`, 'cyan');
    log(`  ✓ Today Schedule: ${data.todaySchedule?.length || 0} items`, 'cyan');
    log(`  ✓ Recent Customers: ${data.recentCustomers?.length || 0} items`, 'cyan');
    log(`  ✓ Quick Stats:`, 'cyan');
    if (data.quickStats) {
      log(`    - Active Customers: ${data.quickStats.active_customers}`, 'cyan');
      log(`    - Pending Tasks: ${data.quickStats.pending_tasks}`, 'cyan');
      log(`    - Active Deals: ${data.quickStats.active_deals}`, 'cyan');
      log(`    - Open Tickets: ${data.quickStats.open_tickets}`, 'cyan');
    }
    log(`  ✓ User Activity Report: ${data.userActivityReport?.length || 0} users`, 'cyan');
    log(`  ✓ Alerts: ${data.alerts?.length || 0} items`, 'cyan');
  }
  
  // Test 2: Test without authentication
  log('\n2. GET /api/dashboard/admin (without auth)', 'blue');
  await testAPI({
    method: 'GET',
    path: '/api/dashboard/admin',
    expectedStatus: [401]
  });
}

// Test Related Dashboard APIs
async function testRelatedDashboardAPIs() {
  log('\n=== 🔗 Related Dashboard APIs ===', 'cyan');
  const headers = { 
    'Authorization': `Bearer ${authToken}`
  };
  
  // Test customers API (used in dashboard)
  log('\n1. GET /api/customers (for dashboard)', 'blue');
  await testAPI({
    method: 'GET',
    path: '/api/customers',
    headers,
    params: { page: 1, limit: 5 },
    expectedStatus: [200],
    logResponse: true
  });
  
  // Test deals API (used in dashboard)
  log('\n2. GET /api/deals (for dashboard)', 'blue');
  await testAPI({
    method: 'GET',
    path: '/api/deals',
    headers,
    expectedStatus: [200],
    logResponse: true
  });
  
  // Test tasks API (used in dashboard)
  log('\n3. GET /api/tasks (for dashboard)', 'blue');
  await testAPI({
    method: 'GET',
    path: '/api/tasks',
    headers,
    expectedStatus: [200],
    logResponse: true
  });
  
  // Test activities API (used in dashboard)
  log('\n4. GET /api/activities (for dashboard)', 'blue');
  await testAPI({
    method: 'GET',
    path: '/api/activities',
    headers,
    expectedStatus: [200],
    logResponse: true
  });
  
  // Test notifications API (used in dashboard)
  log('\n5. GET /api/notifications (for dashboard)', 'blue');
  await testAPI({
    method: 'GET',
    path: '/api/notifications',
    headers,
    expectedStatus: [200],
    logResponse: true
  });
}

// Generate Report
function generateReport() {
  log('\n' + '='.repeat(80), 'cyan');
  log('📋 DASHBOARD API TESTING REPORT', 'cyan');
  log('='.repeat(80), 'cyan');
  
  log(`\n📊 Summary:`, 'blue');
  log(`   Total Tests: ${results.total}`, 'blue');
  log(`   ✓ Passed: ${results.passed} (${((results.passed/results.total)*100).toFixed(1)}%)`, 'green');
  log(`   ✗ Failed: ${results.failed} (${((results.failed/results.total)*100).toFixed(1)}%)`, 'red');
  
  if (results.slowAPIs.length > 0) {
    log(`\n⚠️  Slow APIs (>2s): ${results.slowAPIs.length}`, 'yellow');
    results.slowAPIs.forEach(api => {
      log(`   - ${api.endpoint}: ${api.responseTime}ms`, 'yellow');
    });
  }
  
  if (results.errors.length > 0) {
    log(`\n❌ Failed Tests: ${results.errors.length}`, 'red');
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
  
  log('\n' + '='.repeat(80), 'cyan');
  
  // Summary by category
  log('\n📈 Test Results by Category:', 'blue');
  log('   1. Authentication: 1 test', 'cyan');
  log('   2. Dashboard Stats: 6 tests', 'cyan');
  log('   3. Dashboard Admin: 2 tests', 'cyan');
  log('   4. Related APIs: 5 tests', 'cyan');
  
  log('\n' + '='.repeat(80), 'cyan');
}

// Main execution
async function main() {
  log('🚀 Starting Dashboard API Testing...', 'cyan');
  log(`📍 Base URL: ${BASE_URL}`, 'blue');
  log(`👤 Test User: ${TEST_EMAIL}\n`, 'blue');
  
  try {
    // Authenticate first
    await authenticate();
    
    if (!authToken) {
      log('\n❌ Cannot proceed without authentication', 'red');
      log('💡 Make sure the server is running and credentials are correct', 'yellow');
      return;
    }
    
    // Run all dashboard tests
    await testDashboardStatsAPI();
    await testDashboardAdminAPI();
    await testRelatedDashboardAPIs();
    
    // Generate final report
    generateReport();
    
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
  }
}

// Run tests
main();
