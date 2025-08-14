// Test script for PersonalizedProductsSection
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testPersonalizedProductsAPI() {
  try {
    console.log('🧪 Testing Personalized Products API...');
    
    // Test without authentication (guest user)
    console.log('\n1. Testing as guest user:');
    const guestResponse = await axios.get(`${BASE_URL}/personalization/products?limit=6`);
    console.log('✅ Guest response status:', guestResponse.status);
    console.log('📊 Guest response data:', {
      success: guestResponse.data.success,
      productsCount: guestResponse.data.data?.products?.length || 0,
      personalizationLevel: guestResponse.data.data?.personalizationLevel
    });

    // Test personalized categories API
    console.log('\n2. Testing personalized categories:');
    const categoriesResponse = await axios.get(`${BASE_URL}/personalization/categories?limit=10`);
    console.log('✅ Categories response status:', categoriesResponse.status);
    console.log('📂 Categories data:', {
      success: categoriesResponse.data.success,
      categoriesCount: categoriesResponse.data.data?.categories?.length || 0,
      personalizationLevel: categoriesResponse.data.data?.userBehaviorSummary?.personalizationLevel
    });

    // Test with authentication
    console.log('\n3. Testing with authentication:');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'huy.nguyen.huu@gmail.com',
      password: 'huuhuy82'
    });

    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('🔐 Login successful, testing with user token...');

      const authResponse = await axios.get(`${BASE_URL}/personalization/products?limit=6`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ Authenticated response status:', authResponse.status);
      console.log('👤 Authenticated response data:', {
        success: authResponse.data.success,
        productsCount: authResponse.data.data?.products?.length || 0,
        personalizationLevel: authResponse.data.data?.personalizationLevel,
        basedOnCategories: authResponse.data.data?.basedOn?.categories?.length || 0,
        basedOnOrders: authResponse.data.data?.basedOn?.recentOrders,
        basedOnWishlist: authResponse.data.data?.basedOn?.wishlist,
        basedOnCart: authResponse.data.data?.basedOn?.cart
      });
    }

  } catch (error) {
    console.error('❌ API Test Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

// Run the test
testPersonalizedProductsAPI();
