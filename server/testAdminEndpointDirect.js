const axios = require('axios');

const ADMIN_CREDENTIALS = {
  email: 'galangboy82@gmail.com',
  password: 'Huuhuy82@'
};

async function testAdminEndpointDirectly() {
  try {
    console.log('🔍 DIRECT ADMIN ENDPOINT TEST');
    console.log('=============================');
    
    // 1. Login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', ADMIN_CREDENTIALS);
    const token = loginResponse.data.data.token;
    const headers = { 'Authorization': `Bearer ${token}` };
    
    // 2. Test specific order
    const orderId = '68a6dfd7f3db2b37c070a565';
    console.log(`\n🔍 Testing order: ${orderId}`);
    
    const response = await axios.get(`http://localhost:5000/api/orders/admin/${orderId}`, { headers });
    
    console.log('\n📊 Response status:', response.status);
    console.log('📊 Response data structure:');
    console.log('Success:', response.data.success);
    console.log('Message:', response.data.message);
    
    const order = response.data.data;
    console.log('\n📋 Order details:');
    console.log('Order Code:', order.orderCode);
    console.log('User:', order.user?.name);
    console.log('Address exists:', !!order.address);
    console.log('Address data:', order.address);
    console.log('AddressSnapshot exists:', !!order.addressSnapshot);
    
    if (order.addressSnapshot) {
      console.log('Snapshot data:', order.addressSnapshot);
    }
    
    console.log('\n✅ Direct endpoint test completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAdminEndpointDirectly();
