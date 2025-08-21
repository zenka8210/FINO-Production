const axios = require('axios');

async function compareUserVsAdminEndpoints() {
  try {
    console.log('🔍 SO SÁNH USER VS ADMIN ENDPOINTS');
    console.log('==================================');
    
    // Login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'galangboy82@gmail.com',
      password: 'Huuhuy82@'
    });
    const token = loginResponse.data.data.token;
    const orderId = '68a6dfd7f3db2b37c070a565';
    
    console.log('\n1️⃣ TEST USER ENDPOINT (should work):');
    console.log(`GET /api/orders/${orderId}`);
    
    try {
      const userResponse = await axios.get(`http://localhost:5000/api/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const userOrder = userResponse.data.data;
      
      console.log('✅ User endpoint response:');
      console.log('   Address exists:', !!userOrder.address);
      console.log('   AddressSnapshot exists:', !!userOrder.addressSnapshot);
      
      if (userOrder.address) {
        console.log('   Address data:', {
          fullName: userOrder.address.fullName,
          phone: userOrder.address.phone,
          isSnapshot: userOrder.address.isSnapshot
        });
      }
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('⚠️ User endpoint: Forbidden (expected for admin accessing user order)');
      } else {
        console.log('❌ User endpoint error:', error.response?.data?.message || error.message);
      }
    }
    
    console.log('\n2️⃣ TEST ADMIN ENDPOINT (currently broken):');
    console.log(`GET /api/orders/admin/${orderId}`);
    
    const adminResponse = await axios.get(`http://localhost:5000/api/orders/admin/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const adminOrder = adminResponse.data.data;
    
    console.log('❌ Admin endpoint response:');
    console.log('   Address exists:', !!adminOrder.address);
    console.log('   AddressSnapshot exists:', !!adminOrder.addressSnapshot);
    
    if (adminOrder.address) {
      console.log('   Address data:', {
        fullName: adminOrder.address.fullName,
        phone: adminOrder.address.phone,
        isSnapshot: adminOrder.address.isSnapshot
      });
    } else {
      console.log('   Address is NULL - fallback not working!');
    }
    
    console.log('\n🔍 COMPARISON:');
    console.log('Both endpoints call getOrderWithDetails() from service');
    console.log('But admin endpoint has additional fallback logic in controller');
    console.log('The issue might be that controller logic overrides service logic');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

compareUserVsAdminEndpoints();
