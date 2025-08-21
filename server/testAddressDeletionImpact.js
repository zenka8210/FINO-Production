const axios = require('axios');

const TEST_CREDENTIALS = {
  email: 'galangboy82@gmail.com',
  password: 'Huuhuy82@'
};

const BASE_URL = 'http://localhost:5000/api';

// Test script to verify the critical address deletion issue
async function testAddressDeletionImpact() {
  try {
    console.log('🚨 ADDRESS DELETION IMPACT TEST');
    console.log('=====================================');
    console.log('This test verifies what happens to order history when user deletes addresses');

    // 1. Login as test user
    console.log('\n1️⃣ Logging in as test user...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_CREDENTIALS);
    const userToken = loginResponse.data.data.token;
    console.log('✅ User login successful');

    const headers = { 'Authorization': `Bearer ${userToken}` };

    // 2. Get user's current addresses
    console.log('\n2️⃣ Fetching user addresses...');
    const addressesResponse = await axios.get(`${BASE_URL}/addresses`, { headers });
    const addresses = addressesResponse.data.data || [];
    
    console.log(`Found ${addresses.length} addresses for this user:`);
    addresses.forEach((addr, index) => {
      console.log(`   ${index + 1}. ${addr.fullName} - ${addr.addressLine} (ID: ${addr._id})`);
      console.log(`      Default: ${addr.isDefault}, Active: ${addr.isActive}`);
    });

    // 3. Get user's orders to see which addresses are in use
    console.log('\n3️⃣ Fetching user orders to check address usage...');
    const ordersResponse = await axios.get(`${BASE_URL}/orders`, { headers });
    console.log('Raw orders response:', ordersResponse.data);
    
    const orders = ordersResponse.data.data?.documents || [];
    
    console.log(`Found ${orders.length} orders for this user:`);
    
    // Track which addresses are used in orders
    const addressUsageMap = new Map();
    
    for (const order of orders) {
      const addressId = order.address?._id || order.address;
      if (addressId) {
        if (!addressUsageMap.has(addressId)) {
          addressUsageMap.set(addressId, []);
        }
        addressUsageMap.get(addressId).push({
          orderCode: order.orderCode,
          status: order.status,
          createdAt: order.createdAt,
          addressData: order.address
        });
      }
    }

    console.log('\n📊 Address Usage Analysis:');
    console.log('===========================');
    
    addressUsageMap.forEach((orderList, addressId) => {
      console.log(`\n📍 Address ID: ${addressId}`);
      console.log(`   Used in ${orderList.length} orders:`);
      
      orderList.forEach(orderInfo => {
        console.log(`   - Order ${orderInfo.orderCode} (${orderInfo.status})`);
        if (orderInfo.addressData) {
          console.log(`     Address Data: ${orderInfo.addressData.fullName} - ${orderInfo.addressData.addressLine}`);
        } else {
          console.log(`     ❌ Address Data: MISSING/NULL - REFERENTIAL INTEGRITY BROKEN!`);
        }
      });
    });

    // 4. Check for orphaned orders (orders with missing address references)
    console.log('\n4️⃣ Checking for orphaned orders (broken address references)...');
    let orphanedCount = 0;
    let validCount = 0;

    for (const order of orders) {
      if (!order.address || !order.address._id) {
        console.log(`❌ ORPHANED ORDER: ${order.orderCode} - No address data found`);
        orphanedCount++;
      } else {
        // Check if the address still exists in user's address list
        const addressExists = addresses.find(addr => addr._id === order.address._id);
        if (!addressExists) {
          console.log(`⚠️  POTENTIAL ORPHAN: Order ${order.orderCode} references address ${order.address._id} which may have been deleted`);
          console.log(`    Address data preserved: ${order.address.fullName} - ${order.address.addressLine}`);
        } else {
          validCount++;
        }
      }
    }

    // 5. Summary and recommendations
    console.log('\n5️⃣ CRITICAL ANALYSIS & RECOMMENDATIONS:');
    console.log('==========================================');
    
    console.log(`\n📈 Summary:`);
    console.log(`   Total Orders: ${orders.length}`);
    console.log(`   Orders with valid addresses: ${validCount}`);
    console.log(`   Orphaned orders: ${orphanedCount}`);
    console.log(`   Current user addresses: ${addresses.length}`);

    if (orphanedCount > 0) {
      console.log('\n🚨 CRITICAL ISSUE DETECTED:');
      console.log('   Some orders have missing address references!');
      console.log('   This breaks order history tracking and creates data integrity issues.');
    }

    console.log('\n💡 RECOMMENDED SOLUTIONS:');
    console.log('===========================');
    
    console.log('\n1️⃣ IMMEDIATE SOLUTION: Embed Address Data in Orders');
    console.log('   Instead of storing only ObjectId reference, store complete address object');
    console.log('   Pros: Order history preserved forever');
    console.log('   Cons: Data duplication, larger documents');
    
    console.log('\n2️⃣ HYBRID SOLUTION: Store Both Reference + Snapshot');
    console.log('   Store ObjectId for active addresses + embedded snapshot for historical data');
    console.log('   Pros: Best of both worlds');
    console.log('   Cons: More complex implementation');
    
    console.log('\n3️⃣ SOFT DELETE SOLUTION: Mark Addresses as Deleted');
    console.log('   Add "deletedAt" field instead of physically removing addresses');
    console.log('   Pros: Simple, preserves references');
    console.log('   Cons: Database grows over time');

    console.log('\n🎯 CURRENT SYSTEM STATUS:');
    if (orphanedCount === 0 && orders.every(order => order.address && order.address.fullName)) {
      console.log('✅ System appears to be working correctly - addresses are embedded or properly populated');
    } else {
      console.log('❌ System has referential integrity issues that need immediate attention');
    }

    console.log('\n✅ Address deletion impact test completed!');

  } catch (error) {
    console.error('❌ Error during address deletion test:', error.response?.data || error.message);
  }
}

// Run test
testAddressDeletionImpact();
