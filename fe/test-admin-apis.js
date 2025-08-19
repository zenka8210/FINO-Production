const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

const ADMIN_CREDENTIALS = {
  email: 'huy.nguyen.huu@gmail.com',
  password: 'huuhuy82'
};

async function getAdminToken() {
  const response = await axios.post(`${BASE_URL}/api/auth/login`, ADMIN_CREDENTIALS);
  return response.data.data.token;
}

async function testAdminAPIs() {
  try {
    console.log('🔑 Getting admin token...');
    const token = await getAdminToken();
    console.log('✅ Token obtained');
    
    const headers = { 'Authorization': `Bearer ${token}` };
    
    // Test user registration API
    console.log('\n📊 Testing user registration API...');
    const userRegRes = await axios.get(`${BASE_URL}/api/statistics/user-registration?months=2`, { headers });
    console.log('User registration data:', JSON.stringify(userRegRes.data, null, 2));
    
    // Test revenue chart API  
    console.log('\n💰 Testing revenue chart API (year)...');
    const revenueRes = await axios.get(`${BASE_URL}/api/statistics/revenue-chart?period=year`, { headers });
    console.log('Revenue chart data:', JSON.stringify(revenueRes.data, null, 2));
    
    // Test dashboard stats API
    console.log('\n📈 Testing dashboard stats API...');
    const dashboardRes = await axios.get(`${BASE_URL}/api/statistics/dashboard`, { headers });
    console.log('Dashboard stats:', JSON.stringify(dashboardRes.data, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAdminAPIs();
