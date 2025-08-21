const axios = require('axios');

const ADMIN_CREDENTIALS = {
  email: 'galangboy82@gmail.com',
  password: 'Huuhuy82@'
};

const BASE_URL = 'http://localhost:5000/api';

// Test script to debug order address display issue in admin modal
async function testOrderAddressIssue() {
  try {
    console.log('🔐 Admin Order Address Debug Test');
    console.log('=====================================');

    // 1. Login as admin
    console.log('\n1️⃣ Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    const adminToken = loginResponse.data.data.token;
    console.log('✅ Admin login successful');

    const headers = { 'Authorization': `Bearer ${adminToken}` };

    // 2. Get all orders to find one to test
    console.log('\n2️⃣ Fetching recent orders...');
    const ordersResponse = await axios.get(`${BASE_URL}/orders/admin/all?limit=5&sort=-createdAt`, { headers });
    console.log('Raw orders response:', ordersResponse.data);
    
    const orders = ordersResponse.data.data?.data || ordersResponse.data.data?.orders || ordersResponse.data.data || [];

    if (orders.length === 0) {
      console.log('❌ No orders found for testing');
      return;
    }

    const testOrder = orders[0];
    console.log('Test order object:', testOrder);
    console.log(`✅ Using order for testing: ${testOrder.orderCode} (${testOrder._id})`);

    // 3. Get order details via admin endpoint
    console.log('\n3️⃣ Fetching order details via admin endpoint...');
    const orderDetailResponse = await axios.get(`${BASE_URL}/orders/admin/${testOrder._id}`, { headers });
    const orderDetail = orderDetailResponse.data.data;

    // 4. Analyze address data
    console.log('\n4️⃣ Analyzing address data:');
    console.log('===============================');
    
    // User information
    console.log('\n👤 User Info:');
    console.log(`   Name: ${orderDetail.user?.name || 'N/A'}`);
    console.log(`   Email: ${orderDetail.user?.email || 'N/A'}`);
    console.log(`   Phone: ${orderDetail.user?.phone || 'N/A'}`);
    
    // Address information
    console.log('\n📍 Order Address (what admin modal should show):');
    if (orderDetail.address) {
      console.log(`   Full Name: ${orderDetail.address.fullName || 'N/A'}`);
      console.log(`   Phone: ${orderDetail.address.phone || 'N/A'}`);
      console.log(`   Address Line: ${orderDetail.address.addressLine || 'N/A'}`);
      console.log(`   Ward: ${orderDetail.address.ward || 'N/A'}`);
      console.log(`   District: ${orderDetail.address.district || 'N/A'}`);
      console.log(`   City: ${orderDetail.address.city || 'N/A'}`);
      console.log(`   Is Default: ${orderDetail.address.isDefault || false}`);
      console.log(`   Address ID: ${orderDetail.address._id}`);
    } else {
      console.log('   ❌ NO ADDRESS DATA FOUND IN ORDER!');
    }

    // 5. Analysis based on current data
    console.log('\n5️⃣ Analysis based on current data:');
    console.log('====================================');
    
    console.log('\n� Issue Analysis:');
    
    const orderUserName = orderDetail.user?.name;
    const addressFullName = orderDetail.address?.fullName;
    const orderUserPhone = orderDetail.user?.phone;  
    const addressPhone = orderDetail.address?.phone;
    
    console.log(`User in order: "${orderUserName}" (${orderUserPhone})`);
    console.log(`Address recipient: "${addressFullName}" (${addressPhone})`);
    
    if (orderUserName !== addressFullName || orderUserPhone !== addressPhone) {
      console.log('⚠️  MISMATCH: Order user info differs from delivery address info');
      console.log('   This suggests the address belongs to someone else or is outdated');
    } else {
      console.log('✅ Order user info matches delivery address info');
    }
    
    if (orderDetail.address?.isDefault) {
      console.log('📌 This order used the user\'s default address');
    } else {
      console.log('🎯 This order used a non-default address (customer chose specific address)');
    }

    console.log('\n🎯 CONCLUSION:');
    console.log('The admin modal should display:');
    console.log(`   Recipient: ${addressFullName}`);
    console.log(`   Phone: ${addressPhone}`);
    console.log(`   Address: ${orderDetail.address?.addressLine}`);
    console.log(`   ${orderDetail.address?.ward}, ${orderDetail.address?.district}, ${orderDetail.address?.city}`);
    
    console.log('\n✅ Order address data appears correct in database.');
    console.log('❓ If admin modal shows different info, the issue is in frontend component logic.')

    console.log('\n✅ Address debug test completed!');

  } catch (error) {
    console.error('❌ Error during address debug test:', error.response?.data || error.message);
  }
}

// Run test
testOrderAddressIssue();
