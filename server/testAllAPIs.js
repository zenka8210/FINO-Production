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

// Global variables to store tokens and test data
let customerToken = '';
let adminToken = '';
let testCustomerId = '';
let testAdminId = '';
let testProductId = '';
let testCategoryId = '';
let testOrderId = '';
let testAddressId = '';
let testVoucherId = '';
let testReviewId = '';
let testColorId = '';
let testSizeId = '';
let testBannerId = '';
let testPostId = '';
let testPaymentMethodId = '';
let testProductVariantId = '';

// Helper function to make API requests
async function apiRequest(method, url, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      data,
      timeout: 10000, // 10 second timeout
      headers: {}
    };
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status,
      code: error.code,
      timeout: error.code === 'ECONNABORTED'
    };
  }
}

// Log test result
function logResult(testName, result, details = null) {
  if (result.success) {
    console.log(chalk.green(`✅ ${testName}`));
    if (details) {
      console.log(chalk.gray(`   ${details}`));
    }
  } else {
    console.log(chalk.red(`❌ ${testName}`));
    console.log(chalk.red(`   Error: ${JSON.stringify(result.error)}`));
  }
}

// 1. AUTHENTICATION TESTS
async function testAuthentication() {
  console.log(chalk.blue.bold('\n🔐 === TESTING AUTHENTICATION ENDPOINTS ==='));
  
  // Test Customer Login
  console.log(chalk.yellow('\n📝 Testing Customer Login...'));
  const customerLoginResult = await apiRequest('POST', '/auth/login', CUSTOMER_LOGIN);
  logResult('Customer Login', customerLoginResult);
  
  if (customerLoginResult.success) {
    customerToken = customerLoginResult.data.data.token;
    testCustomerId = customerLoginResult.data.data.user._id;
    console.log(chalk.gray(`   Customer Token: ${customerToken.substring(0, 20)}...`));
    console.log(chalk.gray(`   Customer ID: ${testCustomerId}`));
  }
  
  // Test Admin Login
  console.log(chalk.yellow('\n📝 Testing Admin Login...'));
  const adminLoginResult = await apiRequest('POST', '/auth/login', ADMIN_LOGIN);
  logResult('Admin Login', adminLoginResult);
  
  if (adminLoginResult.success) {
    adminToken = adminLoginResult.data.data.token;
    testAdminId = adminLoginResult.data.data.user._id;
    console.log(chalk.gray(`   Admin Token: ${adminToken.substring(0, 20)}...`));
    console.log(chalk.gray(`   Admin ID: ${testAdminId}`));
  }
  
  // Test Register (with a new user)
  console.log(chalk.yellow('\n📝 Testing User Registration...'));
  const newUser = {
    email: `test${Date.now()}@shop.com`,
    password: 'testpass123',
    name: 'Test User',
    phone: '0999999999',
    address: 'Test Address'
  };
  const registerResult = await apiRequest('POST', '/auth/register', newUser);
  logResult('User Registration', registerResult);
  
  // Test Duplicate Email Registration (Should fail)
  console.log(chalk.yellow('\n📝 Testing Duplicate Email Registration (Should Fail)...'));
  const duplicateUser = {
    email: CUSTOMER_LOGIN.email, // Use existing email
    password: 'testpass123',
    name: 'Duplicate User',
    phone: '0888888888'
  };
  const duplicateRegisterResult = await apiRequest('POST', '/auth/register', duplicateUser);
  logResult('Duplicate Email Registration (Should Fail)', 
    { success: !duplicateRegisterResult.success, error: duplicateRegisterResult.error });
  
  // Test Invalid Login
  console.log(chalk.yellow('\n📝 Testing Invalid Login (Should Fail)...'));
  const invalidLogin = {
    email: 'invalid@email.com',
    password: 'wrongpassword'
  };
  const invalidLoginResult = await apiRequest('POST', '/auth/login', invalidLogin);
  logResult('Invalid Login (Should Fail)', 
    { success: !invalidLoginResult.success, error: invalidLoginResult.error });
  
  return customerLoginResult.success && adminLoginResult.success;
}

// 2. USER MANAGEMENT TESTS
async function testUserManagement() {
  console.log(chalk.blue.bold('\n👥 === TESTING USER MANAGEMENT ENDPOINTS ==='));
  
  // Test Get Current User Profile (Customer)
  console.log(chalk.yellow('\n📝 Testing Get Current User Profile...'));
  const profileResult = await apiRequest('GET', '/users/me/profile', null, customerToken);
  logResult('Get Current User Profile', profileResult);
  
  // Test Get All Users (Admin only)
  console.log(chalk.yellow('\n📝 Testing Get All Users (Admin)...'));
  const allUsersResult = await apiRequest('GET', '/users', null, adminToken);
  logResult('Get All Users (Admin)', allUsersResult, 
    allUsersResult.success ? `Total users: ${allUsersResult.data.data.users?.length || 0}` : null);
  
  // Test Get User by ID (Admin)
  console.log(chalk.yellow('\n📝 Testing Get User by ID (Admin)...'));
  const userByIdResult = await apiRequest('GET', `/users/${testCustomerId}`, null, adminToken);
  logResult('Get User by ID (Admin)', userByIdResult);
  
  // Test Update Current User Profile
  console.log(chalk.yellow('\n📝 Testing Update Current User Profile...'));
  const updateData = { name: 'Updated Name', phone: '0987654321' };
  const updateProfileResult = await apiRequest('PUT', '/users/me/profile', updateData, customerToken);
  logResult('Update Current User Profile', updateProfileResult);
  
  // Test Get All Users with Customer Token (Should fail - Authorization test)
  console.log(chalk.yellow('\n📝 Testing Get All Users (Customer - should fail)...'));
  const customerGetAllResult = await apiRequest('GET', '/users', null, customerToken);
  logResult('Get All Users (Customer - should fail)', 
    { success: !customerGetAllResult.success, error: customerGetAllResult.error });
  
  // Test Access Admin Endpoint without Token (Should fail)
  console.log(chalk.yellow('\n📝 Testing Access Admin Endpoint without Auth (Should Fail)...'));
  const noAuthResult = await apiRequest('GET', '/users');
  logResult('Access Admin Endpoint without Auth (Should Fail)', 
    { success: !noAuthResult.success, error: noAuthResult.error });
  
  // Test Customer trying to delete another user (Should fail)
  console.log(chalk.yellow('\n📝 Testing Customer Delete User (Should Fail)...'));
  const customerDeleteResult = await apiRequest('DELETE', `/users/${testAdminId}`, null, customerToken);
  logResult('Customer Delete User (Should Fail)', 
    { success: !customerDeleteResult.success, error: customerDeleteResult.error });
}

