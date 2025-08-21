require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Order = require('./models/OrderSchema');

// Test if specific order has addressSnapshot
async function testOrderAddressSnapshot() {
  try {
    console.log('🔍 TEST ORDER ADDRESS SNAPSHOT');
    console.log('==============================');
    
    // Connect to database  
    const dbUri = process.env.DB_URI;
    await mongoose.connect(dbUri);
    console.log('📊 Connected to MongoDB Atlas database');

    // Test specific order from debug
    const orderId = '68a6dfd7f3db2b37c070a565';
    
    console.log(`\n🔍 Checking order: ${orderId}`);
    
    // Get order without any population to see raw data
    const rawOrder = await Order.findById(orderId);
    
    if (!rawOrder) {
      console.log('❌ Order not found');
      return;
    }

    console.log(`\n📋 Raw Order Data:`);
    console.log(`   Order Code: ${rawOrder.orderCode}`);
    console.log(`   Has address field: ${rawOrder.address ? 'YES' : 'NO'}`);
    console.log(`   Address value: ${rawOrder.address}`);
    console.log(`   Has addressSnapshot: ${rawOrder.addressSnapshot ? 'YES' : 'NO'}`);
    
    if (rawOrder.addressSnapshot) {
      console.log(`   Snapshot data:`, rawOrder.addressSnapshot);
    } else {
      console.log(`   No snapshot data found`);
    }

    // Now test populated version (like service does)
    const populatedOrder = await Order.findById(orderId)
      .populate('user', 'name email phone')
      .populate('address')
      .populate('voucher')
      .populate('paymentMethod');

    console.log(`\n📋 Populated Order Data:`);
    console.log(`   Address populated: ${populatedOrder.address ? 'YES' : 'NO'}`);
    console.log(`   AddressSnapshot exists: ${populatedOrder.addressSnapshot ? 'YES' : 'NO'}`);
    
    if (populatedOrder.address) {
      console.log(`   Populated address:`, populatedOrder.address);
    }
    
    if (populatedOrder.addressSnapshot) {
      console.log(`   Snapshot in populated:`, populatedOrder.addressSnapshot);
    }

    // Test the service fallback logic manually
    console.log(`\n🔄 Testing fallback logic:`);
    if (!populatedOrder.address && populatedOrder.addressSnapshot) {
      console.log(`✅ Should trigger fallback: address is null, snapshot exists`);
      
      // Create mock address like service does
      const mockAddress = {
        _id: null,
        fullName: populatedOrder.addressSnapshot.fullName,
        phone: populatedOrder.addressSnapshot.phone,
        addressLine: populatedOrder.addressSnapshot.addressLine,
        ward: populatedOrder.addressSnapshot.ward,
        district: populatedOrder.addressSnapshot.district,
        city: populatedOrder.addressSnapshot.city,
        postalCode: populatedOrder.addressSnapshot.postalCode,
        isDefault: populatedOrder.addressSnapshot.isDefault,
        isSnapshot: true,
        snapshotCreatedAt: populatedOrder.addressSnapshot.snapshotCreatedAt
      };
      
      console.log(`   Mock address created:`, mockAddress);
    } else {
      console.log(`❌ Fallback not needed or not possible:`);
      console.log(`     Address exists: ${!!populatedOrder.address}`);
      console.log(`     Snapshot exists: ${!!populatedOrder.addressSnapshot}`);
    }

    console.log('\n✅ Order address snapshot test completed!');

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Database connection closed');
  }
}

// Run test
testOrderAddressSnapshot();
