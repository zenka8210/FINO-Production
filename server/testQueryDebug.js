const axios = require('axios');
const BASE_URL = 'http://localhost:5000/api';

async function testQuery() {
  try {
    console.log('Testing API call to:', `${BASE_URL}/products/public?page=1&limit=5`);
    const response = await axios.get(`${BASE_URL}/products/public?page=1&limit=5`);
    console.log('Response Status:', response.status);
    console.log('Response Data Structure:', JSON.stringify(response.data, null, 2));
    console.log('Has pagination?', !!response.data.pagination);
  } catch (error) {
    console.error('Error Status:', error.response?.status);
    console.error('Error Data:', error.response?.data || error.message);
  }
}

testQuery();
