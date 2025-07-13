const axios = require('axios');

async function testConnection() {
  try {
    console.log('Testing server connection...');
    const response = await axios({
      method: 'POST',
      url: 'http://localhost:5000/api/auth/login',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        email: 'admin@example.com',
        password: 'password123'
      }
    });
    
    console.log('✅ Connection successful');
    console.log('Status:', response.status);
    console.log('User:', response.data.data.user.email, response.data.data.user.role);
  } catch (error) {
    console.log('❌ Connection failed');
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error data:', error.response.data);
    }
  }
}

testConnection();