// 3. CATEGORY TESTS
async function testCategories() {
  console.log(chalk.blue.bold('\n📂 === TESTING CATEGORY ENDPOINTS ==='));
  
  // Test Get All Categories (Public)
  console.log(chalk.yellow('\n📝 Testing Get All Categories (Public)...'));
  const publicCategoriesResult = await apiRequest('GET', '/categories/public');
  logResult('Get All Categories (Public)', publicCategoriesResult);
  
  // Test Create Category (Admin)
  console.log(chalk.yellow('\n📝 Testing Create Category (Admin)...'));
  const newCategory = {
    name: `Test Category ${Date.now()}`,
    description: 'Test category description',
    isActive: true
  };
  const createCategoryResult = await apiRequest('POST', '/categories', newCategory, adminToken);
  logResult('Create Category (Admin)', createCategoryResult);
  
  if (createCategoryResult.success) {
    testCategoryId = createCategoryResult.data.data._id;
    console.log(chalk.gray(`   Created Category ID: ${testCategoryId}`));
  }
  
  // Test Get All Categories (Admin)
  console.log(chalk.yellow('\n📝 Testing Get All Categories (Admin)...'));
  const adminCategoriesResult = await apiRequest('GET', '/categories', null, adminToken);
  logResult('Get All Categories (Admin)', adminCategoriesResult);
  
  // Test Get Category by ID
  if (testCategoryId) {
    console.log(chalk.yellow('\n📝 Testing Get Category by ID...'));
    const categoryByIdResult = await apiRequest('GET', `/categories/${testCategoryId}`, null, adminToken);
    logResult('Get Category by ID', categoryByIdResult);
    
    // Test Update Category
    console.log(chalk.yellow('\n📝 Testing Update Category...'));
    const updateCategoryData = { name: `Updated Category ${Date.now()}` };
    const updateCategoryResult = await apiRequest('PUT', `/categories/${testCategoryId}`, updateCategoryData, adminToken);
    logResult('Update Category', updateCategoryResult);
  }
}

// 4. PRODUCT TESTS
async function testProducts() {
  console.log(chalk.blue.bold('\n🛍️ === TESTING PRODUCT ENDPOINTS ==='));
  
  // Test Get All Products (Public)
  console.log(chalk.yellow('\n📝 Testing Get All Products (Public)...'));
  const publicProductsResult = await apiRequest('GET', '/products/public');
  logResult('Get All Products (Public)', publicProductsResult);
  
  // Test Create Product (Admin)
  if (testCategoryId) {
    console.log(chalk.yellow('\n📝 Testing Create Product (Admin)...'));
    const newProduct = {
      name: `Test Product ${Date.now()}`,
      description: 'Test product description',
      price: 100000,
      category: testCategoryId,
      brand: 'Test Brand',
      images: ['test1.jpg', 'test2.jpg'],
      isActive: true
    };
    const createProductResult = await apiRequest('POST', '/products', newProduct, adminToken);
    logResult('Create Product (Admin)', createProductResult);
    
    if (createProductResult.success) {
      testProductId = createProductResult.data.data._id;
      console.log(chalk.gray(`   Created Product ID: ${testProductId}`));
    }
  }
  
  // Test Get All Products (Admin)
  console.log(chalk.yellow('\n📝 Testing Get All Products (Admin)...'));
  const adminProductsResult = await apiRequest('GET', '/products', null, adminToken);
  logResult('Get All Products (Admin)', adminProductsResult);
  
  // Test Get Product by ID (Public)
  if (testProductId) {
    console.log(chalk.yellow('\n📝 Testing Get Product by ID (Public)...'));
    const productByIdResult = await apiRequest('GET', `/products/public/${testProductId}`);
    logResult('Get Product by ID (Public)', productByIdResult);
    
    // Test Update Product
    console.log(chalk.yellow('\n📝 Testing Update Product...'));
    const updateProductData = { name: `Updated Product ${Date.now()}`, price: 150000 };
    const updateProductResult = await apiRequest('PUT', `/products/${testProductId}`, updateProductData, adminToken);
    logResult('Update Product', updateProductResult);
  }
  
  // Test Get Products by Category (Public)
  if (testCategoryId) {
    console.log(chalk.yellow('\n📝 Testing Get Products by Category (Public)...'));
    const productsByCategoryResult = await apiRequest('GET', `/products/category/${testCategoryId}/public`);
    logResult('Get Products by Category (Public)', productsByCategoryResult);
  }
}

