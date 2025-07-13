const axios = require('axios');

async function testAPIs() {
  console.log('=== TESTING QUERY MIDDLEWARE APIs ===\n');

  // Step 1: Test basic authentication
  console.log('1. Testing Authentication...');
  let adminToken = null;
  
  try {
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com',
      password: 'password123'
    }, { timeout: 5000 });
    
    adminToken = loginResponse.data.data.token;
    console.log('✅ Authentication successful');
  } catch (error) {
    console.log('❌ Authentication failed:', error.message);
    return;
  }

  // Step 2: Test endpoints one by one
  const tests = [
    {
      name: 'Categories Public',
      url: '/categories/public?page=1&limit=3',
      token: null
    },
    {
      name: 'Products Public',
      url: '/products/public?page=1&limit=3',
      token: null
    },
    {
      name: 'Users Admin',
      url: '/users?page=1&limit=3',
      token: adminToken
    },
    {
      name: 'Orders User',
      url: '/orders?page=1&limit=3',
      token: adminToken
    }
  ];

  for (const test of tests) {
    console.log(`\n2. Testing ${test.name}...`);
    
    try {
      const config = {
        method: 'GET',
        url: `http://localhost:5000/api${test.url}`,
        timeout: 8000,
        headers: {}
      };
      
      if (test.token) {
        config.headers.Authorization = `Bearer ${test.token}`;
      }
      
      const response = await axios(config);
      console.log(`✅ ${test.name} successful - Data count: ${response.data.data?.data?.length || 0}`);
    } catch (error) {
      const errorMsg = error.code === 'ECONNABORTED' ? 'Timeout' : 
                       error.response?.data?.message || error.message;
      console.log(`❌ ${test.name} failed: ${errorMsg}`);
    }
  }

  console.log('\n=== TEST COMPLETED ===');
}

testAPIs().catch(console.error);
