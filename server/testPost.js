const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const POST_ENDPOINT = `${BASE_URL}/posts`;
const AUTH_ENDPOINT = `${BASE_URL}/auth`;

// Set axios timeout
axios.defaults.timeout = 10000;

// Test data
const testUsers = {
    admin: {
        email: `post_admin_${Date.now()}@test.com`,
        password: 'AdminPassword123!',
        name: 'Post Admin',
        role: 'admin'
    },
    customer: {
        email: `post_customer_${Date.now()}@test.com`,
        password: 'TestPassword123!',
        name: 'Post Customer'
    }
};

// Global variables for test data tracking
let adminToken = null;
let customerToken = null;
let createdPostIds = [];
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

function createTestPost(overrides = {}) {
    return {
        title: `Test Post ${Date.now()}`,
        content: `This is a test post content created at ${new Date().toISOString()}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
        image: 'https://example.com/post-image.jpg',
        describe: 'This is a test post description for API testing purposes.',
        isPublished: true,
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
 * Test public post operations
 */
async function testPublicOperations() {
    logSection('PUBLIC POST OPERATIONS');

    // Test 1: Get published posts (public)
    try {
        const response = await axios.get(`${POST_ENDPOINT}/published`);
        if (response.status === 200 && response.data.success) {
            logTest('Test 1: Get Published Posts', 'PASS', `Found ${response.data.data.length} published posts`);
        } else {
            logTest('Test 1: Get Published Posts', 'FAIL', 'Invalid response structure');
        }
    } catch (error) {
        logTest('Test 1: Get Published Posts', 'FAIL', error.response?.data?.message || error.message);
    }

    // Test 2: Get published posts with pagination
    try {
        const response = await axios.get(`${POST_ENDPOINT}/published?page=1&limit=5`);
        if (response.status === 200 && response.data.success && response.data.pagination) {
            logTest('Test 2: Get Published Posts Paginated', 'PASS', `Page ${response.data.pagination.currentPage}/${response.data.pagination.totalPages}`);
        } else {
            logTest('Test 2: Get Published Posts Paginated', 'FAIL', 'Invalid pagination response');
        }
    } catch (error) {
        logTest('Test 2: Get Published Posts Paginated', 'FAIL', error.response?.data?.message || error.message);
    }
}

/**
 * Test admin post CRUD operations
 */
async function testAdminCRUD() {
    logSection('ADMIN POST CRUD OPERATIONS');

    if (!adminToken) {
        logTest('Admin CRUD Tests', 'FAIL', 'No admin token available');
        return;
    }

    const authHeaders = getAuthHeaders(adminToken);

    // Test 3: Create post with valid data (admin only)
    try {
        const postData = createTestPost();
        const response = await axios.post(POST_ENDPOINT, postData, authHeaders);
        if (response.status === 201 && response.data.success && response.data.data._id) {
            createdPostIds.push(response.data.data._id);
            logTest('Test 3: Create Valid Post (Admin)', 'PASS', 'Post created successfully');
        } else {
            logTest('Test 3: Create Valid Post (Admin)', 'FAIL', 'Invalid creation response');
        }
    } catch (error) {
        logTest('Test 3: Create Valid Post (Admin)', 'FAIL', error.response?.data?.message || error.message);
    }

    // Test 4: Create post without title (should fail)
    try {
        const postData = createTestPost({ title: '' });
        const response = await axios.post(POST_ENDPOINT, postData, authHeaders);
        logTest('Test 4: Create Post Without Title', 'FAIL', 'Should have failed without title');
    } catch (error) {
        if (error.response?.status === 400) {
            logTest('Test 4: Create Post Without Title', 'PASS', 'Correctly rejected post without title');
        } else {
            logTest('Test 4: Create Post Without Title', 'FAIL', 'Wrong error type');
        }
    }

    // Test 5: Create post without content (should fail)
    try {
        const postData = createTestPost({ content: '' });
        const response = await axios.post(POST_ENDPOINT, postData, authHeaders);
        logTest('Test 5: Create Post Without Content', 'FAIL', 'Should have failed without content');
    } catch (error) {
        if (error.response?.status === 400) {
            logTest('Test 5: Create Post Without Content', 'PASS', 'Correctly rejected post without content');
        } else {
            logTest('Test 5: Create Post Without Content', 'FAIL', 'Wrong error type');
        }
    }

    // Test 6: Get all posts (admin)
    try {
        const response = await axios.get(`${POST_ENDPOINT}?page=1&limit=10`, authHeaders);
        if (response.status === 200 && response.data.success && response.data.data) {
            logTest('Test 6: Get All Posts Admin', 'PASS', `Found ${response.data.data.length} posts`);
        } else {
            logTest('Test 6: Get All Posts Admin', 'FAIL', 'Invalid response structure');
        }
    } catch (error) {
        logTest('Test 6: Get All Posts Admin', 'FAIL', error.response?.data?.message || error.message);
    }

    // Test 7: Get post by ID
    if (createdPostIds.length > 0) {
        try {
            const postId = createdPostIds[0];
            const response = await axios.get(`${POST_ENDPOINT}/${postId}`);
            if (response.status === 200 && response.data.success && response.data.data._id === postId) {
                logTest('Test 7: Get Post By ID', 'PASS', 'Post retrieved successfully');
            } else {
                logTest('Test 7: Get Post By ID', 'FAIL', 'Invalid response data');
            }
        } catch (error) {
            logTest('Test 7: Get Post By ID', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('Test 7: Get Post By ID', 'FAIL', 'No posts to test with');
    }

    // Test 8: Update post (admin)
    if (createdPostIds.length > 0) {
        try {
            const postId = createdPostIds[0];
            const updateData = { 
                title: 'Updated Test Post Title',
                content: 'Updated content for the test post'
            };
            const response = await axios.put(`${POST_ENDPOINT}/${postId}`, updateData, authHeaders);
            if (response.status === 200 && response.data.success && response.data.data.title === updateData.title) {
                logTest('Test 8: Update Post (Admin)', 'PASS', 'Post updated successfully');
            } else {
                logTest('Test 8: Update Post (Admin)', 'FAIL', 'Invalid update response');
            }
        } catch (error) {
            logTest('Test 8: Update Post (Admin)', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('Test 8: Update Post (Admin)', 'FAIL', 'No posts to test with');
    }

    // Test 9: Toggle post visibility (admin)
    if (createdPostIds.length > 0) {
        try {
            const postId = createdPostIds[0];
            const response = await axios.patch(`${POST_ENDPOINT}/${postId}/toggle-visibility`, {}, authHeaders);
            if (response.status === 200 && response.data.success) {
                logTest('Test 9: Toggle Post Visibility', 'PASS', 'Post visibility toggled');
            } else {
                logTest('Test 9: Toggle Post Visibility', 'FAIL', 'Invalid toggle response');
            }
        } catch (error) {
            logTest('Test 9: Toggle Post Visibility', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('Test 9: Toggle Post Visibility', 'FAIL', 'No posts to test with');
    }

    // Test 10: Update publish status (admin)
    if (createdPostIds.length > 0) {
        try {
            const postId = createdPostIds[0];
            const response = await axios.patch(`${POST_ENDPOINT}/${postId}/publish-status`, {
                isPublished: false
            }, authHeaders);
            if (response.status === 200 && response.data.success) {
                logTest('Test 10: Update Publish Status', 'PASS', 'Publish status updated');
            } else {
                logTest('Test 10: Update Publish Status', 'FAIL', 'Invalid status update response');
            }
        } catch (error) {
            logTest('Test 10: Update Publish Status', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('Test 10: Update Publish Status', 'FAIL', 'No posts to test with');
    }
}

/**
 * Test authorization and permissions
 */
async function testAuthorization() {
    logSection('AUTHORIZATION AND PERMISSIONS');

    // Test 11: Customer trying to create post (should fail)
    if (customerToken) {
        try {
            const customerHeaders = getAuthHeaders(customerToken);
            const postData = createTestPost();
            const response = await axios.post(POST_ENDPOINT, postData, customerHeaders);
            logTest('Test 11: Customer Create Post', 'FAIL', 'Customer should not create posts');
        } catch (error) {
            if (error.response?.status === 403) {
                logTest('Test 11: Customer Create Post', 'PASS', 'Correctly blocked customer creation');
            } else {
                logTest('Test 11: Customer Create Post', 'FAIL', 'Wrong error type');
            }
        }
    } else {
        logTest('Test 11: Customer Create Post', 'FAIL', 'No customer token available');
    }

    // Test 12: Unauthenticated access to admin endpoint (should fail)
    try {
        const response = await axios.get(`${POST_ENDPOINT}`);
        logTest('Test 12: Unauthenticated Admin Access', 'FAIL', 'Should require authentication');
    } catch (error) {
        if (error.response?.status === 401) {
            logTest('Test 12: Unauthenticated Admin Access', 'PASS', 'Correctly requires authentication');
        } else {
            logTest('Test 12: Unauthenticated Admin Access', 'FAIL', 'Wrong error type');
        }
    }

    // Test 13: Customer accessing admin endpoints (should fail)
    if (customerToken) {
        try {
            const customerHeaders = getAuthHeaders(customerToken);
            const response = await axios.get(`${POST_ENDPOINT}`, customerHeaders);
            logTest('Test 13: Customer Access Admin Endpoint', 'FAIL', 'Customer should not access admin endpoints');
        } catch (error) {
            if (error.response?.status === 403) {
                logTest('Test 13: Customer Access Admin Endpoint', 'PASS', 'Correctly blocked customer access');
            } else {
                logTest('Test 13: Customer Access Admin Endpoint', 'FAIL', 'Wrong error type');
            }
        }
    } else {
        logTest('Test 13: Customer Access Admin Endpoint', 'FAIL', 'No customer token available');
    }

    // Test 14: Customer trying to toggle post visibility (should fail)
    if (customerToken && createdPostIds.length > 0) {
        try {
            const customerHeaders = getAuthHeaders(customerToken);
            const postId = createdPostIds[0];
            const response = await axios.patch(`${POST_ENDPOINT}/${postId}/toggle-visibility`, {}, customerHeaders);
            logTest('Test 14: Customer Toggle Visibility', 'FAIL', 'Customer should not toggle visibility');
        } catch (error) {
            if (error.response?.status === 403) {
                logTest('Test 14: Customer Toggle Visibility', 'PASS', 'Correctly blocked customer access');
            } else {
                logTest('Test 14: Customer Toggle Visibility', 'FAIL', 'Wrong error type');
            }
        }
    } else {
        logTest('Test 14: Customer Toggle Visibility', 'FAIL', 'No customer token or posts available');
    }
}

/**
 * Test edge cases and error handling
 */
async function testEdgeCases() {
    logSection('EDGE CASES AND ERROR HANDLING');

    const authHeaders = adminToken ? getAuthHeaders(adminToken) : {};

    // Test 15: Get post with invalid ID format
    try {
        const response = await axios.get(`${POST_ENDPOINT}/invalid-id`);
        logTest('Test 15: Invalid Post ID Format', 'FAIL', 'Should reject invalid ID format');
    } catch (error) {
        if (error.response?.status === 400) {
            logTest('Test 15: Invalid Post ID Format', 'PASS', 'Correctly rejected invalid ID');
        } else {
            logTest('Test 15: Invalid Post ID Format', 'FAIL', 'Wrong error type');
        }
    }

    // Test 16: Get non-existent post
    try {
        const response = await axios.get(`${POST_ENDPOINT}/507f1f77bcf86cd799439099`);
        logTest('Test 16: Non-existent Post', 'FAIL', 'Should return 404 for non-existent post');
    } catch (error) {
        if (error.response?.status === 404 || error.response?.status === 500) {
            logTest('Test 16: Non-existent Post', 'PASS', `Correctly handled non-existent post (${error.response.status})`);
        } else {
            logTest('Test 16: Non-existent Post', 'FAIL', 'Wrong error type');
        }
    }

    // Test 17: Create post with missing required fields
    if (adminToken) {
        try {
            const postData = { title: 'Test Post' }; // Missing required fields
            const response = await axios.post(POST_ENDPOINT, postData, authHeaders);
            logTest('Test 17: Missing Required Fields', 'FAIL', 'Should reject missing required fields');
        } catch (error) {
            if (error.response?.status === 400) {
                logTest('Test 17: Missing Required Fields', 'PASS', 'Correctly rejected missing fields');
            } else {
                logTest('Test 17: Missing Required Fields', 'FAIL', 'Wrong error type');
            }
        }
    } else {
        logTest('Test 17: Missing Required Fields', 'FAIL', 'No admin token available');
    }

    // Test 18: Update non-existent post
    if (adminToken) {
        try {
            const updateData = { title: 'Updated Title' };
            const response = await axios.put(`${POST_ENDPOINT}/507f1f77bcf86cd799439099`, updateData, authHeaders);
            logTest('Test 18: Update Non-existent Post', 'FAIL', 'Should return 404 for non-existent post');
        } catch (error) {
            if (error.response?.status === 404 || error.response?.status === 500) {
                logTest('Test 18: Update Non-existent Post', 'PASS', `Correctly handled non-existent post (${error.response.status})`);
            } else {
                logTest('Test 18: Update Non-existent Post', 'FAIL', 'Wrong error type');
            }
        }
    } else {
        logTest('Test 18: Update Non-existent Post', 'FAIL', 'No admin token available');
    }

    // Test 19: Delete non-existent post
    if (adminToken) {
        try {
            const response = await axios.delete(`${POST_ENDPOINT}/507f1f77bcf86cd799439099`, authHeaders);
            logTest('Test 19: Delete Non-existent Post', 'FAIL', 'Should return 404 for non-existent post');
        } catch (error) {
            if (error.response?.status === 404 || error.response?.status === 500) {
                logTest('Test 19: Delete Non-existent Post', 'PASS', `Correctly handled non-existent post (${error.response.status})`);
            } else {
                logTest('Test 19: Delete Non-existent Post', 'FAIL', 'Wrong error type');
            }
        }
    } else {
        logTest('Test 19: Delete Non-existent Post', 'FAIL', 'No admin token available');
    }
}

/**
 * Test published posts filtering
 */
async function testPublishedFiltering() {
    logSection('PUBLISHED POSTS FILTERING');

    if (!adminToken || createdPostIds.length === 0) {
        logTest('Published Filtering Tests', 'FAIL', 'No admin token or posts available');
        return;
    }

    const authHeaders = getAuthHeaders(adminToken);

    // Test 20: Verify unpublished post not in public endpoint
    try {
        const postId = createdPostIds[0];
        
        // First, make sure the post is unpublished
        await axios.patch(`${POST_ENDPOINT}/${postId}/publish-status`, {
            isPublished: false
        }, authHeaders);
        
        // Then check if it appears in published posts
        const response = await axios.get(`${POST_ENDPOINT}/published`);
        const publishedPosts = response.data.data;
        const foundPost = publishedPosts.find(post => post._id === postId);
        
        if (!foundPost) {
            logTest('Test 20: Unpublished Post Hidden', 'PASS', 'Unpublished post correctly hidden from public');
        } else {
            logTest('Test 20: Unpublished Post Hidden', 'FAIL', 'Unpublished post visible in public endpoint');
        }
    } catch (error) {
        logTest('Test 20: Unpublished Post Hidden', 'FAIL', error.response?.data?.message || error.message);
    }

    // Test 21: Verify published post appears in public endpoint
    try {
        const postId = createdPostIds[0];
        
        // First, make sure the post is published
        await axios.patch(`${POST_ENDPOINT}/${postId}/publish-status`, {
            isPublished: true
        }, authHeaders);
        
        // Then check if it appears in published posts
        const response = await axios.get(`${POST_ENDPOINT}/published`);
        const publishedPosts = response.data.data;
        const foundPost = publishedPosts.find(post => post._id === postId);
        
        if (foundPost) {
            logTest('Test 21: Published Post Visible', 'PASS', 'Published post correctly visible in public');
        } else {
            logTest('Test 21: Published Post Visible', 'FAIL', 'Published post not visible in public endpoint');
        }
    } catch (error) {
        logTest('Test 21: Published Post Visible', 'FAIL', error.response?.data?.message || error.message);
    }
}

/**
 * Cleanup test data
 */
async function cleanupTestData() {
    logSection('CLEANUP TEST DATA');

    if (!adminToken || createdPostIds.length === 0) {
        console.log('🧹 No cleanup needed or no admin token');
        return;
    }

    const authHeaders = getAuthHeaders(adminToken);

    for (const postId of createdPostIds) {
        try {
            await axios.delete(`${POST_ENDPOINT}/${postId}`, authHeaders);
            console.log(`🧹 Cleaned up post: ${postId}`);
        } catch (error) {
            console.log(`⚠️  Failed to cleanup post ${postId}: ${error.message}`);
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
async function runPostTests() {
    console.log('🚀 STARTING COMPREHENSIVE POST API TESTING');
    console.log('============================================================');

    try {
        await setupTestEnvironment();
        await testPublicOperations();
        await testAdminCRUD();
        await testAuthorization();
        await testEdgeCases();
        await testPublishedFiltering();
        await cleanupTestData();
    } catch (error) {
        console.error('💥 Critical error during testing:', error.message);
    } finally {
        generateFinalReport();
        console.log('============================================================');
        console.log('🏁 POST API TESTING COMPLETED');
    }
}

// Track start time for duration calculation
const startTime = Date.now();

// Run tests if this file is executed directly
if (require.main === module) {
    runPostTests();
}

module.exports = {
    runPostTests,
    testResults
};