// 4a. STOCK MANAGEMENT TESTS
async function testStockManagement() {
  console.log(chalk.blue.bold('\n📦 === TESTING STOCK MANAGEMENT ENDPOINTS ==='));
  
  // Test Get Available Products Only
  console.log(chalk.yellow('\n📝 Testing Get Available Products Only...'));
  const availableProductsResult = await apiRequest('GET', '/products/available?includeVariants=true');
  logResult('Get Available Products Only', availableProductsResult);
  
  // Test Check Product Availability
  if (testProductId) {
    console.log(chalk.yellow('\n📝 Testing Check Product Availability...'));
    const availabilityResult = await apiRequest('GET', `/products/check-availability/${testProductId}`);
    logResult('Check Product Availability', availabilityResult);
    
    if (availabilityResult.success) {
      console.log(chalk.gray(`   Available: ${availabilityResult.data.data.available}`));
      console.log(chalk.gray(`   Total Stock: ${availabilityResult.data.data.totalStock}`));
      console.log(chalk.gray(`   Available Variants: ${availabilityResult.data.data.availableVariants}`));
    }
  }
  
  // Test Check Variant Stock
  if (testProductVariantId) {
    console.log(chalk.yellow('\n📝 Testing Check Variant Stock...'));
    const variantStockResult = await apiRequest('GET', `/products/check-variant-stock/${testProductVariantId}?quantity=5`);
    logResult('Check Variant Stock (quantity: 5)', variantStockResult);
    
    if (variantStockResult.success) {
      console.log(chalk.gray(`   Can Order: ${variantStockResult.data.data.canOrder}`));
      console.log(chalk.gray(`   Available Stock: ${variantStockResult.data.data.availableStock}`));
    }
    
    // Test with excessive quantity
    console.log(chalk.yellow('\n📝 Testing Check Variant Stock (Excessive Quantity)...'));
    const variantStockExcessiveResult = await apiRequest('GET', `/products/check-variant-stock/${testProductVariantId}?quantity=1000`);
    logResult('Check Variant Stock (quantity: 1000)', variantStockExcessiveResult);
    
    if (variantStockExcessiveResult.success) {
      console.log(chalk.gray(`   Can Order: ${variantStockExcessiveResult.data.data.canOrder}`));
      console.log(chalk.gray(`   Available Stock: ${variantStockExcessiveResult.data.data.availableStock}`));
    }
  }
  
  // Test Validate Cart Items
  if (testProductVariantId) {
    console.log(chalk.yellow('\n📝 Testing Validate Cart Items...'));
    const cartItems = {
      items: [
        { variantId: testProductVariantId, quantity: 3 },
        { variantId: testProductVariantId, quantity: 2 }
      ]
    };
    const cartValidationResult = await apiRequest('POST', '/products/validate-cart', cartItems);
    logResult('Validate Cart Items', cartValidationResult);
    
    if (cartValidationResult.success) {
      console.log(chalk.gray(`   Cart Valid: ${cartValidationResult.data.data.valid}`));
      console.log(chalk.gray(`   Items checked: ${cartValidationResult.data.data.items.length}`));
    }
  }
}

// 5. COLOR AND SIZE TESTS
async function testColorsAndSizes() {
  console.log(chalk.blue.bold('\n🎨 === TESTING COLOR AND SIZE ENDPOINTS ==='));
  
  // Test Create Color (Admin)
  console.log(chalk.yellow('\n📝 Testing Create Color (Admin)...'));
  const newColor = {
    name: `Test Color ${Date.now()}`,
    hexCode: '#FF0000',
    isActive: true
  };
  const createColorResult = await apiRequest('POST', '/colors', newColor, adminToken);
  logResult('Create Color (Admin)', createColorResult);
  
  if (createColorResult.success) {
    testColorId = createColorResult.data.data._id;
  }
  
  // Test Get All Colors
  console.log(chalk.yellow('\n📝 Testing Get All Colors...'));
  const colorsResult = await apiRequest('GET', '/colors/public');
  logResult('Get All Colors', colorsResult);
  
  // Test Create Size (Admin)
  console.log(chalk.yellow('\n📝 Testing Create Size (Admin)...'));
  const newSize = {
    name: `Test Size ${Date.now()}`,
    value: 'XL',
    category: 'clothing',
    isActive: true
  };
  const createSizeResult = await apiRequest('POST', '/sizes', newSize, adminToken);
  logResult('Create Size (Admin)', createSizeResult);
  
  if (createSizeResult.success) {
    testSizeId = createSizeResult.data.data._id;
  }
  
  // Test Get All Sizes
  console.log(chalk.yellow('\n📝 Testing Get All Sizes...'));
  const sizesResult = await apiRequest('GET', '/sizes/public');
  logResult('Get All Sizes', sizesResult);
}

// 6. PRODUCT VARIANT TESTS
async function testProductVariants() {
  console.log(chalk.blue.bold('\n🎨 === TESTING PRODUCT VARIANT ENDPOINTS ==='));
  
  // Test Create Product Variant (Admin)
  if (testProductId && testColorId && testSizeId) {
    console.log(chalk.yellow('\n📝 Testing Create Product Variant (Admin)...'));
    const newVariant = {
      product: testProductId,
      color: testColorId,
      size: testSizeId,
      sku: `TEST-SKU-${Date.now()}`,
      price: 120000,
      stock: 50,
      images: ['variant1.jpg']
    };
    const createVariantResult = await apiRequest('POST', '/product-variants', newVariant, adminToken);
    logResult('Create Product Variant (Admin)', createVariantResult);
    
    if (createVariantResult.success) {
      testProductVariantId = createVariantResult.data.data._id;
    }
  }
  
  // Test Get All Product Variants (Admin)
  console.log(chalk.yellow('\n📝 Testing Get All Product Variants (Admin)...'));
  const allVariantsResult = await apiRequest('GET', '/product-variants', null, adminToken);
  logResult('Get All Product Variants (Admin)', allVariantsResult);
  
  // Test Get Variants by Product (Public)
  if (testProductId) {
    console.log(chalk.yellow('\n📝 Testing Get Variants by Product (Public)...'));
    const variantsByProductResult = await apiRequest('GET', `/product-variants/product/${testProductId}`);
    logResult('Get Variants by Product (Public)', variantsByProductResult);
  }
  
  // Test Update Product Variant
  if (testProductVariantId) {
    console.log(chalk.yellow('\n📝 Testing Update Product Variant...'));
    const updateVariantData = { price: 130000, stock: 60 };
    const updateVariantResult = await apiRequest('PUT', `/product-variants/${testProductVariantId}`, updateVariantData, adminToken);
    logResult('Update Product Variant', updateVariantResult);
  }
}

