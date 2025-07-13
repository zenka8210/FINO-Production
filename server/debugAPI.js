const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testEndpoint(method, url, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {},
      timeout: 10000 // 10 seconds timeout
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await axios(config);
    console.log(`✅ ${method} ${url} - Status: ${response.status}`);
    console.log('Response sample:', {
      success: response.data.success,
      message: response.data.message,
      dataType: typeof response.data.data,
      dataLength: Array.isArray(response.data.data?.data) ? response.data.data.data.length : 'not array'
    });
    return response.data;
  } catch (error) {
    console.log(`❌ ${method} ${url} - Status: ${error.response?.status || 'No Response'}`);
    console.log('Error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function debugAPI() {
  console.log('🔍 === DEBUGGING API ENDPOINTS ===\n');

  // Test authentication first
  console.log('1. Test authentication');
  const loginResponse = await testEndpoint('POST', '/auth/login', {
    email: 'admin@example.com',
    password: 'password123'
  });

  if (loginResponse && loginResponse.data && loginResponse.data.token) {
    const adminToken = loginResponse.data.token;
    console.log('✅ Got admin token');

    console.log('\n2. Test products/public endpoint (no auth)');
    await testEndpoint('GET', '/products/public?page=1&limit=3');

    console.log('\n3. Test admin products endpoint (with auth)');
    await testEndpoint('GET', '/products?page=1&limit=3', null, adminToken);

    console.log('\n4. Test users endpoint (with auth)');
    await testEndpoint('GET', '/users?page=1&limit=3', null, adminToken);

    console.log('\n5. Test categories endpoint (no auth)');
    await testEndpoint('GET', '/categories?page=1&limit=3');

  } else {
    console.log('❌ Cannot get admin token, stopping tests');
  }
}

debugAPI().catch(console.error);
