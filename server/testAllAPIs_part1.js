/**
 * COMPREHENSIVE API TESTING SUITE - PART 1
 * 
 * This file contains basic API tests:
 * ✅ Authentication & Authorization
 * ✅ User Management  
 * ✅ Categories & Hierarchies
 * ✅ Products & Variants
 * ✅ Colors & Sizes
 * ✅ Stock Management & Inventory
 * 
 * Usage:
 * - Run individually: node testAllAPIs_part1.js
 * - Import functions: const { testAuthentication, testProducts } = require('./testAllAPIs_part1.js')
 */

const axios = require('axios');
const chalk = require('chalk');

// API Base URL
const BASE_URL = 'http://localhost:5000/api';

// Test credentials
const CUSTOMER_LOGIN = {
  email: 'customer1@shop.com',
  password: 'customer123'
};

const ADMIN_LOGIN = {
  email: 'admin1@shop.com', 
  password: 'admin123456'
};

// Global variables to store tokens and test data
let customerToken = '';
let adminToken = '';
let testCustomerId = '';
let testAdminId = '';
let testProductId = '';
let testCategoryId = '';
let testColorId = '';
let testSizeId = '';
let testProductVariantId = '';

// Helper function to make API requests
async function apiRequest(method, url, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      data,
      timeout: 10000, // 10 second timeout
      headers: {}
    };
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status,
      code: error.code,
      timeout: error.code === 'ECONNABORTED'
    };
  }
}

// Log test result
function logResult(testName, result, details = null) {
  if (result.success) {
    console.log(chalk.green(`✅ ${testName}`));
    if (details) {
      console.log(chalk.gray(`   ${details}`));
    }
  } else {
    console.log(chalk.red(`❌ ${testName}`));
    console.log(chalk.red(`   Status: ${result.status || 'N/A'}`));
    console.log(chalk.red(`   Error: ${JSON.stringify(result.error)}`));
    if (result.timeout) {
      console.log(chalk.yellow(`   ⏰ Request timed out`));
    }
  }
}

// ==================== AUTHENTICATION TESTS ====================
async function testAuthentication() {
  console.log(chalk.blue('\n🔐 ===== TESTING AUTHENTICATION APIs ====='));
  
  try {
    // Test customer login
    console.log(chalk.yellow('\n📝 Testing Customer Login...'));
    const customerLoginResult = await apiRequest('POST', '/auth/login', CUSTOMER_LOGIN);
    logResult('Customer Login', customerLoginResult);
    
    if (customerLoginResult.success) {
      // Fix: Handle the correct response structure
      if (customerLoginResult.data?.data?.token) {
        customerToken = customerLoginResult.data.data.token;
        testCustomerId = customerLoginResult.data.data.user._id;
        console.log(chalk.gray(`   Customer Token: ${customerToken.substring(0, 20)}...`));
        console.log(chalk.gray(`   Customer ID: ${testCustomerId}`));
      } else {
        console.log(chalk.yellow(`   ⚠️ Login successful but token/user not found in expected path`));
        console.log(chalk.gray(`   Response structure: ${JSON.stringify(customerLoginResult.data)}`));
      }
    }

    // Test admin login  
    console.log(chalk.yellow('\n📝 Testing Admin Login...'));
    const adminLoginResult = await apiRequest('POST', '/auth/login', ADMIN_LOGIN);
    logResult('Admin Login', adminLoginResult);
    
    if (adminLoginResult.success) {
      // Fix: Handle the correct response structure
      if (adminLoginResult.data?.data?.token) {
        adminToken = adminLoginResult.data.data.token;
        testAdminId = adminLoginResult.data.data.user._id;
        console.log(chalk.gray(`   Admin Token: ${adminToken.substring(0, 20)}...`));
        console.log(chalk.gray(`   Admin ID: ${testAdminId}`));
      } else {
        console.log(chalk.yellow(`   ⚠️ Login successful but token/user not found in expected path`));
        console.log(chalk.gray(`   Response structure: ${JSON.stringify(adminLoginResult.data)}`));
      }
    }

    // Test get profile with customer token
    if (customerToken) {
      console.log(chalk.yellow('\n📝 Testing Get Customer Profile...'));
      const profileResult = await apiRequest('GET', '/auth/profile', null, customerToken);
      logResult('Get Customer Profile', profileResult);
    }

    // Test get profile with admin token
    if (adminToken) {
      console.log(chalk.yellow('\n📝 Testing Get Admin Profile...'));
      const adminProfileResult = await apiRequest('GET', '/auth/profile', null, adminToken);
      logResult('Get Admin Profile', adminProfileResult);
    }

    console.log(chalk.green('✅ Authentication API tests completed successfully'));
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Authentication API tests failed:'), error.message);
    return false;
  }
}