// 7. ADDRESS TESTS
async function testAddresses() {
  console.log(chalk.blue.bold('\n🏠 === TESTING ADDRESS ENDPOINTS ==='));
  
  // Get existing addresses first
  console.log(chalk.yellow('\n📝 Testing Get All Addresses...'));
  const addressesResult = await apiRequest('GET', '/addresses', null, customerToken);
  logResult('Get All Addresses', addressesResult);
  
  let existingAddressCount = 0;
  if (addressesResult.success && addressesResult.data.data) {
    existingAddressCount = addressesResult.data.data.length;
    console.log(chalk.gray(`   Existing addresses: ${existingAddressCount}`));
  }
  
  // Test Create Address
  console.log(chalk.yellow('\n📝 Testing Create Address...'));
  const newAddress = {
    fullName: 'Test Recipient',
    phone: '0123456789',
    addressLine: '123 Test Street',
    ward: 'Test Ward',
    district: 'Test District',
    city: 'Test Province',
    isDefault: existingAddressCount === 0 // First address should be default
  };
  const createAddressResult = await apiRequest('POST', '/addresses', newAddress, customerToken);
  logResult('Create Address', createAddressResult);
  
  if (createAddressResult.success) {
    testAddressId = createAddressResult.data.data._id;
    console.log(chalk.gray(`   Created Address ID: ${testAddressId}`));
  }
  
  // Test Create Second Address
  console.log(chalk.yellow('\n📝 Testing Create Second Address...'));
  const secondAddress = {
    fullName: 'Test Recipient 2',
    phone: '0987654321',
    addressLine: '456 Test Avenue',
    ward: 'Test Ward 2',
    district: 'Test District 2',
    city: 'Test Province 2',
    isDefault: false
  };
  const createSecondAddressResult = await apiRequest('POST', '/addresses', secondAddress, customerToken);
  logResult('Create Second Address', createSecondAddressResult);
  
  let secondAddressId = null;
  if (createSecondAddressResult.success) {
    secondAddressId = createSecondAddressResult.data.data._id;
  }
  
  // Test Update Address
  if (testAddressId) {
    console.log(chalk.yellow('\n📝 Testing Update Address...'));
    const updateAddressData = { fullName: 'Updated Recipient' };
    const updateAddressResult = await apiRequest('PUT', `/addresses/${testAddressId}`, updateAddressData, customerToken);
    logResult('Update Address', updateAddressResult);
  }
  
  // Test Set Default Address
  if (secondAddressId) {
    console.log(chalk.yellow('\n📝 Testing Set Default Address...'));
    const setDefaultResult = await apiRequest('PATCH', `/addresses/${secondAddressId}/set-default`, null, customerToken);
    logResult('Set Default Address', setDefaultResult);
    
    // Verify default address change
    console.log(chalk.yellow('\n📝 Testing Get Addresses After Default Change...'));
    const addressesAfterDefaultResult = await apiRequest('GET', '/addresses', null, customerToken);
    logResult('Get Addresses After Default Change', addressesAfterDefaultResult);
    
    if (addressesAfterDefaultResult.success) {
      const defaultAddress = addressesAfterDefaultResult.data.data.find(addr => addr.isDefault);
      console.log(chalk.gray(`   Default address ID: ${defaultAddress?._id}`));
      console.log(chalk.gray(`   Default address matches: ${defaultAddress?._id === secondAddressId}`));
    }
  }
  
  // Test Address Limit (Create multiple addresses to test limit)
  console.log(chalk.yellow('\n📝 Testing Address Limit...'));
  const addressPromises = [];
  for (let i = 3; i <= 6; i++) { // Create up to 6 addresses total
    const addressData = {
      fullName: `Test Recipient ${i}`,
      phone: `012345678${i}`,
      addressLine: `${i * 100} Test Street ${i}`,
      ward: `Test Ward ${i}`,
      district: `Test District ${i}`,
      city: `Test Province ${i}`,
      isDefault: false
    };
    addressPromises.push(apiRequest('POST', '/addresses', addressData, customerToken));
  }
  
  const addressResults = await Promise.all(addressPromises);
  let successCount = 0;
  let limitReached = false;
  
  addressResults.forEach((result, index) => {
    if (result.success) {
      successCount++;
      console.log(chalk.green(`   ✅ Address ${index + 3} created successfully`));
    } else {
      console.log(chalk.red(`   ❌ Address ${index + 3} failed: ${JSON.stringify(result.error)}`));
      if (result.error && typeof result.error === 'string' && result.error.includes('limit')) {
        limitReached = true;
      }
    }
  });
  
  console.log(chalk.gray(`   Successfully created ${successCount} additional addresses`));
  console.log(chalk.gray(`   Address limit reached: ${limitReached}`));
  
  // Test Unauthorized Address Access
  console.log(chalk.yellow('\n📝 Testing Unauthorized Address Access (Should Fail)...'));
  const unauthorizedAddressResult = await apiRequest('GET', '/addresses');
  logResult('Unauthorized Address Access (Should Fail)', 
    { success: !unauthorizedAddressResult.success, error: unauthorizedAddressResult.error });
}

