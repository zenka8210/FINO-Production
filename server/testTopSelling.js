const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

// Connect manually without ES modules issues
mongoose.connect('mongodb+srv://finodev01:0101001@cluster0.pfafcr6.mongodb.net/asm?retryWrites=true&w=majority');

const orderSchema = new mongoose.Schema({}, { strict: false, collection: 'orders' });
const Order = mongoose.model('Order', orderSchema);

async function testTopSellingAggregation() {
  try {
    console.log('🔍 Testing top selling products aggregation...');
    
    // First check total orders
    const totalOrders = await Order.countDocuments();
    console.log('📊 Total orders:', totalOrders);
    
    if (totalOrders === 0) {
      console.log('❌ No orders found! Need to create test data.');
      process.exit(1);
    }
    
    // Check orders with items
    const ordersWithItems = await Order.countDocuments({ items: { $exists: true, $ne: [] } });
    console.log('📦 Orders with items:', ordersWithItems);
    
    // Check recent orders (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentOrders = await Order.countDocuments({
      status: { $nin: ['cancelled'] },
      createdAt: { $gte: thirtyDaysAgo }
    });
    console.log('📅 Recent orders (30 days):', recentOrders);
    
    // If no recent orders, check all orders
    if (recentOrders === 0) {
      console.log('⚠️ No recent orders, checking all orders...');
      const allOrdersWithItems = await Order.countDocuments({
        status: { $nin: ['cancelled'] },
        items: { $exists: true, $ne: [] }
      });
      console.log('📋 All non-cancelled orders with items:', allOrdersWithItems);
      
      if (allOrdersWithItems > 0) {
        console.log('🔄 Running aggregation on all orders...');
        
        const topSellingAllTime = await Order.aggregate([
          {
            $match: {
              status: { $nin: ['cancelled'] },
              items: { $exists: true, $ne: [] }
            }
          },
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.product',
              totalQuantity: { $sum: '$items.quantity' },
              totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
              orderCount: { $sum: 1 }
            }
          },
          {
            $sort: { 
              totalQuantity: -1,
              totalRevenue: -1
            }
          },
          { $limit: 10 }
        ]);
        
        console.log('\n📈 Top selling products (all time):');
        console.log('Found', topSellingAllTime.length, 'products');
        
        if (topSellingAllTime.length > 0) {
          topSellingAllTime.forEach((item, idx) => {
            console.log(`${idx + 1}. Product: ${item._id}, Qty: ${item.totalQuantity}, Revenue: ${item.totalRevenue}, Orders: ${item.orderCount}`);
          });
        }
      }
    } else {
      console.log('🔄 Running aggregation on recent orders...');
      
        const topSellingRecent = await Order.aggregate([
          {
            $match: {
              status: { $nin: ['cancelled'] },
              createdAt: { $gte: thirtyDaysAgo },
              items: { $exists: true, $ne: [] }
            }
          },
          { $unwind: '$items' },
          {
            $match: {
              'items.productVariant': { $exists: true, $ne: null }
            }
          },
          {
            $group: {
              _id: '$items.productVariant', // Sử dụng productVariant
              totalQuantity: { $sum: '$items.quantity' },
              totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
              orderCount: { $sum: 1 }
            }
          },
          {
            $sort: { 
              totalQuantity: -1,
              totalRevenue: -1
            }
          },
          { $limit: 10 }
        ]);      console.log('\n📈 Top selling products (30 days):');
      console.log('Found', topSellingRecent.length, 'products');
      
      if (topSellingRecent.length > 0) {
        topSellingRecent.forEach((item, idx) => {
          console.log(`${idx + 1}. Product: ${item._id}, Qty: ${item.totalQuantity}, Revenue: ${item.totalRevenue}, Orders: ${item.orderCount}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

setTimeout(testTopSellingAggregation, 2000);