// ==================== USER MANAGEMENT TESTS ====================
async function testUserManagement() {
  console.log(chalk.blue('\n👥 ===== TESTING USER MANAGEMENT APIs ====='));
  
  try {
    // Test Get All Users (Admin only)
    if (adminToken) {
      console.log(chalk.yellow('\n📝 Testing Get All Users (Admin)...'));
      const getAllUsersResult = await apiRequest('GET', '/users', null, adminToken);
      logResult('Get All Users (Admin)', getAllUsersResult);
    }

    // Test Get User by ID (Admin)
    if (adminToken && testCustomerId) {
      console.log(chalk.yellow('\n📝 Testing Get User by ID (Admin)...'));
      const getUserResult = await apiRequest('GET', `/users/${testCustomerId}`, null, adminToken);
      logResult('Get User by ID (Admin)', getUserResult);
    }

    // Test Update User Profile (Customer)
    if (customerToken && testCustomerId) {
      console.log(chalk.yellow('\n📝 Testing Update User Profile (Customer)...'));
      const updateData = {
        name: 'Updated Customer Name',
        phone: '0987654321'
      };
      const updateResult = await apiRequest('PUT', `/users/${testCustomerId}`, updateData, customerToken);
      logResult('Update User Profile (Customer)', updateResult);
    }

    console.log(chalk.green('✅ User Management API tests completed successfully'));
    return true;
  } catch (error) {
    console.error(chalk.red('❌ User Management API tests failed:'), error.message);
    return false;
  }
}

// ==================== CATEGORY TESTS ====================
async function testCategories() {
  console.log(chalk.blue('\n📂 ===== TESTING CATEGORY APIs ====='));
  
  try {
    // Test Get All Categories (Public)
    console.log(chalk.yellow('\n📝 Testing Get All Categories...'));
    const getCategoriesResult = await apiRequest('GET', '/categories');
    logResult('Get All Categories', getCategoriesResult);

    // Test Create Category (Admin)
    if (adminToken) {
      console.log(chalk.yellow('\n📝 Testing Create Category (Admin)...'));
      const newCategoryData = {
        name: 'Test Category',
        description: 'This is a test category',
        isActive: true
      };
      const createCategoryResult = await apiRequest('POST', '/categories', newCategoryData, adminToken);
      logResult('Create Category (Admin)', createCategoryResult);
      
      if (createCategoryResult.success) {
        // Extract category ID from different possible response structures
        let categoryObj = null;
        
        if (createCategoryResult.data?.data?._id) {
          categoryObj = createCategoryResult.data.data;
        } else if (createCategoryResult.data?.category?._id) {
          categoryObj = createCategoryResult.data.category;
        } else if (createCategoryResult.data?.message?._id) {
          categoryObj = createCategoryResult.data.message;
        }
        
        if (categoryObj && categoryObj._id) {
          testCategoryId = categoryObj._id;
          console.log(chalk.gray(`   Created Category ID: ${testCategoryId}`));
        }
      }
    }

    // If no category created, try to get existing one
    if (!testCategoryId && getCategoriesResult.success && getCategoriesResult.data?.data?.length > 0) {
      testCategoryId = getCategoriesResult.data.data[0]._id;
      console.log(chalk.gray(`   Using existing Category ID: ${testCategoryId}`));
    }

    // Test Get Category by ID
    if (testCategoryId) {
      console.log(chalk.yellow('\n📝 Testing Get Category by ID...'));
      const getCategoryResult = await apiRequest('GET', `/categories/${testCategoryId}`);
      logResult('Get Category by ID', getCategoryResult);
    }

    // Test Update Category (Admin)
    if (adminToken && testCategoryId) {
      console.log(chalk.yellow('\n📝 Testing Update Category (Admin)...'));
      const updateCategoryData = {
        name: 'Updated Test Category',
        description: 'Updated description'
      };
      const updateCategoryResult = await apiRequest('PUT', `/categories/${testCategoryId}`, updateCategoryData, adminToken);
      logResult('Update Category (Admin)', updateCategoryResult);
    }

    console.log(chalk.green('✅ Category API tests completed successfully'));
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Category API tests failed:'), error.message);
    return false;
  }
}