// 8. VOUCHER TESTS
async function testVouchers() {
  console.log(chalk.blue.bold('\n🎟️ === TESTING VOUCHER ENDPOINTS ==='));
  
  // Test Get All Vouchers (Public)
  console.log(chalk.yellow('\n📝 Testing Get All Vouchers (Public)...'));
  const publicVouchersResult = await apiRequest('GET', '/vouchers');
  logResult('Get All Vouchers (Public)', publicVouchersResult);
  
  // Test Create Voucher (Admin)
  console.log(chalk.yellow('\n📝 Testing Create Voucher (Admin)...'));
  const newVoucher = {
    code: `TEST${Date.now()}`,
    discountPercent: 10,
    minimumOrderValue: 100000,
    maximumDiscountAmount: 50000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isActive: true,
    usageLimit: 100,
    isOneTimePerUser: false
  };
  const createVoucherResult = await apiRequest('POST', '/vouchers/admin', newVoucher, adminToken);
  logResult('Create Voucher (Admin)', createVoucherResult);
  
  if (createVoucherResult.success) {
    testVoucherId = createVoucherResult.data.data._id;
  }
  
  // Test Get Active Vouchers
  console.log(chalk.yellow('\n📝 Testing Get Active Vouchers...'));
  const activeVouchersResult = await apiRequest('GET', '/vouchers/active');
  logResult('Get Active Vouchers', activeVouchersResult);
  
  // Test Get Voucher by Code
  if (newVoucher.code) {
    console.log(chalk.yellow('\n📝 Testing Get Voucher by Code...'));
    const voucherByCodeResult = await apiRequest('GET', `/vouchers/code/${newVoucher.code}`);
    logResult('Get Voucher by Code', voucherByCodeResult);
    
    // Test Check Voucher Usage
    console.log(chalk.yellow('\n📝 Testing Check Voucher Usage...'));
    const checkUsageResult = await apiRequest('GET', `/vouchers/check-usage/${newVoucher.code}`, null, customerToken);
    logResult('Check Voucher Usage', checkUsageResult);
    
    // Test Apply Voucher
    console.log(chalk.yellow('\n📝 Testing Apply Voucher...'));
    const applyVoucherData = {
      code: newVoucher.code,
      orderTotal: 200000
    };
    const applyVoucherResult = await apiRequest('POST', '/vouchers/apply', applyVoucherData, customerToken);
    logResult('Apply Voucher', applyVoucherResult);
  }
  
  // Test Get User Used Vouchers
  console.log(chalk.yellow('\n📝 Testing Get User Used Vouchers...'));
  try {
    const usedVouchersResult = await apiRequest('GET', '/vouchers/my-used-voucher', null, customerToken);
    logResult('Get User Used Vouchers', usedVouchersResult);
  } catch (error) {
    console.log(chalk.red(`   Exception in Get User Used Vouchers: ${error.message}`));
  }
  
  // Test Get Voucher by ID (Admin)
  if (testVoucherId) {
    console.log(chalk.yellow('\n📝 Testing Get Voucher by ID (Admin)...'));
    const voucherByIdResult = await apiRequest('GET', `/vouchers/admin/${testVoucherId}`, null, adminToken);
    logResult('Get Voucher by ID (Admin)', voucherByIdResult);
  }
}

// 9. PAYMENT METHOD TESTS
async function testPaymentMethods() {
  console.log(chalk.blue.bold('\n💳 === TESTING PAYMENT METHOD ENDPOINTS ==='));
  
  // Test Get Active Payment Methods (Public)
  console.log(chalk.yellow('\n📝 Testing Get Active Payment Methods (Public)...'));
  const activePaymentMethodsResult = await apiRequest('GET', '/payment-methods/active');
  logResult('Get Active Payment Methods (Public)', activePaymentMethodsResult);
  
  // Test Create Payment Method (Admin)
  console.log(chalk.yellow('\n📝 Testing Create Payment Method (Admin)...'));
  const newPaymentMethod = {
    method: 'Momo',
    isActive: true
  };
  const createPaymentMethodResult = await apiRequest('POST', '/payment-methods', newPaymentMethod, adminToken);
  logResult('Create Payment Method (Admin)', createPaymentMethodResult);
  
  if (createPaymentMethodResult.success) {
    // Try different possible paths for the ID
    testPaymentMethodId = createPaymentMethodResult.data._id || 
                          createPaymentMethodResult.data?.data?._id || 
                          createPaymentMethodResult.data?.message?._id;
    console.log(chalk.gray(`   Debug: Set paymentMethodId=${testPaymentMethodId}`));
  }
  
  // Test Get All Payment Methods (Admin)
  console.log(chalk.yellow('\n📝 Testing Get All Payment Methods (Admin)...'));
  const allPaymentMethodsResult = await apiRequest('GET', '/payment-methods', null, adminToken);
  logResult('Get All Payment Methods (Admin)', allPaymentMethodsResult);
  
  // Test Payment Method Statistics (Admin)
  console.log(chalk.yellow('\n📝 Testing Payment Method Statistics (Admin)...'));
  const paymentStatsResult = await apiRequest('GET', '/payment-methods/stats', null, adminToken);
  logResult('Payment Method Statistics (Admin)', paymentStatsResult);
  
  // Test Get Payment Method by ID
  if (testPaymentMethodId) {
    console.log(chalk.yellow('\n📝 Testing Get Payment Method by ID...'));
    const paymentByIdResult = await apiRequest('GET', `/payment-methods/${testPaymentMethodId}`, null, adminToken);
    logResult('Get Payment Method by ID', paymentByIdResult);
    
    // Test Update Payment Method
    console.log(chalk.yellow('\n📝 Testing Update Payment Method...'));
    const updatePaymentData = { isActive: false }; // Sửa thành update field khác, không phải method
    const updatePaymentResult = await apiRequest('PUT', `/payment-methods/${testPaymentMethodId}`, updatePaymentData, adminToken);
    logResult('Update Payment Method', updatePaymentResult);
    
    // Test Toggle Payment Method Status
    console.log(chalk.yellow('\n📝 Testing Toggle Payment Method Status...'));
    const toggleStatusResult = await apiRequest('PUT', `/payment-methods/${testPaymentMethodId}/toggle-status`, null, adminToken);
    logResult('Toggle Payment Method Status', toggleStatusResult);
  }
}

// 10. BANNER TESTS
async function testBanners() {
  console.log(chalk.blue.bold('\n🎯 === TESTING BANNER ENDPOINTS ==='));
  
  // Test Create Banner (Admin)
  console.log(chalk.yellow('\n📝 Testing Create Banner (Admin)...'));
  const newBanner = {
    title: `Test Banner ${Date.now()}`,
    description: 'Test banner description',
    image: 'test-banner.jpg',
    link: 'https://example.com',
    isActive: true
  };
  const createBannerResult = await apiRequest('POST', '/banners', newBanner, adminToken);
  logResult('Create Banner (Admin)', createBannerResult);
  
  if (createBannerResult.success) {
    testBannerId = createBannerResult.data.data._id;
  }
  
  // Test Get All Banners (Admin)
  console.log(chalk.yellow('\n📝 Testing Get All Banners (Admin)...'));
  const allBannersResult = await apiRequest('GET', '/banners', null, adminToken);
  logResult('Get All Banners (Admin)', allBannersResult);
  
  // Test Get Active Banners (Public)
  console.log(chalk.yellow('\n📝 Testing Get Active Banners (Public)...'));
  const activeBannersResult = await apiRequest('GET', '/banners/active');
  logResult('Get Active Banners (Public)', activeBannersResult);
}

