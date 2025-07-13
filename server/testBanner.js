const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const BANNER_ENDPOINT = `${BASE_URL}/banners`;
const AUTH_ENDPOINT = `${BASE_URL}/auth`;

// Configure axios defaults
axios.defaults.timeout = 10000; // 10 second timeout
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Test data
const testUsers = {
    admin: {
        email: `banner_admin_${Date.now()}@test.com`,
        password: 'AdminPassword123!',
        name: 'Banner Admin',
        role: 'admin'
    },
    customer: {
        email: `banner_customer_${Date.now()}@test.com`,
        password: 'TestPassword123!',
        name: 'Banner Customer'
    }
};

// Global variables for test data tracking
let adminToken = null;
let customerToken = null;
let createdBannerIds = [];
let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

// Utility Functions
function logTest(testName, status, details = '') {
    testResults.total++;
    if (status === 'PASS') {
        testResults.passed++;
        console.log(`✅ ${testName}: ${status} ${details ? `- ${details}` : ''}`);
    } else {
        testResults.failed++;
        console.log(`❌ ${testName}: ${status} ${details ? `- ${details}` : ''}`);
    }
    testResults.details.push({ test: testName, status, details });
}

function logSection(sectionName) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🧪 ${sectionName}`);
    console.log('='.repeat(50));
}

function getAuthHeaders(token) {
    return { headers: { Authorization: `Bearer ${token}` } };
}

function createTestBanner(overrides = {}) {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return {
        image: 'https://example.com/banner.jpg',
        title: `Test Banner ${Date.now()}`,
        link: '/products/507f1f77bcf86cd799439011',
        startDate: tomorrow.toISOString(),
        endDate: nextWeek.toISOString(),
        ...overrides
    };
}

/**
 * Setup: Prepare test environment
 */
async function setupTestEnvironment() {
    logSection('SETUP TEST ENVIRONMENT');

    // Setup 1: Create admin user
    try {
        const response = await axios.post(`${AUTH_ENDPOINT}/register`, testUsers.admin);
        if (response.status === 201 && response.data.success) {
            logTest('Setup 1: Create Admin User', 'PASS', 'Admin account created');
        } else {
            logTest('Setup 1: Create Admin User', 'FAIL', 'Failed to create admin');
        }
    } catch (error) {
        if (error.response?.status === 400 && error.response.data.message.includes('đã tồn tại')) {
            logTest('Setup 1: Create Admin User', 'PASS', 'Admin already exists');
        } else {
            logTest('Setup 1: Create Admin User', 'FAIL', error.response?.data?.message || error.message);
        }
    }

    // Setup 2: Admin login
    try {
        const response = await axios.post(`${AUTH_ENDPOINT}/login`, {
            email: testUsers.admin.email,
            password: testUsers.admin.password
        });
        if (response.status === 200 && response.data.success && response.data.data.token) {
            adminToken = response.data.data.token;
            logTest('Setup 2: Admin Login', 'PASS', 'Got admin token');
        } else {
            logTest('Setup 2: Admin Login', 'FAIL', 'Invalid login response');
        }
    } catch (error) {
        logTest('Setup 2: Admin Login', 'FAIL', error.response?.data?.message || error.message);
    }

    // Setup 3: Create customer user
    try {
        const response = await axios.post(`${AUTH_ENDPOINT}/register`, testUsers.customer);
        if (response.status === 201 && response.data.success) {
            logTest('Setup 3: Create Customer User', 'PASS', 'Customer account created');
        } else {
            logTest('Setup 3: Create Customer User', 'FAIL', 'Failed to create customer');
        }
    } catch (error) {
        if (error.response?.status === 400 && error.response.data.message.includes('đã tồn tại')) {
            logTest('Setup 3: Create Customer User', 'PASS', 'Customer already exists');
        } else {
            logTest('Setup 3: Create Customer User', 'FAIL', error.response?.data?.message || error.message);
        }
    }

    // Setup 4: Customer login
    try {
        const response = await axios.post(`${AUTH_ENDPOINT}/login`, {
            email: testUsers.customer.email,
            password: testUsers.customer.password
        });
        if (response.status === 200 && response.data.success && response.data.data.token) {
            customerToken = response.data.data.token;
            logTest('Setup 4: Customer Login', 'PASS', 'Got customer token');
        } else {
            logTest('Setup 4: Customer Login', 'FAIL', 'Invalid login response');
        }
    } catch (error) {
        logTest('Setup 4: Customer Login', 'FAIL', error.response?.data?.message || error.message);
    }
}

/**
 * Test public banner operations
 */
async function testPublicOperations() {
    logSection('PUBLIC BANNER OPERATIONS');

    // Test 1: Get active banners (public)
    try {
        const response = await axios.get(`${BANNER_ENDPOINT}/active`);
        if (response.status === 200 && response.data.success) {
            logTest('Test 1: Get Active Banners', 'PASS', `Found ${response.data.data.length} active banners`);
        } else {
            logTest('Test 1: Get Active Banners', 'FAIL', 'Invalid response structure');
        }
    } catch (error) {
        logTest('Test 1: Get Active Banners', 'FAIL', error.response?.data?.message || error.message);
    }

    // Test 2: Get banners by status - active
    try {
        const response = await axios.get(`${BANNER_ENDPOINT}/status/active`);
        if (response.status === 200 && response.data.success) {
            logTest('Test 2: Get Active Status Banners', 'PASS', `Found ${response.data.data.length} active banners`);
        } else {
            logTest('Test 2: Get Active Status Banners', 'FAIL', 'Invalid response structure');
        }
    } catch (error) {
        logTest('Test 2: Get Active Status Banners', 'FAIL', error.response?.data?.message || error.message);
    }

    // Test 3: Get banners by status - expired
    try {
        const response = await axios.get(`${BANNER_ENDPOINT}/status/expired`);
        if (response.status === 200 && response.data.success) {
            logTest('Test 3: Get Expired Status Banners', 'PASS', `Found ${response.data.data.length} expired banners`);
        } else {
            logTest('Test 3: Get Expired Status Banners', 'FAIL', 'Invalid response structure');
        }
    } catch (error) {
        logTest('Test 3: Get Expired Status Banners', 'FAIL', error.response?.data?.message || error.message);
    }

    // Test 4: Get banners by status - upcoming
    try {
        const response = await axios.get(`${BANNER_ENDPOINT}/status/upcoming`);
        if (response.status === 200 && response.data.success) {
            logTest('Test 4: Get Upcoming Status Banners', 'PASS', `Found ${response.data.data.length} upcoming banners`);
        } else {
            logTest('Test 4: Get Upcoming Status Banners', 'FAIL', 'Invalid response structure');
        }
    } catch (error) {
        logTest('Test 4: Get Upcoming Status Banners', 'FAIL', error.response?.data?.message || error.message);
    }

    // Test 5: Get invalid status (should fail)
    try {
        const response = await axios.get(`${BANNER_ENDPOINT}/status/invalid`);
        logTest('Test 5: Invalid Status Request', 'FAIL', 'Should have failed with invalid status');
    } catch (error) {
        if (error.response?.status === 400) {
            logTest('Test 5: Invalid Status Request', 'PASS', 'Correctly rejected invalid status');
        } else {
            logTest('Test 5: Invalid Status Request', 'FAIL', 'Wrong error type');
        }
    }
}

/**
 * Test admin banner CRUD operations
 */
async function testAdminCRUD() {
    logSection('ADMIN BANNER CRUD OPERATIONS');

    if (!adminToken) {
        logTest('Admin CRUD Tests', 'FAIL', 'No admin token available');
        return;
    }

    const authHeaders = getAuthHeaders(adminToken);

    // Test 6: Create banner with valid data
    try {
        const bannerData = createTestBanner();
        const response = await axios.post(BANNER_ENDPOINT, bannerData, authHeaders);
        if (response.status === 201 && response.data.success && response.data.data._id) {
            createdBannerIds.push(response.data.data._id);
            logTest('Test 6: Create Valid Banner', 'PASS', 'Banner created successfully');
        } else {
            logTest('Test 6: Create Valid Banner', 'FAIL', 'Invalid creation response');
        }
    } catch (error) {
        logTest('Test 6: Create Valid Banner', 'FAIL', error.response?.data?.message || error.message);
    }

    // Test 7: Create banner without link (should fail)
    try {
        const bannerData = createTestBanner({ link: '' });
        const response = await axios.post(BANNER_ENDPOINT, bannerData, authHeaders);
        logTest('Test 7: Create Banner Without Link', 'FAIL', 'Should have failed without link');
    } catch (error) {
        if (error.response?.status === 400) {
            logTest('Test 7: Create Banner Without Link', 'PASS', 'Correctly rejected banner without link');
        } else {
            logTest('Test 7: Create Banner Without Link', 'FAIL', 'Wrong error type');
        }
    }

    // Test 8: Create banner with invalid dates (should fail)
    try {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const bannerData = createTestBanner({
            startDate: now.toISOString(),
            endDate: yesterday.toISOString()
        });
        const response = await axios.post(BANNER_ENDPOINT, bannerData, authHeaders);
        logTest('Test 8: Create Banner Invalid Dates', 'FAIL', 'Should have failed with invalid dates');
    } catch (error) {
        if (error.response?.status === 400) {
            logTest('Test 8: Create Banner Invalid Dates', 'PASS', 'Correctly rejected invalid dates');
        } else {
            logTest('Test 8: Create Banner Invalid Dates', 'FAIL', 'Wrong error type');
        }
    }

    // Test 9: Get all banners (admin)
    try {
        const response = await axios.get(`${BANNER_ENDPOINT}?page=1&limit=10`, authHeaders);
        if (response.status === 200 && response.data.success && response.data.data.data) {
            logTest('Test 9: Get All Banners Admin', 'PASS', `Found ${response.data.data.data.length} banners`);
        } else {
            logTest('Test 9: Get All Banners Admin', 'FAIL', 'Invalid response structure');
        }
    } catch (error) {
        logTest('Test 9: Get All Banners Admin', 'FAIL', error.response?.data?.message || error.message);
    }

    // Test 10: Get banner by ID
    if (createdBannerIds.length > 0) {
        try {
            const bannerId = createdBannerIds[0];
            const response = await axios.get(`${BANNER_ENDPOINT}/${bannerId}`, authHeaders);
            if (response.status === 200 && response.data.success && response.data.data._id === bannerId) {
                logTest('Test 10: Get Banner By ID', 'PASS', 'Banner retrieved successfully');
            } else {
                logTest('Test 10: Get Banner By ID', 'FAIL', 'Invalid response data');
            }
        } catch (error) {
            logTest('Test 10: Get Banner By ID', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('Test 10: Get Banner By ID', 'FAIL', 'No banners to test with');
    }

    // Test 11: Update banner
    if (createdBannerIds.length > 0) {
        try {
            const bannerId = createdBannerIds[0];
            const updateData = { title: 'Updated Banner Title' };
            const response = await axios.put(`${BANNER_ENDPOINT}/${bannerId}`, updateData, authHeaders);
            if (response.status === 200 && response.data.success && response.data.data.title === updateData.title) {
                logTest('Test 11: Update Banner', 'PASS', 'Banner updated successfully');
            } else {
                logTest('Test 11: Update Banner', 'FAIL', 'Invalid update response');
            }
        } catch (error) {
            logTest('Test 11: Update Banner', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('Test 11: Update Banner', 'FAIL', 'No banners to test with');
    }

    // Test 12: Check banner status
    if (createdBannerIds.length > 0) {
        try {
            const bannerId = createdBannerIds[0];
            const response = await axios.get(`${BANNER_ENDPOINT}/${bannerId}/check-status`);
            if (response.status === 200 && response.data.success && typeof response.data.data.isActive === 'boolean') {
                logTest('Test 12: Check Banner Status', 'PASS', `Banner active: ${response.data.data.isActive}`);
            } else {
                logTest('Test 12: Check Banner Status', 'FAIL', 'Invalid status response');
            }
        } catch (error) {
            logTest('Test 12: Check Banner Status', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('Test 12: Check Banner Status', 'FAIL', 'No banners to test with');
    }
}

/**
 * Test admin-only features
 */
async function testAdminFeatures() {
    logSection('ADMIN-ONLY FEATURES');

    if (!adminToken) {
        logTest('Admin Features Tests', 'FAIL', 'No admin token available');
        return;
    }

    const authHeaders = getAuthHeaders(adminToken);

    // Test 13: Get banners with status (admin)
    try {
        const response = await axios.get(`${BANNER_ENDPOINT}/admin/status?page=1&limit=10`, authHeaders);
        if (response.status === 200 && response.data.success && response.data.data.data) {
            logTest('Test 13: Get Banners With Status', 'PASS', `Found ${response.data.data.data.length} banners with status`);
        } else {
            logTest('Test 13: Get Banners With Status', 'FAIL', 'Invalid response structure');
        }
    } catch (error) {
        logTest('Test 13: Get Banners With Status', 'FAIL', error.response?.data?.message || error.message);
    }

    // Test 14: Get banner statistics
    try {
        const response = await axios.get(`${BANNER_ENDPOINT}/statistics`, authHeaders);
        if (response.status === 200 && response.data.success && response.data.data.total !== undefined) {
            const stats = response.data.data;
            logTest('Test 14: Get Banner Statistics', 'PASS', `Total: ${stats.total}, Active: ${stats.active}, Expired: ${stats.expired}, Upcoming: ${stats.upcoming}`);
        } else {
            logTest('Test 14: Get Banner Statistics', 'FAIL', 'Invalid statistics response');
        }
    } catch (error) {
        logTest('Test 14: Get Banner Statistics', 'FAIL', error.response?.data?.message || error.message);
    }

    // Test 15: Validate banner link
    try {
        const response = await axios.post(`${BANNER_ENDPOINT}/validate-link`, {
            link: '/products/507f1f77bcf86cd799439011'
        }, authHeaders);
        if (response.status === 200 && response.data.success && response.data.data.valid === true) {
            logTest('Test 15: Validate Valid Link', 'PASS', 'Link validation successful');
        } else {
            logTest('Test 15: Validate Valid Link', 'FAIL', 'Invalid validation response');
        }
    } catch (error) {
        logTest('Test 15: Validate Valid Link', 'FAIL', error.response?.data?.message || error.message);
    }

    // Test 16: Validate invalid link
    try {
        const response = await axios.post(`${BANNER_ENDPOINT}/validate-link`, {
            link: 'invalid-link'
        }, authHeaders);
        logTest('Test 16: Validate Invalid Link', 'FAIL', 'Should have failed with invalid link');
    } catch (error) {
        if (error.response?.status === 400) {
            logTest('Test 16: Validate Invalid Link', 'PASS', 'Correctly rejected invalid link');
        } else {
            logTest('Test 16: Validate Invalid Link', 'FAIL', 'Wrong error type');
        }
    }
}

/**
 * Test authorization and permissions
 */
async function testAuthorization() {
    logSection('AUTHORIZATION AND PERMISSIONS');

    // Test 17: Customer accessing admin endpoint (should fail)
    if (customerToken) {
        try {
            const customerHeaders = getAuthHeaders(customerToken);
            const response = await axios.get(`${BANNER_ENDPOINT}`, customerHeaders);
            logTest('Test 17: Customer Access Admin Endpoint', 'FAIL', 'Customer should not access admin endpoints');
        } catch (error) {
            if (error.response?.status === 403) {
                logTest('Test 17: Customer Access Admin Endpoint', 'PASS', 'Correctly blocked customer access');
            } else {
                logTest('Test 17: Customer Access Admin Endpoint', 'FAIL', 'Wrong error type');
            }
        }
    } else {
        logTest('Test 17: Customer Access Admin Endpoint', 'FAIL', 'No customer token available');
    }

    // Test 18: Unauthenticated access to admin endpoint (should fail)
    try {
        const response = await axios.get(`${BANNER_ENDPOINT}`);
        logTest('Test 18: Unauthenticated Admin Access', 'FAIL', 'Should require authentication');
    } catch (error) {
        if (error.response?.status === 401) {
            logTest('Test 18: Unauthenticated Admin Access', 'PASS', 'Correctly requires authentication');
        } else {
            logTest('Test 18: Unauthenticated Admin Access', 'FAIL', 'Wrong error type');
        }
    }

    // Test 19: Customer creating banner (should fail)
    if (customerToken) {
        try {
            const customerHeaders = getAuthHeaders(customerToken);
            const bannerData = createTestBanner();
            const response = await axios.post(BANNER_ENDPOINT, bannerData, customerHeaders);
            logTest('Test 19: Customer Create Banner', 'FAIL', 'Customer should not create banners');
        } catch (error) {
            if (error.response?.status === 403) {
                logTest('Test 19: Customer Create Banner', 'PASS', 'Correctly blocked customer creation');
            } else {
                logTest('Test 19: Customer Create Banner', 'FAIL', 'Wrong error type');
            }
        }
    } else {
        logTest('Test 19: Customer Create Banner', 'FAIL', 'No customer token available');
    }
}

/**
 * Test edge cases and error handling
 */
async function testEdgeCases() {
    logSection('EDGE CASES AND ERROR HANDLING');

    const authHeaders = adminToken ? getAuthHeaders(adminToken) : {};

    // Test 20: Get banner with invalid ID format
    try {
        const response = await axios.get(`${BANNER_ENDPOINT}/invalid-id/check-status`);
        logTest('Test 20: Invalid Banner ID Format', 'FAIL', 'Should reject invalid ID format');
    } catch (error) {
        if (error.response?.status === 400) {
            logTest('Test 20: Invalid Banner ID Format', 'PASS', 'Correctly rejected invalid ID');
        } else {
            logTest('Test 20: Invalid Banner ID Format', 'FAIL', `Wrong error type: ${error.response?.status}`);
        }
    }

    // Test 21: Get non-existent banner
    if (adminToken) {
        try {
            const response = await axios.get(`${BANNER_ENDPOINT}/507f1f77bcf86cd799439099`, authHeaders);
            logTest('Test 21: Non-existent Banner', 'FAIL', 'Should return 404 for non-existent banner');
        } catch (error) {
            if (error.response?.status === 404) {
                logTest('Test 21: Non-existent Banner', 'PASS', 'Correctly returned 404');
            } else {
                logTest('Test 21: Non-existent Banner', 'FAIL', 'Wrong error type');
            }
        }
    } else {
        logTest('Test 21: Non-existent Banner', 'FAIL', 'No admin token available');
    }

    // Test 22: Create banner with invalid link format
    if (adminToken) {
        try {
            const bannerData = createTestBanner({ link: 'invalid-link-format' });
            const response = await axios.post(BANNER_ENDPOINT, bannerData, authHeaders);
            logTest('Test 22: Invalid Link Format', 'FAIL', 'Should reject invalid link format');
        } catch (error) {
            if (error.response?.status === 400) {
                logTest('Test 22: Invalid Link Format', 'PASS', 'Correctly rejected invalid link format');
            } else {
                logTest('Test 22: Invalid Link Format', 'FAIL', 'Wrong error type');
            }
        }
    } else {
        logTest('Test 22: Invalid Link Format', 'FAIL', 'No admin token available');
    }

    // Test 23: Create banner with missing required fields
    if (adminToken) {
        try {
            const bannerData = { title: 'Test Banner' }; // Missing required fields
            const response = await axios.post(BANNER_ENDPOINT, bannerData, authHeaders);
            logTest('Test 23: Missing Required Fields', 'FAIL', 'Should reject missing required fields');
        } catch (error) {
            if (error.response?.status === 400) {
                logTest('Test 23: Missing Required Fields', 'PASS', 'Correctly rejected missing fields');
            } else {
                logTest('Test 23: Missing Required Fields', 'FAIL', 'Wrong error type');
            }
        }
    } else {
        logTest('Test 23: Missing Required Fields', 'FAIL', 'No admin token available');
    }
}

/**
 * Cleanup test data
 */
async function cleanupTestData() {
    logSection('CLEANUP TEST DATA');

    if (!adminToken || createdBannerIds.length === 0) {
        console.log('🧹 No cleanup needed or no admin token');
        return;
    }

    const authHeaders = getAuthHeaders(adminToken);

    for (const bannerId of createdBannerIds) {
        try {
            await axios.delete(`${BANNER_ENDPOINT}/${bannerId}`, authHeaders);
            console.log(`🧹 Cleaned up banner: ${bannerId}`);
        } catch (error) {
            console.log(`⚠️  Failed to cleanup banner ${bannerId}: ${error.message}`);
        }
    }

    console.log('🧹 Cleanup completed');
}

/**
 * Generate final report
 */
function generateFinalReport() {
    logSection('FINAL TEST RESULTS');

    const successRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
    console.log(`📊 Tests Passed: ${testResults.passed}/${testResults.total}`);
    console.log(`📊 Tests Failed: ${testResults.failed}/${testResults.total}`);
    console.log(`📊 Success Rate: ${successRate}%`);
    console.log(`⏱️  Total Duration: ${(Date.now() - startTime) / 1000}s`);

    if (testResults.failed > 0) {
        console.log('⚠️  Some tests failed. Check the details above.');
        console.log('❌ Failed Tests:');
        testResults.details
            .filter(result => result.status === 'FAIL')
            .forEach(result => console.log(`   - ${result.test}: ${result.details}`));
    } else {
        console.log('🎉 All tests passed successfully!');
    }
}

/**
 * Main test runner
 */
async function runBannerTests() {
    console.log('🚀 STARTING COMPREHENSIVE BANNER API TESTING');
    console.log('============================================================');

    try {
        await setupTestEnvironment();
        await testPublicOperations();
        await testAdminCRUD();
        await testAdminFeatures();
        await testAuthorization();
        await testEdgeCases();
        await cleanupTestData();
    } catch (error) {
        console.error('💥 Critical error during testing:', error.message);
    } finally {
        generateFinalReport();
        console.log('============================================================');
        console.log('🏁 BANNER API TESTING COMPLETED');
    }
}

// Track start time for duration calculation
const startTime = Date.now();

// Run tests if this file is executed directly
if (require.main === module) {
    runBannerTests();
}

module.exports = {
    runBannerTests,
    testResults
};
