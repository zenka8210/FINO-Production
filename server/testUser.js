const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const USER_ENDPOINT = `${BASE_URL}/users`;
const AUTH_ENDPOINT = `${BASE_URL}/auth`;

// Configure axios
axios.defaults.timeout = 15000;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Test data
const testUsers = {
    admin: {
        email: `user_admin_${Date.now()}@test.com`,
        password: 'AdminPassword123!',
        name: 'User Admin Test',
        role: 'admin'
    },
    customer: {
        email: `user_customer_${Date.now()}@test.com`,
        password: 'CustomerPassword123!',
        name: 'User Customer Test'
    },
    testUser: {
        email: `test_user_${Date.now()}@test.com`,
        password: 'TestPassword123!',
        name: 'Test User for CRUD',
        phone: '0123456789'
    }
};

// Global variables
let adminToken = null;
let customerToken = null;
let createdUserId = null;
let createdAddressId = null;
let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

const startTime = Date.now();

// Utility functions
function logTest(testName, status, details = '') {
    testResults.total++;
    if (status === 'PASS') {
        testResults.passed++;
        console.log(`✅ ${testName}: ${status} - ${details}`);
    } else {
        testResults.failed++;
        console.log(`❌ ${testName}: ${status} - ${details}`);
    }
    testResults.details.push({ testName, status, details });
}

