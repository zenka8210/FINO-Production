const axios = require('axios');
const chalk = require('chalk');

// API Base URL
const BASE_URL = 'http://localhost:5000/api';

// Test credentials
const CUSTOMER_LOGIN = {
  email: 'customer1@shop.com',
  password: 'customer123'
};

const ADMIN_LOGIN = {
  email: 'admin1@shop.com', 
  password: 'admin123456'
};

// Global variables
let customerToken = '';
let adminToken = '';
let testProductId = '';
let testCategoryId = '';
let testColorId = '';
let testSizeId = '';
let testVariantId = '';

// Helper function to make API requests
async function apiRequest(method, url, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      data,
      timeout: 10000,
      headers: {}
    };
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      return { error: error.response.data, status: error.response.status };
    }
    throw error;
  }
}

// Helper function to log results
function logResult(testName, result) {
  if (result.error) {
    console.log(chalk.red(`❌ ${testName}`));
    console.log(chalk.red(`   Error: ${JSON.stringify(result.error)}`));
  } else {
    console.log(chalk.green(`✅ ${testName}`));
    if (result.data) {
      console.log(chalk.blue(`   Data count: ${Array.isArray(result.data) ? result.data.length : 'Single object'}`));
    }
  }
}

async function login() {
  console.log(chalk.cyan('🔐 === AUTHENTICATION ==='));
  
  const customerLogin = await apiRequest('POST', '/auth/login', CUSTOMER_LOGIN);
  if (customerLogin.data && customerLogin.data.token) {
    customerToken = customerLogin.data.token;
    console.log(chalk.green('✅ Customer login successful'));
  } else {
    console.log(chalk.red('❌ Customer login failed:', JSON.stringify(customerLogin)));
  }
  
  const adminLogin = await apiRequest('POST', '/auth/login', ADMIN_LOGIN);
  if (adminLogin.data && adminLogin.data.token) {
    adminToken = adminLogin.data.token;
    console.log(chalk.green('✅ Admin login successful'));
  } else {
    console.log(chalk.red('❌ Admin login failed:', JSON.stringify(adminLogin)));
  }
}

async function setupTestData() {
  console.log(chalk.cyan('\n🔧 === SETTING UP TEST DATA ==='));
  
  // Create category
  const categoryData = {
    name: 'Test Stock Category',
    description: 'Category for stock testing'
  };
  const category = await apiRequest('POST', '/categories', categoryData, adminToken);
  if (category.data && category.data._id) {
    testCategoryId = category.data._id;
    console.log(chalk.green('✅ Test category created'));
  }
  
  // Create color
  const colorData = {
    name: 'Test Red',
    hexCode: '#FF0000'
  };
  const color = await apiRequest('POST', '/colors', colorData, adminToken);
  if (color.data && color.data._id) {
    testColorId = color.data._id;
    console.log(chalk.green('✅ Test color created'));
  }
  
  // Create size
  const sizeData = {
    name: 'Test Medium',
    value: 'M'
  };
  const size = await apiRequest('POST', '/sizes', sizeData, adminToken);
  if (size.data && size.data._id) {
    testSizeId = size.data._id;
    console.log(chalk.green('✅ Test size created'));
  }
  
  // Create product
  const productData = {
    name: 'Test Stock Product',
    price: 299000,
    description: 'Product for testing stock management',
    category: testCategoryId
  };
  const product = await apiRequest('POST', '/products', productData, adminToken);
  if (product.data && product.data._id) {
    testProductId = product.data._id;
    console.log(chalk.green('✅ Test product created'));
  }
  
  // Create product variant with stock
  const variantData = {
    product: testProductId,
    color: testColorId,
    size: testSizeId,
    price: 299000,
    stock: 10 // Initial stock
  };
  const variant = await apiRequest('POST', '/product-variants', variantData, adminToken);
  if (variant.data && variant.data._id) {
    testVariantId = variant.data._id;
    console.log(chalk.green('✅ Test variant created with stock: 10'));
  }
}

