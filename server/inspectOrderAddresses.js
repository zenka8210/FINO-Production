const mongoose = require('mongoose');
const Order = require('./models/OrderSchema');
const Address = require('./models/AddressSchema'); // Import Address schema for populate

// Direct database inspection for address issues
async function inspectOrderAddresses() {
  try {
    console.log('🔍 DIRECT DATABASE INSPECTION');
    console.log('===============================');
    
    // Connect to database
    const dbUri = 'mongodb+srv://finodev01:0101001@cluster0.pfafcr6.mongodb.net/asm?retryWrites=true&w=majority';
    await mongoose.connect(dbUri);
    console.log('📊 Connected to MongoDB Atlas database');

    // 1. Get sample orders to inspect structure
    console.log('\n1️⃣ Inspecting order structure in database...');
    const sampleOrders = await Order.find({}).limit(5).select('orderCode user address').lean();
    
    console.log('\nSample orders from database:');
    sampleOrders.forEach((order, index) => {
      console.log(`${index + 1}. Order ${order.orderCode}:`);
      console.log(`   User: ${order.user}`);
      console.log(`   Address: ${order.address}`);
      console.log(`   Address type: ${typeof order.address}`);
    });

    // 2. Count orders by address status
    console.log('\n2️⃣ Counting orders by address status...');
    const totalOrders = await Order.countDocuments({});
    const ordersWithAddress = await Order.countDocuments({ address: { $ne: null, $exists: true } });
    const ordersWithNullAddress = await Order.countDocuments({ address: null });
    const ordersWithMissingAddress = await Order.countDocuments({ address: { $exists: false } });
    
    console.log(`Total orders: ${totalOrders}`);
    console.log(`Orders with address: ${ordersWithAddress}`);
    console.log(`Orders with null address: ${ordersWithNullAddress}`);
    console.log(`Orders missing address field: ${ordersWithMissingAddress}`);

    // 3. Test order populate to see what happens
    console.log('\n3️⃣ Testing address population...');
    const ordersWithPopulate = await Order.find({}).limit(5).populate('address').select('orderCode address');
    
    console.log('\nOrders with populate:');
    ordersWithPopulate.forEach((order, index) => {
      console.log(`${index + 1}. Order ${order.orderCode}:`);
      console.log(`   Address populated: ${order.address ? 'YES' : 'NO'}`);
      if (order.address) {
        console.log(`   Address data: ${order.address.fullName} - ${order.address.addressLine}`);
      } else {
        console.log(`   Address data: NULL`);
      }
    });

    // 4. Check for specific user orders (the test user)
    console.log('\n4️⃣ Checking specific user orders...');
    const userOrders = await Order.find({ user: new mongoose.Types.ObjectId('6881100e907049e948f7e020') })
                                 .limit(5)
                                 .populate('address')
                                 .select('orderCode address');
    
    console.log(`Found ${userOrders.length} orders for test user`);
    userOrders.forEach((order, index) => {
      console.log(`${index + 1}. Order ${order.orderCode}:`);
      console.log(`   Address ObjectId: ${order.address ? order.address._id || 'HAS DATA BUT NO _ID' : 'NULL'}`);
      if (order.address) {
        console.log(`   Address details: ${order.address.fullName || 'NO FULLNAME'} - ${order.address.addressLine || 'NO ADDRESS LINE'}`);
      }
    });

    console.log('\n✅ Database inspection completed!');

  } catch (error) {
    console.error('❌ Error during database inspection:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Database connection closed');
  }
}

// Run the inspection
inspectOrderAddresses();
