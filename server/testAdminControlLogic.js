const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';

// Test credentials
const ADMIN_CREDENTIALS = {
  email: 'huy.nguyen.huu@gmail.com',
  password: 'huuhuy82'
};

// Test scenarios for admin payment status control
async function testAdminPaymentStatusControl() {
  console.log('\n🧪 ============ TESTING ADMIN PAYMENT STATUS CONTROL ============\n');
  
  try {
    // 1. Login as admin
    console.log('🔐 1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    const adminToken = loginResponse.data.data.token;
    const headers = { 'Authorization': `Bearer ${adminToken}` };
    console.log('✅ Admin login successful');
    
    // 2. Get some orders to test
    console.log('\n📋 2. Fetching orders...');
    const ordersResponse = await axios.get(`${BASE_URL}/orders`, { headers });
    const orders = ordersResponse.data.data.data;
    console.log(`✅ Found ${orders.length} orders`);
    
    if (orders.length === 0) {
      console.log('❌ No orders found for testing');
      return;
    }
    
    // Test cases
    const testCases = [
      {
        description: '❌ VNPay order payment status change should fail',
        filter: (order) => order.paymentMethod?.method === 'VNPay' || order.paymentMethod === 'VNPay',
        newPaymentStatus: 'paid',
        expectError: true
      },
      {
        description: '❌ Momo order payment status change should fail',
        filter: (order) => order.paymentMethod?.method === 'Momo' || order.paymentMethod === 'Momo',
        newPaymentStatus: 'paid',
        expectError: true
      },
      {
        description: '❌ Cancelled order payment status change should fail',
        filter: (order) => order.status === 'cancelled',
        newPaymentStatus: 'paid',
        expectError: true
      },
      {
        description: '❌ COD delivered order payment status change should fail',
        filter: (order) => (order.paymentMethod?.method === 'COD' || order.paymentMethod === 'COD') && order.status === 'delivered',
        newPaymentStatus: 'failed',
        expectError: true
      },
      {
        description: '❌ COD shipped order payment status change should fail',
        filter: (order) => (order.paymentMethod?.method === 'COD' || order.paymentMethod === 'COD') && order.status === 'shipped',
        newPaymentStatus: 'failed',
        expectError: true
      },
      {
        description: '✅ COD pending order payment status change should succeed',
        filter: (order) => (order.paymentMethod?.method === 'COD' || order.paymentMethod === 'COD') && order.status === 'pending',
        newPaymentStatus: 'paid',
        expectError: false
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n🧪 3. Testing: ${testCase.description}`);
      
      const testOrder = orders.find(testCase.filter);
      
      if (!testOrder) {
        console.log(`⏭️  Skipping - No matching order found for this test case`);
        continue;
      }
      
      console.log(`📋 Using order: ${testOrder.orderCode} (${testOrder.paymentMethod?.method || testOrder.paymentMethod}, ${testOrder.status})`);
      
      try {
        const response = await axios.put(
          `${BASE_URL}/orders/admin/${testOrder._id}/payment-status`,
          { paymentStatus: testCase.newPaymentStatus },
          { headers }
        );
        
        if (testCase.expectError) {
          console.log(`❌ UNEXPECTED SUCCESS - This should have failed!`);
          console.log(`Response:`, response.data);
        } else {
          console.log(`✅ SUCCESS - Payment status updated as expected`);
          console.log(`New status: ${response.data.data.paymentStatus}`);
        }
        
      } catch (error) {
        if (testCase.expectError) {
          console.log(`✅ EXPECTED ERROR - ${error.response?.data?.message || error.message}`);
        } else {
          console.log(`❌ UNEXPECTED ERROR - ${error.response?.data?.message || error.message}`);
        }
      }
    }
    
    // 4. Test order status transitions
    console.log('\n🔄 4. Testing order status transitions...');
    
    const statusTestCases = [
      {
        description: '❌ Delivered → Cancelled should fail',
        filter: (order) => order.status === 'delivered',
        newStatus: 'cancelled',
        expectError: true
      },
      {
        description: '❌ Shipped → Pending should fail (backward)',
        filter: (order) => order.status === 'shipped',
        newStatus: 'pending',
        expectError: true
      },
      {
        description: '✅ Pending → Processing should succeed',
        filter: (order) => order.status === 'pending',
        newStatus: 'processing',
        expectError: false
      }
    ];
    
    for (const testCase of statusTestCases) {
      console.log(`\n🧪 Testing: ${testCase.description}`);
      
      const testOrder = orders.find(testCase.filter);
      
      if (!testOrder) {
        console.log(`⏭️  Skipping - No matching order found for this test case`);
        continue;
      }
      
      console.log(`📋 Using order: ${testOrder.orderCode} (current status: ${testOrder.status})`);
      
      try {
        const response = await axios.put(
          `${BASE_URL}/orders/admin/${testOrder._id}/status`,
          { status: testCase.newStatus },
          { headers }
        );
        
        if (testCase.expectError) {
          console.log(`❌ UNEXPECTED SUCCESS - This should have failed!`);
          console.log(`New status: ${response.data.data.status}`);
        } else {
          console.log(`✅ SUCCESS - Status updated as expected`);
          console.log(`New status: ${response.data.data.status}`);
        }
        
      } catch (error) {
        if (testCase.expectError) {
          console.log(`✅ EXPECTED ERROR - ${error.response?.data?.message || error.message}`);
        } else {
          console.log(`❌ UNEXPECTED ERROR - ${error.response?.data?.message || error.message}`);
        }
      }
    }
    
    console.log('\n✅ ============ ADMIN CONTROL TESTING COMPLETED ============\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
if (require.main === module) {
  testAdminPaymentStatusControl();
}

module.exports = { testAdminPaymentStatusControl };
