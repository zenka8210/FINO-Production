const axios = require('axios');

async function testAuth() {
  console.log('Testing authentication...');
  
  try {
    const response = await axios({
      method: 'POST',
      url: 'http://localhost:5000/api/auth/login',
      data: {
        email: 'admin@example.com',
        password: 'password123'
      },
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Login successful');
    console.log('Response:', response.data);
    return response.data.data.token;
  } catch (error) {
    console.log('❌ Login failed');
    console.log('Error:', error.response?.data || error.message);
    return null;
  }
}

async function testCategoriesPublic(token) {
  console.log('\nTesting categories/public...');
  
  try {
    const response = await axios({
      method: 'GET',
      url: 'http://localhost:5000/api/categories/tree',
      timeout: 5000
    });
    
    console.log('✅ Categories tree successful');
    console.log('Response length:', response.data.data?.length || 0);
  } catch (error) {
    console.log('❌ Categories tree failed');
    console.log('Error:', error.response?.data || error.message);
  }
}

async function main() {
  const token = await testAuth();
  if (token) {
    await testCategoriesPublic(token);
  }
}

main().catch(console.error);
