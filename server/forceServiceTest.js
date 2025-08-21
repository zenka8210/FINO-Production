const axios = require('axios');

async function forceServiceTest() {
  try {
    console.log('🔥 FORCE SERVICE FALLBACK TEST');
    console.log('==============================');
    
    // Create a direct service test endpoint
    const testPayload = {
      action: 'test-address-fallback',
      orderId: '68a6dfd7f3db2b37c070a565'
    };
    
    // Login first
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'galangboy82@gmail.com',
      password: 'Huuhuy82@'
    });
    const token = loginResponse.data.data.token;
    
    console.log('📞 Making direct API call to trigger service...');
    
    // This should trigger the service logs if working
    const response = await axios.get(`http://localhost:5000/api/orders/admin/68a6dfd7f3db2b37c070a565`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const order = response.data.data;
    
    console.log('\n📊 Service Response Check:');
    console.log('Address exists?:', order.address !== null);
    console.log('AddressSnapshot exists?:', !!order.addressSnapshot);
    
    if (order.address && order.address.isSnapshot) {
      console.log('🎉 SUCCESS! Fallback is working!');
      console.log('   Full name:', order.address.fullName);
      console.log('   Phone:', order.address.phone);
    } else {
      console.log('❌ FAILED! Service logs should appear above if running correctly');
      
      // Manual check
      if (!order.address && order.addressSnapshot) {
        console.log('\n🔧 Manual fallback simulation:');
        const mockAddress = {
          _id: null,
          fullName: order.addressSnapshot.fullName,
          phone: order.addressSnapshot.phone,
          addressLine: order.addressSnapshot.addressLine,
          ward: order.addressSnapshot.ward,
          district: order.addressSnapshot.district,
          city: order.addressSnapshot.city,
          isSnapshot: true
        };
        console.log('   This is what should be returned:', mockAddress);
        console.log('\n💡 The problem is that service.getOrderWithDetails() is not applying fallback');
        console.log('   Even though the code is correct, something prevents it from running');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

forceServiceTest();