// 11. POST TESTS
async function testPosts() {
  console.log(chalk.blue.bold('\n📰 === TESTING POST/BLOG ENDPOINTS ==='));
  
  // Test Get All Posts (Public)
  console.log(chalk.yellow('\n📝 Testing Get All Posts (Public)...'));
  const publicPostsResult = await apiRequest('GET', '/posts');
  logResult('Get All Posts (Public)', publicPostsResult);
  
  // Test Create Post
  console.log(chalk.yellow('\n📝 Testing Create Post...'));
  const newPost = {
    title: `Test Post ${Date.now()}`,
    content: 'This is a test post content',
    describe: 'Test post description',
    image: 'test-post.jpg'
  };
  const createPostResult = await apiRequest('POST', '/posts', newPost, customerToken);
  logResult('Create Post', createPostResult);
  
  if (createPostResult.success) {
    testPostId = createPostResult.data.data._id;
  }
  
  // Test Get Post by ID
  if (testPostId) {
    console.log(chalk.yellow('\n📝 Testing Get Post by ID...'));
    const postByIdResult = await apiRequest('GET', `/posts/${testPostId}`);
    logResult('Get Post by ID', postByIdResult);
    
    // Test Update Post
    console.log(chalk.yellow('\n📝 Testing Update Post...'));
    const updatePostData = { title: `Updated Post ${Date.now()}` };
    const updatePostResult = await apiRequest('PUT', `/posts/${testPostId}`, updatePostData, customerToken);
    logResult('Update Post', updatePostResult);
  }
}

// 12. ORDER TESTS
async function testOrders() {
  console.log(chalk.blue.bold('\n🛒 === TESTING ORDER ENDPOINTS ==='));
  
  // Test Calculate Shipping Fee
  if (testAddressId) {
    console.log(chalk.yellow('\n📝 Testing Calculate Shipping Fee...'));
    const shippingFeeResult = await apiRequest('GET', `/orders/shipping-fee/${testAddressId}`, null, customerToken);
    logResult('Calculate Shipping Fee', shippingFeeResult);
  }
  
  // Test Calculate Total
  if (testProductVariantId && testAddressId) {
    console.log(chalk.yellow('\n📝 Testing Calculate Order Total...'));
    const calculateData = {
      items: [{ 
        productVariant: testProductVariantId, 
        quantity: 2, 
        price: 50000,  // Price per item
        totalPrice: 100000  // price * quantity
      }],
      address: testAddressId,
      voucherId: testVoucherId
    };
    const calculateResult = await apiRequest('POST', '/orders/calculate-total', calculateData, customerToken);
    logResult('Calculate Order Total', calculateResult);
    
    // Test Create Order
    console.log(chalk.yellow('\n📝 Testing Create Order...'));
    console.log(chalk.gray(`   Debug: addressId=${testAddressId}, paymentMethodId=${testPaymentMethodId}`));
    const newOrder = {
      items: [{ 
        productVariant: testProductVariantId, 
        quantity: 2, 
        price: 50000,  // Price per item
        totalPrice: 100000  // price * quantity
      }],
      address: testAddressId,
      paymentMethod: testPaymentMethodId,
      note: 'Test order note'
    };
    const createOrderResult = await apiRequest('POST', '/orders', newOrder, customerToken);
    logResult('Create Order', createOrderResult);
    
    if (createOrderResult.success) {
      testOrderId = createOrderResult.data.data._id;
    }
  }
  
  // Test Get User Orders
  console.log(chalk.yellow('\n📝 Testing Get User Orders...'));
  const userOrdersResult = await apiRequest('GET', '/orders', null, customerToken);
  logResult('Get User Orders', userOrdersResult);
  
  // Test Get Order by ID
  if (testOrderId) {
    console.log(chalk.yellow('\n📝 Testing Get Order by ID...'));
    const orderByIdResult = await apiRequest('GET', `/orders/${testOrderId}`, null, customerToken);
    logResult('Get Order by ID', orderByIdResult);
  }
  
  // Test Can Review Product
  if (testProductId) {
    console.log(chalk.yellow('\n📝 Testing Can Review Product...'));
    const canReviewResult = await apiRequest('GET', `/orders/${testProductId}/can-review`, null, customerToken);
    logResult('Can Review Product', canReviewResult);
  }
  
  // Test Get All Orders (Admin)
  console.log(chalk.yellow('\n📝 Testing Get All Orders (Admin)...'));
  const allOrdersResult = await apiRequest('GET', '/orders/admin/all', null, adminToken);
  logResult('Get All Orders (Admin)', allOrdersResult);
  
  // Test Order Statistics (Admin)
  console.log(chalk.yellow('\n📝 Testing Order Statistics (Admin)...'));
  const orderStatsResult = await apiRequest('GET', '/orders/admin/stats', null, adminToken);
  logResult('Order Statistics (Admin)', orderStatsResult);
  
  // Test Search Orders (Admin)
  console.log(chalk.yellow('\n📝 Testing Search Orders (Admin)...'));
  const searchOrdersResult = await apiRequest('GET', '/orders/admin/search?q=test', null, adminToken);
  logResult('Search Orders (Admin)', searchOrdersResult);
  
  // Test Top Selling Products (Admin)
  console.log(chalk.yellow('\n📝 Testing Top Selling Products (Admin)...'));
  const topProductsResult = await apiRequest('GET', '/orders/admin/top-products', null, adminToken);
  logResult('Top Selling Products (Admin)', topProductsResult);
  
  // Test Update Order Status (Admin)
  if (testOrderId) {
    console.log(chalk.yellow('\n📝 Testing Update Order Status (Admin)...'));
    console.log(chalk.gray(`   Debug: testOrderId=${testOrderId}`));
    const updateStatusData = { status: 'processing' }; // Sửa từ 'confirmed' thành 'processing' để phù hợp với OrderSchema
    console.log(chalk.gray(`   Debug: updateStatusData=${JSON.stringify(updateStatusData)}`));
    console.log(chalk.gray(`   Debug: adminToken exists=${!!adminToken}`));
    console.log(chalk.gray(`   Debug: API endpoint=/orders/admin/${testOrderId}/status`));
    
    try {
      const updateStatusResult = await apiRequest('PUT', `/orders/admin/${testOrderId}/status`, updateStatusData, adminToken);
      logResult('Update Order Status (Admin)', updateStatusResult);
      
      if (!updateStatusResult.success) {
        console.log(chalk.red(`   Full error details: ${JSON.stringify(updateStatusResult, null, 2)}`));
      }
    } catch (error) {
      console.log(chalk.red(`   Caught exception: ${error.message}`));
      console.log(chalk.red(`   Stack: ${error.stack}`));
    }
  } else {
    console.log(chalk.red('   ⚠️ Skipping Update Order Status test - no testOrderId'));
  }
}

