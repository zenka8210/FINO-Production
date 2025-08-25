const axios = require('axios');

async function testSimpleCODUpdate() {
  try {
    const BASE_URL = 'http://localhost:5000';
    
    // Login credentials for admin
    const ADMIN_CREDENTIALS = {
      email: 'huy.nguyen.huu@gmail.com', 
      password: 'huuhuy82'
    };
    
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, ADMIN_CREDENTIALS);
    const adminToken = loginResponse.data.data.token;
    
    const headers = { 'Authorization': `Bearer ${adminToken}` };
    
    console.log('📋 Fetching recent orders...');
    const ordersResponse = await axios.get(`${BASE_URL}/api/orders/admin/all?limit=20`, { headers });
    
    const orders = ordersResponse.data.data.data || [];
    console.log(`📊 Found ${orders.length} orders`);
    
    // Find COD orders
    const codOrders = orders.filter(order => {
      const paymentMethod = order.paymentMethod?.method || order.paymentMethod || '';
      return paymentMethod.toLowerCase() === 'cod';
    });
    
    console.log('\n📋 COD orders analysis:');
    codOrders.forEach(order => {
      console.log(`- ${order.orderCode}: status=${order.status}, payment=${order.paymentStatus}`);
    });
    
    // Find a delivered COD order to test with 
    const deliveredCOD = codOrders.find(order => order.status === 'delivered');
    
    if (deliveredCOD) {
      console.log(`\n🎯 Testing with delivered COD order: ${deliveredCOD.orderCode}`);
      console.log(`Current: status=${deliveredCOD.status}, payment=${deliveredCOD.paymentStatus}`);
      
      // Try to update status to delivered again (should trigger auto-payment logic)
      console.log('\n🔄 Re-triggering delivered status update...');
      
      const updateResponse = await axios.put(
        `${BASE_URL}/api/orders/admin/${deliveredCOD._id}/status`,
        { status: 'delivered' },
        { headers }
      );
      
      console.log('\n📋 Update response:');
      console.log('Success:', updateResponse.data.success);
      console.log('Auto-updated flag:', updateResponse.data.data?.paymentStatusAutoUpdated);
      
      const updatedOrder = updateResponse.data.data?.order;
      if (updatedOrder) {
        console.log('\n📊 Final order state:');
        console.log(`- Status: ${updatedOrder.status}`);
        console.log(`- Payment Status: ${updatedOrder.paymentStatus}`);
        
        if (updatedOrder.paymentStatus === 'paid') {
          console.log('✅ COD auto-payment logic is working correctly!');
        }
      }
    } else {
      console.log('❌ No delivered COD orders found to test with');
      
      // Look for any non-cancelled COD order
      const testableOrder = codOrders.find(order => order.status !== 'cancelled');
      if (testableOrder) {
        console.log(`\n🎯 Found testable COD order: ${testableOrder.orderCode}`);
        console.log(`Current status: ${testableOrder.status}`);
        console.log('Can test full workflow by moving to delivered');
      } else {
        console.log('❌ No testable COD orders available');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing COD update:');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run test
testSimpleCODUpdate();
