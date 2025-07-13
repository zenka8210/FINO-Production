const axios = require('axios');
const chalk = require('chalk');

const BASE_URL = 'http://localhost:5000/api';

async function apiRequest(method, url, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
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
      error: error.response?.data?.message || error.message,
      status: error.response?.status,
      data: error.response?.data
    };
  }
}

async function testAllProductEndpoints() {
  console.log(chalk.blue('🧪 === COMPREHENSIVE PRODUCT API ENDPOINTS TEST ==='));
  console.log(chalk.blue('Kiểm tra tất cả endpoints của Product API'));
  console.log('='.repeat(60));
  
  let adminToken = null;
  let userToken = null;
  let testCategoryId = null;
  let testProductId = null;
  let testVariantId = null;
  let testColorId = null;
  let testSizeId = null;
  
  const results = {
    // Public endpoints
    'GET /products/public': '❌',
    'GET /products/public-display': '❌',
    'GET /products/available': '❌',
    'GET /products/check-availability/:id': '❌',
    'GET /products/check-variant-stock/:variantId': '❌',
    'POST /products/validate-cart': '❌',
    'GET /products/:id/validate-display': '❌',
    'POST /products/check-add-to-cart': '❌',
    'GET /products/category/:categoryId/public': '❌',
    
    // Query Middleware endpoints
    'GET /products/public?page=1&limit=5': '❌',
    'GET /products/public?search=shirt': '❌',
    'GET /products/public?sort=price&order=asc': '❌',
    'GET /products/public?filter[category]=electronics': '❌',
    'GET /products/public?filter[price][min]=100000': '❌',
    'GET /products/available?page=1&limit=3': '❌',
    
    // Admin endpoints
    'GET /products (admin)': '❌',
    'GET /products/:id (admin)': '❌',
    'POST /products (admin)': '❌',
    'PUT /products/:id (admin)': '❌',
    'DELETE /products/:id (admin)': '❌',
    'GET /products/admin/out-of-stock': '❌',
    'GET /products/admin/out-of-stock-notification': '❌',
    'GET /products/:id/validate-display-admin': '❌',
    
    // Admin Query Middleware endpoints
    'GET /products?page=1&limit=5 (admin)': '❌',
    'GET /products?search=product&sort=name (admin)': '❌',
    'GET /products?filter[category]=electronics (admin)': '❌'
  };

  try {
    // ========== SETUP ==========
    console.log(chalk.yellow('\n📝 SETUP: Authentication & Test Data'));
    
    // Admin login
    const adminLogin = await apiRequest('POST', '/auth/login', {
      email: 'admin@example.com',
      password: 'password123'
    });
    
    if (!adminLogin.success) {
      console.log(chalk.red('❌ Cannot continue - admin login failed'));
      return;
    }
    adminToken = adminLogin.data?.data?.token || adminLogin.data?.token;
    console.log(chalk.green('✅ Admin logged in'));

    // User login
    const userEmail = `testuser_${Date.now()}@example.com`;
    await apiRequest('POST', '/auth/register', {
      email: userEmail,
      password: 'password123',
      name: 'Test User'
    });
    const userLogin = await apiRequest('POST', '/auth/login', {
      email: userEmail,
      password: 'password123'
    });
    userToken = userLogin.data?.data?.token || userLogin.data?.token;
    console.log(chalk.green('✅ User logged in'));

    // Get test data
    const categories = await apiRequest('GET', '/categories', null, adminToken);
    testCategoryId = categories.data?.data?.data?.[0]?._id;
    
    const colors = await apiRequest('GET', '/colors', null, adminToken);
    testColorId = colors.data?.data?.data?.[0]?._id;
    
    const sizes = await apiRequest('GET', '/sizes', null, adminToken);
    testSizeId = sizes.data?.data?.data?.[0]?._id;
    
    console.log(chalk.green('✅ Got test category, color, and size'));

    // ========== PUBLIC ENDPOINTS ==========
    console.log(chalk.yellow('\n🌐 === TESTING PUBLIC ENDPOINTS ==='));

    // Test 1: GET /products/public
    console.log(chalk.cyan('\n1. Testing GET /products/public'));
    const publicProducts = await apiRequest('GET', '/products/public');
    if (publicProducts.success) {
      results['GET /products/public'] = '✅';
      console.log(chalk.green('   ✅ Success - Found products:'), publicProducts.data?.data?.total || 0);
    } else {
      console.log(chalk.red('   ❌ Failed:'), publicProducts.error);
    }

    // Test 2: GET /products/public-display
    console.log(chalk.cyan('\n2. Testing GET /products/public-display'));
    const publicDisplay = await apiRequest('GET', '/products/public-display');
    if (publicDisplay.success) {
      results['GET /products/public-display'] = '✅';
      console.log(chalk.green('   ✅ Success - Products with stock info'));
    } else {
      console.log(chalk.red('   ❌ Failed:'), publicDisplay.error);
    }

    // Test 3: GET /products/available
    console.log(chalk.cyan('\n3. Testing GET /products/available'));
    const availableProducts = await apiRequest('GET', '/products/available');
    if (availableProducts.success) {
      results['GET /products/available'] = '✅';
      console.log(chalk.green('   ✅ Success - Available products'));
    } else {
      console.log(chalk.red('   ❌ Failed:'), availableProducts.error);
    }

    // ========== ADMIN ENDPOINTS ==========
    console.log(chalk.yellow('\n🔐 === TESTING ADMIN ENDPOINTS ==='));

    // Test 4: POST /products (Create Product)
    console.log(chalk.cyan('\n4. Testing POST /products (Create Product)'));
    const createProduct = await apiRequest('POST', '/products', {
      name: 'Test Product API Endpoint',
      price: 200000,
      description: 'Product created for API testing',
      category: testCategoryId,
      images: ['test-image.jpg']
    }, adminToken);
    
    if (createProduct.success) {
      testProductId = createProduct.data.data._id;
      results['POST /products (admin)'] = '✅';
      console.log(chalk.green('   ✅ Success - Product created:'), testProductId);
    } else {
      console.log(chalk.red('   ❌ Failed:'), createProduct.error);
    }

    // Test 5: GET /products (Admin - All Products)
    console.log(chalk.cyan('\n5. Testing GET /products (Admin)'));
    const adminProducts = await apiRequest('GET', '/products', null, adminToken);
    if (adminProducts.success) {
      results['GET /products (admin)'] = '✅';
      console.log(chalk.green('   ✅ Success - Admin products list'));
    } else {
      console.log(chalk.red('   ❌ Failed:'), adminProducts.error);
    }

    // Test 6: GET /products/:id (Admin)
    if (testProductId) {
      console.log(chalk.cyan('\n6. Testing GET /products/:id (Admin)'));
      const productById = await apiRequest('GET', `/products/${testProductId}`, null, adminToken);
      if (productById.success) {
        results['GET /products/:id (admin)'] = '✅';
        console.log(chalk.green('   ✅ Success - Product details'));
      } else {
        console.log(chalk.red('   ❌ Failed:'), productById.error);
      }
    }

    // Test 7: PUT /products/:id (Update Product)
    if (testProductId) {
      console.log(chalk.cyan('\n7. Testing PUT /products/:id (Update Product)'));
      const updateProduct = await apiRequest('PUT', `/products/${testProductId}`, {
        name: 'Updated Test Product API',
        price: 250000,
        description: 'Updated product description',
        category: testCategoryId  // Include category in update
      }, adminToken);
      
      if (updateProduct.success) {
        results['PUT /products/:id (admin)'] = '✅';
        console.log(chalk.green('   ✅ Success - Product updated'));
      } else {
        console.log(chalk.red('   ❌ Failed:'), updateProduct.error);
      }
    }

    // Create a test variant for stock-related tests
    if (testProductId && testColorId && testSizeId) {
      console.log(chalk.cyan('\n📦 Creating test variant for stock tests...'));
      const createVariant = await apiRequest('POST', '/product-variants', {
        product: testProductId,
        color: testColorId,
        size: testSizeId,
        stock: 10,  // In stock
        price: 230000
      }, adminToken);
      
      if (createVariant.success) {
        testVariantId = createVariant.data.data._id;
        console.log(chalk.green('   ✅ Test variant created'));
      }
    }

    // Test 8: GET /products/check-availability/:id
    if (testProductId) {
      console.log(chalk.cyan('\n8. Testing GET /products/check-availability/:id'));
      const checkAvailability = await apiRequest('GET', `/products/check-availability/${testProductId}`);
      if (checkAvailability.success) {
        results['GET /products/check-availability/:id'] = '✅';
        console.log(chalk.green('   ✅ Success - Availability checked'));
      } else {
        console.log(chalk.red('   ❌ Failed:'), checkAvailability.error);
      }
    }

    // Test 9: GET /products/check-variant-stock/:variantId
    if (testVariantId) {
      console.log(chalk.cyan('\n9. Testing GET /products/check-variant-stock/:variantId'));
      const checkVariantStock = await apiRequest('GET', `/products/check-variant-stock/${testVariantId}?quantity=5`);
      if (checkVariantStock.success) {
        results['GET /products/check-variant-stock/:variantId'] = '✅';
        console.log(chalk.green('   ✅ Success - Variant stock checked'));
      } else {
        console.log(chalk.red('   ❌ Failed:'), checkVariantStock.error);
      }
    }

    // Test 10: POST /products/validate-cart
    if (testVariantId) {
      console.log(chalk.cyan('\n10. Testing POST /products/validate-cart'));
      const validateCart = await apiRequest('POST', '/products/validate-cart', {
        items: [
          { variantId: testVariantId, quantity: 2 }
        ]
      });
      if (validateCart.success) {
        results['POST /products/validate-cart'] = '✅';
        console.log(chalk.green('   ✅ Success - Cart validated'));
      } else {
        console.log(chalk.red('   ❌ Failed:'), validateCart.error);
      }
    }

    // Test 11: GET /products/:id/validate-display
    if (testProductId) {
      console.log(chalk.cyan('\n11. Testing GET /products/:id/validate-display'));
      const validateDisplay = await apiRequest('GET', `/products/${testProductId}/validate-display`);
      if (validateDisplay.success) {
        results['GET /products/:id/validate-display'] = '✅';
        console.log(chalk.green('   ✅ Success - Display validation'));
      } else {
        console.log(chalk.red('   ❌ Failed:'), validateDisplay.error);
      }
    }

    // Test 12: POST /products/check-add-to-cart
    if (testVariantId) {
      console.log(chalk.cyan('\n12. Testing POST /products/check-add-to-cart'));
      const checkAddToCart = await apiRequest('POST', '/products/check-add-to-cart', {
        variantId: testVariantId,
        quantity: 1
      });
      if (checkAddToCart.success) {
        results['POST /products/check-add-to-cart'] = '✅';
        console.log(chalk.green('   ✅ Success - Add to cart check'));
      } else {
        console.log(chalk.red('   ❌ Failed:'), checkAddToCart.error);
      }
    }

    // Test 13: GET /products/category/:categoryId/public
    if (testCategoryId) {
      console.log(chalk.cyan('\n13. Testing GET /products/category/:categoryId/public'));
      const categoryProducts = await apiRequest('GET', `/products/category/${testCategoryId}/public`);
      if (categoryProducts.success) {
        results['GET /products/category/:categoryId/public'] = '✅';
        console.log(chalk.green('   ✅ Success - Category products'));
      } else {
        console.log(chalk.red('   ❌ Failed:'), categoryProducts.error);
      }
    }

    // Test 14: GET /products/admin/out-of-stock
    console.log(chalk.cyan('\n14. Testing GET /products/admin/out-of-stock'));
    const outOfStock = await apiRequest('GET', '/products/admin/out-of-stock', null, adminToken);
    if (outOfStock.success) {
      results['GET /products/admin/out-of-stock'] = '✅';
      console.log(chalk.green('   ✅ Success - Out of stock products'));
    } else {
      console.log(chalk.red('   ❌ Failed:'), outOfStock.error);
    }

    // Test 15: GET /products/admin/out-of-stock-notification
    console.log(chalk.cyan('\n15. Testing GET /products/admin/out-of-stock-notification'));
    const outOfStockNotification = await apiRequest('GET', '/products/admin/out-of-stock-notification', null, adminToken);
    if (outOfStockNotification.success) {
      results['GET /products/admin/out-of-stock-notification'] = '✅';
      console.log(chalk.green('   ✅ Success - Out of stock notification'));
    } else {
      console.log(chalk.red('   ❌ Failed:'), outOfStockNotification.error);
    }

    // Test 16: GET /products/:id/validate-display-admin
    if (testProductId) {
      console.log(chalk.cyan('\n16. Testing GET /products/:id/validate-display-admin'));
      const validateDisplayAdmin = await apiRequest('GET', `/products/${testProductId}/validate-display-admin`, null, adminToken);
      if (validateDisplayAdmin.success) {
        results['GET /products/:id/validate-display-admin'] = '✅';
        console.log(chalk.green('   ✅ Success - Admin display validation'));
      } else {
        console.log(chalk.red('   ❌ Failed:'), validateDisplayAdmin.error);
      }
    }

    // Test 17: DELETE /products/:id (should be last)
    if (testProductId) {
      console.log(chalk.cyan('\n17. Testing DELETE /products/:id'));
      
      // First delete the test variant to allow product deletion
      if (testVariantId) {
        await apiRequest('DELETE', `/product-variants/${testVariantId}`, null, adminToken);
        console.log(chalk.green('   ✅ Test variant cleaned up'));
      }
      
      const deleteProduct = await apiRequest('DELETE', `/products/${testProductId}`, null, adminToken);
      if (deleteProduct.success) {
        results['DELETE /products/:id (admin)'] = '✅';
        console.log(chalk.green('   ✅ Success - Product deleted'));
      } else {
        console.log(chalk.red('   ❌ Failed:'), deleteProduct.error);
      }
    }

  } catch (error) {
    console.error(chalk.red('💥 Unexpected error:'), error.message);
  }

  // ========== RESULTS ==========
  console.log(chalk.blue('\n📊 === API ENDPOINTS TEST RESULTS ==='));
  console.log(chalk.blue('Public Endpoints:'));
  Object.entries(results).forEach(([endpoint, status]) => {
    if (!endpoint.includes('(admin)')) {
      console.log(`${status} ${endpoint}`);
    }
  });
  
  console.log(chalk.blue('\nAdmin Endpoints:'));
  Object.entries(results).forEach(([endpoint, status]) => {
    if (endpoint.includes('(admin)')) {
      console.log(`${status} ${endpoint}`);
    }
  });
  
  const passed = Object.values(results).filter(r => r === '✅').length;
  const total = Object.keys(results).length;
  const percentage = Math.round(passed/total*100);
  
  console.log(chalk.blue('\n🎯 === SUMMARY ==='));
  console.log(chalk.cyan(`Passed: ${passed}/${total} endpoints (${percentage}%)`));
  
  if (percentage === 100) {
    console.log(chalk.green('🎉 EXCELLENT: All Product API endpoints are working perfectly!'));
  } else if (percentage >= 90) {
    console.log(chalk.yellow('⚠️  GOOD: Most endpoints working, minor issues to fix'));
  } else if (percentage >= 70) {
    console.log(chalk.yellow('⚠️  FAIR: Several endpoints need attention'));
  } else {
    console.log(chalk.red('❌ POOR: Many endpoints need fixing'));
  }
  
  return { passed, total, percentage, results };
}

// Run the comprehensive test
if (require.main === module) {
  testAllProductEndpoints().then(() => {
    console.log(chalk.blue('\n✨ Comprehensive API testing completed'));
    process.exit(0);
  }).catch(error => {
    console.error(chalk.red('💥 Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = { testAllProductEndpoints };
