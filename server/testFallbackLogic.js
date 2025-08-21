const axios = require('axios');

async function testFallbackLogic() {
  try {
    console.log('🧪 TESTING FALLBACK LOGIC');
    console.log('=========================');
    
    // Login as admin
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'galangboy82@gmail.com',
      password: 'Huuhuy82@'
    });
    
    const token = loginResponse.data.data.token;
    const headers = { 'Authorization': `Bearer ${token}` };
    
    // Test order with null address but has addressSnapshot
    const orderId = '68a6dfd7f3db2b37c070a565';
    
    console.log(`\n🎯 Testing order: ${orderId}`);
    console.log('Expected: Should show address from snapshot if fallback works');
    
    const response = await axios.get(`http://localhost:5000/api/orders/admin/${orderId}`, { headers });
    const order = response.data.data;
    
    console.log('\n📊 Results:');
    console.log('Order code:', order.orderCode);
    console.log('Has addressSnapshot:', !!order.addressSnapshot);
    console.log('Address after fallback:', order.address ? 'EXISTS' : 'STILL NULL');
    
    if (order.address) {
      console.log('\n✅ FALLBACK WORKED!');
      console.log('Address data:', {
        fullName: order.address.fullName,
        phone: order.address.phone,
        addressLine: order.address.addressLine,
        isSnapshot: order.address.isSnapshot
      });
    } else {
      console.log('\n❌ FALLBACK NOT WORKING');
      console.log('Snapshot data available:', order.addressSnapshot);
      console.log('But address is still null - patch may not be applied');
    }
    
    // Check if we can manually apply the logic
    if (!order.address && order.addressSnapshot) {
      console.log('\n🔧 Manually applying fallback logic:');
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
      console.log('Mock address would be:', mockAddress);
      console.log('\n💡 Admin modal should display:');
      console.log(`   Recipient: ${mockAddress.fullName}`);
      console.log(`   Phone: ${mockAddress.phone}`);
      console.log(`   Address: ${mockAddress.addressLine}`);
      console.log(`   Location: ${mockAddress.ward}, ${mockAddress.district}, ${mockAddress.city}`);
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testFallbackLogic();
