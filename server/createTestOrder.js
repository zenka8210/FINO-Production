const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';
const ADMIN_CREDENTIALS = {
  email: 'huy.nguyen.huu@gmail.com',
  password: 'huuhuy82'
};

async function createTestOrder() {
  try {
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    const adminToken = loginResponse.data.data.token;
    const headers = { 'Authorization': `Bearer ${adminToken}` };
    
    console.log('📦 Creating a test order for today...');
    
    // Get a product first
    const productsResponse = await axios.get(`${BASE_URL}/products?limit=1`, { headers });
    const product = productsResponse.data.data?.[0];
    
    if (!product) {
      console.log('❌ No products found');
      return;
    }
    
    // Get user ID
    const usersResponse = await axios.get(`${BASE_URL}/users?limit=1`, { headers });
    const user = usersResponse.data.data?.documents?.[0] || usersResponse.data.data?.[0];
    
    if (!user) {
      console.log('❌ No users found');
      return;
    }
    
    console.log('Found product:', product.name);
    console.log('Found user:', user.name);
    
    // Create order data
    const orderData = {
      user: user._id,
      items: [{
        productVariant: product._id,
        quantity: 1,
        price: product.price || 100000,
        totalPrice: product.price || 100000
      }],
      address: {
        fullName: user.name,
        phone: user.phone || '0123456789',
        addressLine: '123 Test Street',
        ward: 'Test Ward',
        district: 'Test District', 
        city: 'Test City'
      },
      paymentMethod: 'COD',
      shippingFee: 30000,
      total: (product.price || 100000) + 30000,
      finalTotal: (product.price || 100000) + 30000,
      paymentStatus: 'paid',
      status: 'delivered'
    };
    
    const createResponse = await axios.post(`${BASE_URL}/orders`, orderData, { headers });
    console.log('✅ Test order created:', createResponse.data.data.orderCode);
    
    // Now check today's orders count
    console.log('📊 Checking today\'s orders...');
    const ordersResponse = await axios.get(`${BASE_URL}/orders?limit=100`, { headers });
    const orders = ordersResponse.data.data?.documents || ordersResponse.data.data || [];
    
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= todayStart;
    });
    
    console.log(`📊 Orders created today: ${todayOrders.length}`);
    todayOrders.forEach(order => {
      console.log(`- ${order.orderCode} | ${new Date(order.createdAt).toLocaleString()} | ${order.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

if (require.main === module) {
  createTestOrder();
}
