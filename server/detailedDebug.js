const axios = require('axios');

async function detailedDebug() {
  try {
    console.log('🔬 CHI TIẾT DEBUG ADMIN ENDPOINT');
    console.log('===============================');
    
    // Login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'galangboy82@gmail.com',
      password: 'Huuhuy82@'
    });
    const token = loginResponse.data.data.token;
    const orderId = '68a6dfd7f3db2b37c070a565';
    
    console.log('📞 Calling admin endpoint with detailed logging...');
    console.log('Expected service logs:');
    console.log('   "⚠️  Order FINO2025082100005: Address reference lost, using addressSnapshot fallback"');
    
    // Call admin endpoint
    const response = await axios.get(`http://localhost:5000/api/orders/admin/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const order = response.data.data;
    
    console.log('\n📊 Full Response Analysis:');
    console.log('Order ID:', order._id);
    console.log('Order Code:', order.orderCode);
    
    console.log('\nAddress Information:');
    console.log('   address field type:', typeof order.address);
    console.log('   address is null?:', order.address === null);
    console.log('   address is undefined?:', order.address === undefined);
    
    console.log('\nAddressSnapshot Information:');
    console.log('   addressSnapshot exists?:', !!order.addressSnapshot);
    if (order.addressSnapshot) {
      console.log('   snapshot fullName:', order.addressSnapshot.fullName);
      console.log('   snapshot phone:', order.addressSnapshot.phone);
    }
    
    // Check all keys in response
    console.log('\nAll Response Keys:');
    console.log('   ', Object.keys(order).sort());
    
    console.log('\n💡 DIAGNOSIS:');
    if (!order.address && order.addressSnapshot) {
      console.log('   ❌ Service fallback logic NOT working in admin endpoint');
      console.log('   ✅ But it WORKS in user endpoint');
      console.log('   🔧 Possible cause: Different service method or query for admin');
    } else if (order.address && order.address.isSnapshot) {
      console.log('   ✅ Service fallback logic IS working!');
      console.log('   🎉 Admin modal should show address now');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

detailedDebug();
