const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000';

const ADMIN_CREDENTIALS = {
  email: 'huy.nguyen.huu@gmail.com',
  password: 'huuhuy82'
};

async function createCODTestOrder() {
  try {
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, ADMIN_CREDENTIALS);
    const adminToken = loginResponse.data.data.token;
    const headers = { 'Authorization': `Bearer ${adminToken}` };

    console.log('✅ Admin login successful');

    // Get available products first
    console.log('📦 Fetching products...');
    const productsResponse = await axios.get(`${BASE_URL}/api/products?limit=5`, { headers });
    const products = productsResponse.data.data.data;
    
    if (products.length === 0) {
      console.log('❌ No products found');
      return;
    }

    const product = products[0];
    console.log(`📋 Using product: ${product.name} (${product._id})`);
    console.log(`📋 Product variants:`, product.variants?.length || 0);
    
    // Use first variant if available, otherwise null
    const variant = product.variants && product.variants.length > 0 ? product.variants[0]._id : undefined;

    // Get payment methods to find COD
    console.log('💳 Fetching payment methods...');
    const paymentMethodsResponse = await axios.get(`${BASE_URL}/api/payment-methods`, { headers });
    
    const paymentMethods = paymentMethodsResponse.data.data.data || [];
    console.log('💳 Found payment methods:', paymentMethods.map(pm => pm.method));
    
    const codPaymentMethod = paymentMethods.find(pm => 
      pm.method?.toLowerCase() === 'cod' || pm.method?.toLowerCase() === 'tiền mặt'
    );
    
    if (!codPaymentMethod) {
      console.log('❌ COD payment method not found');
      console.log('Available payment methods:', paymentMethods.map(pm => pm.method));
      return;
    }

    console.log(`💰 Found COD payment method: ${codPaymentMethod.method} (${codPaymentMethod._id})`);

    // Create a test order (without variant for simple product)
    const orderData = {
      items: [{
        product: product._id,
        quantity: 1,
        price: product.price
      }],
      address: {
        fullName: 'Test User COD',
        phone: '0123456789',
        addressLine: '123 Test Street',
        ward: 'Test Ward',
        district: 'Test District', 
        city: 'Ho Chi Minh'
      },
      paymentMethod: codPaymentMethod._id,
      voucher: null,
      notes: 'Test COD order for auto-payment logic testing'
    };

    console.log('🛒 Creating COD test order...');
    const createOrderResponse = await axios.post(`${BASE_URL}/api/orders`, orderData, { headers });
    
    if (createOrderResponse.data.success) {
      const newOrder = createOrderResponse.data.data;
      console.log('✅ COD test order created successfully!');
      console.log(`- Order Code: ${newOrder.orderCode}`);
      console.log(`- Order ID: ${newOrder._id}`);
      console.log(`- Status: ${newOrder.status}`);
      console.log(`- Payment Status: ${newOrder.paymentStatus}`);
      console.log(`- Payment Method: ${newOrder.paymentMethod?.method || 'Unknown'}`);
      console.log(`- Total: ${newOrder.finalTotal?.toLocaleString('vi-VN')} VND`);
      
      console.log('\n🎯 This order can now be used for testing COD auto-payment logic');
      console.log(`   Run: node testCODAPI.js`);
      
    } else {
      console.log('❌ Failed to create order:', createOrderResponse.data);
    }

  } catch (error) {
    console.error('❌ Error creating COD test order:');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the creation
createCODTestOrder();
