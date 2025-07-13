const axios = require('axios');

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

async function testCartAndWishlist() {
  console.log('🛒 CART & WISHLIST BUSINESS LOGIC TESTS');
  console.log('=======================================');
  
  let adminToken = null;
  let userToken = null;
  let testCategoryId = null;
  let testProductId = null;
  let testVariantId = null;

  try {
    // Setup: Admin login
    console.log('\n1. Admin Login...');
    const adminLogin = await apiRequest('POST', '/auth/login', {
      email: 'admin@example.com',
      password: 'password123'
    });
    
    if (!adminLogin.success) {
      console.log('❌ Admin login failed:', adminLogin.error);
      console.log('   Status:', adminLogin.status);
      console.log('   Data:', adminLogin.data);
      return;
    }
    adminToken = adminLogin.data?.data?.token || adminLogin.data?.token;
    console.log('✅ Admin logged in');

    // Setup: User registration & login
    console.log('\n2. User Setup...');
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
    
    if (!userLogin.success) {
      console.log('❌ User login failed');
      return;
    }
    userToken = userLogin.data?.data?.token || userLogin.data?.token;
    console.log('✅ User registered and logged in');

    // Setup: Get category
    console.log('\n3. Getting Category...');
    const categories = await apiRequest('GET', '/categories', null, adminToken);
    if (!categories.success || !categories.data?.data?.data?.length) {
      console.log('❌ No categories found');
      return;
    }
    testCategoryId = categories.data.data.data[0]._id;
    console.log('✅ Got category:', testCategoryId);

    // Setup: Create product with variant
    console.log('\n4. Creating Test Product...');
    const product = await apiRequest('POST', '/products', {
      name: 'Test Product for Cart',
      price: 100000,
      category: testCategoryId,
      description: 'Test product for cart testing'
    }, adminToken);
    
    if (!product.success) {
      console.log('❌ Product creation failed:', product.error);
      return;
    }
    testProductId = product.data.data._id;
    console.log('✅ Product created:', testProductId);

    // Setup: Get colors and sizes for variant
    console.log('\n5. Getting Colors and Sizes...');
    const colors = await apiRequest('GET', '/colors', null, adminToken);
    const sizes = await apiRequest('GET', '/sizes', null, adminToken);
    
    if (!colors.success || !sizes.success) {
      console.log('❌ Could not get colors/sizes');
      return;
    }
    
    const colorId = colors.data.data.data[0]._id;
    const sizeId = sizes.data.data.data[0]._id;

    // Setup: Create variant with low stock
    console.log('\n6. Creating Product Variant...');
    const variant = await apiRequest('POST', '/product-variants', {
      product: testProductId,
      color: colorId,
      size: sizeId,
      stock: 1,  // Low stock for testing
      price: 90000
    }, adminToken);
    
    if (!variant.success) {
      console.log('❌ Variant creation failed:', variant.error);
      return;
    }
    testVariantId = variant.data.data._id;
    console.log('✅ Variant created with stock 1:', testVariantId);

    // Test 1: Add variant to cart (should work)
    console.log('\n7. Testing Cart - Add In-Stock Item...');
    const addToCart1 = await apiRequest('POST', '/cart/items', {
      productVariant: testVariantId,
      quantity: 1
    }, userToken);
    
    if (addToCart1.success) {
      console.log('✅ Added in-stock item to cart successfully');
    } else {
      console.log('❌ Failed to add in-stock item:', addToCart1.error);
    }

    // Test 2: Update variant to 0 stock
    console.log('\n8. Making Variant Out of Stock...');
    const updateVariant = await apiRequest('PUT', `/product-variants/${testVariantId}`, {
      stock: 0
    }, adminToken);
    
    if (updateVariant.success) {
      console.log('✅ Variant updated to 0 stock');
    } else {
      console.log('❌ Failed to update variant stock');
      return;
    }

    // Test 3: Try to add out-of-stock variant to cart (should fail)
    console.log('\n9. Testing Cart - Block Out-of-Stock Item...');
    const addToCart2 = await apiRequest('POST', '/cart/items', {
      productVariant: testVariantId,
      quantity: 1
    }, userToken);
    
    if (!addToCart2.success && addToCart2.error?.includes('stock')) {
      console.log('✅ Cart correctly blocked out-of-stock item');
    } else {
      console.log('❌ Cart did NOT block out-of-stock item');
    }

    // Test 4: Try to add out-of-stock variant to wishlist (should work)
    console.log('\n10. Testing Wishlist - Allow Out-of-Stock Item...');
    const addToWishlist = await apiRequest('POST', '/wishlist', {
      productId: testProductId
    }, userToken);
    
    if (addToWishlist.success) {
      console.log('✅ Wishlist correctly allowed out-of-stock product');
    } else {
      console.log('❌ Wishlist blocked product:', addToWishlist.error);
      console.log('   Debug - User token valid?', !!userToken);
      console.log('   Debug - Response data:', addToWishlist.data);
    }

    // Cleanup
    console.log('\n11. Cleanup...');
    await apiRequest('DELETE', `/products/${testProductId}`, null, adminToken);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 ALL CART & WISHLIST TESTS COMPLETED!');

  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

testCartAndWishlist().then(() => {
  console.log('\n✨ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
