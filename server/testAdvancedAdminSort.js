/**
 * @fileoverview Advanced Admin Sort Testing
 * @description Advanced testing for admin sort functionality with detailed validation
 * @author DATN Project
 * @version 1.0.0
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'password123'
};

let authToken = null;

/**
 * Login and get admin token
 */
async function loginAdmin() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    if (response.data.success && response.data.data.token) {
      authToken = response.data.data.token;
      return true;
    }
    return false;
  } catch (error) {
    console.log('❌ Admin login error:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test detailed sorting for a specific endpoint
 */
async function testDetailedSorting(endpoint, model) {
  console.log(`\n🔍 Testing detailed sorting for ${model}...`);
  
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  try {
    // Test 1: Default sort (createdAt DESC)
    console.log('  Test 1: Default sort validation');
    const response1 = await axios.get(`${BASE_URL}${endpoint}?limit=10`, { headers });
    
    if (response1.data.success) {
      const data = response1.data.data;
      const items = Array.isArray(data) ? data : (data.data || data.documents || []);
      
      if (items.length >= 2) {
        let sortCorrect = true;
        for (let i = 0; i < items.length - 1; i++) {
          const current = new Date(items[i].createdAt);
          const next = new Date(items[i + 1].createdAt);
          
          if (current < next) {
            sortCorrect = false;
            break;
          }
        }
        
        if (sortCorrect) {
          console.log('    ✅ Default sort (createdAt DESC) is correct');
        } else {
          console.log('    ❌ Default sort (createdAt DESC) is incorrect');
        }
      } else {
        console.log('    ⚠️  Not enough items to validate sorting');
      }
    }

    // Test 2: Explicit ASC sort
    console.log('  Test 2: Explicit ASC sort validation');
    const response2 = await axios.get(`${BASE_URL}${endpoint}?sortBy=createdAt&sortOrder=asc&limit=10`, { headers });
    
    if (response2.data.success) {
      const data = response2.data.data;
      const items = Array.isArray(data) ? data : (data.data || data.documents || []);
      
      if (items.length >= 2) {
        let sortCorrect = true;
        for (let i = 0; i < items.length - 1; i++) {
          const current = new Date(items[i].createdAt);
          const next = new Date(items[i + 1].createdAt);
          
          if (current > next) {
            sortCorrect = false;
            break;
          }
        }
        
        if (sortCorrect) {
          console.log('    ✅ Explicit ASC sort is correct');
        } else {
          console.log('    ❌ Explicit ASC sort is incorrect');
        }
      } else {
        console.log('    ⚠️  Not enough items to validate sorting');
      }
    }

    // Test 3: UpdatedAt sort
    console.log('  Test 3: UpdatedAt sort validation');
    const response3 = await axios.get(`${BASE_URL}${endpoint}?sortBy=updatedAt&sortOrder=desc&limit=10`, { headers });
    
    if (response3.data.success) {
      const data = response3.data.data;
      const items = Array.isArray(data) ? data : (data.data || data.documents || []);
      
      if (items.length >= 2) {
        let sortCorrect = true;
        for (let i = 0; i < items.length - 1; i++) {
          const current = new Date(items[i].updatedAt);
          const next = new Date(items[i + 1].updatedAt);
          
          if (current < next) {
            sortCorrect = false;
            break;
          }
        }
        
        if (sortCorrect) {
          console.log('    ✅ UpdatedAt DESC sort is correct');
        } else {
          console.log('    ❌ UpdatedAt DESC sort is incorrect');
        }
      } else {
        console.log('    ⚠️  Not enough items to validate sorting');
      }
    }

    // Test 4: JSON sort format
    console.log('  Test 4: JSON sort format validation');
    const sortJson = JSON.stringify({ createdAt: 1, updatedAt: -1 });
    const response4 = await axios.get(`${BASE_URL}${endpoint}?sort=${encodeURIComponent(sortJson)}&limit=10`, { headers });
    
    if (response4.data.success) {
      console.log('    ✅ JSON sort format accepted');
    } else {
      console.log('    ❌ JSON sort format rejected');
    }

    // Test 5: Multiple sort fields
    console.log('  Test 5: Multiple sort fields validation');
    const response5 = await axios.get(`${BASE_URL}${endpoint}?sort=createdAt:asc,updatedAt:desc&limit=10`, { headers });
    
    if (response5.data.success) {
      console.log('    ✅ Multiple sort fields accepted');
    } else {
      console.log('    ❌ Multiple sort fields rejected');
    }

    return true;
  } catch (error) {
    console.log(`    ❌ Error testing ${model}:`, error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test performance of sorting
 */
async function testSortPerformance(endpoint, model) {
  console.log(`\n⚡ Testing sort performance for ${model}...`);
  
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  try {
    const startTime = Date.now();
    
    // Test with larger dataset
    const response = await axios.get(`${BASE_URL}${endpoint}?limit=50`, { headers });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.data.success) {
      const data = response.data.data;
      const items = Array.isArray(data) ? data : (data.data || data.documents || []);
      
      console.log(`    ✅ Retrieved ${items.length} items in ${duration}ms`);
      
      if (duration > 1000) {
        console.log(`    ⚠️  Performance warning: Query took ${duration}ms`);
      } else {
        console.log(`    ✅ Performance good: Query took ${duration}ms`);
      }
    }

    return true;
  } catch (error) {
    console.log(`    ❌ Performance test failed for ${model}:`, error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Run comprehensive admin sort tests
 */
async function runComprehensiveTests() {
  console.log('🚀 Running Comprehensive Admin Sort Tests...\n');
  
  const loginSuccess = await loginAdmin();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without admin login');
    return;
  }

  const testEndpoints = [
    { path: '/products', model: 'Product' },
    { path: '/categories', model: 'Category' },
    { path: '/cart/admin/all', model: 'Cart' },
    { path: '/vouchers', model: 'Voucher' },
    { path: '/wishlist/admin/all', model: 'WishList' }
  ];

  let passedTests = 0;
  let totalTests = 0;

  // Detailed sorting tests
  console.log('📊 DETAILED SORTING TESTS');
  console.log('=' * 50);
  
  for (const endpoint of testEndpoints) {
    totalTests++;
    const success = await testDetailedSorting(endpoint.path, endpoint.model);
    if (success) passedTests++;
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Performance tests
  console.log('\n⚡ PERFORMANCE TESTS');
  console.log('=' * 50);
  
  for (const endpoint of testEndpoints) {
    totalTests++;
    const success = await testSortPerformance(endpoint.path, endpoint.model);
    if (success) passedTests++;
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Summary
  console.log('\n📋 COMPREHENSIVE TEST SUMMARY');
  console.log('=' * 50);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${totalTests - passedTests}`);
  console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All comprehensive tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }
}

// If running directly, execute comprehensive tests
if (require.main === module) {
  runComprehensiveTests();
}

module.exports = {
  runComprehensiveTests,
  testDetailedSorting,
  testSortPerformance
};