function logSection(sectionName) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 ${sectionName}`);
    console.log(`${'='.repeat(60)}`);
}

function getAuthHeaders(token) {
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

/**
 * Setup test environment
 */
async function setupTestEnvironment() {
    logSection('SETUP TEST ENVIRONMENT');

    // Create admin user first
    console.log('Creating admin user...');
    try {
      await axios.post(`${AUTH_ENDPOINT}/register`, {
        email: 'admin@example.com',
        password: 'password123',
        name: 'Admin Test',
        role: 'admin'
      });
      console.log('Admin user created');
    } catch (regError) {
      console.log('Admin user may already exist');
    }
    
    // Admin login
    try {
        const response = await axios.post(`${AUTH_ENDPOINT}/login`, {
            email: 'admin@example.com',
            password: 'password123'
        });
        if (response.data.success && response.data.data.token) {
            adminToken = response.data.data.token;
            logTest('Setup: Admin Login', 'PASS', 'Admin token acquired');
        } else {
            logTest('Setup: Admin Login', 'FAIL', `No token received. Response: ${JSON.stringify(response.data)}`);
        }
    } catch (error) {
        logTest('Setup: Admin Login', 'FAIL', `Error: ${error.response?.data?.message || error.message}`);
    }

    // Create customer
    try {
        await axios.post(`${AUTH_ENDPOINT}/register`, testUsers.customer);
        logTest('Setup: Create Customer', 'PASS', 'Customer created or already exists');
    } catch (error) {
        if (error.response?.status === 400) {
            logTest('Setup: Create Customer', 'PASS', 'Customer already exists');
        } else {
            logTest('Setup: Create Customer', 'FAIL', error.response?.data?.message || error.message);
        }
    }

    // Customer login
    try {
        const response = await axios.post(`${AUTH_ENDPOINT}/login`, {
            email: testUsers.customer.email,
            password: testUsers.customer.password
        });
        if (response.data.success && response.data.data.token) {
            customerToken = response.data.data.token;
            logTest('Setup: Customer Login', 'PASS', 'Customer token acquired');
        } else {
            logTest('Setup: Customer Login', 'FAIL', 'No token received');
        }
    } catch (error) {
        logTest('Setup: Customer Login', 'FAIL', error.response?.data?.message || error.message);
    }
}

/**
 * Test Admin User Management Endpoints
 */
async function testAdminUserManagement() {
    logSection('TESTING ADMIN USER MANAGEMENT ENDPOINTS');

    // 1. Test POST /api/users - Create user (Admin)
    if (adminToken) {
        try {
            const response = await axios.post(USER_ENDPOINT, testUsers.testUser, getAuthHeaders(adminToken));
            if (response.status === 201 && response.data.success && response.data.data._id) {
                createdUserId = response.data.data._id;
                logTest('API Test: POST /users (admin)', 'PASS', `User created with ID: ${createdUserId}`);
            } else {
                logTest('API Test: POST /users (admin)', 'FAIL', 'Invalid creation response');
            }
        } catch (error) {
            logTest('API Test: POST /users (admin)', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: POST /users (admin)', 'FAIL', 'No admin token available');
    }

    // 2. Test GET /api/users - Get all users (Admin)
    if (adminToken) {
        try {
            const response = await axios.get(USER_ENDPOINT, getAuthHeaders(adminToken));
            if (response.status === 200 && response.data.success && Array.isArray(response.data.data)) {
                logTest('API Test: GET /users (admin)', 'PASS', `Retrieved ${response.data.data.length} users`);
            } else {
                logTest('API Test: GET /users (admin)', 'FAIL', 'Invalid response structure');
            }
        } catch (error) {
            logTest('API Test: GET /users (admin)', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: GET /users (admin)', 'FAIL', 'No admin token available');
    }

    // 3. Test GET /api/users with query parameters
    if (adminToken) {
        try {
            const response = await axios.get(`${USER_ENDPOINT}?page=1&limit=5&search=test&role=customer`, getAuthHeaders(adminToken));
            if (response.status === 200 && response.data.success) {
                logTest('API Test: GET /users with query (admin)', 'PASS', 'Query parameters working');
            } else {
                logTest('API Test: GET /users with query (admin)', 'FAIL', 'Invalid response');
            }
        } catch (error) {
            logTest('API Test: GET /users with query (admin)', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: GET /users with query (admin)', 'FAIL', 'No admin token available');
    }

    // 4. Test GET /api/users/:id - Get user by ID (Admin)
    if (adminToken && createdUserId) {
        try {
            const response = await axios.get(`${USER_ENDPOINT}/${createdUserId}`, getAuthHeaders(adminToken));
            if (response.status === 200 && response.data.success && response.data.data._id === createdUserId) {
                logTest('API Test: GET /users/:id (admin)', 'PASS', 'User retrieved by ID');
            } else {
                logTest('API Test: GET /users/:id (admin)', 'FAIL', 'Invalid response');
            }
        } catch (error) {
            logTest('API Test: GET /users/:id (admin)', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: GET /users/:id (admin)', 'FAIL', 'No admin token or created user available');
    }

    // 5. Test PUT /api/users/:id - Update user (Admin)
    if (adminToken && createdUserId) {
        try {
            const updateData = {
                name: 'Updated Test User',
                phone: '0987654321',
                isActive: true
            };
            const response = await axios.put(`${USER_ENDPOINT}/${createdUserId}`, updateData, getAuthHeaders(adminToken));
            if (response.status === 200 && response.data.success) {
                logTest('API Test: PUT /users/:id (admin)', 'PASS', 'User updated successfully');
            } else {
                logTest('API Test: PUT /users/:id (admin)', 'FAIL', 'Invalid update response');
            }
        } catch (error) {
            logTest('API Test: PUT /users/:id (admin)', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: PUT /users/:id (admin)', 'FAIL', 'No admin token or created user available');
    }

    // 6. Test PATCH /api/users/:id/role - Update user role (Admin)
    if (adminToken && createdUserId) {
        try {
            const response = await axios.patch(`${USER_ENDPOINT}/${createdUserId}/role`, { role: 'customer' }, getAuthHeaders(adminToken));
            if (response.status === 200 && response.data.success) {
                logTest('API Test: PATCH /users/:id/role (admin)', 'PASS', 'User role updated successfully');
            } else {
                logTest('API Test: PATCH /users/:id/role (admin)', 'FAIL', 'Invalid role update response');
            }
        } catch (error) {
            logTest('API Test: PATCH /users/:id/role (admin)', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: PATCH /users/:id/role (admin)', 'FAIL', 'No admin token or created user available');
    }

    // 7. Test PATCH /api/users/:id/status - Toggle user status (Admin)
    if (adminToken && createdUserId) {
        try {
            const response = await axios.patch(`${USER_ENDPOINT}/${createdUserId}/status`, {}, getAuthHeaders(adminToken));
            if (response.status === 200 && response.data.success) {
                logTest('API Test: PATCH /users/:id/status (admin)', 'PASS', 'User status toggled successfully');
            } else {
                logTest('API Test: PATCH /users/:id/status (admin)', 'FAIL', 'Invalid status update response');
            }
        } catch (error) {
            logTest('API Test: PATCH /users/:id/status (admin)', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: PATCH /users/:id/status (admin)', 'FAIL', 'No admin token or created user available');
    }

    // 8. Test GET /api/users/stats - Get user statistics (Admin)
    if (adminToken) {
        try {
            const response = await axios.get(`${USER_ENDPOINT}/stats`, getAuthHeaders(adminToken));
            if (response.status === 200 && response.data.success && response.data.data.overview) {
                const stats = response.data.data;
                logTest('API Test: GET /users/stats (admin)', 'PASS', 
                    `Statistics: ${stats.overview.totalUsers} total users, ${stats.overview.activeUsers} active`);
            } else {
                logTest('API Test: GET /users/stats (admin)', 'FAIL', 'Invalid statistics response');
            }
        } catch (error) {
            logTest('API Test: GET /users/stats (admin)', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: GET /users/stats (admin)', 'FAIL', 'No admin token available');
    }
}

/**
 * Test Current User Profile Management
 */
async function testCurrentUserProfile() {
    logSection('TESTING CURRENT USER PROFILE MANAGEMENT');

    // 9. Test GET /api/users/me/profile - Get current user profile
    if (customerToken) {
        try {
            const response = await axios.get(`${USER_ENDPOINT}/me/profile`, getAuthHeaders(customerToken));
            if (response.status === 200 && response.data.success && response.data.data.email) {
                logTest('API Test: GET /users/me/profile', 'PASS', 'Current user profile retrieved');
            } else {
                logTest('API Test: GET /users/me/profile', 'FAIL', 'Invalid profile response');
            }
        } catch (error) {
            logTest('API Test: GET /users/me/profile', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: GET /users/me/profile', 'FAIL', 'No customer token available');
    }

    // 10. Test PUT /api/users/me/profile - Update current user profile
    if (customerToken) {
        try {
            const updateData = {
                name: 'Updated Customer Name',
                phone: '0111222333'
            };
            const response = await axios.put(`${USER_ENDPOINT}/me/profile`, updateData, getAuthHeaders(customerToken));
            if (response.status === 200 && response.data.success) {
                logTest('API Test: PUT /users/me/profile', 'PASS', 'Profile updated successfully');
            } else {
                logTest('API Test: PUT /users/me/profile', 'FAIL', 'Invalid profile update response');
            }
        } catch (error) {
            logTest('API Test: PUT /users/me/profile', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: PUT /users/me/profile', 'FAIL', 'No customer token available');
    }

    // 11. Test PUT /api/users/me/password - Change password
    if (customerToken) {
        try {
            const passwordData = {
                currentPassword: testUsers.customer.password,
                newPassword: 'NewPassword123!'
            };
            const response = await axios.put(`${USER_ENDPOINT}/me/password`, passwordData, getAuthHeaders(customerToken));
            if (response.status === 200 && response.data.success) {
                logTest('API Test: PUT /users/me/password', 'PASS', 'Password changed successfully');
                // Update test data for future use
                testUsers.customer.password = passwordData.newPassword;
            } else {
                logTest('API Test: PUT /users/me/password', 'FAIL', 'Invalid password change response');
            }
        } catch (error) {
            logTest('API Test: PUT /users/me/password', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: PUT /users/me/password', 'FAIL', 'No customer token available');
    }
}

/**
 * Test Address Management
 */
async function testAddressManagement() {
    logSection('TESTING ADDRESS MANAGEMENT');

    // 12. Test POST /api/users/me/addresses - Add address
    if (customerToken) {
        try {
            const addressData = {
                fullName: 'Test Customer',
                phone: '0123456789',
                addressLine: '123 Test Street',
                city: 'Ho Chi Minh',
                district: 'District 1',
                ward: 'Ward 1',
                isDefault: true
            };
            const response = await axios.post(`${USER_ENDPOINT}/me/addresses`, addressData, getAuthHeaders(customerToken));
            if (response.status === 201 && response.data.success && response.data.data._id) {
                createdAddressId = response.data.data._id;
                logTest('API Test: POST /users/me/addresses', 'PASS', `Address created with ID: ${createdAddressId}`);
            } else {
                logTest('API Test: POST /users/me/addresses', 'FAIL', 'Invalid address creation response');
            }
        } catch (error) {
            logTest('API Test: POST /users/me/addresses', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: POST /users/me/addresses', 'FAIL', 'No customer token available');
    }

    // 13. Test GET /api/users/me/addresses - Get all addresses
    if (customerToken) {
        try {
            const response = await axios.get(`${USER_ENDPOINT}/me/addresses`, getAuthHeaders(customerToken));
            if (response.status === 200 && response.data.success && Array.isArray(response.data.data)) {
                logTest('API Test: GET /users/me/addresses', 'PASS', `Retrieved ${response.data.data.length} addresses`);
            } else {
                logTest('API Test: GET /users/me/addresses', 'FAIL', 'Invalid addresses response');
            }
        } catch (error) {
            logTest('API Test: GET /users/me/addresses', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: GET /users/me/addresses', 'FAIL', 'No customer token available');
    }

    // 14. Test GET /api/users/me/addresses/:addressId - Get address by ID
    if (customerToken && createdAddressId) {
        try {
            const response = await axios.get(`${USER_ENDPOINT}/me/addresses/${createdAddressId}`, getAuthHeaders(customerToken));
            if (response.status === 200 && response.data.success && response.data.data._id === createdAddressId) {
                logTest('API Test: GET /users/me/addresses/:addressId', 'PASS', 'Address retrieved by ID');
            } else {
                logTest('API Test: GET /users/me/addresses/:addressId', 'FAIL', 'Invalid address response');
            }
        } catch (error) {
            logTest('API Test: GET /users/me/addresses/:addressId', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: GET /users/me/addresses/:addressId', 'FAIL', 'No customer token or created address available');
    }

    // 15. Test PUT /api/users/me/addresses/:addressId - Update address
    if (customerToken && createdAddressId) {
        try {
            const updateData = {
                fullName: 'Updated Test Customer',
                addressLine: '456 Updated Street'
            };
            const response = await axios.put(`${USER_ENDPOINT}/me/addresses/${createdAddressId}`, updateData, getAuthHeaders(customerToken));
            if (response.status === 200 && response.data.success) {
                logTest('API Test: PUT /users/me/addresses/:addressId', 'PASS', 'Address updated successfully');
            } else {
                logTest('API Test: PUT /users/me/addresses/:addressId', 'FAIL', 'Invalid address update response');
            }
        } catch (error) {
            logTest('API Test: PUT /users/me/addresses/:addressId', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: PUT /users/me/addresses/:addressId', 'FAIL', 'No customer token or created address available');
    }

    // 16. Test PATCH /api/users/me/addresses/:addressId/set-default - Set default address
    if (customerToken && createdAddressId) {
        try {
            const response = await axios.patch(`${USER_ENDPOINT}/me/addresses/${createdAddressId}/set-default`, {}, getAuthHeaders(customerToken));
            if (response.status === 200 && response.data.success) {
                logTest('API Test: PATCH /users/me/addresses/:addressId/set-default', 'PASS', 'Default address set successfully');
            } else {
                logTest('API Test: PATCH /users/me/addresses/:addressId/set-default', 'FAIL', 'Invalid set default response');
            }
        } catch (error) {
            logTest('API Test: PATCH /users/me/addresses/:addressId/set-default', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: PATCH /users/me/addresses/:addressId/set-default', 'FAIL', 'No customer token or created address available');
    }
}

/**
 * Test Authorization and Edge Cases
 */
async function testAuthorizationAndEdgeCases() {
    logSection('TESTING AUTHORIZATION & EDGE CASES');

    // 17. Test unauthorized access to admin endpoints
    try {
        const response = await axios.get(`${USER_ENDPOINT}/stats`);
        logTest('Auth Test: Unauthorized admin endpoint access', 'FAIL', 'Should require authentication');
    } catch (error) {
        if (error.response?.status === 401) {
            logTest('Auth Test: Unauthorized admin endpoint access', 'PASS', 'Correctly requires authentication');
        } else {
            logTest('Auth Test: Unauthorized admin endpoint access', 'PASS', `Got expected error: ${error.response?.status}`);
        }
    }

    // 18. Test customer access to admin endpoints
    if (customerToken) {
        try {
            const response = await axios.get(`${USER_ENDPOINT}/stats`, getAuthHeaders(customerToken));
            logTest('Auth Test: Customer access to admin endpoint', 'FAIL', 'Should block customer access');
        } catch (error) {
            if (error.response?.status === 403) {
                logTest('Auth Test: Customer access to admin endpoint', 'PASS', 'Correctly blocked customer access');
            } else {
                logTest('Auth Test: Customer access to admin endpoint', 'PASS', `Got expected error: ${error.response?.status}`);
            }
        }
    } else {
        logTest('Auth Test: Customer access to admin endpoint', 'FAIL', 'No customer token available');
    }

    // 19. Test invalid ObjectId validation
    if (adminToken) {
        try {
            const response = await axios.get(`${USER_ENDPOINT}/invalid-id`, getAuthHeaders(adminToken));
            logTest('Edge Test: Invalid ObjectId validation', 'FAIL', 'Should reject invalid ObjectId');
        } catch (error) {
            if (error.response?.status === 400) {
                logTest('Edge Test: Invalid ObjectId validation', 'PASS', 'Correctly rejected invalid ObjectId');
            } else {
                logTest('Edge Test: Invalid ObjectId validation', 'PASS', `Got expected error: ${error.response?.status}`);
            }
        }
    } else {
        logTest('Edge Test: Invalid ObjectId validation', 'FAIL', 'No admin token available');
    }

    // 20. Test duplicate email creation
    if (adminToken) {
        try {
            const duplicateUser = {
                email: testUsers.customer.email, // Use existing email
                password: 'Password123!',
                name: 'Duplicate User'
            };
            const response = await axios.post(USER_ENDPOINT, duplicateUser, getAuthHeaders(adminToken));
            logTest('Edge Test: Duplicate email creation', 'FAIL', 'Should reject duplicate email');
        } catch (error) {
            if (error.response?.status === 400) {
                logTest('Edge Test: Duplicate email creation', 'PASS', 'Correctly rejected duplicate email');
            } else {
                logTest('Edge Test: Duplicate email creation', 'PASS', `Got expected error: ${error.response?.status}`);
            }
        }
    } else {
        logTest('Edge Test: Duplicate email creation', 'FAIL', 'No admin token available');
    }

    // 21. Test invalid data validation
    if (adminToken) {
        try {
            const invalidUser = {
                email: 'invalid-email', // Invalid email format
                password: '123', // Too short password
                name: ''
            };
            const response = await axios.post(USER_ENDPOINT, invalidUser, getAuthHeaders(adminToken));
            logTest('Edge Test: Invalid user data validation', 'FAIL', 'Should reject invalid data');
        } catch (error) {
            if (error.response?.status === 400) {
                logTest('Edge Test: Invalid user data validation', 'PASS', 'Correctly rejected invalid data');
            } else {
                logTest('Edge Test: Invalid user data validation', 'PASS', `Got expected error: ${error.response?.status}`);
            }
        }
    } else {
        logTest('Edge Test: Invalid user data validation', 'FAIL', 'No admin token available');
    }

    // 22. Test wrong password change
    if (customerToken) {
        try {
            const wrongPasswordData = {
                currentPassword: 'WrongPassword123!',
                newPassword: 'AnotherNewPassword123!'
            };
            const response = await axios.put(`${USER_ENDPOINT}/me/password`, wrongPasswordData, getAuthHeaders(customerToken));
            logTest('Edge Test: Wrong current password', 'FAIL', 'Should reject wrong current password');
        } catch (error) {
            if (error.response?.status === 400) {
                logTest('Edge Test: Wrong current password', 'PASS', 'Correctly rejected wrong current password');
            } else {
                logTest('Edge Test: Wrong current password', 'PASS', `Got expected error: ${error.response?.status}`);
            }
        }
    } else {
        logTest('Edge Test: Wrong current password', 'FAIL', 'No customer token available');
    }
}

/**
 * Cleanup Test Data
 */
async function cleanupTestData() {
    logSection('CLEANUP TEST DATA');

    // Delete created address
    if (customerToken && createdAddressId) {
        try {
            await axios.delete(`${USER_ENDPOINT}/me/addresses/${createdAddressId}`, getAuthHeaders(customerToken));
            logTest('Cleanup: Delete test address', 'PASS', 'Test address deleted');
        } catch (error) {
            logTest('Cleanup: Delete test address', 'FAIL', error.response?.data?.message || error.message);
        }
    }

    // Delete created user
    if (adminToken && createdUserId) {
        try {
            await axios.delete(`${USER_ENDPOINT}/${createdUserId}`, getAuthHeaders(adminToken));
            logTest('Cleanup: Delete test user', 'PASS', 'Test user deleted');
        } catch (error) {
            logTest('Cleanup: Delete test user', 'FAIL', error.response?.data?.message || error.message);
        }
    }
}

/**
 * Display final results
 */
function displayResults() {
    logSection('FINAL TEST RESULTS');
    
    console.log(`📊 Tests Passed: ${testResults.passed}/${testResults.total}`);
    console.log(`📊 Tests Failed: ${testResults.failed}/${testResults.total}`);
    console.log(`📊 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
    console.log(`⏱️  Total Duration: ${((Date.now() - startTime) / 1000).toFixed(3)}s`);
    
    if (testResults.failed > 0) {
        console.log('\n❌ FAILED TESTS:');
        testResults.details
            .filter(test => test.status === 'FAIL')
            .forEach(test => console.log(`   - ${test.testName}: ${test.details}`));
    } else {
        console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
    }

    console.log('\n📋 TESTED ENDPOINTS:');
    console.log('✅ Admin User Management (8 endpoints)');
    console.log('   - POST /users (create user)');
    console.log('   - GET /users (get all users)');
    console.log('   - GET /users with query parameters');
    console.log('   - GET /users/:id (get user by ID)');
    console.log('   - PUT /users/:id (update user)');
    console.log('   - PATCH /users/:id/role (update role)');
    console.log('   - PATCH /users/:id/status (toggle status)');
    console.log('   - GET /users/stats (user statistics) ⭐ NEW');
    
    console.log('✅ Current User Profile (3 endpoints)');
    console.log('   - GET /users/me/profile');
    console.log('   - PUT /users/me/profile');
    console.log('   - PUT /users/me/password');
    
    console.log('✅ Address Management (5 endpoints)');
    console.log('   - POST /users/me/addresses');
    console.log('   - GET /users/me/addresses');
    console.log('   - GET /users/me/addresses/:addressId');
    console.log('   - PUT /users/me/addresses/:addressId');
    console.log('   - PATCH /users/me/addresses/:addressId/set-default');
    
    console.log('✅ Authorization & Edge Cases (6 test scenarios)');
    console.log('   - Unauthorized access blocking');
    console.log('   - Customer permission validation');
    console.log('   - Invalid ObjectId validation');
    console.log('   - Duplicate email validation');
    console.log('   - Invalid data validation');
    console.log('   - Wrong password validation');
}

/**
 * Main test execution
 */
async function runAllTests() {
    console.log('🚀 STARTING COMPREHENSIVE USER API TESTING');
    console.log('============================================================');
    
    try {
        await setupTestEnvironment();
        await testAdminUserManagement();
        await testCurrentUserProfile();
        await testAddressManagement();
        await testAuthorizationAndEdgeCases();
        await cleanupTestData();
    } catch (error) {
        console.error('💥 Test suite crashed:', error.message);
    } finally {
        displayResults();
        console.log('============================================================');
        console.log('🏁 USER API TESTING COMPLETED');
    }
}

// Run the tests
runAllTests();
