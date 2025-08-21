const mongoose = require('mongoose');
const Order = require('./models/OrderSchema');
require('./config/db');

setTimeout(async () => {
  try {
    // Get today's date
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    console.log('Today start:', todayStart);
    
    // Find orders created today
    const todayOrders = await Order.find({
      createdAt: { $gte: todayStart }
    }).select('orderCode createdAt status paymentStatus finalTotal');
    
    console.log('Orders created today:', todayOrders.length);
    todayOrders.forEach(order => {
      console.log(`- ${order.orderCode} | ${order.createdAt} | ${order.status} | ${order.paymentStatus} | ${order.finalTotal}đ`);
    });
    
    // Also check recent orders for comparison
    const recentOrders = await Order.find({}).sort({ createdAt: -1 }).limit(10).select('orderCode createdAt status paymentStatus finalTotal');
    console.log('\nRecent 10 orders:');
    recentOrders.forEach(order => {
      console.log(`- ${order.orderCode} | ${order.createdAt} | ${order.status} | ${order.paymentStatus} | ${order.finalTotal}đ`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}, 2000);