// 13. REVIEW TESTS
async function testReviews() {
  console.log(chalk.blue.bold('\n⭐ === TESTING REVIEW ENDPOINTS ==='));
  
  // Test Create Review
  if (testProductId) {
    console.log(chalk.yellow('\n📝 Testing Create Review...'));
    const newReview = {
      product: testProductId,
      rating: 5,
      comment: 'Great product! Highly recommended.',
      order: testOrderId
    };
    const createReviewResult = await apiRequest('POST', '/reviews', newReview, customerToken);
    logResult('Create Review', createReviewResult);
    
    if (createReviewResult.success) {
      testReviewId = createReviewResult.data.data._id;
    }
    
    // Test Get Product Reviews (Public)
    console.log(chalk.yellow('\n📝 Testing Get Product Reviews (Public)...'));
    const productReviewsResult = await apiRequest('GET', `/reviews/product/${testProductId}`);
    logResult('Get Product Reviews (Public)', productReviewsResult);
  }
  
  // Test Get User Reviews
  console.log(chalk.yellow('\n📝 Testing Get User Reviews...'));
  const userReviewsResult = await apiRequest('GET', '/reviews', null, customerToken);
  logResult('Get User Reviews', userReviewsResult);
  
  // Test Get All Reviews (Admin)
  console.log(chalk.yellow('\n📝 Testing Get All Reviews (Admin)...'));
  const allReviewsResult = await apiRequest('GET', '/reviews/admin/all', null, adminToken);
  logResult('Get All Reviews (Admin)', allReviewsResult);
  
  // Test Update Review
  if (testReviewId) {
    console.log(chalk.yellow('\n📝 Testing Update Review...'));
    const updateReviewData = { rating: 4, comment: 'Updated review comment' };
    const updateReviewResult = await apiRequest('PUT', `/reviews/${testReviewId}`, updateReviewData, customerToken);
    logResult('Update Review', updateReviewResult);
  }
}

// 14. WISHLIST TESTS
async function testWishlist() {
  console.log(chalk.blue.bold('\n💝 === TESTING WISHLIST ENDPOINTS ==='));
  
  // Test Add to Wishlist
  if (testProductId) {
    console.log(chalk.yellow('\n📝 Testing Add to Wishlist...'));
    const addToWishlistData = { productId: testProductId };
    const addToWishlistResult = await apiRequest('POST', '/wishlist', addToWishlistData, customerToken);
    logResult('Add to Wishlist', addToWishlistResult);
    
    // Test Get Wishlist
    console.log(chalk.yellow('\n📝 Testing Get Wishlist...'));
    const wishlistResult = await apiRequest('GET', '/wishlist', null, customerToken);
    logResult('Get Wishlist', wishlistResult);
    
    // Test Get Wishlist Count
    console.log(chalk.yellow('\n📝 Testing Get Wishlist Count...'));
    const wishlistCountResult = await apiRequest('GET', '/wishlist/count', null, customerToken);
    logResult('Get Wishlist Count', wishlistCountResult);
    
    // Test Check Product in Wishlist
    console.log(chalk.yellow('\n📝 Testing Check Product in Wishlist...'));
    const checkWishlistResult = await apiRequest('GET', `/wishlist/check/${testProductId}`, null, customerToken);
    logResult('Check Product in Wishlist', checkWishlistResult);
    
    // Test Toggle Wishlist
    console.log(chalk.yellow('\n📝 Testing Toggle Wishlist...'));
    const toggleWishlistData = { productId: testProductId };
    const toggleWishlistResult = await apiRequest('POST', '/wishlist/toggle', toggleWishlistData, customerToken);
    logResult('Toggle Wishlist', toggleWishlistResult);
  }
  
  // Test Get Wishlist Stats (Admin)
  console.log(chalk.yellow('\n📝 Testing Get Wishlist Stats (Admin)...'));
  const wishlistStatsResult = await apiRequest('GET', '/wishlist/admin/stats', null, adminToken);
  logResult('Get Wishlist Stats (Admin)', wishlistStatsResult);
}