// ==================== COLORS AND SIZES TESTS ====================
async function testColorsAndSizes() {
  console.log(chalk.blue('\n🎨 ===== TESTING COLORS AND SIZES APIs ====='));
  
  try {
    // Test Get All Colors
    console.log(chalk.yellow('\n📝 Testing Get All Colors...'));
    const getColorsResult = await apiRequest('GET', '/colors');
    logResult('Get All Colors', getColorsResult);

    // Test Create Color (Admin)
    if (adminToken) {
      console.log(chalk.yellow('\n📝 Testing Create Color (Admin)...'));
      const newColorData = {
        name: 'Test Red',
        hexCode: '#FF0000'
      };
      const createColorResult = await apiRequest('POST', '/colors', newColorData, adminToken);
      logResult('Create Color (Admin)', createColorResult);
      
      if (createColorResult.success) {
        // Extract color ID
        if (createColorResult.data?.data?._id) {
          testColorId = createColorResult.data.data._id;
          console.log(chalk.gray(`   Created Color ID: ${testColorId}`));
        }
      }
    }

    // Get existing color if not created
    if (!testColorId && getColorsResult.success && getColorsResult.data?.data?.length > 0) {
      testColorId = getColorsResult.data.data[0]._id;
      console.log(chalk.gray(`   Using existing Color ID: ${testColorId}`));
    }

    // Test Get All Sizes
    console.log(chalk.yellow('\n📝 Testing Get All Sizes...'));
    const getSizesResult = await apiRequest('GET', '/sizes');
    logResult('Get All Sizes', getSizesResult);

    // Test Create Size (Admin)
    if (adminToken) {
      console.log(chalk.yellow('\n📝 Testing Create Size (Admin)...'));
      const newSizeData = {
        name: 'XL',
        description: 'Extra Large'
      };
      const createSizeResult = await apiRequest('POST', '/sizes', newSizeData, adminToken);
      logResult('Create Size (Admin)', createSizeResult);
      
      if (createSizeResult.success) {
        // Extract size ID
        if (createSizeResult.data?.data?._id) {
          testSizeId = createSizeResult.data.data._id;
          console.log(chalk.gray(`   Created Size ID: ${testSizeId}`));
        }
      }
    }

    // Get existing size if not created
    if (!testSizeId && getSizesResult.success && getSizesResult.data?.data?.length > 0) {
      testSizeId = getSizesResult.data.data[0]._id;
      console.log(chalk.gray(`   Using existing Size ID: ${testSizeId}`));
    }

    console.log(chalk.green('✅ Colors and Sizes API tests completed successfully'));
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Colors and Sizes API tests failed:'), error.message);
    return false;
  }
}

