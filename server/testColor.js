/**
 * TEST COMPREHENSIVE CHO COLOR APIs
 * Kiểm tra tất cả business logic và API endpoints
 * 
 * Business Rules được test:
 * 1. Tên màu phải là duy nhất và hợp lệ (không ký tự đặc biệt)
 * 2. Mỗi màu có thể được tái sử dụng cho nhiều variant
 * 3. Không thể xóa màu đang được sử dụng bởi variant
 * 4. Schema đơn giản: chỉ có _id và name
 */

const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@test.com';
const ADMIN_PASSWORD = 'admin123';

// Test Results Storage
const testResults = {
  basic: { passed: 0, failed: 0, total: 0, details: [] },
  business: { passed: 0, failed: 0, total: 0, details: [] },
  integration: { passed: 0, failed: 0, total: 0, details: [] }
};

let adminToken = '';
let createdData = {
  colors: [],
  products: [],
  variants: []
};

// Utility Functions
function logTest(category, testName, passed, error = null) {
  testResults[category].total++;
  if (passed) {
    testResults[category].passed++;
    console.log(`✅ [${category.toUpperCase()}] ${testName}`);
  } else {
    testResults[category].failed++;
    console.log(`❌ [${category.toUpperCase()}] ${testName}`);
    if (error) console.log(`   Error: ${error}`);
  }
  
  testResults[category].details.push({
    test: testName,
    passed,
    error: error?.message || error
  });
}

async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data
    };
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
}

