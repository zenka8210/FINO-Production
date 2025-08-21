const Order = require('./models/OrderSchema');
const { connectDB, disconnectDB } = require('./config/db');

async function debugOrderData() {
  try {
    console.log('🔍 DEBUG ORDER DATA MODIFICATION');
    console.log('=================================');
    
    await connectDB();
    
    const orderId = '68a6dfd7f3db2b37c070a565';
    console.log(`\n📋 Testing order: ${orderId}`);
    
    // Test 1: Raw query without populate
    console.log('\n1️⃣ RAW DATA TEST:');
    const rawOrder = await Order.findById(orderId);
    console.log('Raw address field:', rawOrder.address);
    console.log('Raw addressSnapshot exists:', !!rawOrder.addressSnapshot);
    if (rawOrder.addressSnapshot) {
      console.log('Snapshot data:', {
        fullName: rawOrder.addressSnapshot.fullName,
        phone: rawOrder.addressSnapshot.phone
      });
    }
    
    // Test 2: With populate
    console.log('\n2️⃣ POPULATE TEST:');
    const populatedOrder = await Order.findById(orderId)
      .populate('address')
      .populate('user', 'name email');
    
    console.log('Populated address:', populatedOrder.address);
    console.log('Address populated as null?:', populatedOrder.address === null);
    
    // Test 3: Manual modification after populate
    console.log('\n3️⃣ MANUAL MODIFICATION TEST:');
    if (!populatedOrder.address && populatedOrder.addressSnapshot) {
      console.log('📝 Applying fallback manually...');
      
      // Try direct assignment
      populatedOrder.address = {
        _id: null,
        fullName: populatedOrder.addressSnapshot.fullName,
        phone: populatedOrder.addressSnapshot.phone,
        addressLine: populatedOrder.addressSnapshot.addressLine,
        ward: populatedOrder.addressSnapshot.ward,
        district: populatedOrder.addressSnapshot.district,
        city: populatedOrder.addressSnapshot.city,
        isSnapshot: true
      };
      
      console.log('✅ Manual assignment done!');
      console.log('Address after manual fix:', {
        fullName: populatedOrder.address.fullName,
        phone: populatedOrder.address.phone,
        isSnapshot: populatedOrder.address.isSnapshot
      });
    }
    
    // Test 4: Convert to JSON and back
    console.log('\n4️⃣ JSON CONVERSION TEST:');
    const orderJSON = populatedOrder.toJSON();
    console.log('Address in JSON:', !!orderJSON.address);
    if (orderJSON.address) {
      console.log('JSON address data:', {
        fullName: orderJSON.address.fullName,
        isSnapshot: orderJSON.address.isSnapshot
      });
    }
    
    await disconnectDB();
    console.log('\n✅ Debug completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugOrderData();