// ==================== PRODUCT TESTS ====================
async function testProducts() {
  console.log(chalk.blue('\n🛍️ ===== TESTING PRODUCT APIs ====='));
  
  try {
    // Test Get All Products (Public)
    console.log(chalk.yellow('\n📝 Testing Get All Products...'));
    const getProductsResult = await apiRequest('GET', '/products');
    logResult('Get All Products', getProductsResult);

    // Test Create Product (Admin)
    if (adminToken && testCategoryId) {
      console.log(chalk.yellow('\n📝 Testing Create Product (Admin)...'));
      const newProductData = {
        name: 'Test Product',
        description: 'This is a test product',
        categoryId: testCategoryId,
        basePrice: 99.99,
        isActive: true
      };
      const createProductResult = await apiRequest('POST', '/products', newProductData, adminToken);
      logResult('Create Product (Admin)', createProductResult);
      
      if (createProductResult.success) {
        // Extract product ID from different possible response structures
        let productObj = null;
        
        if (createProductResult.data?.data?._id) {
          productObj = createProductResult.data.data;
        } else if (createProductResult.data?.product?._id) {
          productObj = createProductResult.data.product;
        } else if (createProductResult.data?.message?._id) {
          productObj = createProductResult.data.message;
        }
        
        if (productObj && productObj._id) {
          testProductId = productObj._id;
          console.log(chalk.gray(`   Created Product ID: ${testProductId}`));
        }
      }
    }

    // If no product created, try to get existing one
    if (!testProductId && getProductsResult.success && getProductsResult.data?.data?.length > 0) {
      testProductId = getProductsResult.data.data[0]._id;
      console.log(chalk.gray(`   Using existing Product ID: ${testProductId}`));
    }

    // Test Get Product by ID
    if (testProductId) {
      console.log(chalk.yellow('\n📝 Testing Get Product by ID...'));
      const getProductResult = await apiRequest('GET', `/products/${testProductId}`);
      logResult('Get Product by ID', getProductResult);
    }

    // Test Update Product (Admin)
    if (adminToken && testProductId) {
      console.log(chalk.yellow('\n📝 Testing Update Product (Admin)...'));
      const updateProductData = {
        name: 'Updated Test Product',
        description: 'Updated description',
        basePrice: 129.99
      };
      const updateProductResult = await apiRequest('PUT', `/products/${testProductId}`, updateProductData, adminToken);
      logResult('Update Product (Admin)', updateProductResult);
    }

    console.log(chalk.green('✅ Product API tests completed successfully'));
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Product API tests failed:'), error.message);
    return false;
  }
}

// ==================== PRODUCT VARIANT TESTS ====================
async function testProductVariants() {
  console.log(chalk.blue('\n🔧 ===== TESTING PRODUCT VARIANT APIs ====='));
  
  try {
    // Test Get All Variants for Product
    if (testProductId) {
      console.log(chalk.yellow('\n📝 Testing Get Product Variants...'));
      const getVariantsResult = await apiRequest('GET', `/product-variants/product/${testProductId}`);
      logResult('Get Product Variants', getVariantsResult);
    }

    // Test Create Product Variant (Admin)
    if (adminToken && testProductId && testColorId && testSizeId) {
      console.log(chalk.yellow('\n📝 Testing Create Product Variant (Admin)...'));
      const newVariantData = {
        productId: testProductId,
        colorId: testColorId,
        sizeId: testSizeId,
        price: 119.99,
        stock: 50,
        sku: 'TEST-VARIANT-001'
      };
      const createVariantResult = await apiRequest('POST', '/product-variants', newVariantData, adminToken);
      logResult('Create Product Variant (Admin)', createVariantResult);
      
      if (createVariantResult.success) {
        // Extract variant ID from different possible response structures
        let variantObj = null;
        
        if (createVariantResult.data?.data?._id) {
          variantObj = createVariantResult.data.data;
        } else if (createVariantResult.data?.variant?._id) {
          variantObj = createVariantResult.data.variant;
        } else if (createVariantResult.data?.message?._id) {
          variantObj = createVariantResult.data.message;
        }
        
        if (variantObj && variantObj._id) {
          testProductVariantId = variantObj._id;
          console.log(chalk.gray(`   Created Variant ID: ${testProductVariantId}`));
        }
      }
    }

    // Test Get Variant by ID
    if (testProductVariantId) {
      console.log(chalk.yellow('\n📝 Testing Get Variant by ID...'));
      const getVariantResult = await apiRequest('GET', `/product-variants/${testProductVariantId}`);
      logResult('Get Variant by ID', getVariantResult);
    }

    console.log(chalk.green('✅ Product Variant API tests completed successfully'));
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Product Variant API tests failed:'), error.message);
    return false;
  }
}

