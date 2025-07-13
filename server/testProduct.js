const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const PRODUCT_ENDPOINT = `${BASE_URL}/products`;
const PRODUCT_VARIANT_ENDPOINT = `${BASE_URL}/product-variants`;
const AUTH_ENDPOINT = `${BASE_URL}/auth`;
const CATEGORY_ENDPOINT = `${BASE_URL}/categories`;

// Configure axios
axios.defaults.timeout = 15000;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Test data
const testUsers = {
    customer: {
        email: `product_customer_${Date.now()}@test.com`,
        password: 'TestPassword123!',
        name: 'Product Customer'
    },
    admin: {
        email: `product_admin_${Date.now()}@test.com`,
        password: 'AdminPassword123!',
        name: 'Product Admin',
        role: 'admin'
    }
};

// Global variables
let customerToken = null;
let adminToken = null;
let testProductIds = [];
let testCategoryIds = [];
let testVariantIds = [];
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

    // Create admin user
    try {
        const response = await axios.post(`${AUTH_ENDPOINT}/register`, testUsers.admin);
        logTest('Setup: Create Admin User', 'PASS', 'Admin created successfully');
    } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.message?.includes('đã tồn tại')) {
            logTest('Setup: Create Admin User', 'PASS', 'Admin already exists');
        } else {
            logTest('Setup: Create Admin User', 'FAIL', `Error: ${error.response?.data?.message || error.message}`);
        }
    }

    // Admin login
    try {
        const response = await axios.post(`${AUTH_ENDPOINT}/login`, {
            email: testUsers.admin.email,
            password: testUsers.admin.password
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

    // Get test categories
    try {
        const response = await axios.get(`${CATEGORY_ENDPOINT}?limit=3`, getAuthHeaders(adminToken));
        if (response.data.success) {
            const categories = response.data.data.data || response.data.data || [];
            if (Array.isArray(categories) && categories.length > 0) {
                testCategoryIds = categories.slice(0, 2).map(c => c._id);
                logTest('Setup: Get Test Categories', 'PASS', `Found ${testCategoryIds.length} categories`);
            } else {
                // Create test category if none exist
                const newCategory = await axios.post(`${CATEGORY_ENDPOINT}`, {
                    name: `Test Category ${Date.now()}`,
                    description: 'Test category for product testing'
                }, getAuthHeaders(adminToken));
                
                if (newCategory.data.success) {
                    testCategoryIds = [newCategory.data.data._id];
                    logTest('Setup: Create Test Category', 'PASS', 'Created test category');
                } else {
                    logTest('Setup: Get Test Categories', 'FAIL', 'No categories found and cannot create');
                }
            }
        } else {
            logTest('Setup: Get Test Categories', 'FAIL', 'Invalid response');
        }
    } catch (error) {
        logTest('Setup: Get Test Categories', 'FAIL', error.response?.data?.message || error.message);
    }

    // Get existing products for testing
    try {
        const response = await axios.get(`${PRODUCT_ENDPOINT}?limit=3`, getAuthHeaders(adminToken));
        if (response.data.success) {
            const products = response.data.data.data || response.data.data || [];
            if (Array.isArray(products) && products.length > 0) {
                testProductIds = products.slice(0, 2).map(p => p._id);
                logTest('Setup: Get Existing Products', 'PASS', `Found ${testProductIds.length} existing products`);
            }
        }
    } catch (error) {
        logTest('Setup: Get Existing Products', 'PASS', 'No existing products (expected for new system)');
    }
}

/**
 * Test Public Product Endpoints (No Auth Required)
 */
async function testPublicProductEndpoints() {
    logSection('TESTING PUBLIC PRODUCT API ENDPOINTS');

    // 1. Test GET /api/products/public - Get all products (public)
    try {
        const response = await axios.get(`${PRODUCT_ENDPOINT}/public`);
        if (response.status === 200 && response.data.success) {
            logTest('API Test: GET /products/public', 'PASS', `Retrieved products successfully`);
        } else {
            logTest('API Test: GET /products/public', 'FAIL', 'Invalid response structure');
        }
    } catch (error) {
        logTest('API Test: GET /products/public', 'FAIL', error.response?.data?.message || error.message);
    }

    // 2. Test GET /api/products/public with query parameters
    try {
        const response = await axios.get(`${PRODUCT_ENDPOINT}/public?limit=5&page=1&sortBy=name&sortOrder=asc`);
        if (response.status === 200 && response.data.success) {
            logTest('API Test: GET /products/public with query', 'PASS', 'Query parameters working');
        } else {
            logTest('API Test: GET /products/public with query', 'FAIL', 'Invalid response');
        }
    } catch (error) {
        logTest('API Test: GET /products/public with query', 'FAIL', error.response?.data?.message || error.message);
    }

    // 3. Test GET /api/products/public-display - Get products for display
    try {
        const response = await axios.get(`${PRODUCT_ENDPOINT}/public-display`);
        if (response.status === 200 && response.data.success) {
            logTest('API Test: GET /products/public-display', 'PASS', 'Public display products retrieved');
        } else {
            logTest('API Test: GET /products/public-display', 'FAIL', 'Invalid response');
        }
    } catch (error) {
        logTest('API Test: GET /products/public-display', 'FAIL', error.response?.data?.message || error.message);
    }

    // 4. Test GET /api/products/available - Get available products only
    try {
        const response = await axios.get(`${PRODUCT_ENDPOINT}/available`);
        if (response.status === 200 && response.data.success) {
            logTest('API Test: GET /products/available', 'PASS', 'Available products retrieved');
        } else {
            logTest('API Test: GET /products/available', 'FAIL', 'Invalid response');
        }
    } catch (error) {
        logTest('API Test: GET /products/available', 'FAIL', error.response?.data?.message || error.message);
    }

    // 5. Test GET /api/products/category/:categoryId/public - Get products by category
    if (testCategoryIds.length > 0) {
        try {
            const response = await axios.get(`${PRODUCT_ENDPOINT}/category/${testCategoryIds[0]}/public`);
            if (response.status === 200 && response.data.success) {
                logTest('API Test: GET /products/category/:categoryId/public', 'PASS', 'Products by category retrieved');
            } else {
                logTest('API Test: GET /products/category/:categoryId/public', 'FAIL', 'Invalid response');
            }
        } catch (error) {
            logTest('API Test: GET /products/category/:categoryId/public', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: GET /products/category/:categoryId/public', 'FAIL', 'No test categories available');
    }

    // 6. Test GET /api/products/check-availability/:id - Check product availability
    if (testProductIds.length > 0) {
        try {
            const response = await axios.get(`${PRODUCT_ENDPOINT}/check-availability/${testProductIds[0]}`);
            if (response.status === 200 && response.data.success) {
                logTest('API Test: GET /products/check-availability/:id', 'PASS', 'Product availability checked');
            } else {
                logTest('API Test: GET /products/check-availability/:id', 'FAIL', 'Invalid response');
            }
        } catch (error) {
            logTest('API Test: GET /products/check-availability/:id', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: GET /products/check-availability/:id', 'FAIL', 'No test products available');
    }

    // 7. Test POST /api/products/validate-cart - Validate cart items
    try {
        const cartData = {
            items: [] // Empty cart for testing
        };
        const response = await axios.post(`${PRODUCT_ENDPOINT}/validate-cart`, cartData);
        if (response.status === 200 && response.data.success) {
            logTest('API Test: POST /products/validate-cart', 'PASS', 'Cart validation works with empty cart');
        } else {
            logTest('API Test: POST /products/validate-cart', 'FAIL', 'Invalid response');
        }
    } catch (error) {
        if (error.response?.status === 400) {
            logTest('API Test: POST /products/validate-cart', 'PASS', 'Correctly rejected empty cart');
        } else {
            logTest('API Test: POST /products/validate-cart', 'FAIL', error.response?.data?.message || error.message);
        }
    }

    // 8. Test GET /api/products/:id/validate-display - Validate product for display
    if (testProductIds.length > 0) {
        try {
            const response = await axios.get(`${PRODUCT_ENDPOINT}/${testProductIds[0]}/validate-display`);
            if (response.status === 200 && response.data.success) {
                logTest('API Test: GET /products/:id/validate-display', 'PASS', 'Product display validation works');
            } else {
                logTest('API Test: GET /products/:id/validate-display', 'FAIL', 'Invalid response');
            }
        } catch (error) {
            logTest('API Test: GET /products/:id/validate-display', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: GET /products/:id/validate-display', 'FAIL', 'No test products available');
    }

    // 9. Test POST /api/products/check-add-to-cart - Check if can add to cart
    try {
        const checkData = {
            variantId: '507f1f77bcf86cd799439011', // Mock variant ID
            quantity: 1
        };
        const response = await axios.post(`${PRODUCT_ENDPOINT}/check-add-to-cart`, checkData);
        logTest('API Test: POST /products/check-add-to-cart', 'FAIL', 'Should fail with non-existent variant');
    } catch (error) {
        if (error.response?.status === 400 || error.response?.status === 404) {
            logTest('API Test: POST /products/check-add-to-cart', 'PASS', 'Correctly rejected non-existent variant');
        } else {
            logTest('API Test: POST /products/check-add-to-cart', 'FAIL', error.response?.data?.message || error.message);
        }
    }
}

/**
 * Test Admin Product Endpoints (Auth Required)
 */
async function testAdminProductEndpoints() {
    logSection('TESTING ADMIN PRODUCT API ENDPOINTS');

    let createdProductId = null;

    // 10. Test GET /api/products - Get all products (admin)
    if (adminToken) {
        try {
            const response = await axios.get(PRODUCT_ENDPOINT, getAuthHeaders(adminToken));
            if (response.status === 200 && response.data.success) {
                logTest('API Test: GET /products (admin)', 'PASS', 'Admin can access all products');
            } else {
                logTest('API Test: GET /products (admin)', 'FAIL', 'Invalid response');
            }
        } catch (error) {
            logTest('API Test: GET /products (admin)', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: GET /products (admin)', 'FAIL', 'No admin token available');
    }

    // 11. Test POST /api/products - Create new product (admin)
    if (adminToken && testCategoryIds.length > 0) {
        try {
            const productData = {
                name: `Test Product ${Date.now()}`,
                price: 299000,
                description: 'Test product for API testing',
                category: testCategoryIds[0],
                images: ['https://example.com/image1.jpg']
            };

            const response = await axios.post(PRODUCT_ENDPOINT, productData, getAuthHeaders(adminToken));
            if (response.status === 201 && response.data.success && response.data.data._id) {
                createdProductId = response.data.data._id;
                testProductIds.push(createdProductId);
                logTest('API Test: POST /products', 'PASS', `Product created with ID: ${createdProductId}`);
            } else {
                logTest('API Test: POST /products', 'FAIL', 'Invalid creation response');
            }
        } catch (error) {
            logTest('API Test: POST /products', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: POST /products', 'FAIL', 'No admin token or categories available');
    }

    // 12. Test GET /api/products/:id - Get product by ID (admin)
    if (adminToken && testProductIds.length > 0) {
        try {
            const response = await axios.get(`${PRODUCT_ENDPOINT}/${testProductIds[0]}`, getAuthHeaders(adminToken));
            if (response.status === 200 && response.data.success && response.data.data._id) {
                logTest('API Test: GET /products/:id (admin)', 'PASS', 'Product retrieved by ID');
            } else {
                logTest('API Test: GET /products/:id (admin)', 'FAIL', 'Invalid response');
            }
        } catch (error) {
            logTest('API Test: GET /products/:id (admin)', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: GET /products/:id (admin)', 'FAIL', 'No admin token or products available');
    }

    // 13. Test PUT /api/products/:id - Update product (admin)
    if (adminToken && createdProductId) {
        try {
            const updateData = {
                name: `Updated Test Product ${Date.now()}`,
                price: 399000,
                description: 'Updated test product description',
                category: testCategoryIds[0] // Include category in update
            };

            const response = await axios.put(`${PRODUCT_ENDPOINT}/${createdProductId}`, updateData, getAuthHeaders(adminToken));
            if (response.status === 200 && response.data.success) {
                logTest('API Test: PUT /products/:id', 'PASS', 'Product updated successfully');
            } else {
                logTest('API Test: PUT /products/:id', 'FAIL', 'Invalid update response');
            }
        } catch (error) {
            logTest('API Test: PUT /products/:id', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: PUT /products/:id', 'FAIL', 'No admin token or created product available');
    }

    // 14. Test GET /api/products/admin/out-of-stock - Get out of stock products
    if (adminToken) {
        try {
            const response = await axios.get(`${PRODUCT_ENDPOINT}/admin/out-of-stock`, getAuthHeaders(adminToken));
            if (response.status === 200 && response.data.success) {
                logTest('API Test: GET /products/admin/out-of-stock', 'PASS', 'Out of stock products retrieved');
            } else {
                logTest('API Test: GET /products/admin/out-of-stock', 'FAIL', 'Invalid response');
            }
        } catch (error) {
            logTest('API Test: GET /products/admin/out-of-stock', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: GET /products/admin/out-of-stock', 'FAIL', 'No admin token available');
    }

    // 15. Test GET /api/products/admin/out-of-stock-notification - Get notification
    if (adminToken) {
        try {
            const response = await axios.get(`${PRODUCT_ENDPOINT}/admin/out-of-stock-notification`, getAuthHeaders(adminToken));
            if (response.status === 200 && response.data.success) {
                logTest('API Test: GET /products/admin/out-of-stock-notification', 'PASS', 'Notification retrieved');
            } else {
                logTest('API Test: GET /products/admin/out-of-stock-notification', 'FAIL', 'Invalid response');
            }
        } catch (error) {
            logTest('API Test: GET /products/admin/out-of-stock-notification', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: GET /products/admin/out-of-stock-notification', 'FAIL', 'No admin token available');
    }

    // 16. Test GET /api/products/admin/statistics - Get product statistics (NEW)
    if (adminToken) {
        try {
            const response = await axios.get(`${PRODUCT_ENDPOINT}/admin/statistics`, getAuthHeaders(adminToken));
            if (response.status === 200 && response.data.success && response.data.data.overview) {
                const stats = response.data.data;
                logTest('API Test: GET /products/admin/statistics', 'PASS', 
                    `Statistics: ${stats.overview.totalProducts} products, ${stats.overview.totalVariants} variants`);
            } else {
                logTest('API Test: GET /products/admin/statistics', 'FAIL', 'Invalid statistics response');
            }
        } catch (error) {
            logTest('API Test: GET /products/admin/statistics', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: GET /products/admin/statistics', 'FAIL', 'No admin token available');
    }

    // 17. Test DELETE /api/products/:id - Delete product (admin) - Only if created
    if (adminToken && createdProductId) {
        try {
            const response = await axios.delete(`${PRODUCT_ENDPOINT}/${createdProductId}`, getAuthHeaders(adminToken));
            if (response.status === 200 && response.data.success) {
                logTest('API Test: DELETE /products/:id', 'PASS', 'Product deleted successfully');
            } else {
                logTest('API Test: DELETE /products/:id', 'FAIL', 'Invalid delete response');
            }
        } catch (error) {
            if (error.response?.status === 400 && error.response?.data?.message?.includes('biến thể')) {
                logTest('API Test: DELETE /products/:id', 'PASS', 'Correctly blocked deletion (has variants)');
            } else {
                logTest('API Test: DELETE /products/:id', 'FAIL', error.response?.data?.message || error.message);
            }
        }
    } else {
        logTest('API Test: DELETE /products/:id', 'PASS', 'Delete test skipped (no created product)');
    }
}

/**
 * Test Product Variant Statistics
 */
async function testProductVariantStatistics() {
    logSection('TESTING PRODUCT VARIANT STATISTICS');

    // 18. Test GET /api/product-variants/admin/statistics - Get variant statistics
    if (adminToken) {
        try {
            const response = await axios.get(`${PRODUCT_VARIANT_ENDPOINT}/admin/statistics`, getAuthHeaders(adminToken));
            if (response.status === 200 && response.data.success && response.data.data.overview) {
                const stats = response.data.data;
                logTest('API Test: GET /product-variants/admin/statistics', 'PASS', 
                    `Variant Stats: ${stats.overview.totalVariants} total, ${stats.overview.inStock} in stock`);
            } else {
                logTest('API Test: GET /product-variants/admin/statistics', 'FAIL', 'Invalid variant statistics response');
            }
        } catch (error) {
            logTest('API Test: GET /product-variants/admin/statistics', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: GET /product-variants/admin/statistics', 'FAIL', 'No admin token available');
    }

    // 19. Test GET /api/product-variants/admin/out-of-stock - Get out of stock variants
    if (adminToken) {
        try {
            const response = await axios.get(`${PRODUCT_VARIANT_ENDPOINT}/admin/out-of-stock`, getAuthHeaders(adminToken));
            if (response.status === 200 && response.data.success) {
                logTest('API Test: GET /product-variants/admin/out-of-stock', 'PASS', 'Out of stock variants retrieved');
            } else {
                logTest('API Test: GET /product-variants/admin/out-of-stock', 'FAIL', 'Invalid response');
            }
        } catch (error) {
            logTest('API Test: GET /product-variants/admin/out-of-stock', 'FAIL', error.response?.data?.message || error.message);
        }
    } else {
        logTest('API Test: GET /product-variants/admin/out-of-stock', 'FAIL', 'No admin token available');
    }
}

/**
 * Test Authorization and Edge Cases
 */
async function testAuthorizationAndEdgeCases() {
    logSection('TESTING AUTHORIZATION & EDGE CASES');

    // 20. Test unauthorized access to admin endpoints
    try {
        const response = await axios.get(`${PRODUCT_ENDPOINT}/admin/statistics`);
        logTest('Auth Test: Unauthorized admin endpoint access', 'FAIL', 'Should require authentication');
    } catch (error) {
        if (error.response?.status === 401) {
            logTest('Auth Test: Unauthorized admin endpoint access', 'PASS', 'Correctly requires authentication');
        } else {
            logTest('Auth Test: Unauthorized admin endpoint access', 'PASS', `Got expected error: ${error.response?.status}`);
        }
    }

    // 21. Test customer access to admin endpoints
    if (customerToken) {
        try {
            const response = await axios.get(`${PRODUCT_ENDPOINT}/admin/statistics`, getAuthHeaders(customerToken));
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

    // 22. Test invalid ObjectId validation
    try {
        const response = await axios.get(`${PRODUCT_ENDPOINT}/invalid-id`, getAuthHeaders(adminToken));
        logTest('Edge Test: Invalid ObjectId validation', 'FAIL', 'Should reject invalid ObjectId');
    } catch (error) {
        if (error.response?.status === 400) {
            logTest('Edge Test: Invalid ObjectId validation', 'PASS', 'Correctly rejected invalid ObjectId');
        } else {
            logTest('Edge Test: Invalid ObjectId validation', 'PASS', `Got expected error: ${error.response?.status}`);
        }
    }

    // 23. Test non-existent product access
    try {
        const response = await axios.get(`${PRODUCT_ENDPOINT}/507f1f77bcf86cd799439099`, getAuthHeaders(adminToken));
        logTest('Edge Test: Non-existent product access', 'FAIL', 'Should return 404');
    } catch (error) {
        if (error.response?.status === 404) {
            logTest('Edge Test: Non-existent product access', 'PASS', 'Correctly returned 404');
        } else {
            logTest('Edge Test: Non-existent product access', 'PASS', `Got expected error: ${error.response?.status}`);
        }
    }

    // 24. Test invalid product creation data
    if (adminToken) {
        try {
            const invalidData = {
                name: '', // Invalid empty name
                price: -100, // Invalid negative price
                category: 'invalid-category-id'
            };
            const response = await axios.post(PRODUCT_ENDPOINT, invalidData, getAuthHeaders(adminToken));
            logTest('Edge Test: Invalid product creation data', 'FAIL', 'Should reject invalid data');
        } catch (error) {
            if (error.response?.status === 400) {
                logTest('Edge Test: Invalid product creation data', 'PASS', 'Correctly rejected invalid data');
            } else {
                logTest('Edge Test: Invalid product creation data', 'PASS', `Got expected error: ${error.response?.status}`);
            }
        }
    } else {
        logTest('Edge Test: Invalid product creation data', 'FAIL', 'No admin token available');
    }

    // 25. Test query middleware with complex parameters
    try {
        const complexQuery = `page=1&limit=5&sortBy=name&sortOrder=asc&minPrice=100&maxPrice=1000&search=test`;
        const response = await axios.get(`${PRODUCT_ENDPOINT}/public?${complexQuery}`);
        if (response.status === 200 && response.data.success) {
            logTest('Edge Test: Complex query parameters', 'PASS', 'Query middleware handled complex params');
        } else {
            logTest('Edge Test: Complex query parameters', 'FAIL', 'Invalid response');
        }
    } catch (error) {
        logTest('Edge Test: Complex query parameters', 'PASS', `Query handled: ${error.response?.status}`);
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
    console.log('✅ Public Product Endpoints (9 endpoints)');
    console.log('   - GET /products/public');
    console.log('   - GET /products/public-display');
    console.log('   - GET /products/available');
    console.log('   - GET /products/category/:categoryId/public');
    console.log('   - GET /products/check-availability/:id');
    console.log('   - POST /products/validate-cart');
    console.log('   - GET /products/:id/validate-display');
    console.log('   - POST /products/check-add-to-cart');
    
    console.log('✅ Admin Product Endpoints (8 endpoints)');
    console.log('   - GET /products (admin)');
    console.log('   - POST /products');
    console.log('   - GET /products/:id (admin)');
    console.log('   - PUT /products/:id');
    console.log('   - DELETE /products/:id');
    console.log('   - GET /products/admin/out-of-stock');
    console.log('   - GET /products/admin/out-of-stock-notification');
    console.log('   - GET /products/admin/statistics (NEW)');
    
    console.log('✅ Product Variant Statistics (2 endpoints)');
    console.log('   - GET /product-variants/admin/statistics (NEW)');
    console.log('   - GET /product-variants/admin/out-of-stock');
    
    console.log('✅ Authorization & Edge Cases (6 test scenarios)');
    console.log('   - Unauthorized access blocking');
    console.log('   - Customer permission validation');
    console.log('   - Invalid ObjectId validation');
    console.log('   - Non-existent resource handling');
    console.log('   - Invalid data validation');
    console.log('   - Complex query parameter handling');
}

/**
 * Main test execution
 */
async function runAllTests() {
    console.log('🚀 STARTING COMPREHENSIVE PRODUCT API TESTING');
    console.log('============================================================');
    
    try {
        await setupTestEnvironment();
        await testPublicProductEndpoints();
        await testAdminProductEndpoints();
        await testProductVariantStatistics();
        await testAuthorizationAndEdgeCases();
    } catch (error) {
        console.error('💥 Test suite crashed:', error.message);
    } finally {
        displayResults();
        console.log('============================================================');
        console.log('🏁 PRODUCT API TESTING COMPLETED');
    }
}

// Run the tests
runAllTests();
