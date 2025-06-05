// Test script cho tất cả API endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let adminToken = '';
let testUserId = '';
let testProductId = '';
let testPromotionId = '';
let testReturnRequestId = '';

// Utility function để log kết quả test
function logTest(testName, success, data = null, error = null) {
  console.log(`\n🧪 ${testName}`);
  console.log(success ? '✅ PASS' : '❌ FAIL');
  if (data) console.log('📊 Data:', JSON.stringify(data, null, 2));
  if (error) {
    console.log('❌ Error:', error);
    if (error.response) {
      console.log('📋 Response Status:', error.response.status);
      console.log('📋 Response Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
  console.log('─'.repeat(50));
}

// Hàm delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testAPIs() {
  console.log('🚀 Bắt đầu test tất cả API endpoints...\n');

  try {
    // 1. TEST AUTH APIs
    console.log('🔐 TESTING AUTHENTICATION APIs');
    

    // Đảm bảo dùng cùng 1 timestamp cho đăng ký và đăng nhập
    const now = Date.now();
    let testEmail = `test${now}@test.com`;
    let testUsername = 'testuser_' + now;

    try {
      const registerData = {
        username: testUsername,
        email: testEmail,
        password: '12345678', // >= 8 ký tự
        full_name: 'Test User',
        phone: '0123456789'
      };
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData);
      logTest('Register User', true, registerResponse.data);
      testUserId = registerResponse.data.data?.user?.id;
    } catch (error) {
      logTest('Register User', false, null, error.response?.data || error);
    }

    await delay(1000);

    // Test Login
    try {
      const loginData = {
        email: testEmail,
        password: '12345678' // Phải trùng với đăng ký
      };
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
      logTest('Login User', true, loginResponse.data);
      authToken = loginResponse.data.data?.token;
    } catch (error) {
      logTest('Login User', false, null, error.response?.data || error);
    }

    await delay(1000);

    // 2. TEST PROMOTION APIs
    console.log('\n🎁 TESTING PROMOTION APIs');
    
    // Test Get Active Promotions (Public)
    try {
      const activePromotionsResponse = await axios.get(`${BASE_URL}/promotions/active`);
      logTest('Get Active Promotions', true, activePromotionsResponse.data);
    } catch (error) {
      logTest('Get Active Promotions', false, null, error.response?.data || error);
    }

    // Test Calculate Discount (Public)
    try {
      const discountData = {
        originalPrice: 100000,
        promotionCode: 'SALE20'
      };
      
      const discountResponse = await axios.post(`${BASE_URL}/promotions/calculate-discount`, discountData);
      logTest('Calculate Discount', true, discountResponse.data);
    } catch (error) {
      logTest('Calculate Discount', false, null, error.response?.data || error);
    }

    await delay(1000);

    // 3. TEST RETURN REQUEST APIs (cần auth token)
    console.log('\n📦 TESTING RETURN REQUEST APIs');
    
    if (authToken) {
      const headers = { Authorization: `Bearer ${authToken}` };
      
      // Test Get My Return Requests
      try {
        const myRequestsResponse = await axios.get(`${BASE_URL}/return-requests/my-requests`, { headers });
        logTest('Get My Return Requests', true, myRequestsResponse.data);
      } catch (error) {
        logTest('Get My Return Requests', false, null, error.response?.data || error);
      }

      // Test Create Return Request
      try {
        const returnRequestData = {
          orderId: '6500000000000000000000001', // Mock order ID
          reason: 'Sản phẩm không đúng mô tả',
          description: 'Màu sắc không như hình ảnh',
          images: ['https://example.com/image1.jpg']
        };
        
        const createReturnResponse = await axios.post(`${BASE_URL}/return-requests`, returnRequestData, { headers });
        logTest('Create Return Request', true, createReturnResponse.data);
        testReturnRequestId = createReturnResponse.data.data?.id;
      } catch (error) {
        logTest('Create Return Request', false, null, error.response?.data || error);
      }
    } else {
      console.log('⚠️ Skipping Return Request tests - No auth token');
    }

    await delay(1000);

    // 4. TEST BANNER APIs (Public endpoints)
    console.log('\n🖼️ TESTING BANNER APIs');
    
    try {
      const bannersResponse = await axios.get(`${BASE_URL}/banners`);
      logTest('Get Active Banners', true, bannersResponse.data);
    } catch (error) {
      logTest('Get Active Banners', false, null, error.response?.data || error);
    }

    // 5. TEST PAYMENT APIs
    console.log('\n💳 TESTING PAYMENT APIs');
    
    try {
      const paymentMethodsResponse = await axios.get(`${BASE_URL}/payments/methods`);
      logTest('Get Payment Methods', true, paymentMethodsResponse.data);
    } catch (error) {
      logTest('Get Payment Methods', false, null, error.response?.data || error);
    }

    // 6. TEST TAG APIs
    console.log('\n🏷️ TESTING TAG APIs');
    
    try {
      const tagsResponse = await axios.get(`${BASE_URL}/tags`);
      logTest('Get All Tags', true, tagsResponse.data);
    } catch (error) {
      logTest('Get All Tags', false, null, error.response?.data || error);
    }

    // 7. TEST EXISTING APIs
    console.log('\n📦 TESTING EXISTING APIs');
    
    // Test Products
    try {
      const productsResponse = await axios.get(`${BASE_URL}/products`);
      logTest('Get Products', true, productsResponse.data);
    } catch (error) {
      logTest('Get Products', false, null, error.response?.data || error);
    }

    // Test Categories
    try {
      const categoriesResponse = await axios.get(`${BASE_URL}/categories`);
      logTest('Get Categories', true, categoriesResponse.data);
    } catch (error) {
      logTest('Get Categories', false, null, error.response?.data || error);
    }

    // Test News
    try {
      const newsResponse = await axios.get(`${BASE_URL}/news/public`);
      logTest('Get Public News', true, newsResponse.data);
    } catch (error) {
      logTest('Get Public News', false, null, error.response?.data || error);
    }

    // Test Vouchers
    try {
      const vouchersResponse = await axios.get(`${BASE_URL}/vouchers/available`);
      logTest('Get Available Vouchers', true, vouchersResponse.data);
    } catch (error) {
      logTest('Get Available Vouchers', false, null, error.response?.data || error);
    }

    await delay(1000);

    // 8. TEST VALIDATION ERRORS
    console.log('\n❌ TESTING VALIDATION ERRORS');
    
    // Test invalid login
    try {
      await axios.post(`${BASE_URL}/auth/login`, { email: 'invalid', password: '' });
      logTest('Invalid Login Validation', false, 'Should have failed');
    } catch (error) {
      logTest('Invalid Login Validation', true, error.response?.data);
    }

    // Test invalid promotion creation (without auth)
    try {
      await axios.post(`${BASE_URL}/promotions`, { name: 'Test' });
      logTest('Unauthorized Promotion Creation', false, 'Should have failed');
    } catch (error) {
      logTest('Unauthorized Promotion Creation', true, error.response?.data);
    }

    console.log('\n🎉 Test hoàn thành!');
    console.log('\n📋 SUMMARY:');
    console.log('✅ Các API đã được test bao gồm:');
    console.log('   - Authentication (Register, Login)');
    console.log('   - Promotion Management (Public endpoints)');
    console.log('   - Return Request Management');
    console.log('   - Banner Management');
    console.log('   - Payment Methods');
    console.log('   - Tag Management');
    console.log('   - Existing APIs (Products, Categories, News, Vouchers)');
    console.log('   - Validation & Error Handling');
    
  } catch (error) {
    console.error('❌ Test script error:', error.message);
  }
}

// Install axios if not available
const checkAxios = async () => {
  try {
    require('axios');
    return true;
  } catch (error) {
    console.log('📦 Installing axios...');
    const { execSync } = require('child_process');
    execSync('npm install axios', { stdio: 'inherit' });
    return true;
  }
};

// Run tests
checkAxios().then(() => {
  testAPIs().catch(console.error);
});
