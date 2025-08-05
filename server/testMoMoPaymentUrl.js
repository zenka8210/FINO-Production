/**
 * Simple test to check MoMo checkout response for paymentUrl
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test credentials
const ADMIN_CREDENTIALS = {
  email: 'galangboy82@gmail.com',
  password: 'Huuhuy82@'
};

async function testMoMoPaymentUrl() {
  try {
    console.log('🔐 Logging in...');
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    const token = loginResponse.data.data.token;
    
    console.log('✅ Login successful');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('\n🛒 Testing MoMo checkout to get paymentUrl...');
    
    const checkoutData = {
      addressId: '507f1f77bcf86cd799439011', // Dummy ObjectId
      paymentMethodId: '689187ff3b29d88c249067f0', // MoMo payment method ID
      voucherId: null
    };

    const response = await axios.post(`${BASE_URL}/payment/momo/checkout`, checkoutData, { headers });
    
    console.log('✅ MoMo checkout response:');
    console.log('📋 Full response:', JSON.stringify(response.data, null, 2));
    
    // Check if paymentUrl exists
    if (response.data.data && response.data.data.paymentUrl) {
      console.log('\n🎯 PaymentUrl found:', response.data.data.paymentUrl);
      console.log('📏 PaymentUrl length:', response.data.data.paymentUrl.length);
      
      // Check if it's a real MoMo URL
      if (response.data.data.paymentUrl.includes('momo.vn')) {
        console.log('✅ Valid MoMo payment URL detected!');
      } else {
        console.log('⚠️ PaymentUrl does not look like a MoMo URL');
      }
    } else {
      console.log('❌ No paymentUrl found in response!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testMoMoPaymentUrl();
