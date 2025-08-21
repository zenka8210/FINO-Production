const axios = require('axios');

async function directApiTest() {
  try {
    console.log('🔍 DIRECT API TEST - CHECK SERVER LOGS');
    console.log('=====================================');
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NmM2NDEzODcxNzllYzUyYmYyYWU3OTIiLCJlbWFpbCI6ImdhbGFuZ2JveTgyQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTczNDc2MjI4NiwiZXhwIjoxNzM1MzY3MDg2fQ.JQcNhzwM0OU1PIxpKh3qiD3BAXW09DdnOp95a3mFHzc';
    const orderId = '68a6dfd7f3db2b37c070a565';
    
    console.log(`📞 Calling: GET /api/orders/admin/${orderId}`);
    console.log('Expected server logs:');
    console.log('   - "⚠️  Order FINO2025082100005: Address reference lost, using addressSnapshot fallback"');
    console.log('   - "✅ Created mock address from snapshot for admin modal"');
    
    const response = await axios.get(`http://localhost:5000/api/orders/admin/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const order = response.data.data;
    console.log('\n📋 Response analysis:');
    console.log('Order code:', order.orderCode);
    console.log('Address null?:', order.address === null);
    console.log('Has addressSnapshot?:', !!order.addressSnapshot);
    
    if (order.address) {
      console.log('✅ ADDRESS EXISTS IN RESPONSE!');
      console.log('Address type:', typeof order.address);
      console.log('Has isSnapshot flag?:', order.address.isSnapshot);
    } else {
      console.log('❌ ADDRESS IS NULL - FALLBACK NOT WORKING');
      console.log('Check server console for fallback logs!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

directApiTest();
