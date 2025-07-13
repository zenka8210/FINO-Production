const axios = require('axios');
const chalk = require('chalk');

const BASE_URL = 'http://localhost:5000/api';

// Helper function to add delay between requests
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function apiRequest(method, url, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {}
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error';
    return {
      success: false,
      error: errorMsg,
      status: error.response?.status || 0,
      data: error.response?.data
    };
  }
}

async function testQueryMiddlewareEndpoints() {
  console.log(chalk.blue('🧪 === QUERY MIDDLEWARE ENDPOINTS TEST ==='));
  console.log(chalk.blue('Kiểm tra tất cả endpoints sử dụng Query Middleware mới'));
  console.log('='.repeat(60));
  
  let adminToken = null;
  let userToken = null;
  
  const results = {
    // Products with Query Middleware
    'GET /products/public?page=1&limit=5': '❌',
    'GET /products/public?search=shirt': '❌',
    'GET /products/public?sort=price&order=asc': '❌',
    'GET /products/public?filter[category]=electronics': '❌',
    'GET /products/public?filter[price][min]=100000': '❌',
    'GET /products/public?filter[price][max]=500000': '❌',
    'GET /products/available?page=1&limit=3': '❌',
    
    // Users with Query Middleware (Admin only)
    'GET /users?page=1&limit=5': '❌',
    'GET /users?search=john': '❌',
    'GET /users?sort=createdAt&order=desc': '❌',
    'GET /users?filter[role]=user': '❌',
    'GET /users?filter[isActive]=true': '❌',
    
    // Orders with Query Middleware
    'GET /orders?page=1&limit=5': '❌',
    'GET /orders?search=ORD': '❌',
    'GET /orders?sort=totalAmount&order=desc': '❌',
    'GET /orders?filter[status]=pending': '❌',
    'GET /orders?filter[paymentStatus]=paid': '❌',
    
    // Categories with Query Middleware
    'GET /categories?page=1&limit=5': '❌',
    'GET /categories?search=electronics': '❌',
    'GET /categories?sort=name&order=asc': '❌',
    'GET /categories?filter[isActive]=true': '❌',
    
    // Reviews with Query Middleware
    'GET /reviews?page=1&limit=5': '❌',
    'GET /reviews?search=good': '❌',
    'GET /reviews?sort=rating&order=desc': '❌',
    'GET /reviews?filter[rating][min]=4': '❌',
    
    // Posts with Query Middleware
    'GET /posts?page=1&limit=5': '❌',
    'GET /posts?search=technology': '❌',
    'GET /posts?sort=createdAt&order=desc': '❌',
    'GET /posts?filter[isPublished]=true': '❌',
    
    // Banners with Query Middleware
    'GET /banners?page=1&limit=3': '❌',
    'GET /banners?filter[isActive]=true': '❌',
    'GET /banners?sort=order&order=asc': '❌',
    
    // Colors with Query Middleware
    'GET /colors?page=1&limit=5': '❌',
    'GET /colors?search=red': '❌',
    'GET /colors?sort=name&order=asc': '❌',
    
    // Sizes with Query Middleware
    'GET /sizes?page=1&limit=5': '❌',
    'GET /sizes?search=large': '❌',
    'GET /sizes?sort=order&order=asc': '❌',
    
    // Product Variants with Query Middleware
    'GET /product-variants?page=1&limit=5': '❌',
    'GET /product-variants?search=variant': '❌',
    'GET /product-variants?filter[stock][min]=1': '❌',
    
    // Vouchers with Query Middleware
    'GET /vouchers?page=1&limit=5': '❌',
    'GET /vouchers?search=SAVE': '❌',
    'GET /vouchers?filter[isActive]=true': '❌',
    
    // Payment Methods with Query Middleware
    'GET /payment-methods?page=1&limit=5': '❌',
    'GET /payment-methods?filter[isActive]=true': '❌',
    'GET /payment-methods?sort=createdAt&order=asc': '❌',
    
    // Wish Lists with Query Middleware
    'GET /wishlists?page=1&limit=5': '❌',
    'GET /wishlists?search=list': '❌',
    
    // Carts with Query Middleware
    'GET /cart/admin/all?page=1&limit=5': '❌',
    'GET /cart/admin/all?search=cart': '❌',
    'GET /cart/admin/all?sort=createdAt&order=desc': '❌',
    'GET /cart/admin/all?filter[type]=cart': '❌',
    'GET /cart/admin/orders?page=1&limit=5': '❌',
    'GET /cart/admin/orders?filter[status]=pending': '❌',
    'GET /cart/admin/active-carts?page=1&limit=5': '❌',
    
    // Cart Statistics
    'GET /cart/admin/statistics': '❌',
    'GET /cart/admin/trends?days=7': '❌'
  };

  try {
    // ========== AUTHENTICATION ==========
    console.log(chalk.yellow('\n🔐 === AUTHENTICATION ==='));

    // Admin login
    const adminLogin = await apiRequest('POST', '/auth/login', {
      email: 'admin@example.com',
      password: 'password123'
    });

    if (adminLogin.success) {
      adminToken = adminLogin.data.data.token;
      console.log(chalk.green('✅ Admin logged in'));
    } else {
      console.log(chalk.red('❌ Admin login failed:'), adminLogin.error);
      return;
    }

    // User login
    const userLogin = await apiRequest('POST', '/auth/login', {
      email: 'customer@example.com',
      password: 'password123'
    });

    if (userLogin.success) {
      userToken = userLogin.data.data.token;
      console.log(chalk.green('✅ User logged in'));
    } else {
      console.log(chalk.red('❌ User login failed:'), userLogin.error);
    }

    // ========== PRODUCTS QUERY MIDDLEWARE TESTS ==========
    console.log(chalk.yellow('\n📦 === TESTING PRODUCTS WITH QUERY MIDDLEWARE ==='));

    // Test 1: Pagination
    console.log(chalk.cyan('\n1. Testing Products Pagination'));
    await delay(100); // Small delay to prevent overload
    const productsPagination = await apiRequest('GET', '/products/public?page=1&limit=5');
    if (productsPagination.success && productsPagination.data?.data?.pagination) {
      results['GET /products/public?page=1&limit=5'] = '✅';
      console.log(chalk.green('   ✅ Success - Pagination:'), productsPagination.data.data.pagination);
    } else {
      console.log(chalk.red('   ❌ Failed:'), productsPagination.error || 'No pagination data');
      console.log('   Response:', JSON.stringify(productsPagination.data, null, 2));
    }

    // Test 2: Search
    console.log(chalk.cyan('\n2. Testing Products Search'));
    const productsSearch = await apiRequest('GET', '/products/public?search=shirt');
    if (productsSearch.success) {
      results['GET /products/public?search=shirt'] = '✅';
      console.log(chalk.green('   ✅ Success - Found products:'), productsSearch.data?.data?.length || 0);
    } else {
      console.log(chalk.red('   ❌ Failed:'), productsSearch.error);
    }

    // Test 3: Sorting
    console.log(chalk.cyan('\n3. Testing Products Sorting'));
    const productsSorting = await apiRequest('GET', '/products/public?sort=price&order=asc');
    if (productsSorting.success) {
      results['GET /products/public?sort=price&order=asc'] = '✅';
      console.log(chalk.green('   ✅ Success - Sorted by price ascending'));
    } else {
      console.log(chalk.red('   ❌ Failed:'), productsSorting.error);
    }

    // Test 4: Category Filter
    console.log(chalk.cyan('\n4. Testing Products Category Filter'));
    const productsFilter = await apiRequest('GET', '/products/public?filter[category]=electronics');
    if (productsFilter.success) {
      results['GET /products/public?filter[category]=electronics'] = '✅';
      console.log(chalk.green('   ✅ Success - Filtered by category'));
    } else {
      console.log(chalk.red('   ❌ Failed:'), productsFilter.error);
    }

    // Test 5: Price Range Filter
    console.log(chalk.cyan('\n5. Testing Products Price Range Filter'));
    const priceMinFilter = await apiRequest('GET', '/products/public?filter[price][min]=100000');
    if (priceMinFilter.success) {
      results['GET /products/public?filter[price][min]=100000'] = '✅';
      console.log(chalk.green('   ✅ Success - Price min filter'));
    } else {
      console.log(chalk.red('   ❌ Failed:'), priceMinFilter.error);
    }

    const priceMaxFilter = await apiRequest('GET', '/products/public?filter[price][max]=500000');
    if (priceMaxFilter.success) {
      results['GET /products/public?filter[price][max]=500000'] = '✅';
      console.log(chalk.green('   ✅ Success - Price max filter'));
    } else {
      console.log(chalk.red('   ❌ Failed:'), priceMaxFilter.error);
    }

    // Test 6: Available Products with Pagination
    console.log(chalk.cyan('\n6. Testing Available Products with Pagination'));
    await delay(100);
    const availableProducts = await apiRequest('GET', '/products/available?page=1&limit=3');
    if (availableProducts.success && availableProducts.data?.data?.pagination) {
      results['GET /products/available?page=1&limit=3'] = '✅';
      console.log(chalk.green('   ✅ Success - Available products pagination'));
    } else {
      console.log(chalk.red('   ❌ Failed:'), availableProducts.error || 'No pagination data');
      console.log('   Response:', JSON.stringify(availableProducts.data, null, 2));
    }

    // ========== USERS QUERY MIDDLEWARE TESTS (ADMIN ONLY) ==========
    console.log(chalk.yellow('\n👥 === TESTING USERS WITH QUERY MIDDLEWARE (ADMIN) ==='));

    // Test 7: Users Pagination
    console.log(chalk.cyan('\n7. Testing Users Pagination'));
    const usersPagination = await apiRequest('GET', '/users?page=1&limit=5', null, adminToken);
    if (usersPagination.success && usersPagination.data?.pagination) {
      results['GET /users?page=1&limit=5'] = '✅';
      console.log(chalk.green('   ✅ Success - Users pagination'));
    } else {
      console.log(chalk.red('   ❌ Failed:'), usersPagination.error);
    }

    // Test 8: Users Search
    console.log(chalk.cyan('\n8. Testing Users Search'));
    const usersSearch = await apiRequest('GET', '/users?search=john', null, adminToken);
    if (usersSearch.success) {
      results['GET /users?search=john'] = '✅';
      console.log(chalk.green('   ✅ Success - Users search'));
    } else {
      console.log(chalk.red('   ❌ Failed:'), usersSearch.error);
    }

    // Test 9: Users Sorting
    console.log(chalk.cyan('\n9. Testing Users Sorting'));
    const usersSorting = await apiRequest('GET', '/users?sort=createdAt&order=desc', null, adminToken);
    if (usersSorting.success) {
      results['GET /users?sort=createdAt&order=desc'] = '✅';
      console.log(chalk.green('   ✅ Success - Users sorting'));
    } else {
      console.log(chalk.red('   ❌ Failed:'), usersSorting.error);
    }

    // Test 10: Users Role Filter
    console.log(chalk.cyan('\n10. Testing Users Role Filter'));
    const usersRoleFilter = await apiRequest('GET', '/users?filter[role]=user', null, adminToken);
    if (usersRoleFilter.success) {
      results['GET /users?filter[role]=user'] = '✅';
      console.log(chalk.green('   ✅ Success - Users role filter'));
    } else {
      console.log(chalk.red('   ❌ Failed:'), usersRoleFilter.error);
    }

    // Test 11: Users Active Status Filter
    console.log(chalk.cyan('\n11. Testing Users Active Status Filter'));
    const usersActiveFilter = await apiRequest('GET', '/users?filter[isActive]=true', null, adminToken);
    if (usersActiveFilter.success) {
      results['GET /users?filter[isActive]=true'] = '✅';
      console.log(chalk.green('   ✅ Success - Users active filter'));
    } else {
      console.log(chalk.red('   ❌ Failed:'), usersActiveFilter.error);
    }

    // ========== ORDERS QUERY MIDDLEWARE TESTS ==========
    console.log(chalk.yellow('\n📋 === TESTING ORDERS WITH QUERY MIDDLEWARE ==='));

    // Test 12: Orders Pagination
    console.log(chalk.cyan('\n12. Testing Orders Pagination'));
    await delay(100);
    const ordersPagination = await apiRequest('GET', '/orders?page=1&limit=5', null, adminToken);
    if (ordersPagination.success && (ordersPagination.data?.data?.pagination || ordersPagination.data?.pagination)) {
      results['GET /orders?page=1&limit=5'] = '✅';
      console.log(chalk.green('   ✅ Success - Orders pagination'));
    } else {
      console.log(chalk.red('   ❌ Failed:'), ordersPagination.error || 'No pagination data');
      console.log('   Response:', JSON.stringify(ordersPagination.data, null, 2));
    }

    // Test 13: Orders Search
    console.log(chalk.cyan('\n13. Testing Orders Search'));
    const ordersSearch = await apiRequest('GET', '/orders?search=ORD', null, adminToken);
    if (ordersSearch.success) {
      results['GET /orders?search=ORD'] = '✅';
      console.log(chalk.green('   ✅ Success - Orders search'));
    } else {
      console.log(chalk.red('   ❌ Failed:'), ordersSearch.error);
    }

    // Test 14: Orders Sorting
    console.log(chalk.cyan('\n14. Testing Orders Sorting'));
    const ordersSorting = await apiRequest('GET', '/orders?sort=totalAmount&order=desc', null, adminToken);
    if (ordersSorting.success) {
      results['GET /orders?sort=totalAmount&order=desc'] = '✅';
      console.log(chalk.green('   ✅ Success - Orders sorting'));
    } else {
      console.log(chalk.red('   ❌ Failed:'), ordersSorting.error);
    }

    // Test 15: Orders Status Filter
    console.log(chalk.cyan('\n15. Testing Orders Status Filter'));
    const ordersStatusFilter = await apiRequest('GET', '/orders?filter[status]=pending', null, adminToken);
    if (ordersStatusFilter.success) {
      results['GET /orders?filter[status]=pending'] = '✅';
      console.log(chalk.green('   ✅ Success - Orders status filter'));
    } else {
      console.log(chalk.red('   ❌ Failed:'), ordersStatusFilter.error);
    }

    // Test 16: Orders Payment Status Filter
    console.log(chalk.cyan('\n16. Testing Orders Payment Status Filter'));
    const ordersPaymentFilter = await apiRequest('GET', '/orders?filter[paymentStatus]=paid', null, adminToken);
    if (ordersPaymentFilter.success) {
      results['GET /orders?filter[paymentStatus]=paid'] = '✅';
      console.log(chalk.green('   ✅ Success - Orders payment filter'));
    } else {
      console.log(chalk.red('   ❌ Failed:'), ordersPaymentFilter.error);
    }

    // ========== ADDITIONAL COLLECTIONS TESTS ==========
    console.log(chalk.yellow('\n🎯 === TESTING OTHER COLLECTIONS WITH QUERY MIDDLEWARE ==='));

    // Categories Tests
    console.log(chalk.cyan('\n17. Testing Categories'));
    const categoriesPagination = await apiRequest('GET', '/categories?page=1&limit=5', null, adminToken);
    if (categoriesPagination.success) {
      results['GET /categories?page=1&limit=5'] = '✅';
      console.log(chalk.green('   ✅ Categories pagination'));
    }

    const categoriesSearch = await apiRequest('GET', '/categories?search=electronics', null, adminToken);
    if (categoriesSearch.success) {
      results['GET /categories?search=electronics'] = '✅';
      console.log(chalk.green('   ✅ Categories search'));
    } else {
      console.log(chalk.red('   ❌ Categories search failed'));
    }

    const categoriesSort = await apiRequest('GET', '/categories?sort=name&order=asc', null, adminToken);
    if (categoriesSort.success && categoriesSort.data?.data?.sort) {
      results['GET /categories?sort=name&order=asc'] = '✅';
      console.log(chalk.green('   ✅ Categories sort'));
    } else {
      console.log(chalk.red('   ❌ Categories sort failed'));
    }

    const categoriesFilter = await apiRequest('GET', '/categories?filter[isActive]=true', null, adminToken);
    if (categoriesFilter.success) {
      results['GET /categories?filter[isActive]=true'] = '✅';
      console.log(chalk.green('   ✅ Categories filter'));
    } else {
      console.log(chalk.red('   ❌ Categories filter failed'));
    }

    // Reviews Tests
    console.log(chalk.cyan('\n18. Testing Reviews'));
    const reviewsPagination = await apiRequest('GET', '/reviews/admin/all?page=1&limit=5', null, adminToken);
    if (reviewsPagination.success) {
      results['GET /reviews?page=1&limit=5'] = '✅';
      console.log(chalk.green('   ✅ Reviews pagination'));
    }

    const reviewsSearch = await apiRequest('GET', '/reviews/admin/all?search=good', null, adminToken);
    if (reviewsSearch.success) {
      results['GET /reviews?search=good'] = '✅';
      console.log(chalk.green('   ✅ Reviews search'));
    } else {
      console.log(chalk.red('   ❌ Reviews search failed'));
    }

    const reviewsSort = await apiRequest('GET', '/reviews/admin/all?sort=rating&order=desc', null, adminToken);
    if (reviewsSort.success && reviewsSort.data?.data?.sort) {
      results['GET /reviews?sort=rating&order=desc'] = '✅';
      console.log(chalk.green('   ✅ Reviews sort'));
    } else {
      console.log(chalk.red('   ❌ Reviews sort failed'));
    }

    const reviewsFilter = await apiRequest('GET', '/reviews/admin/all?filter[rating][min]=4', null, adminToken);
    if (reviewsFilter.success) {
      results['GET /reviews?filter[rating][min]=4'] = '✅';
      console.log(chalk.green('   ✅ Reviews filter'));
    } else {
      console.log(chalk.red('   ❌ Reviews filter failed'));
    }

    // Posts Tests
    console.log(chalk.cyan('\n19. Testing Posts'));
    const postsPagination = await apiRequest('GET', '/posts?page=1&limit=5', null, adminToken);
    if (postsPagination.success) {
      results['GET /posts?page=1&limit=5'] = '✅';
      console.log(chalk.green('   ✅ Posts pagination'));
    }

    const postsSearch = await apiRequest('GET', '/posts?search=technology', null, adminToken);
    if (postsSearch.success) {
      results['GET /posts?search=technology'] = '✅';
      console.log(chalk.green('   ✅ Posts search'));
    } else {
      console.log(chalk.red('   ❌ Posts search failed'));
    }

    const postsSort = await apiRequest('GET', '/posts?sort=createdAt&order=desc', null, adminToken);
    if (postsSort.success && postsSort.data?.data?.sort) {
      results['GET /posts?sort=createdAt&order=desc'] = '✅';
      console.log(chalk.green('   ✅ Posts sort'));
    } else {
      console.log(chalk.red('   ❌ Posts sort failed'));
    }

    const postsFilter = await apiRequest('GET', '/posts?filter[isPublished]=true', null, adminToken);
    if (postsFilter.success) {
      results['GET /posts?filter[isPublished]=true'] = '✅';
      console.log(chalk.green('   ✅ Posts filter'));
    } else {
      console.log(chalk.red('   ❌ Posts filter failed'));
    }

    // Banners Tests
    console.log(chalk.cyan('\n20. Testing Banners'));
    const bannersPagination = await apiRequest('GET', '/banners?page=1&limit=3', null, adminToken);
    if (bannersPagination.success) {
      results['GET /banners?page=1&limit=3'] = '✅';
      console.log(chalk.green('   ✅ Banners pagination'));
    }

    const bannersFilter = await apiRequest('GET', '/banners?filter[isActive]=true', null, adminToken);
    if (bannersFilter.success) {
      results['GET /banners?filter[isActive]=true'] = '✅';
      console.log(chalk.green('   ✅ Banners filter'));
    } else {
      console.log(chalk.red('   ❌ Banners filter failed'));
    }

    const bannersSort = await apiRequest('GET', '/banners?sort=order&order=asc', null, adminToken);
    if (bannersSort.success && bannersSort.data?.data?.sort) {
      results['GET /banners?sort=order&order=asc'] = '✅';
      console.log(chalk.green('   ✅ Banners sort'));
    } else {
      console.log(chalk.red('   ❌ Banners sort failed'));
    }

    // Colors Tests
    console.log(chalk.cyan('\n21. Testing Colors'));
    const colorsPagination = await apiRequest('GET', '/colors?page=1&limit=5', null, adminToken);
    if (colorsPagination.success) {
      results['GET /colors?page=1&limit=5'] = '✅';
      console.log(chalk.green('   ✅ Colors pagination'));
    }

    const colorsSearch = await apiRequest('GET', '/colors?search=red', null, adminToken);
    if (colorsSearch.success) {
      results['GET /colors?search=red'] = '✅';
      console.log(chalk.green('   ✅ Colors search'));
    } else {
      console.log(chalk.red('   ❌ Colors search failed'));
    }

    const colorsSort = await apiRequest('GET', '/colors?sort=name&order=asc', null, adminToken);
    if (colorsSort.success && colorsSort.data?.data?.sort) {
      results['GET /colors?sort=name&order=asc'] = '✅';
      console.log(chalk.green('   ✅ Colors sort'));
    } else {
      console.log(chalk.red('   ❌ Colors sort failed'));
    }

    // Sizes Tests
    console.log(chalk.cyan('\n22. Testing Sizes'));
    const sizesPagination = await apiRequest('GET', '/sizes?page=1&limit=5', null, adminToken);
    if (sizesPagination.success) {
      results['GET /sizes?page=1&limit=5'] = '✅';
      console.log(chalk.green('   ✅ Sizes pagination'));
    }

    const sizesSearch = await apiRequest('GET', '/sizes?search=large', null, adminToken);
    if (sizesSearch.success) {
      results['GET /sizes?search=large'] = '✅';
      console.log(chalk.green('   ✅ Sizes search'));
    } else {
      console.log(chalk.red('   ❌ Sizes search failed'));
    }

    const sizesSort = await apiRequest('GET', '/sizes?sort=order&order=asc', null, adminToken);
    if (sizesSort.success && sizesSort.data?.data?.sort) {
      results['GET /sizes?sort=order&order=asc'] = '✅';
      console.log(chalk.green('   ✅ Sizes sort'));
    } else {
      console.log(chalk.red('   ❌ Sizes sort failed'));
    }

    // Product Variants Tests
    console.log(chalk.cyan('\n23. Testing Product Variants'));
    const variantsPagination = await apiRequest('GET', '/product-variants?page=1&limit=5', null, adminToken);
    if (variantsPagination.success) {
      results['GET /product-variants?page=1&limit=5'] = '✅';
      console.log(chalk.green('   ✅ Product Variants pagination'));
    }

    const variantsSearch = await apiRequest('GET', '/product-variants?search=variant', null, adminToken);
    if (variantsSearch.success) {
      results['GET /product-variants?search=variant'] = '✅';
      console.log(chalk.green('   ✅ Product Variants search'));
    } else {
      console.log(chalk.red('   ❌ Product Variants search failed'));
    }

    const variantsFilter = await apiRequest('GET', '/product-variants?filter[stock][min]=1', null, adminToken);
    if (variantsFilter.success) {
      results['GET /product-variants?filter[stock][min]=1'] = '✅';
      console.log(chalk.green('   ✅ Product Variants filter'));
    } else {
      console.log(chalk.red('   ❌ Product Variants filter failed'));
    }

    // Vouchers Tests
    console.log(chalk.cyan('\n24. Testing Vouchers'));
    const vouchersPagination = await apiRequest('GET', '/vouchers?page=1&limit=5', null, adminToken);
    if (vouchersPagination.success) {
      results['GET /vouchers?page=1&limit=5'] = '✅';
      console.log(chalk.green('   ✅ Vouchers pagination'));
    }

    const vouchersSearch = await apiRequest('GET', '/vouchers?search=SAVE', null, adminToken);
    if (vouchersSearch.success) {
      results['GET /vouchers?search=SAVE'] = '✅';
      console.log(chalk.green('   ✅ Vouchers search'));
    } else {
      console.log(chalk.red('   ❌ Vouchers search failed'));
    }

    const vouchersFilter = await apiRequest('GET', '/vouchers?filter[isActive]=true', null, adminToken);
    if (vouchersFilter.success) {
      results['GET /vouchers?filter[isActive]=true'] = '✅';
      console.log(chalk.green('   ✅ Vouchers filter'));
    } else {
      console.log(chalk.red('   ❌ Vouchers filter failed'));
    }

    // Payment Methods Tests
    console.log(chalk.cyan('\n25. Testing Payment Methods'));
    const paymentMethodsPagination = await apiRequest('GET', '/payment-methods?page=1&limit=5', null, adminToken);
    if (paymentMethodsPagination.success) {
      results['GET /payment-methods?page=1&limit=5'] = '✅';
      console.log(chalk.green('   ✅ Payment Methods pagination'));
    }

    const paymentMethodsFilter = await apiRequest('GET', '/payment-methods?filter[isActive]=true', null, adminToken);
    if (paymentMethodsFilter.success) {
      results['GET /payment-methods?filter[isActive]=true'] = '✅';
      console.log(chalk.green('   ✅ Payment Methods filter'));
    } else {
      console.log(chalk.red('   ❌ Payment Methods filter failed'));
    }

    const paymentMethodsSort = await apiRequest('GET', '/payment-methods?sort=createdAt&order=asc', null, adminToken);
    if (paymentMethodsSort.success && paymentMethodsSort.data?.data?.data) {
      results['GET /payment-methods?sort=createdAt&order=asc'] = '✅';
      console.log(chalk.green('   ✅ Payment Methods sort'));
    } else {
      console.log(chalk.red('   ❌ Payment Methods sort failed'));
    }

    // Wish Lists Tests (if routes exist)
    console.log(chalk.cyan('\n26. Testing Wish Lists'));
    const wishlistsPagination = await apiRequest('GET', '/wishlist/admin/all?page=1&limit=5', null, adminToken);
    if (wishlistsPagination.success) {
      results['GET /wishlists?page=1&limit=5'] = '✅';
      console.log(chalk.green('   ✅ Wish Lists pagination'));
    }

    const wishlistsSearch = await apiRequest('GET', '/wishlist/admin/all?search=list', null, adminToken);
    if (wishlistsSearch.success) {
      results['GET /wishlists?search=list'] = '✅';
      console.log(chalk.green('   ✅ Wish Lists search'));
    } else {
      console.log(chalk.red('   ❌ Wish Lists search failed'));
    }

    // Carts Tests (if routes exist)
    console.log(chalk.cyan('\n27. Testing Carts'));
    const cartsPagination = await apiRequest('GET', '/cart/admin/all?page=1&limit=5', null, adminToken);
    if (cartsPagination.success) {
      results['GET /cart/admin/all?page=1&limit=5'] = '✅';
      console.log(chalk.green('   ✅ Carts pagination'));
    } else {
      console.log(chalk.red('   ❌ Carts pagination failed'));
    }

    const cartsSearch = await apiRequest('GET', '/cart/admin/all?search=cart', null, adminToken);
    if (cartsSearch.success) {
      results['GET /cart/admin/all?search=cart'] = '✅';
      console.log(chalk.green('   ✅ Carts search'));
    }

    const cartsSort = await apiRequest('GET', '/cart/admin/all?sort=createdAt&order=desc', null, adminToken);
    if (cartsSort.success && cartsSort.data?.data?.data) {
      results['GET /cart/admin/all?sort=createdAt&order=desc'] = '✅';
      console.log(chalk.green('   ✅ Carts sort'));
    } else {
      console.log(chalk.red('   ❌ Carts sort failed'));
    }

    const cartsFilter = await apiRequest('GET', '/cart/admin/all?filter[type]=cart', null, adminToken);
    if (cartsFilter.success && cartsFilter.data?.data?.data) {
      results['GET /cart/admin/all?filter[type]=cart'] = '✅';
      console.log(chalk.green('   ✅ Carts filter'));
    } else {
      console.log(chalk.red('   ❌ Carts filter failed'));
    }

    const cartOrdersPagination = await apiRequest('GET', '/cart/admin/orders?page=1&limit=5', null, adminToken);
    if (cartOrdersPagination.success) {
      results['GET /cart/admin/orders?page=1&limit=5'] = '✅';
      console.log(chalk.green('   ✅ Orders pagination'));
    }

    const cartOrdersFilter = await apiRequest('GET', '/cart/admin/orders?filter[status]=pending', null, adminToken);
    if (cartOrdersFilter.success && cartOrdersFilter.data?.data?.data) {
      results['GET /cart/admin/orders?filter[status]=pending'] = '✅';
      console.log(chalk.green('   ✅ Orders filter'));
    } else {
      console.log(chalk.red('   ❌ Orders filter failed'));
    }

    const activeCartsPagination = await apiRequest('GET', '/cart/admin/active-carts?page=1&limit=5', null, adminToken);
    if (activeCartsPagination.success) {
      results['GET /cart/admin/active-carts?page=1&limit=5'] = '✅';
      console.log(chalk.green('   ✅ Active Carts pagination'));
    }

    console.log(chalk.cyan('\n28. Testing Cart Statistics'));
    const cartStatistics = await apiRequest('GET', '/cart/admin/statistics', null, adminToken);
    if (cartStatistics.success) {
      results['GET /cart/admin/statistics'] = '✅';
      console.log(chalk.green('   ✅ Cart Statistics'));
      console.log('   📊 Statistics Preview:', {
        totalCarts: cartStatistics.data?.data?.summary?.totalCarts || 0,
        totalUsers: cartStatistics.data?.data?.summary?.totalUsersWithCart || 0,
        abandonedCarts: cartStatistics.data?.data?.summary?.abandonedCarts || 0,
        topProducts: cartStatistics.data?.data?.topProductsInCart?.length || 0
      });
    } else {
      console.log(chalk.red('   ❌ Cart Statistics failed'));
    }

    const cartTrends = await apiRequest('GET', '/cart/admin/trends?days=7', null, adminToken);
    if (cartTrends.success) {
      results['GET /cart/admin/trends?days=7'] = '✅';
      console.log(chalk.green('   ✅ Cart Trends (7 days)'));
    } else {
      console.log(chalk.red('   ❌ Cart Trends failed'));
    }

  } catch (error) {
    console.log(chalk.red('❌ Test error:'), error.message);
  }

  // ========== FINAL RESULTS ==========
  console.log(chalk.yellow('\n📊 === FINAL RESULTS ==='));
  console.log('='.repeat(80));

  const passed = Object.values(results).filter(status => status === '✅').length;
  const total = Object.keys(results).length;
  const failureRate = ((total - passed) / total * 100).toFixed(1);
  const successRate = (passed / total * 100).toFixed(1);

  console.log(chalk.blue(`\n🧪 Query Middleware Endpoints Test Summary:`));
  console.log(chalk.green(`✅ Passed: ${passed}/${total} (${successRate}%)`));
  console.log(chalk.red(`❌ Failed: ${total - passed}/${total} (${failureRate}%)`));
  console.log('='.repeat(80));

  // Group results by collection
  const collections = {
    'Products': [],
    'Users': [],
    'Orders': [],
    'Categories': [],
    'Reviews': [],
    'Posts': [],
    'Banners': [],
    'Colors': [],
    'Sizes': [],
    'Product Variants': [],
    'Vouchers': [],
    'Payment Methods': [],
    'Wish Lists': [],
    'Carts': []
  };

  Object.entries(results).forEach(([endpoint, status]) => {
    if (endpoint.includes('/products')) collections['Products'].push(`${status} ${endpoint}`);
    else if (endpoint.includes('/users')) collections['Users'].push(`${status} ${endpoint}`);
    else if (endpoint.includes('/orders')) collections['Orders'].push(`${status} ${endpoint}`);
    else if (endpoint.includes('/categories')) collections['Categories'].push(`${status} ${endpoint}`);
    else if (endpoint.includes('/reviews')) collections['Reviews'].push(`${status} ${endpoint}`);
    else if (endpoint.includes('/posts')) collections['Posts'].push(`${status} ${endpoint}`);
    else if (endpoint.includes('/banners')) collections['Banners'].push(`${status} ${endpoint}`);
    else if (endpoint.includes('/colors')) collections['Colors'].push(`${status} ${endpoint}`);
    else if (endpoint.includes('/sizes')) collections['Sizes'].push(`${status} ${endpoint}`);
    else if (endpoint.includes('/product-variants')) collections['Product Variants'].push(`${status} ${endpoint}`);
    else if (endpoint.includes('/vouchers')) collections['Vouchers'].push(`${status} ${endpoint}`);
    else if (endpoint.includes('/payment-methods')) collections['Payment Methods'].push(`${status} ${endpoint}`);
    else if (endpoint.includes('/wishlists')) collections['Wish Lists'].push(`${status} ${endpoint}`);
    else if (endpoint.includes('/cart')) collections['Carts'].push(`${status} ${endpoint}`);
  });

  Object.entries(collections).forEach(([collection, tests]) => {
    if (tests.length > 0) {
      console.log(chalk.cyan(`\n📁 ${collection}:`));
      tests.forEach(test => console.log(`   ${test}`));
    }
  });

  console.log(chalk.blue('\n🎉 === QUERY MIDDLEWARE ENDPOINTS TEST COMPLETED ==='));
  
  if (successRate >= 90) {
    console.log(chalk.green('🎉 Excellent! Query Middleware integration is working perfectly!'));
  } else if (successRate >= 75) {
    console.log(chalk.yellow('⚠️  Good! Most Query Middleware endpoints are working, but some need attention.'));
  } else {
    console.log(chalk.red('❌ Warning! Many Query Middleware endpoints have issues that need to be fixed.'));
  }
}

// Run the test
if (require.main === module) {
  testQueryMiddlewareEndpoints().catch(console.error);
}

module.exports = testQueryMiddlewareEndpoints;
