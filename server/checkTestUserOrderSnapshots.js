require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Order = require('./models/OrderSchema');

// Check specific test user orders for snapshots
async function checkTestUserOrderSnapshots() {
  try {
    console.log('🔍 TEST USER ORDER SNAPSHOT CHECK');
    console.log('=================================');
    
    // Connect to database  
    const dbUri = process.env.DB_URI;
    await mongoose.connect(dbUri);
    console.log('📊 Connected to MongoDB Atlas database');

    // Test user ID from API response
    const testUserId = '6881100e907049e948f7e020';
    
    console.log(`\n🔍 Checking orders for test user: ${testUserId}`);
    
    // Get all orders for test user
    const userOrders = await Order.find({ user: testUserId })
      .select('orderCode address addressSnapshot createdAt')
      .sort({ createdAt: -1 });

    console.log(`Found ${userOrders.length} orders for test user`);

    if (userOrders.length === 0) {
      console.log('❌ No orders found for test user');
      return;
    }

    console.log('\n📋 Order Analysis:');
    console.log('==================');

    userOrders.forEach((order, index) => {
      console.log(`\n${index + 1}. Order: ${order.orderCode}`);
      console.log(`   Created: ${order.createdAt}`);
      console.log(`   Address ObjectId: ${order.address ? order.address : 'NULL'}`);
      console.log(`   Has Snapshot: ${order.addressSnapshot ? 'YES' : 'NO'}`);
      
      if (order.addressSnapshot) {
        console.log(`   Snapshot: ${order.addressSnapshot.fullName} - ${order.addressSnapshot.addressLine}`);
      }
    });

    // Count snapshots
    const ordersWithSnapshot = userOrders.filter(order => order.addressSnapshot);
    const ordersWithoutSnapshot = userOrders.filter(order => !order.addressSnapshot);

    console.log('\n📊 Summary:');
    console.log(`Orders with snapshots: ${ordersWithSnapshot.length}`);
    console.log(`Orders without snapshots: ${ordersWithoutSnapshot.length}`);

    if (ordersWithoutSnapshot.length > 0) {
      console.log('\n⚠️  Orders without snapshots:');
      ordersWithoutSnapshot.forEach(order => {
        console.log(`   - ${order.orderCode} (${order.createdAt})`);
      });
      
      console.log('\n💡 These orders need migration. Creating snapshots now...');
      
      // Try to create snapshots for missing ones
      for (const order of ordersWithoutSnapshot) {
        try {
          // Find any address for this user
          const Address = mongoose.model('Address');
          const userAddresses = await Address.find({ user: testUserId, isActive: { $ne: false } });
          
          if (userAddresses.length > 0) {
            const fallbackAddress = userAddresses.find(addr => addr.isDefault) || userAddresses[0];
            
            const addressSnapshot = {
              fullName: fallbackAddress.fullName,
              phone: fallbackAddress.phone,
              addressLine: fallbackAddress.addressLine,
              ward: fallbackAddress.ward,
              district: fallbackAddress.district,
              city: fallbackAddress.city,
              postalCode: fallbackAddress.postalCode,
              isDefault: fallbackAddress.isDefault || false,
              snapshotCreatedAt: new Date()
            };

            await Order.findByIdAndUpdate(order._id, { 
              addressSnapshot: addressSnapshot 
            });

            console.log(`   ✅ Created snapshot for ${order.orderCode}: ${addressSnapshot.fullName}`);
          } else {
            console.log(`   ❌ No addresses found for ${order.orderCode}`);
          }
        } catch (error) {
          console.error(`   ❌ Error creating snapshot for ${order.orderCode}:`, error.message);
        }
      }
    }

    console.log('\n✅ Test user order snapshot check completed!');

  } catch (error) {
    console.error('❌ Error during check:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Database connection closed');
  }
}

// Run check
checkTestUserOrderSnapshots();
