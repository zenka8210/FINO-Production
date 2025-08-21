const axios = require('axios');

async function debugApiResponse() {
  try {
    console.log('🚨 EMERGENCY DEBUGGING');
    console.log('======================');
    
    // Login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'galangboy82@gmail.com',
      password: 'Huuhuy82@'
    });
    const token = loginResponse.data.data.token;
    
    const orderId = '68a6dfd7f3db2b37c070a565';
    
    console.log('🔍 Step 1: Call API and check response structure');
    const response = await axios.get(`http://localhost:5000/api/orders/admin/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const order = response.data.data;
    
    console.log('\n📊 API Response Analysis:');
    console.log('Response structure:', {
      hasAddress: 'address' in order,
      hasAddressSnapshot: 'addressSnapshot' in order,
      addressValue: order.address,
      addressType: typeof order.address
    });
    
    // Check if address field exists but is null vs not existing
    if ('address' in order) {
      if (order.address === null) {
        console.log('📍 Address field EXISTS but is NULL');
      } else {
        console.log('📍 Address field EXISTS and has data:', typeof order.address);
      }
    } else {
      console.log('📍 Address field DOES NOT EXIST in response');
    }
    
    // Check snapshot
    if (order.addressSnapshot) {
      console.log('\n📋 AddressSnapshot is available:');
      console.log('   Full name:', order.addressSnapshot.fullName);
      console.log('   Phone:', order.addressSnapshot.phone);
      console.log('   Address:', order.addressSnapshot.addressLine);
      
      console.log('\n💡 This means fallback should work!');
      console.log('   The issue is that controller code is not executing');
      console.log('   or not modifying the response properly.');
    }
    
    console.log('\n🔧 PROPOSED SOLUTION:');
    console.log('   Option 1: Add fallback in SERVICE level (not controller)');
    console.log('   Option 2: Add fallback in FRONTEND component');
    console.log('   Option 3: Fix the controller patch (verify it\'s actually running)');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugApiResponse();
