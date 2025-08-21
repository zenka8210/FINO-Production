const mongoose = require('mongoose');
const Order = require('./models/OrderSchema');
const Address = require('./models/AddressSchema');
const User = require('./models/UserSchema');

// Migration script to fix order address data integrity issues
async function fixOrderAddressIntegrity() {
  try {
    console.log('🔧 ORDER ADDRESS INTEGRITY FIX');
    console.log('=================================');
    
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/DATN');
    console.log('📊 Connected to database');

    // 1. Find all orders with null addresses
    console.log('\n1️⃣ Finding orders with missing address data...');
    const orphanedOrders = await Order.find({ address: null });
    console.log(`Found ${orphanedOrders.length} orders with null addresses`);

    if (orphanedOrders.length === 0) {
      console.log('✅ No orphaned orders found');
      return;
    }

    // 2. For each orphaned order, try to restore address from user's default address
    console.log('\n2️⃣ Attempting to restore addresses...');
    
    let fixedCount = 0;
    let unfixableCount = 0;
    
    for (const order of orphanedOrders) {
      console.log(`\n🔍 Processing order ${order.orderCode}...`);
      
      // Get user's current default address
      const user = await User.findById(order.user);
      if (!user) {
        console.log(`   ❌ User not found for order ${order.orderCode}`);
        unfixableCount++;
        continue;
      }
      
      // Find user's default address
      const defaultAddress = await Address.findOne({ 
        user: user._id, 
        isDefault: true,
        isActive: { $ne: false }
      });
      
      if (!defaultAddress) {
        // Try to find any address for this user
        const anyAddress = await Address.findOne({ 
          user: user._id,
          isActive: { $ne: false }
        });
        
        if (!anyAddress) {
          console.log(`   ❌ No addresses found for user ${user.name}`);
          unfixableCount++;
          continue;
        }
        
        // Use any available address
        order.address = anyAddress._id;
        await order.save();
        console.log(`   ✅ Restored with non-default address: ${anyAddress.fullName}`);
        fixedCount++;
        
      } else {
        // Use default address
        order.address = defaultAddress._id;
        await order.save();
        console.log(`   ✅ Restored with default address: ${defaultAddress.fullName}`);
        fixedCount++;
      }
    }

    // 3. Summary
    console.log('\n3️⃣ RESTORATION SUMMARY:');
    console.log('========================');
    console.log(`📊 Total orphaned orders: ${orphanedOrders.length}`);
    console.log(`✅ Successfully fixed: ${fixedCount}`);
    console.log(`❌ Unfixable orders: ${unfixableCount}`);

    if (unfixableCount > 0) {
      console.log('\n⚠️  Some orders could not be fixed due to missing user address data');
      console.log('   These orders need manual review and address creation');
    }

    // 4. Verify the fix
    console.log('\n4️⃣ Verifying fix...');
    const remainingOrphans = await Order.find({ address: null });
    console.log(`Remaining orphaned orders: ${remainingOrphans.length}`);

    if (remainingOrphans.length === 0) {
      console.log('🎉 All orders now have address references!');
    }

    // 5. Recommendations for preventing future issues
    console.log('\n5️⃣ RECOMMENDATIONS FOR PREVENTION:');
    console.log('=====================================');
    console.log('1. Implement address snapshot in order schema');
    console.log('2. Add validation to prevent null addresses in orders');
    console.log('3. Implement soft delete for addresses instead of hard delete');
    console.log('4. Add database constraints to ensure referential integrity');

    console.log('\n✅ Address integrity fix completed!');

  } catch (error) {
    console.error('❌ Error during address integrity fix:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Database connection closed');
  }
}

// Run the fix
fixOrderAddressIntegrity();
