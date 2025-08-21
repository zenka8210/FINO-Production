const axios = require('axios');

async function testWithFreshToken() {
  try {
    console.log('🔍 TEST WITH FRESH TOKEN');
    console.log('========================');
    
    // Login fresh
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'galangboy82@gmail.com',
      password: 'Huuhuy82@'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Fresh login successful');
    
    const orderId = '68a6dfd7f3db2b37c070a565';
    console.log(`📞 Calling: GET /api/orders/admin/${orderId}`);
    console.log('\n🔍 WATCH SERVER CONSOLE FOR THESE LOGS:');
    console.log('   "⚠️  Order FINO2025082100005: Address reference lost, using addressSnapshot fallback"');
    console.log('   "✅ Created mock address from snapshot for admin modal"');
    
    const response = await axios.get(`http://localhost:5000/api/orders/admin/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const order = response.data.data;
    console.log('\n📋 API Response Analysis:');
    console.log('Order code:', order.orderCode);
    console.log('Address exists?:', !!order.address);
    console.log('AddressSnapshot exists?:', !!order.addressSnapshot);
    
    if (order.address) {
      console.log('\n🎉 SUCCESS! Address is present:');
      console.log('   Full name:', order.address.fullName);
      console.log('   Phone:', order.address.phone);  
      console.log('   Address line:', order.address.addressLine);
      console.log('   Is snapshot?:', order.address.isSnapshot);
    } else {
      console.log('\n❌ FAILED! Address is still null');
      console.log('   Check if server logs appeared above');
      console.log('   AddressSnapshot data:', order.addressSnapshot);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testWithFreshToken();