async function testStockManagement() {
  console.log(chalk.cyan('\n📦 === TESTING STOCK MANAGEMENT ==='));
  
  // Test check product availability
  console.log(chalk.yellow('\n📝 Testing Check Product Availability...'));
  const availability = await apiRequest('GET', `/products/check-availability/${testProductId}`);
  logResult('Check Product Availability', availability);
  if (availability.data) {
    console.log(chalk.blue(`   Available: ${availability.data.available}`));
    console.log(chalk.blue(`   Total Stock: ${availability.data.totalStock}`));
    console.log(chalk.blue(`   Available Variants: ${availability.data.availableVariants}`));
  }
  
  // Test check variant stock
  console.log(chalk.yellow('\n📝 Testing Check Variant Stock...'));
  const variantStock = await apiRequest('GET', `/products/check-variant-stock/${testVariantId}?quantity=5`);
  logResult('Check Variant Stock (quantity: 5)', variantStock);
  if (variantStock.data) {
    console.log(chalk.blue(`   Can Order: ${variantStock.data.canOrder}`));
    console.log(chalk.blue(`   Available Stock: ${variantStock.data.availableStock}`));
  }
  
  // Test check variant stock with too much quantity
  console.log(chalk.yellow('\n📝 Testing Check Variant Stock (Excessive Quantity)...'));
  const variantStockExcessive = await apiRequest('GET', `/products/check-variant-stock/${testVariantId}?quantity=15`);
  logResult('Check Variant Stock (quantity: 15)', variantStockExcessive);
  if (variantStockExcessive.data) {
    console.log(chalk.blue(`   Can Order: ${variantStockExcessive.data.canOrder}`));
    console.log(chalk.blue(`   Available Stock: ${variantStockExcessive.data.availableStock}`));
  }
  
  // Test get available products only
  console.log(chalk.yellow('\n📝 Testing Get Available Products Only...'));
  const availableProducts = await apiRequest('GET', '/products/available?includeVariants=true');
  logResult('Get Available Products Only', availableProducts);
  if (availableProducts.data && availableProducts.data.data) {
    console.log(chalk.blue(`   Products with stock: ${availableProducts.data.data.length}`));
  }
  
  // Test validate cart items
  console.log(chalk.yellow('\n📝 Testing Validate Cart Items...'));
  const cartItems = {
    items: [
      { variantId: testVariantId, quantity: 3 },
      { variantId: testVariantId, quantity: 5 } // This should fail as total = 8, but we only have stock validation per item
    ]
  };
  const cartValidation = await apiRequest('POST', '/products/validate-cart', cartItems);
  logResult('Validate Cart Items', cartValidation);
  if (cartValidation.data) {
    console.log(chalk.blue(`   Cart Valid: ${cartValidation.data.valid}`));
    console.log(chalk.blue(`   Items checked: ${cartValidation.data.items.length}`));
  }
}

async function testOrderWithStockManagement() {
  console.log(chalk.cyan('\n🛒 === TESTING ORDER WITH STOCK MANAGEMENT ==='));
  
  // Get user address for order
  const addresses = await apiRequest('GET', '/addresses', null, customerToken);
  let addressId = null;
  if (addresses.data && addresses.data.length > 0) {
    addressId = addresses.data[0]._id;
  } else {
    // Create test address
    const addressData = {
      street: '123 Test Stock Street',
      city: 'Hồ Chí Minh',
      district: 'District 1',
      ward: 'Ward 1',
      postalCode: '70000',
      isDefault: true
    };
    const address = await apiRequest('POST', '/addresses', addressData, customerToken);
    if (address.data) {
      addressId = address.data._id;
    }
  }
  
  // Get payment method
  const paymentMethods = await apiRequest('GET', '/payment-methods/active');
  let paymentMethodId = null;
  if (paymentMethods.data && paymentMethods.data.length > 0) {
    paymentMethodId = paymentMethods.data[0]._id;
  }
  
  if (!addressId || !paymentMethodId) {
    console.log(chalk.red('❌ Cannot test order creation - missing address or payment method'));
    return;
  }
  
  // Test order creation with valid stock
  console.log(chalk.yellow('\n📝 Testing Create Order (Valid Stock)...'));
  const orderData = {
    items: [
      {
        productVariant: testVariantId,
        quantity: 3,
        price: 299000,
        totalPrice: 897000
      }
    ],
    address: addressId,
    paymentMethod: paymentMethodId
  };
  
  const orderResult = await apiRequest('POST', '/orders', orderData, customerToken);
  logResult('Create Order (Valid Stock)', orderResult);
  
  let orderId = null;
  if (orderResult.data && orderResult.data._id) {
    orderId = orderResult.data._id;
    console.log(chalk.blue(`   Order ID: ${orderId}`));
    console.log(chalk.blue(`   Final Total: ${orderResult.data.finalTotal}`));
  }
  
  // Check stock after order
  console.log(chalk.yellow('\n📝 Testing Check Stock After Order...'));
  const stockAfterOrder = await apiRequest('GET', `/products/check-variant-stock/${testVariantId}`);
  logResult('Check Stock After Order', stockAfterOrder);
  if (stockAfterOrder.data) {
    console.log(chalk.blue(`   Remaining Stock: ${stockAfterOrder.data.availableStock}`));
  }
  
  // Test order creation with insufficient stock
  console.log(chalk.yellow('\n📝 Testing Create Order (Insufficient Stock)...'));
  const orderDataInvalid = {
    items: [
      {
        productVariant: testVariantId,
        quantity: 15, // More than available stock
        price: 299000,
        totalPrice: 4485000
      }
    ],
    address: addressId,
    paymentMethod: paymentMethodId
  };
  
  const orderResultInvalid = await apiRequest('POST', '/orders', orderDataInvalid, customerToken);
  logResult('Create Order (Insufficient Stock)', orderResultInvalid);
  
  // Test cancel order to restore stock
  if (orderId) {
    console.log(chalk.yellow('\n📝 Testing Cancel Order (Restore Stock)...'));
    const cancelResult = await apiRequest('PATCH', `/orders/${orderId}/cancel`, { reason: 'Test cancellation' }, customerToken);
    logResult('Cancel Order', cancelResult);
    
    // Check stock after cancellation
    console.log(chalk.yellow('\n📝 Testing Check Stock After Cancellation...'));
    const stockAfterCancel = await apiRequest('GET', `/products/check-variant-stock/${testVariantId}`);
    logResult('Check Stock After Cancellation', stockAfterCancel);
    if (stockAfterCancel.data) {
      console.log(chalk.blue(`   Restored Stock: ${stockAfterCancel.data.availableStock}`));
    }
  }
}