// 15. STATISTICS TESTS
async function testStatistics() {
  console.log(chalk.blue.bold('\n📊 === TESTING STATISTICS ENDPOINTS ==='));
  
  // Test Dashboard Stats
  console.log(chalk.yellow('\n📝 Testing Dashboard Stats...'));
  const dashboardStatsResult = await apiRequest('GET', '/statistics/dashboard', null, adminToken);
  logResult('Dashboard Stats', dashboardStatsResult);
  
  // Test Revenue Chart
  console.log(chalk.yellow('\n📝 Testing Revenue Chart...'));
  const revenueChartResult = await apiRequest('GET', '/statistics/revenue-chart', null, adminToken);
  logResult('Revenue Chart', revenueChartResult);
  
  // Test Top Products
  console.log(chalk.yellow('\n📝 Testing Top Products Stats...'));
  const topProductsResult = await apiRequest('GET', '/statistics/top-products', null, adminToken);
  logResult('Top Products Stats', topProductsResult);
  
  // Test Order Status Stats
  console.log(chalk.yellow('\n📝 Testing Order Status Stats...'));
  const orderStatusResult = await apiRequest('GET', '/statistics/order-status', null, adminToken);
  logResult('Order Status Stats', orderStatusResult);
  
  // Test User Registration Stats
  console.log(chalk.yellow('\n📝 Testing User Registration Stats...'));
  const userRegistrationResult = await apiRequest('GET', '/statistics/user-registration', null, adminToken);
  logResult('User Registration Stats', userRegistrationResult);
  
  // Test Category Distribution
  console.log(chalk.yellow('\n📝 Testing Category Distribution...'));
  const categoryDistributionResult = await apiRequest('GET', '/statistics/category-distribution', null, adminToken);
  logResult('Category Distribution', categoryDistributionResult);
  
  // Test Recent Activity
  console.log(chalk.yellow('\n📝 Testing Recent Activity...'));
  const recentActivityResult = await apiRequest('GET', '/statistics/recent-activity', null, adminToken);
  logResult('Recent Activity', recentActivityResult);
}

// CLEANUP TESTS - Delete created test data
async function cleanupTestData() {
  console.log(chalk.blue.bold('\n🧹 === CLEANUP TEST DATA ==='));
  
  // Delete test review
  if (testReviewId) {
    const deleteReviewResult = await apiRequest('DELETE', `/reviews/${testReviewId}`, null, customerToken);
    logResult('Delete Test Review', deleteReviewResult);
  }
  
  // Delete test post
  if (testPostId) {
    const deletePostResult = await apiRequest('DELETE', `/posts/${testPostId}`, null, customerToken);
    logResult('Delete Test Post', deletePostResult);
  }
  
  // Delete test banner
  if (testBannerId) {
    const deleteBannerResult = await apiRequest('DELETE', `/banners/${testBannerId}`, null, adminToken);
    logResult('Delete Test Banner', deleteBannerResult);
  }
  
  // Delete test order (Admin)
  if (testOrderId) {
    const deleteOrderResult = await apiRequest('DELETE', `/orders/admin/${testOrderId}`, null, adminToken);
    logResult('Delete Test Order', deleteOrderResult);
  }
  
  // Delete test address
  if (testAddressId) {
    const deleteAddressResult = await apiRequest('DELETE', `/addresses/${testAddressId}`, null, customerToken);
    logResult('Delete Test Address', deleteAddressResult);
  }
  
  // Delete test product variant
  if (testProductVariantId) {
    const deleteVariantResult = await apiRequest('DELETE', `/product-variants/${testProductVariantId}`, null, adminToken);
    logResult('Delete Test Product Variant', deleteVariantResult);
  }
  
  // Delete test product
  if (testProductId) {
    const deleteProductResult = await apiRequest('DELETE', `/products/${testProductId}`, null, adminToken);
    logResult('Delete Test Product', deleteProductResult);
  }
  
  // Delete test voucher
  if (testVoucherId) {
    const deleteVoucherResult = await apiRequest('DELETE', `/vouchers/admin/${testVoucherId}`, null, adminToken);
    logResult('Delete Test Voucher', deleteVoucherResult);
  }
  
  // Delete test payment method
  if (testPaymentMethodId) {
    const deletePaymentMethodResult = await apiRequest('DELETE', `/payment-methods/${testPaymentMethodId}`, null, adminToken);
    logResult('Delete Test Payment Method', deletePaymentMethodResult);
  }
  
  // Delete test color
  if (testColorId) {
    const deleteColorResult = await apiRequest('DELETE', `/colors/${testColorId}`, null, adminToken);
    logResult('Delete Test Color', deleteColorResult);
  }
  
  // Delete test size
  if (testSizeId) {
    const deleteSizeResult = await apiRequest('DELETE', `/sizes/${testSizeId}`, null, adminToken);
    logResult('Delete Test Size', deleteSizeResult);
  }
  
  // Delete test category
  if (testCategoryId) {
    const deleteCategoryResult = await apiRequest('DELETE', `/categories/${testCategoryId}`, null, adminToken);
    logResult('Delete Test Category', deleteCategoryResult);
  }
}

// MAIN TEST RUNNER
async function runAllTests() {
  console.log(chalk.blue.bold('🧪 === COMPREHENSIVE API TESTING STARTED ==='));
  console.log(chalk.gray(`Testing against: ${BASE_URL}`));
  console.log(chalk.gray(`Started at: ${new Date().toISOString()}`));
  
  try {
    // Authentication is required for most tests
    const authSuccess = await testAuthentication();
    if (!authSuccess) {
      console.log(chalk.red.bold('❌ Authentication failed. Cannot proceed with other tests.'));
      return;
    }
    
    // Run all test suites
    await testUserManagement();
    await testCategories();
    await testColorsAndSizes();
    await testProducts();
    await testProductVariants();
    await testAddresses();
    await testVouchers();
    await testPaymentMethods();
    await testBanners();
    await testPosts();
    await testOrders();
    await testReviews();
    await testWishlist();
    await testStatistics();
    
    // Cleanup test data
    await cleanupTestData();
    
    console.log(chalk.green.bold('\n🎉 === ALL API TESTS COMPLETED SUCCESSFULLY ==='));
    console.log(chalk.gray(`Completed at: ${new Date().toISOString()}`));
    
  } catch (error) {
    console.log(chalk.red.bold('\n💥 === TEST EXECUTION ERROR ==='));
    console.error(chalk.red(error));
  }
}

// Export functions for modular use
module.exports = {
  runAllTests,
  testAuthentication,
  testUserManagement,
  testCategories,
  testProducts,
  testProductVariants,
  testColorsAndSizes,
  testAddresses,
  testVouchers,
  testPaymentMethods,
  testBanners,
  testPosts,
  testOrders,
  testReviews,
  testWishlist,
  testStatistics,
  cleanupTestData,
  apiRequest
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}
