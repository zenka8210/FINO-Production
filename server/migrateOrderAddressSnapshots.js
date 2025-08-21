require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Order = require('./models/OrderSchema');
const Address = require('./models/AddressSchema');

// Migration to create address snapshots for existing orders
async function migrateOrderAddressSnapshots() {
  try {
    console.log('🔧 ORDER ADDRESS SNAPSHOT MIGRATION');
    console.log('====================================');
    
    // Connect to database  
    const dbUri = process.env.DB_URI;
    await mongoose.connect(dbUri);
    console.log('📊 Connected to MongoDB Atlas database');

    // 1. Find orders that don't have addressSnapshot yet
    console.log('\n1️⃣ Finding orders without address snapshots...');
    const ordersWithoutSnapshot = await Order.find({ 
      addressSnapshot: { $exists: false }
    }).populate('address').limit(50); // Limit for safety

    console.log(`Found ${ordersWithoutSnapshot.length} orders without address snapshots`);

    if (ordersWithoutSnapshot.length === 0) {
      console.log('✅ All orders already have address snapshots or no orders exist');
      return;
    }

    // 2. Create snapshots for each order
    console.log('\n2️⃣ Creating address snapshots...');
    
    let successCount = 0;
    let failureCount = 0;
    let addressNotFoundCount = 0;

    for (const order of ordersWithoutSnapshot) {
      try {
        console.log(`\n🔍 Processing order ${order.orderCode}...`);
        
        if (order.address && order.address._id) {
          // Address reference exists and populated
          const addressSnapshot = {
            fullName: order.address.fullName,
            phone: order.address.phone,
            addressLine: order.address.addressLine,
            ward: order.address.ward,
            district: order.address.district,
            city: order.address.city,
            postalCode: order.address.postalCode,
            isDefault: order.address.isDefault || false,
            snapshotCreatedAt: new Date()
          };

          // Update order with snapshot
          await Order.findByIdAndUpdate(order._id, { 
            addressSnapshot: addressSnapshot 
          });

          console.log(`   ✅ Created snapshot: ${addressSnapshot.fullName} - ${addressSnapshot.addressLine}`);
          successCount++;

        } else {
          // Address reference is broken, try to find any address for this user
          console.log(`   ⚠️  Address reference broken for order ${order.orderCode}`);
          
          const userAddresses = await Address.find({ user: order.user, isActive: { $ne: false } });
          
          if (userAddresses.length > 0) {
            // Use first available address as fallback
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

            console.log(`   ✅ Created fallback snapshot: ${addressSnapshot.fullName} - ${addressSnapshot.addressLine}`);
            successCount++;
          } else {
            console.log(`   ❌ No addresses found for user, cannot create snapshot`);
            addressNotFoundCount++;
          }
        }

      } catch (error) {
        console.error(`   ❌ Error processing order ${order.orderCode}:`, error.message);
        failureCount++;
      }
    }

    // 3. Summary
    console.log('\n3️⃣ MIGRATION SUMMARY:');
    console.log('======================');
    console.log(`📊 Total orders processed: ${ordersWithoutSnapshot.length}`);
    console.log(`✅ Successfully created snapshots: ${successCount}`);
    console.log(`❌ Failed to create snapshots: ${failureCount}`);
    console.log(`🔍 No address data found: ${addressNotFoundCount}`);

    // 4. Verification
    console.log('\n4️⃣ Verifying migration...');
    const remainingWithoutSnapshot = await Order.countDocuments({ 
      addressSnapshot: { $exists: false }
    });
    
    console.log(`Orders still without snapshots: ${remainingWithoutSnapshot}`);

    if (remainingWithoutSnapshot === 0) {
      console.log('🎉 All orders now have address snapshots!');
    } else if (remainingWithoutSnapshot < ordersWithoutSnapshot.length) {
      console.log(`✅ Migration partially successful. ${ordersWithoutSnapshot.length - remainingWithoutSnapshot} orders migrated.`);
      console.log('💡 Run this script again to process remaining orders (if needed)');
    }

    console.log('\n🛡️  BENEFITS OF ADDRESS SNAPSHOTS:');
    console.log('===================================');
    console.log('✅ Order history preserved even if user deletes addresses');
    console.log('✅ Admin can always see delivery information');
    console.log('✅ Customer support can track historical orders');
    console.log('✅ Audit trail for all deliveries maintained');

    console.log('\n✅ Address snapshot migration completed!');

  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Database connection closed');
  }
}

// Run migration
migrateOrderAddressSnapshots();