async function testWishlistWithOutOfStock() {
  console.log(chalk.cyan('\n💝 === TESTING WISHLIST WITH OUT-OF-STOCK PRODUCTS ==='));
  
  // Update variant to have 0 stock
  console.log(chalk.yellow('\n📝 Setting Product Variant to Out of Stock...'));
  const updateVariant = await apiRequest('PUT', `/product-variants/${testVariantId}`, { stock: 0 }, adminToken);
  logResult('Set Variant Out of Stock', updateVariant);
  
  // Test adding out-of-stock product to wishlist (should succeed)
  console.log(chalk.yellow('\n📝 Testing Add Out-of-Stock Product to Wishlist...'));
  const addToWishlist = await apiRequest('POST', '/wishlists', { productId: testProductId }, customerToken);
  logResult('Add Out-of-Stock Product to Wishlist', addToWishlist);
  
  // Check product availability (should show no stock)
  console.log(chalk.yellow('\n📝 Testing Check Out-of-Stock Product Availability...'));
  const availabilityOutOfStock = await apiRequest('GET', `/products/check-availability/${testProductId}`);
  logResult('Check Out-of-Stock Product Availability', availabilityOutOfStock);
  if (availabilityOutOfStock.data) {
    console.log(chalk.blue(`   Available: ${availabilityOutOfStock.data.available}`));
    console.log(chalk.blue(`   Total Stock: ${availabilityOutOfStock.data.totalStock}`));
  }
  
  // Test get available products (should exclude out-of-stock)
  console.log(chalk.yellow('\n📝 Testing Get Available Products (Should Exclude Out-of-Stock)...'));
  const availableProductsFiltered = await apiRequest('GET', '/products/available');
  logResult('Get Available Products (Filtered)', availableProductsFiltered);
  
  // Test get all products including out-of-stock
  console.log(chalk.yellow('\n📝 Testing Get All Products (Including Out-of-Stock)...'));
  const allProductsIncluding = await apiRequest('GET', '/products/public?includeOutOfStock=true');
  logResult('Get All Products (Including Out-of-Stock)', allProductsIncluding);
}

async function cleanup() {
  console.log(chalk.cyan('\n🧹 === CLEANUP TEST DATA ==='));
  
  const cleanupTasks = [
    { name: 'Delete Test Variant', url: `/product-variants/${testVariantId}` },
    { name: 'Delete Test Product', url: `/products/${testProductId}` },
    { name: 'Delete Test Color', url: `/colors/${testColorId}` },
    { name: 'Delete Test Size', url: `/sizes/${testSizeId}` },
    { name: 'Delete Test Category', url: `/categories/${testCategoryId}` }
  ];
  
  for (const task of cleanupTasks) {
    if (task.url.includes('undefined') || task.url.includes('null')) continue;
    
    const result = await apiRequest('DELETE', task.url, null, adminToken);
    logResult(task.name, result);
  }
}

async function runStockManagementTests() {
  try {
    console.log(chalk.blue('🧪 === STOCK MANAGEMENT TESTING STARTED ==='));
    console.log(chalk.blue(`Testing against: ${BASE_URL}`));
    console.log(chalk.blue(`Started at: ${new Date().toISOString()}`));
    
    await login();
    await setupTestData();
    await testStockManagement();
    await testOrderWithStockManagement();
    await testWishlistWithOutOfStock();
    await cleanup();
    
    console.log(chalk.green('\n🎉 === STOCK MANAGEMENT TESTS COMPLETED ==='));
    console.log(chalk.blue(`Completed at: ${new Date().toISOString()}`));
    
  } catch (error) {
    console.error(chalk.red('❌ Test execution failed:'), error.message);
  }
}

// Run the tests
runStockManagementTests();