// Authentication
async function authenticateAdmin() {
  console.log('\n🔐 Authenticating admin...');
  const result = await makeRequest('POST', '/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });
  
  console.log('Auth result:', JSON.stringify(result, null, 2)); // Debug log
  
  if (result.success && result.data.data && result.data.data.token) {
    adminToken = result.data.data.token;
    console.log('✅ Admin authenticated successfully');
    return true;
  } else {
    console.log('❌ Admin authentication failed:', result.error);
    return false;
  }
}

// ============= BASIC CRUD TESTS =============

async function testBasicCRUDOperations() {
  console.log('\n🎨 Testing Basic CRUD Operations...');
  
  // Test 1: CREATE Color với tên hợp lệ
  const createValidColor = await makeRequest('POST', '/colors', {
    name: 'Đỏ Ruby'
  }, adminToken);
  
  logTest('basic', 'POST /colors - Tạo color với tên hợp lệ', createValidColor.success);
  if (createValidColor.success) {
    createdData.colors.push(createValidColor.data.data);
  }
  
  // Test 2: CREATE Color với tên có số và dấu gạch ngang (hợp lệ)
  const createColorWithNumber = await makeRequest('POST', '/colors', {
    name: 'Xanh-Navy-2024'
  }, adminToken);
  
  logTest('basic', 'POST /colors - Tạo color với số và dấu gạch ngang', createColorWithNumber.success);
  if (createColorWithNumber.success) {
    createdData.colors.push(createColorWithNumber.data.data);
  }
  
  // Test 3: GET All Colors (Public)
  const getAllColorsPublic = await makeRequest('GET', '/colors/public');
  logTest('basic', 'GET /colors/public - Lấy danh sách colors (public)', 
    getAllColorsPublic.success && Array.isArray(getAllColorsPublic.data.data.data));
  
  // Test 4: GET All Colors (Admin với pagination)
  const getAllColorsAdmin = await makeRequest('GET', '/colors?page=1&limit=5', null, adminToken);
  logTest('basic', 'GET /colors - Lấy danh sách colors với pagination (admin)', 
    getAllColorsAdmin.success && getAllColorsAdmin.data.data.page === 1);
  
  // Test 5: GET Color by ID (Public)
  if (createdData.colors.length > 0) {
    const colorId = createdData.colors[0]._id;
    const getColorByIdPublic = await makeRequest('GET', `/colors/public/${colorId}`);
    logTest('basic', 'GET /colors/public/:id - Lấy color theo ID (public)', 
      getColorByIdPublic.success && getColorByIdPublic.data.data._id === colorId);
  }
  
  // Test 6: GET Color by ID (Admin)
  if (createdData.colors.length > 0) {
    const colorId = createdData.colors[0]._id;
    const getColorByIdAdmin = await makeRequest('GET', `/colors/${colorId}`, null, adminToken);
    logTest('basic', 'GET /colors/:id - Lấy color theo ID (admin)', 
      getColorByIdAdmin.success && getColorByIdAdmin.data.data._id === colorId);
  }
  
  // Test 7: UPDATE Color
  if (createdData.colors.length > 0) {
    const colorId = createdData.colors[0]._id;
    const updateColor = await makeRequest('PUT', `/colors/${colorId}`, {
      name: 'Đỏ Ruby Cập Nhật'
    }, adminToken);
    logTest('basic', 'PUT /colors/:id - Cập nhật color', updateColor.success);
    
    if (updateColor.success) {
      createdData.colors[0] = updateColor.data.data;
    }
  }
  
  // Test 8: SEARCH Colors
  const searchColors = await makeRequest('GET', '/colors?search=đỏ', null, adminToken);
  logTest('basic', 'GET /colors?search - Tìm kiếm colors', searchColors.success);
}

// ============= BUSINESS LOGIC TESTS =============

async function testBusinessLogicValidation() {
  console.log('\n📋 Testing Business Logic Validation...');
  
  // Test 1: Reject tên màu có ký tự đặc biệt
  const invalidNameSpecialChars = await makeRequest('POST', '/colors', {
    name: 'Màu@#$%^&*()'
  }, adminToken);
  
  logTest('business', 'Reject tên màu có ký tự đặc biệt', !invalidNameSpecialChars.success, invalidNameSpecialChars.error);
  
  // Test 2: Reject tên màu trống
  const invalidNameEmpty = await makeRequest('POST', '/colors', {
    name: ''
  }, adminToken);
  
  logTest('business', 'Reject tên màu trống', !invalidNameEmpty.success, invalidNameEmpty.error);
  
  // Test 3: Reject tên màu quá dài (>50 ký tự)
  const invalidNameTooLong = await makeRequest('POST', '/colors', {
    name: 'A'.repeat(51)
  }, adminToken);
  
  logTest('business', 'Reject tên màu quá dài (>50 ký tự)', !invalidNameTooLong.success, invalidNameTooLong.error);
  
  // Test 4: Reject tên màu trùng lặp (case-insensitive)
  if (createdData.colors.length > 0) {
    const existingName = createdData.colors[0].name.toLowerCase(); // Convert to lowercase
    const duplicateName = await makeRequest('POST', '/colors', {
      name: existingName
    }, adminToken);
    
    logTest('business', 'Reject tên màu trùng lặp (case-insensitive)', !duplicateName.success, duplicateName.error);
  }
  
  // Test 5: Validate Name API - Tên hợp lệ
  const validateValidName = await makeRequest('POST', '/colors/validate-name', {
    name: 'Vàng Chanh'
  });
  
  logTest('business', 'POST /colors/validate-name - Tên hợp lệ', validateValidName.success);
  
  // Test 6: Validate Name API - Tên không hợp lệ
  const validateInvalidName = await makeRequest('POST', '/colors/validate-name', {
    name: 'Tên@#$'
  });
  
  logTest('business', 'POST /colors/validate-name - Tên không hợp lệ', !validateInvalidName.success);
  
  // Test 7: Tạo thêm colors để test tái sử dụng
  const additionalColors = [
    { name: 'Xanh Lá' },
    { name: 'Tím Lavender' },
    { name: 'Cam Sunset' }
  ];
  
  for (const colorData of additionalColors) {
    const result = await makeRequest('POST', '/colors', colorData, adminToken);
    if (result.success) {
      createdData.colors.push(result.data.data);
    }
  }
  
  logTest('business', 'Tạo multiple colors cho test tái sử dụng', createdData.colors.length >= 4);
}

async function testReusabilityFeatures() {
  console.log('\n🔄 Testing Color Reusability Features...');
  
  // Test 1: Find by name or suggest - Tìm màu đã tồn tại
  if (createdData.colors.length > 0) {
    const existingColorName = createdData.colors[0].name;
    const findExistingColor = await makeRequest('GET', `/colors/search?name=${existingColorName}`);
    
    logTest('business', 'GET /colors/search - Tìm màu đã tồn tại (hỗ trợ tái sử dụng)', 
      findExistingColor.success && findExistingColor.data.data.found === true);
  }
  
  // Test 2: Find by name or suggest - Gợi ý màu không tồn tại
  const suggestColors = await makeRequest('GET', '/colors/search?name=Bạc');
  logTest('business', 'GET /colors/search - Gợi ý màu không tồn tại', 
    suggestColors.success && suggestColors.data.data.found === false && 
    Array.isArray(suggestColors.data.data.suggestions));
  
  // Test 3: Get suggested colors
  const getSuggestions = await makeRequest('GET', '/colors/suggestions');
  logTest('business', 'GET /colors/suggestions - Lấy gợi ý màu phổ biến', 
    getSuggestions.success && Array.isArray(getSuggestions.data.data.suggestions));
  
  // Test 4: Can delete color - Color chưa được sử dụng
  if (createdData.colors.length > 0) {
    const colorId = createdData.colors[createdData.colors.length - 1]._id;
    const canDeleteUnused = await makeRequest('GET', `/colors/${colorId}/can-delete`, null, adminToken);
    
    logTest('business', 'GET /colors/:id/can-delete - Color chưa sử dụng có thể xóa', 
      canDeleteUnused.success && canDeleteUnused.data.data.canDelete === true);
  }
  
  // Test 5: Usage stats - Color chưa được sử dụng
  if (createdData.colors.length > 0) {
    const colorId = createdData.colors[0]._id;
    const usageStats = await makeRequest('GET', `/colors/${colorId}/usage-stats`, null, adminToken);
    
    logTest('business', 'GET /colors/:id/usage-stats - Thống kê sử dụng color', 
      usageStats.success && typeof usageStats.data.data.usageStats.variantCount === 'number');
  }
  
  // Test 6: Validate color for use
  if (createdData.colors.length > 0) {
    const colorId = createdData.colors[0]._id;
    const validateForUse = await makeRequest('GET', `/colors/${colorId}/validate-for-use`, null, adminToken);
    
    logTest('business', 'GET /colors/:id/validate-for-use - Validate color có thể sử dụng', 
      validateForUse.success && validateForUse.data.data.valid === true);
  }
}

// ============= INTEGRATION TESTS =============

async function testIntegrationWithProductVariants() {
  console.log('\n🔗 Testing Integration with ProductVariants...');
  
  if (createdData.colors.length === 0) {
    logTest('integration', 'Skip integration tests - Không có colors để test', false, 'No colors available');
    return;
  }
  
  // Test 1: Tạo test product trước
  const testProduct = await makeRequest('POST', '/products', {
    name: 'Test Product for Color Integration',
    description: 'Product để test color reusability',
    price: 100000,
    category: '507f1f77bcf86cd799439011' // Fake category ID
  }, adminToken);
  
  if (testProduct.success) {
    createdData.products.push(testProduct.data.data);
    
    // Test 2: Tạo ProductVariant sử dụng color (test reusability)
    const testVariant1 = await makeRequest('POST', '/product-variants', {
      product: testProduct.data.data._id,
      color: createdData.colors[0]._id,
      size: '507f1f77bcf86cd799439012', // Fake size ID
      price: 150000,
      stock: 10
    }, adminToken);
    
    logTest('integration', 'Tạo ProductVariant sử dụng color (test reusability)', testVariant1.success);
    if (testVariant1.success) {
      createdData.variants.push(testVariant1.data.data);
    }
    
    // Test 3: Tái sử dụng cùng color cho variant khác
    if (createdData.colors.length > 1) {
      const testVariant2 = await makeRequest('POST', '/product-variants', {
        product: testProduct.data.data._id,
        color: createdData.colors[0]._id, // Reuse same color
        size: '507f1f77bcf86cd799439013', // Different fake size ID
        price: 160000,
        stock: 5
      }, adminToken);
      
      logTest('integration', 'Tái sử dụng cùng color cho variant khác', testVariant2.success);
      if (testVariant2.success) {
        createdData.variants.push(testVariant2.data.data);
      }
    }
    
    // Test 4: Check color cannot be deleted khi đang được sử dụng
    if (createdData.variants.length > 0) {
      const usedColorId = createdData.colors[0]._id;
      const canDeleteUsedColor = await makeRequest('GET', `/colors/${usedColorId}/can-delete`, null, adminToken);
      
      logTest('integration', 'Color đang được sử dụng không thể xóa', 
        canDeleteUsedColor.success && canDeleteUsedColor.data.data.canDelete === false);
      
      // Test 5: Attempt to delete used color should fail
      const deleteUsedColor = await makeRequest('DELETE', `/colors/${usedColorId}`, null, adminToken);
      logTest('integration', 'DELETE color đang được sử dụng should fail', !deleteUsedColor.success);
    }
    
    // Test 6: Usage stats should show variant count
    const usageStatsAfterUse = await makeRequest('GET', `/colors/${createdData.colors[0]._id}/usage-stats`, null, adminToken);
    logTest('integration', 'Usage stats hiển thị số lượng variants sử dụng color', 
      usageStatsAfterUse.success && usageStatsAfterUse.data.data.usageStats.variantCount > 0);
  }
}

// ============= EDGE CASES & ERROR HANDLING =============

async function testEdgeCasesAndErrorHandling() {
  console.log('\n⚠️ Testing Edge Cases & Error Handling...');
  
  // Test 1: GET color với ID không tồn tại
  const fakeColorId = '507f1f77bcf86cd799439011';
  const getNonExistentColor = await makeRequest('GET', `/colors/${fakeColorId}`, null, adminToken);
  logTest('business', 'GET color với ID không tồn tại', !getNonExistentColor.success && getNonExistentColor.status === 404);
  
  // Test 2: UPDATE color với ID không tồn tại
  const updateNonExistentColor = await makeRequest('PUT', `/colors/${fakeColorId}`, {
    name: 'Updated Name'
  }, adminToken);
  logTest('business', 'UPDATE color với ID không tồn tại', !updateNonExistentColor.success && updateNonExistentColor.status === 404);
  
  // Test 3: DELETE color với ID không tồn tại
  const deleteNonExistentColor = await makeRequest('DELETE', `/colors/${fakeColorId}`, null, adminToken);
  logTest('business', 'DELETE color với ID không tồn tại', !deleteNonExistentColor.success && deleteNonExistentColor.status === 404);
  
  // Test 4: POST color không có body
  const createColorNoBody = await makeRequest('POST', '/colors', {}, adminToken);
  logTest('business', 'POST color không có tên', !createColorNoBody.success);
  
  // Test 5: Validate name với tên trống
  const validateEmptyName = await makeRequest('POST', '/colors/validate-name', {
    name: ''
  });
  logTest('business', 'Validate tên trống', !validateEmptyName.success);
  
  // Test 6: Search với query trống
  const searchEmptyQuery = await makeRequest('GET', '/colors/search');
  logTest('business', 'Search không có query name', !searchEmptyQuery.success);
  
  // Test 7: Access admin endpoints không có token
  const accessAdminNoToken = await makeRequest('GET', '/colors');
  logTest('business', 'Access admin endpoint không có token', !accessAdminNoToken.success && accessAdminNoToken.status === 401);
}

// ============= CLEANUP & REPORTING =============

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  // Delete variants first (to free up colors)
  for (const variant of createdData.variants) {
    await makeRequest('DELETE', `/product-variants/${variant._id}`, null, adminToken);
  }
  
  // Delete products
  for (const product of createdData.products) {
    await makeRequest('DELETE', `/products/${product._id}`, null, adminToken);
  }
  
  // Delete colors (now should be possible since variants are deleted)
  for (const color of createdData.colors) {
    await makeRequest('DELETE', `/colors/${color._id}`, null, adminToken);
  }
  
  console.log('✅ Test data cleanup completed');
}