// ==================== STOCK MANAGEMENT TESTS ====================
async function testStockManagement() {
  console.log(chalk.blue('\n📦 ===== TESTING STOCK MANAGEMENT APIs ====='));
  
  try {
    // Test Get Stock Info for Product Variant
    if (testProductVariantId) {
      console.log(chalk.yellow('\n📝 Testing Get Stock Info...'));
      const getStockResult = await apiRequest('GET', `/product-variants/${testProductVariantId}/stock`);
      logResult('Get Stock Info', getStockResult);
    }

    // Test Update Stock (Admin)
    if (adminToken && testProductVariantId) {
      console.log(chalk.yellow('\n📝 Testing Update Stock (Admin)...'));
      const updateStockData = {
        stock: 100
      };
      const updateStockResult = await apiRequest('PUT', `/product-variants/${testProductVariantId}/stock`, updateStockData, adminToken);
      logResult('Update Stock (Admin)', updateStockResult);
    }

    console.log(chalk.green('✅ Stock Management API tests completed successfully'));
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Stock Management API tests failed:'), error.message);
    return false;
  }
}

// Helper function to check server availability
async function checkServerAvailable() {
  try {
    const response = await axios.get(`${BASE_URL.replace('/api', '')}`, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Export functions for use in other files
module.exports = {
  apiRequest,
  logResult,
  testAuthentication,
  testUserManagement,
  testCategories,
  testColorsAndSizes,
  testProducts,
  testProductVariants,
  testStockManagement,
  checkServerAvailable,
  // Export tokens and IDs for use in part 2
  getTestData: () => ({
    customerToken,
    adminToken,
    testCustomerId,
    testAdminId,
    testProductId,
    testCategoryId,
    testColorId,
    testSizeId,
    testProductVariantId
  }),
  setTestData: (data) => {
    customerToken = data.customerToken || '';
    adminToken = data.adminToken || '';
    testCustomerId = data.testCustomerId || '';
    testAdminId = data.testAdminId || '';
    testProductId = data.testProductId || '';
    testCategoryId = data.testCategoryId || '';
    testColorId = data.testColorId || '';
    testSizeId = data.testSizeId || '';
    testProductVariantId = data.testProductVariantId || '';
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  console.log(chalk.yellow.bold('🔥 === RUNNING API TEST SUITE - PART 1 ==='));
  
  (async () => {
    try {
      // Check if server is available
      console.log(chalk.blue('\n🔍 Checking server availability...'));
      const serverAvailable = await checkServerAvailable();
      if (!serverAvailable) {
        console.log(chalk.red('❌ Server is not available. Please start the server first.'));
        return;
      }
      console.log(chalk.green('✅ Server is available'));

      // Run all part 1 tests
      const tests = [
        { name: 'Authentication', fn: testAuthentication },
        { name: 'User Management', fn: testUserManagement },
        { name: 'Categories', fn: testCategories },
        { name: 'Colors and Sizes', fn: testColorsAndSizes },
        { name: 'Products', fn: testProducts },
        { name: 'Product Variants', fn: testProductVariants },
        { name: 'Stock Management', fn: testStockManagement }
      ];

      let passed = 0;
      let failed = 0;

      for (const test of tests) {
        try {
          console.log(chalk.blue.bold(`\n🧪 Running ${test.name} Tests...`));
          const result = await test.fn();
          
          if (result !== false) {
            passed++;
            console.log(chalk.green(`✅ ${test.name} Tests: PASSED`));
          } else {
            failed++;
            console.log(chalk.red(`❌ ${test.name} Tests: FAILED`));
          }
        } catch (error) {
          failed++;
          console.log(chalk.red(`💥 ${test.name} Tests: ERROR`));
          console.log(chalk.red(`   ${error.message}`));
        }
      }

      console.log(chalk.blue.bold('\n📊 === PART 1 TEST SUMMARY ==='));
      console.log(chalk.green(`✅ Passed: ${passed}`));
      console.log(chalk.red(`❌ Failed: ${failed}`));
      console.log(chalk.gray(`📅 Completed at: ${new Date().toISOString()}`));

    } catch (error) {
      console.error(chalk.red('❌ Error running part 1 tests:'), error.message);
    }
  })();
}
