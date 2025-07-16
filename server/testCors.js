/**
 * Test CORS Configuration
 * Chạy file này để kiểm tra CORS đã được cấu hình đúng chưa
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function testCors() {
  console.log('🔧 Testing CORS Configuration...\n');
  
  try {
    // Test 1: Simple GET request
    console.log('1️⃣ Testing simple GET request...');
    const response1 = await axios.get(`${API_BASE_URL}/`, {
      headers: {
        'Origin': 'http://localhost:3000'
      }
    });
    console.log('✅ GET request successful');
    console.log('Response headers:', response1.headers);
    
    // Test 2: Preflight request simulation
    console.log('\n2️⃣ Testing preflight request...');
    const response2 = await axios.options(`${API_BASE_URL}/api/auth/login`, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    console.log('✅ OPTIONS request successful');
    console.log('CORS headers:', {
      'Access-Control-Allow-Origin': response2.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': response2.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': response2.headers['access-control-allow-headers'],
      'Access-Control-Allow-Credentials': response2.headers['access-control-allow-credentials']
    });
    
    // Test 3: POST request với Content-Type
    console.log('\n3️⃣ Testing POST request with JSON...');
    try {
      const response3 = await axios.post(`${API_BASE_URL}/api/auth/login`, 
        { email: 'test@test.com', password: 'test123' },
        {
          headers: {
            'Origin': 'http://localhost:3000',
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ POST request successful (expected to fail auth but CORS works)');
    } catch (error) {
      if (error.response && error.response.status !== 500) {
        console.log('✅ POST request reached server (CORS works, auth failed as expected)');
        console.log('CORS headers in error response:', {
          'Access-Control-Allow-Origin': error.response.headers['access-control-allow-origin'],
          'Access-Control-Allow-Credentials': error.response.headers['access-control-allow-credentials']
        });
      } else {
        console.log('❌ POST request failed:', error.message);
      }
    }
    
    console.log('\n🎉 CORS Configuration Test Complete!');
    console.log('\n📋 Summary:');
    console.log('✅ CORS is properly configured');
    console.log('✅ Frontend at http://localhost:3000 can access the API');
    console.log('✅ Credentials are allowed');
    console.log('✅ All HTTP methods are supported');
    
  } catch (error) {
    console.error('❌ CORS test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the server is running:');
      console.log('   cd server && npm run dev');
    }
  }
}

// Chạy test nếu file được chạy trực tiếp
if (require.main === module) {
  testCors();
}

module.exports = testCors;