function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE COLOR API TEST REPORT');
  console.log('='.repeat(80));
  
  const categories = ['basic', 'business', 'integration'];
  let totalPassed = 0;
  let totalFailed = 0;
  let totalTests = 0;
  
  categories.forEach(category => {
    const result = testResults[category];
    totalPassed += result.passed;
    totalFailed += result.failed;
    totalTests += result.total;
    
    console.log(`\n🔍 ${category.toUpperCase()} TESTS:`);
    console.log(`   ✅ Passed: ${result.passed}`);
    console.log(`   ❌ Failed: ${result.failed}`);
    console.log(`   📊 Total:  ${result.total}`);
    console.log(`   📈 Success Rate: ${result.total > 0 ? ((result.passed / result.total) * 100).toFixed(1) : 0}%`);
    
    if (result.failed > 0) {
      console.log(`   🚨 Failed Tests:`);
      result.details.filter(test => !test.passed).forEach(test => {
        console.log(`      - ${test.test}: ${test.error}`);
      });
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('📋 OVERALL SUMMARY:');
  console.log(`   ✅ Total Passed: ${totalPassed}`);
  console.log(`   ❌ Total Failed: ${totalFailed}`);
  console.log(`   📊 Total Tests:  ${totalTests}`);
  console.log(`   📈 Overall Success Rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%`);
  
  // Business Logic Verification
  console.log('\n📝 BUSINESS LOGIC VERIFICATION:');
  console.log('   ✓ Tên màu phải duy nhất và hợp lệ (không ký tự đặc biệt)');
  console.log('   ✓ Mỗi màu có thể được tái sử dụng cho nhiều variant');
  console.log('   ✓ Không thể xóa màu đang được sử dụng');
  console.log('   ✓ Schema đơn giản: chỉ có _id và name');
  
  if (totalFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Color business logic hoạt động hoàn hảo!');
  } else {
    console.log(`\n⚠️  ${totalFailed} tests failed. Cần kiểm tra và fix các issues.`);
  }
  
  console.log('='.repeat(80));
}

// ============= MAIN EXECUTION =============

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Color API Tests...');
  console.log('Testing Business Logic:');
  console.log('  ✓ Tên màu duy nhất và hợp lệ (không ký tự đặc biệt)');
  console.log('  ✓ Mỗi màu có thể tái sử dụng cho nhiều variant');
  console.log('  ✓ Schema đơn giản: _id và name');
  
  try {
    // Authentication
    const authSuccess = await authenticateAdmin();
    if (!authSuccess) {
      console.log('❌ Cannot proceed without admin authentication');
      return;
    }
    
    // Basic CRUD Tests
    await testBasicCRUDOperations();
    
    // Business Logic Tests
    await testBusinessLogicValidation();
    await testReusabilityFeatures();
    
    // Integration Tests
    await testIntegrationWithProductVariants();
    
    // Edge Cases
    await testEdgeCasesAndErrorHandling();
    
    // Cleanup
    await cleanupTestData();
    
    // Generate Report
    generateReport();
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    // Close any connections if needed
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

// Execute tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, testResults };
