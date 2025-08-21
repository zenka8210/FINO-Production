require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Order = require('./models/OrderSchema');
const Address = require('./models/AddressSchema');

// Fix specific order's addressSnapshot
async function fixOrderAddressSnapshot() {
  try {
    console.log('🔧 FIX ORDER ADDRESS SNAPSHOT');
    console.log('=============================');
    
    // Connect to database  
    const dbUri = process.env.DB_URI;
    await mongoose.connect(dbUri);
    console.log('📊 Connected to MongoDB Atlas database');

    // Test specific order from debug
    const orderId = '68a6dfd7f3db2b37c070a565';
    
    console.log(`\n🔍 Fixing order: ${orderId}`);
    
    // Get order
    const order = await Order.findById(orderId);
    
    if (!order) {
      console.log('❌ Order not found');
      return;
    }

    console.log(`Order: ${order.orderCode}`);
    console.log(`Address ID: ${order.address}`);
    console.log(`Current snapshot:`, order.addressSnapshot);

    // Try to find the address
    const address = await Address.findById(order.address);
    
    if (address) {
      console.log(`✅ Address found:`, address);
      
      // Create proper snapshot
      const addressSnapshot = {
        fullName: address.fullName,
        phone: address.phone,
        addressLine: address.addressLine,
        ward: address.ward,
        district: address.district,
        city: address.city,
        postalCode: address.postalCode,
        isDefault: address.isDefault || false,
        snapshotCreatedAt: new Date()
      };
      
      // Update order
      await Order.findByIdAndUpdate(orderId, { addressSnapshot });
      console.log(`✅ Updated snapshot:`, addressSnapshot);
      
    } else {
      console.log(`❌ Address ${order.address} not found - was deleted`);
      
      // Find user's current default address as fallback
      const userAddresses = await Address.find({ 
        user: order.user, 
        isActive: { $ne: false }
      });
      
      if (userAddresses.length > 0) {
        const fallbackAddr = userAddresses.find(addr => addr.isDefault) || userAddresses[0];
        
        const addressSnapshot = {
          fullName: fallbackAddr.fullName,
          phone: fallbackAddr.phone,
          addressLine: fallbackAddr.addressLine,
          ward: fallbackAddr.ward,
          district: fallbackAddr.district,
          city: fallbackAddr.city,
          postalCode: fallbackAddr.postalCode,
          isDefault: fallbackAddr.isDefault || false,
          snapshotCreatedAt: new Date()
        };
        
        await Order.findByIdAndUpdate(orderId, { addressSnapshot });
        console.log(`✅ Created fallback snapshot:`, addressSnapshot);
      } else {
        console.log(`❌ No addresses found for user`);
      }
    }

    // Verify the fix
    const updatedOrder = await Order.findById(orderId);
    console.log(`\n✅ Final snapshot:`, updatedOrder.addressSnapshot);

    console.log('\n✅ Order address snapshot fix completed!');

  } catch (error) {
    console.error('❌ Error during fix:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Database connection closed');
  }
}

// Run fix
fixOrderAddressSnapshot();
