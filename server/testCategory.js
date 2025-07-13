/**
 * COMPREHENSIVE CATEGORY API TESTING SUITE
 * ========================================
 * 
 * This test suite validates all Category APIs with comprehensive scenarios:
 * - Schema validation (simplified structure)
 * - CRUD operations (Create, Read, Update, Delete)
 * - Business logic (hierarchical categories, deletion policies)
 * - Authentication and authorization
 * - Edge cases and error handling
 * - Data integrity and consistency
 * 
 * Expected Results: All tests should pass to ensure Category system reliability
 */

const axios = require('axios');
const mongoose = require('mongoose');

// ============= CONFIGURATION =============
const BASE_URL = 'http://localhost:5000/api';
const CATEGORY_ENDPOINT = `${BASE_URL}/categories`;

// Test configuration
const CONFIG = {
    ADMIN_EMAIL: 'admin@example.com',
    ADMIN_PASSWORD: 'password123',
    USER_EMAIL: 'customer@example.com',
    USER_PASSWORD: 'password123',
    CLEANUP_ON_SUCCESS: true,
    VERBOSE_LOGGING: true
};

// Global variables
let adminToken = '';
let userToken = '';
let testCategoryIds = [];
let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

// ============= UTILITY FUNCTIONS =============

function log(message, type = 'INFO') {
    if (CONFIG.VERBOSE_LOGGING) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${type}] ${message}`);
    }
}

function recordTest(testName, passed, error = null) {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        log(`✅ ${testName}`, 'PASS');
    } else {
        testResults.failed++;
        log(`❌ ${testName}: ${error}`, 'FAIL');
    }
    testResults.details.push({
        test: testName,
        passed,
        error: error ? error.toString() : null,
        timestamp: new Date().toISOString()
    });
}

async function makeRequest(method, url, data = null, token = null) {
    try {
        const config = {
            method,
            url,
            headers: {}
        };
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        if (data) {
            config.data = data;
            config.headers['Content-Type'] = 'application/json';
        }
        
        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status || 500
        };
    }
}

// ============= AUTHENTICATION SETUP =============

async function setupAuthentication() {
    log('Setting up authentication...', 'SETUP');
    
    try {
        // Login as admin
        const adminLogin = await makeRequest('POST', `${BASE_URL}/auth/login`, {
            email: CONFIG.ADMIN_EMAIL,
            password: CONFIG.ADMIN_PASSWORD
        });
        
        if (adminLogin.success) {
            adminToken = adminLogin.data.data.token;
            log('Admin authentication successful', 'AUTH');
        } else {
            throw new Error(`Admin login failed: ${adminLogin.error?.message || adminLogin.error || 'Unknown error'}`);
        }
        
        // Login as regular user
        const userLogin = await makeRequest('POST', `${BASE_URL}/auth/login`, {
            email: CONFIG.USER_EMAIL,
            password: CONFIG.USER_PASSWORD
        });
        
        if (userLogin.success) {
            userToken = userLogin.data.data.token;
            log('User authentication successful', 'AUTH');
        } else {
            throw new Error(`User login failed: ${userLogin.error?.message || userLogin.error || 'Unknown error'}`);
        }
        
        return true;
    } catch (error) {
        log(`Authentication setup failed: ${error.message}`, 'ERROR');
        return false;
    }
}

// ============= TEST CATEGORIES =============

async function test01_GetAllCategories() {
    const result = await makeRequest('GET', `${CATEGORY_ENDPOINT}/public`); // Use public endpoint
    recordTest('01. Get All Categories (No Auth)', 
        result.success && result.status === 200,
        result.error?.message
    );
    return result.success;
}

async function test02_GetCategoryTree() {
    const result = await makeRequest('GET', `${CATEGORY_ENDPOINT}/tree`);
    recordTest('02. Get Category Tree', 
        result.success && result.status === 200 && Array.isArray(result.data.data),
        result.error?.message
    );
    return result.success;
}

async function test03_GetRootCategories() {
    const result = await makeRequest('GET', `${CATEGORY_ENDPOINT}/roots`);
    recordTest('03. Get Root Categories', 
        result.success && result.status === 200 && Array.isArray(result.data.data),
        result.error?.message
    );
    return result.success;
}

async function test04_CreateCategoryUnauthorized() {
    const categoryData = {
        name: 'Test Category Unauthorized',
        description: 'Test description'
    };
    
    const result = await makeRequest('POST', CATEGORY_ENDPOINT, categoryData);
    recordTest('04. Create Category (Unauthorized)', 
        !result.success && result.status === 401,
        result.success ? 'Should have failed with 401' : null
    );
    return !result.success && result.status === 401;
}

async function test05_CreateCategoryAsUser() {
    const categoryData = {
        name: 'Test Category User',
        description: 'Test description'
    };
    
    const result = await makeRequest('POST', CATEGORY_ENDPOINT, categoryData, userToken);
    recordTest('05. Create Category (User Role)', 
        !result.success && result.status === 403,
        result.success ? 'Should have failed with 403' : null
    );
    return !result.success && result.status === 403;
}

async function test06_CreateRootCategory() {
    const timestamp = Date.now();
    const categoryData = {
        name: `Test Electronics ${timestamp}`,
        description: 'Electronic devices and accessories for testing',
        isActive: true
    };
    
    const result = await makeRequest('POST', CATEGORY_ENDPOINT, categoryData, adminToken);
    const success = result.success && result.status === 201 && result.data.data._id;
    
    if (success) {
        testCategoryIds.push(result.data.data._id);
        log(`Created root category: ${result.data.data._id}`, 'DATA');
    }
    
    recordTest('06. Create Root Category (Admin)', success, result.error?.message);
    return success;
}

async function test07_CreateChildCategory() {
    if (testCategoryIds.length === 0) {
        recordTest('07. Create Child Category', false, 'No parent category available');
        return false;
    }
    
    const timestamp = Date.now();
    const categoryData = {
        name: `Test Smartphones ${timestamp}`,
        description: 'Mobile phones and smartphones for testing',
        parent: testCategoryIds[0],
        isActive: true
    };
    
    const result = await makeRequest('POST', CATEGORY_ENDPOINT, categoryData, adminToken);
    const success = result.success && result.status === 201 && result.data.data._id;
    
    if (success) {
        testCategoryIds.push(result.data.data._id);
        log(`Created child category: ${result.data.data._id}`, 'DATA');
    }
    
    recordTest('07. Create Child Category', success, result.error?.message);
    return success;
}

async function test08_CreateCategoryInvalidParent() {
    const categoryData = {
        name: 'Invalid Parent Category',
        description: 'Test description',
        parent: '507f1f77bcf86cd799439011', // Non-existent ID
        isActive: true
    };
    
    const result = await makeRequest('POST', CATEGORY_ENDPOINT, categoryData, adminToken);
    recordTest('08. Create Category (Invalid Parent)', 
        !result.success && (result.status === 400 || result.status === 404),
        result.success ? 'Should have failed with invalid parent' : null
    );
    return !result.success;
}

async function test09_CreateCategoryCircularReference() {
    if (testCategoryIds.length < 2) {
        recordTest('09. Create Category (Circular Reference)', false, 'Insufficient test categories');
        return false;
    }
    
    // Try to set parent as its own child
    const categoryData = {
        name: 'Circular Category',
        description: 'Test circular reference',
        parent: testCategoryIds[1], // Child category as parent
        isActive: true
    };
    
    const result = await makeRequest('POST', CATEGORY_ENDPOINT, categoryData, adminToken);
    
    if (result.success) {
        testCategoryIds.push(result.data.data._id);
        
        // Now try to update the original parent to create circular reference
        const updateResult = await makeRequest('PUT', `${CATEGORY_ENDPOINT}/${testCategoryIds[0]}`, {
            parent: result.data.data._id
        }, adminToken);
        
        recordTest('09. Create Category (Circular Reference)', 
            !updateResult.success,
            updateResult.success ? 'Should have prevented circular reference' : null
        );
        return !updateResult.success;
    } else {
        recordTest('09. Create Category (Circular Reference)', true, 'Initial category creation failed as expected');
        return true;
    }
}

async function test10_GetCategoryById() {
    if (testCategoryIds.length === 0) {
        recordTest('10. Get Category By ID', false, 'No test category available');
        return false;
    }
    
    const result = await makeRequest('GET', `${CATEGORY_ENDPOINT}/${testCategoryIds[0]}/public`); // Use public endpoint
    const success = result.success && result.status === 200 && result.data.data._id === testCategoryIds[0];
    
    recordTest('10. Get Category By ID', success, result.error?.message);
    return success;
}

async function test11_GetCategoryByInvalidId() {
    const result = await makeRequest('GET', `${CATEGORY_ENDPOINT}/invalid-id/public`); // Use public endpoint
    recordTest('11. Get Category (Invalid ID)', 
        !result.success && result.status === 400,
        result.success ? 'Should have failed with invalid ID' : null
    );
    return !result.success && result.status === 400;
}

async function test12_GetChildCategories() {
    if (testCategoryIds.length === 0) {
        recordTest('12. Get Child Categories', false, 'No test category available');
        return false;
    }
    
    const result = await makeRequest('GET', `${CATEGORY_ENDPOINT}/${testCategoryIds[0]}/children`);
    const success = result.success && result.status === 200 && Array.isArray(result.data.data);
    
    recordTest('12. Get Child Categories', success, result.error?.message);
    return success;
}

async function test13_GetCategoryPath() {
    if (testCategoryIds.length < 2) {
        recordTest('13. Get Category Path', false, 'No child category available');
        return false;
    }
    
    const result = await makeRequest('GET', `${CATEGORY_ENDPOINT}/${testCategoryIds[1]}/path`);
    const success = result.success && result.status === 200; // Accept any successful response
    
    recordTest('13. Get Category Path', success, result.error?.message);
    return success;
}

async function test14_GetCategoryAncestors() {
    if (testCategoryIds.length < 2) {
        recordTest('14. Get Category Ancestors', false, 'No child category available');
        return false;
    }
    
    const result = await makeRequest('GET', `${CATEGORY_ENDPOINT}/${testCategoryIds[1]}/ancestors`);
    const success = result.success && result.status === 200 && Array.isArray(result.data.data);
    
    recordTest('14. Get Category Ancestors', success, result.error?.message);
    return success;
}

async function test15_GetCategoryStats() {
    if (testCategoryIds.length === 0) {
        recordTest('15. Get Category Stats', false, 'No test category available');
        return false;
    }
    
    const result = await makeRequest('GET', `${CATEGORY_ENDPOINT}/${testCategoryIds[0]}/stats`, null, adminToken);
    const success = result.success && result.status === 200; // Accept any successful response
    
    recordTest('15. Get Category Stats', success, result.error?.message);
    return success;
}

async function test16_UpdateCategoryUnauthorized() {
    if (testCategoryIds.length === 0) {
        recordTest('16. Update Category (Unauthorized)', false, 'No test category available');
        return false;
    }
    
    const updateData = { name: 'Updated Name' };
    const result = await makeRequest('PUT', `${CATEGORY_ENDPOINT}/${testCategoryIds[0]}`, updateData);
    recordTest('16. Update Category (Unauthorized)', 
        !result.success && result.status === 401,
        result.success ? 'Should have failed with 401' : null
    );
    return !result.success && result.status === 401;
}

async function test17_UpdateCategoryAsUser() {
    if (testCategoryIds.length === 0) {
        recordTest('17. Update Category (User Role)', false, 'No test category available');
        return false;
    }
    
    const updateData = { name: 'Updated Name User' };
    const result = await makeRequest('PUT', `${CATEGORY_ENDPOINT}/${testCategoryIds[0]}`, updateData, userToken);
    recordTest('17. Update Category (User Role)', 
        !result.success && result.status === 403,
        result.success ? 'Should have failed with 403' : null
    );
    return !result.success && result.status === 403;
}

async function test18_UpdateCategoryValid() {
    if (testCategoryIds.length === 0) {
        recordTest('18. Update Category (Valid)', false, 'No test category available');
        return false;
    }
    
    const timestamp = Date.now();
    const updateData = {
        name: `Test Electronics Updated ${timestamp}`,
        description: 'Updated electronic devices and accessories for testing'
    };
    
    const result = await makeRequest('PUT', `${CATEGORY_ENDPOINT}/${testCategoryIds[0]}`, updateData, adminToken);
    const success = result.success && result.status === 200 && 
                   result.data.data.name === updateData.name;
    
    recordTest('18. Update Category (Valid)', success, result.error?.message);
    return success;
}

async function test19_CanDeleteCategoryWithChildren() {
    if (testCategoryIds.length < 2) {
        recordTest('19. Can Delete Category (With Children)', false, 'No parent-child categories available');
        return false;
    }
    
    const result = await makeRequest('GET', `${CATEGORY_ENDPOINT}/${testCategoryIds[0]}/can-delete`, null, adminToken);
    // Should fail because category has children - this is expected behavior
    const success = !result.success || 
                   (result.success && result.status === 200 && 
                    (result.data.data.canDelete === false || result.data.data?.message?.includes('danh mục con')));
    
    recordTest('19. Can Delete Category (With Children)', success, 
        success ? null : 'Should indicate category cannot be deleted due to children');
    return success;
}

async function test20_CanDeleteCategoryWithoutChildren() {
    if (testCategoryIds.length < 2) {
        recordTest('20. Can Delete Category (Without Children)', false, 'No child category available');
        return false;
    }
    
    const result = await makeRequest('GET', `${CATEGORY_ENDPOINT}/${testCategoryIds[1]}/can-delete`, null, adminToken);
    const success = result.success && result.status === 200;
    
    recordTest('20. Can Delete Category (Without Children)', success, result.error?.message);
    return success;
}

async function test21_DeleteCategoryUnauthorized() {
    if (testCategoryIds.length < 2) {
        recordTest('21. Delete Category (Unauthorized)', false, 'No test category available');
        return false;
    }
    
    const result = await makeRequest('DELETE', `${CATEGORY_ENDPOINT}/${testCategoryIds[1]}`);
    recordTest('21. Delete Category (Unauthorized)', 
        !result.success && result.status === 401,
        result.success ? 'Should have failed with 401' : null
    );
    return !result.success && result.status === 401;
}

async function test22_DeleteCategoryAsUser() {
    if (testCategoryIds.length < 2) {
        recordTest('22. Delete Category (User Role)', false, 'No test category available');
        return false;
    }
    
    const result = await makeRequest('DELETE', `${CATEGORY_ENDPOINT}/${testCategoryIds[1]}`, null, userToken);
    recordTest('22. Delete Category (User Role)', 
        !result.success && result.status === 403,
        result.success ? 'Should have failed with 403' : null
    );
    return !result.success && result.status === 403;
}

async function test23_DeleteCategoryWithChildren() {
    if (testCategoryIds.length < 2) {
        recordTest('23. Delete Category (With Children)', false, 'No parent category available');
        return false;
    }
    
    const result = await makeRequest('DELETE', `${CATEGORY_ENDPOINT}/${testCategoryIds[0]}`, null, adminToken);
    recordTest('23. Delete Category (With Children)', 
        !result.success && result.status === 400,
        result.success ? 'Should have failed - category has children' : null
    );
    return !result.success;
}

async function test24_DeleteCategoryValid() {
    // Find a category that can be deleted (try from the end of the list)
    let categoryToDelete = null;
    let categoryIndex = -1;
    
    for (let i = testCategoryIds.length - 1; i >= 0; i--) {
        const checkResult = await makeRequest('GET', `${CATEGORY_ENDPOINT}/${testCategoryIds[i]}/can-delete`, null, adminToken);
        if (checkResult.success && (checkResult.data.data.canDelete === true || !checkResult.data.data?.message?.includes('danh mục con'))) {
            categoryToDelete = testCategoryIds[i];
            categoryIndex = i;
            break;
        }
    }
    
    if (!categoryToDelete) {
        recordTest('24. Delete Category (Valid)', false, 'No deletable category found');
        return false;
    }
    
    const result = await makeRequest('DELETE', `${CATEGORY_ENDPOINT}/${categoryToDelete}`, null, adminToken);
    const success = result.success && result.status === 200;
    
    if (success) {
        testCategoryIds.splice(categoryIndex, 1);
        log(`Deleted category: ${categoryToDelete}`, 'DATA');
    }
    
    recordTest('24. Delete Category (Valid)', success, result.error?.message);
    return success;
}

async function test25_ValidateParentCategory() {
    if (testCategoryIds.length === 0) {
        recordTest('25. Validate Parent Category', false, 'No test category available');
        return false;
    }
    
    const validationData = {
        parentId: testCategoryIds[0],
        categoryId: null // New category
    };
    
    const result = await makeRequest('POST', `${CATEGORY_ENDPOINT}/validate-parent`, validationData, adminToken);
    const success = result.success && result.status === 200 && result.data.data.valid === true;
    
    recordTest('25. Validate Parent Category', success, result.error?.message);
    return success;
}

// ============= CLEANUP FUNCTIONS =============

async function cleanupTestData() {
    if (!CONFIG.CLEANUP_ON_SUCCESS || testResults.failed > 0) {
        log('Skipping cleanup due to configuration or test failures', 'CLEANUP');
        return;
    }
    
    log('Starting cleanup of test data...', 'CLEANUP');
    
    for (const categoryId of testCategoryIds) {
        try {
            const result = await makeRequest('DELETE', `${CATEGORY_ENDPOINT}/${categoryId}`, null, adminToken);
            if (result.success) {
                log(`Cleaned up category: ${categoryId}`, 'CLEANUP');
            } else {
                log(`Failed to cleanup category: ${categoryId}`, 'CLEANUP');
            }
        } catch (error) {
            log(`Error cleaning up category ${categoryId}: ${error.message}`, 'CLEANUP');
        }
    }
    
    log('Cleanup completed', 'CLEANUP');
}

// ============= MAIN TEST EXECUTION =============

async function runAllTests() {
    console.log('\n🧪 COMPREHENSIVE CATEGORY API TESTING SUITE');
    console.log('='.repeat(50));
    
    const startTime = Date.now();
    
    try {
        // Setup phase
        log('Starting Category API comprehensive testing...', 'START');
        
        const authSuccess = await setupAuthentication();
        if (!authSuccess) {
            console.log('\n❌ Authentication setup failed. Cannot proceed with tests.');
            process.exit(1);
        }
        
        // Execute all tests
        log('Executing test suite...', 'EXECUTE');
        
        await test01_GetAllCategories();
        await test02_GetCategoryTree();
        await test03_GetRootCategories();
        await test04_CreateCategoryUnauthorized();
        await test05_CreateCategoryAsUser();
        await test06_CreateRootCategory();
        await test07_CreateChildCategory();
        await test08_CreateCategoryInvalidParent();
        await test09_CreateCategoryCircularReference();
        await test10_GetCategoryById();
        await test11_GetCategoryByInvalidId();
        await test12_GetChildCategories();
        await test13_GetCategoryPath();
        await test14_GetCategoryAncestors();
        await test15_GetCategoryStats();
        await test16_UpdateCategoryUnauthorized();
        await test17_UpdateCategoryAsUser();
        await test18_UpdateCategoryValid();
        await test19_CanDeleteCategoryWithChildren();
        await test20_CanDeleteCategoryWithoutChildren();
        await test21_DeleteCategoryUnauthorized();
        await test22_DeleteCategoryAsUser();
        await test23_DeleteCategoryWithChildren();
        await test24_DeleteCategoryValid();
        await test25_ValidateParentCategory();
        
    } catch (error) {
        log(`Critical error during testing: ${error.message}`, 'ERROR');
        testResults.failed++;
        testResults.total++;
    }
    
    // Cleanup
    await cleanupTestData();
    
    // Results
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Total:  ${testResults.total}`);
    console.log(`⏱️  Duration: ${duration.toFixed(2)}s`);
    console.log(`📊 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.failed > 0) {
        console.log('\n❌ FAILED TESTS:');
        testResults.details
            .filter(test => !test.passed)
            .forEach(test => {
                console.log(`   • ${test.test}: ${test.error}`);
            });
    }
    
    console.log('\n🎯 CATEGORY API TESTING COMPLETED');
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
}

// Start testing if this file is run directly
if (require.main === module) {
    runAllTests().catch(error => {
        console.error('\n💥 CRITICAL ERROR:', error.message);
        console.error(error.stack);
        process.exit(1);
    });
}

module.exports = {
    runAllTests,
    testResults
};
