/**
 * @fileoverview Create Test Data for Admin Sort Testing
 * @description Script to create test data for admin sort functionality
 * @author DATN Project
 * @version 1.0.0
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'password123'
};

let authToken = null;

/**
 * Login and get admin token
 */
async function loginAdmin() {
  try {
    console.log('🔐 Logging in as admin...');
    const response = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    
    if (response.data.success && response.data.data.token) {
      authToken = response.data.data.token;
      console.log('✅ Admin login successful');
      return true;
    }
    return false;
  } catch (error) {
    console.log('❌ Admin login error:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Create test users
 */
async function createTestUsers() {
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  console.log('👥 Creating test users...');
  
  const users = [
    {
      email: 'testuser1@example.com',
      password: 'password123',
      name: 'Test User 1',
      role: 'customer'
    },
    {
      email: 'testuser2@example.com',
      password: 'password123',
      name: 'Test User 2',
      role: 'customer'
    },
    {
      email: 'testuser3@example.com',
      password: 'password123',
      name: 'Test User 3',
      role: 'customer'
    }
  ];

  for (const user of users) {
    try {
      const response = await axios.post(`${BASE_URL}/auth/register`, user);
      if (response.data.success) {
        console.log(`  ✅ Created user: ${user.name}`);
      }
    } catch (error) {
      if (error.response?.data?.message?.includes('đã tồn tại')) {
        console.log(`  ⚠️  User ${user.name} already exists`);
      } else {
        console.log(`  ❌ Failed to create user ${user.name}:`, error.response?.data?.message || error.message);
      }
    }
  }
}

/**
 * Create test reviews
 */
async function createTestReviews() {
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  console.log('⭐ Creating test reviews...');
  
  try {
    // First get some products to review
    const productsResponse = await axios.get(`${BASE_URL}/products?limit=3`, { headers });
    const products = productsResponse.data.data;
    
    if (!products || products.length === 0) {
      console.log('  ⚠️  No products found to create reviews');
      return;
    }

    // Create reviews for each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const review = {
        product: product._id,
        rating: Math.floor(Math.random() * 5) + 1,
        comment: `This is a test review ${i + 1} for ${product.name}`,
        isVerified: true
      };

      try {
        const response = await axios.post(`${BASE_URL}/reviews`, review, { headers });
        if (response.data.success) {
          console.log(`  ✅ Created review for product: ${product.name}`);
        }
      } catch (error) {
        console.log(`  ❌ Failed to create review for ${product.name}:`, error.response?.data?.message || error.message);
      }
    }
  } catch (error) {
    console.log('  ❌ Error creating reviews:', error.response?.data?.message || error.message);
  }
}

/**
 * Create test orders
 */
async function createTestOrders() {
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  console.log('🛍️ Creating test orders...');
  
  try {
    // Get some products and users
    const [productsResponse, usersResponse] = await Promise.all([
      axios.get(`${BASE_URL}/products?limit=3`, { headers }),
      axios.get(`${BASE_URL}/users?limit=3`, { headers })
    ]);

    const products = productsResponse.data.data;
    const users = Array.isArray(usersResponse.data.data) ? usersResponse.data.data : (usersResponse.data.data?.data || []);

    if (!products || products.length === 0) {
      console.log('  ⚠️  No products found to create orders');
      return;
    }

    if (!users || users.length === 0) {
      console.log('  ⚠️  No users found to create orders');
      return;
    }

    // Create sample addresses first
    const addresses = [];
    for (let i = 0; i < Math.min(users.length, 3); i++) {
      const user = users[i];
      if (user.role === 'customer') {
        const address = {
          user: user._id,
          fullName: user.name,
          phone: '0123456789',
          address: `Test Address ${i + 1}`,
          ward: 'Test Ward',
          district: 'Test District',
          province: 'Test Province',
          isDefault: true
        };

        try {
          const addressResponse = await axios.post(`${BASE_URL}/addresses`, address, { headers });
          if (addressResponse.data.success) {
            addresses.push(addressResponse.data.data);
            console.log(`  ✅ Created address for user: ${user.name}`);
          }
        } catch (error) {
          console.log(`  ❌ Failed to create address for ${user.name}:`, error.response?.data?.message || error.message);
        }
      }
    }

    // Create orders if we have addresses
    if (addresses.length > 0) {
      for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i];
        const product = products[i % products.length];
        
        const order = {
          items: [{
            productVariant: product._id, // This might need to be adjusted based on your schema
            quantity: Math.floor(Math.random() * 3) + 1,
            price: product.price || 100000
          }],
          address: address._id,
          paymentMethod: '507f1f77bcf86cd799439011', // Default payment method ID
          shippingFee: 50000
        };

        try {
          const response = await axios.post(`${BASE_URL}/orders`, order, { headers });
          if (response.data.success) {
            console.log(`  ✅ Created order for address: ${address.fullName}`);
          }
        } catch (error) {
          console.log(`  ❌ Failed to create order for ${address.fullName}:`, error.response?.data?.message || error.message);
        }
      }
    }
  } catch (error) {
    console.log('  ❌ Error creating orders:', error.response?.data?.message || error.message);
  }
}

/**
 * Create all test data
 */
async function createAllTestData() {
  console.log('🚀 Creating test data for admin sort testing...\n');
  
  const loginSuccess = await loginAdmin();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without admin login');
    return;
  }

  await createTestUsers();
  await createTestReviews();
  await createTestOrders();
  
  console.log('\n✅ Test data creation completed!');
  console.log('🔍 You can now run the admin sort tests.');
}

// If running directly, execute
if (require.main === module) {
  createAllTestData();
}

module.exports = {
  createAllTestData,
  createTestUsers,
  createTestReviews,
  createTestOrders
};
