const axios = require('axios');
const chalk = require('chalk');

const BASE_URL = 'http://localhost:5000/api';

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
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Unknown error',
      status: error.response?.status,
      data: error.response?.data
    };
  }
}

async function testAllAPIsWithQueryMiddleware() {
  console.log(chalk.blue('🧪 === COMPREHENSIVE API TEST WITH QUERY MIDDLEWARE ==='));
  console.log(chalk.blue('Kiểm tra tất cả APIs đã tích hợp Query Middleware'));
  console.log('='.repeat(80));
  
  let adminToken = null;
  let userToken = null;
  
  const testResults = {
    authentication: { passed: 0, total: 2, tests: {} },
    products: { passed: 0, total: 8, tests: {} },
    users: { passed: 0, total: 5, tests: {} },
    orders: { passed: 0, total: 5, tests: {} },
    categories: { passed: 0, total: 4, tests: {} },
    reviews: { passed: 0, total: 4, tests: {} },
    posts: { passed: 0, total: 4, tests: {} },
    banners: { passed: 0, total: 3, tests: {} },
    colors: { passed: 0, total: 3, tests: {} },
    sizes: { passed: 0, total: 3, tests: {} },
    productVariants: { passed: 0, total: 3, tests: {} },
    vouchers: { passed: 0, total: 3, tests: {} },
    paymentMethods: { passed: 0, total: 3, tests: {} },
    wishLists: { passed: 0, total: 2, tests: {} }
  };

  try {
    // ========== AUTHENTICATION ==========
    console.log(chalk.yellow('\n🔐 === AUTHENTICATION ==='));

    // Admin login
    console.log(chalk.cyan('1. Admin Login'));
    const adminLogin = await apiRequest('POST', '/auth/login', {
      email: 'admin@example.com',
      password: 'password123'
    });

    if (adminLogin.success) {
      adminToken = adminLogin.data.data.token;
      testResults.authentication.tests['Admin Login'] = '✅';
      testResults.authentication.passed++;
      console.log(chalk.green('   ✅ Success'));
    } else {
      testResults.authentication.tests['Admin Login'] = '❌';
      console.log(chalk.red('   ❌ Failed:'), adminLogin.error);
    }

    // User login
    console.log(chalk.cyan('2. User Login'));
    const userLogin = await apiRequest('POST', '/auth/login', {
      email: 'customer@example.com',
      password: 'password123'
    });

    if (userLogin.success) {
      userToken = userLogin.data.data.token;
      testResults.authentication.tests['User Login'] = '✅';
      testResults.authentication.passed++;
      console.log(chalk.green('   ✅ Success'));
    } else {
      testResults.authentication.tests['User Login'] = '❌';
      console.log(chalk.red('   ❌ Failed:'), userLogin.error);
    }

    if (!adminToken) {
      console.log(chalk.red('❌ Cannot continue without admin token'));
      return;
    }

    // ========== PRODUCTS TESTS ==========
    console.log(chalk.yellow('\n📦 === PRODUCTS WITH QUERY MIDDLEWARE ==='));

    const productTests = [
      { name: 'Public Products Pagination', url: '/products/public?page=1&limit=5', token: null },
      { name: 'Public Products Search', url: '/products/public?search=shirt', token: null },
      { name: 'Public Products Sort', url: '/products/public?sort=price&order=asc', token: null },
      { name: 'Public Products Category Filter', url: '/products/public?filter[category]=electronics', token: null },
      { name: 'Public Products Price Filter', url: '/products/public?filter[price][min]=100000', token: null },
      { name: 'Available Products Pagination', url: '/products/available?page=1&limit=3', token: null },
      { name: 'Admin Products Pagination', url: '/products?page=1&limit=5', token: adminToken },
      { name: 'Admin Products Search & Sort', url: '/products?search=product&sort=name&order=asc', token: adminToken }
    ];

    for (let i = 0; i < productTests.length; i++) {
      const test = productTests[i];
      console.log(chalk.cyan(`${i + 1}. ${test.name}`));
      const result = await apiRequest('GET', test.url, null, test.token);
      
      if (result.success) {
        testResults.products.tests[test.name] = '✅';
        testResults.products.passed++;
        console.log(chalk.green('   ✅ Success'));
      } else {
        testResults.products.tests[test.name] = '❌';
        console.log(chalk.red('   ❌ Failed:'), result.error);
      }
    }

    // ========== USERS TESTS ==========
    console.log(chalk.yellow('\n👥 === USERS WITH QUERY MIDDLEWARE ==='));

    const userTests = [
      { name: 'Users Pagination', url: '/users?page=1&limit=5' },
      { name: 'Users Search', url: '/users?search=john' },
      { name: 'Users Sort', url: '/users?sort=createdAt&order=desc' },
      { name: 'Users Role Filter', url: '/users?filter[role]=user' },
      { name: 'Users Active Filter', url: '/users?filter[isActive]=true' }
    ];

    for (let i = 0; i < userTests.length; i++) {
      const test = userTests[i];
      console.log(chalk.cyan(`${i + 1}. ${test.name}`));
      const result = await apiRequest('GET', test.url, null, adminToken);
      
      if (result.success) {
        testResults.users.tests[test.name] = '✅';
        testResults.users.passed++;
        console.log(chalk.green('   ✅ Success'));
      } else {
        testResults.users.tests[test.name] = '❌';
        console.log(chalk.red('   ❌ Failed:'), result.error);
      }
    }

    // ========== ORDERS TESTS ==========
    console.log(chalk.yellow('\n📋 === ORDERS WITH QUERY MIDDLEWARE ==='));

    const orderTests = [
      { name: 'Orders Pagination', url: '/orders?page=1&limit=5' },
      { name: 'Orders Search', url: '/orders?search=ORD' },
      { name: 'Orders Sort', url: '/orders?sort=totalAmount&order=desc' },
      { name: 'Orders Status Filter', url: '/orders?filter[status]=pending' },
      { name: 'Orders Payment Filter', url: '/orders?filter[paymentStatus]=paid' }
    ];

    for (let i = 0; i < orderTests.length; i++) {
      const test = orderTests[i];
      console.log(chalk.cyan(`${i + 1}. ${test.name}`));
      const result = await apiRequest('GET', test.url, null, adminToken);
      
      if (result.success) {
        testResults.orders.tests[test.name] = '✅';
        testResults.orders.passed++;
        console.log(chalk.green('   ✅ Success'));
      } else {
        testResults.orders.tests[test.name] = '❌';
        console.log(chalk.red('   ❌ Failed:'), result.error);
      }
    }

    // ========== CATEGORIES TESTS ==========
    console.log(chalk.yellow('\n🏷️  === CATEGORIES WITH QUERY MIDDLEWARE ==='));

    const categoryTests = [
      { name: 'Categories Pagination', url: '/categories/public?page=1&limit=5' },
      { name: 'Categories Search', url: '/categories/public?search=electronics' },
      { name: 'Categories Sort', url: '/categories/public?sort=name&order=asc' },
      { name: 'Categories Active Filter', url: '/categories/public?filter[isActive]=true' }
    ];

    for (let i = 0; i < categoryTests.length; i++) {
      const test = categoryTests[i];
      console.log(chalk.cyan(`${i + 1}. ${test.name}`));
      const result = await apiRequest('GET', test.url, null, adminToken);
      
      if (result.success) {
        testResults.categories.tests[test.name] = '✅';
        testResults.categories.passed++;
        console.log(chalk.green('   ✅ Success'));
      } else {
        testResults.categories.tests[test.name] = '❌';
        console.log(chalk.red('   ❌ Failed:'), result.error);
      }
    }

    // ========== REVIEWS TESTS ==========
    console.log(chalk.yellow('\n⭐ === REVIEWS WITH QUERY MIDDLEWARE ==='));

    const reviewTests = [
      { name: 'Reviews Pagination', url: '/reviews?page=1&limit=5' },
      { name: 'Reviews Search', url: '/reviews?search=good' },
      { name: 'Reviews Sort', url: '/reviews?sort=rating&order=desc' },
      { name: 'Reviews Rating Filter', url: '/reviews?filter[rating][min]=4' }
    ];

    for (let i = 0; i < reviewTests.length; i++) {
      const test = reviewTests[i];
      console.log(chalk.cyan(`${i + 1}. ${test.name}`));
      const result = await apiRequest('GET', test.url, null, adminToken);
      
      if (result.success) {
        testResults.reviews.tests[test.name] = '✅';
        testResults.reviews.passed++;
        console.log(chalk.green('   ✅ Success'));
      } else {
        testResults.reviews.tests[test.name] = '❌';
        console.log(chalk.red('   ❌ Failed:'), result.error);
      }
    }

    // ========== POSTS TESTS ==========
    console.log(chalk.yellow('\n📝 === POSTS WITH QUERY MIDDLEWARE ==='));

    const postTests = [
      { name: 'Posts Pagination', url: '/posts?page=1&limit=5' },
      { name: 'Posts Search', url: '/posts?search=technology' },
      { name: 'Posts Sort', url: '/posts?sort=createdAt&order=desc' },
      { name: 'Posts Published Filter', url: '/posts?filter[isPublished]=true' }
    ];

    for (let i = 0; i < postTests.length; i++) {
      const test = postTests[i];
      console.log(chalk.cyan(`${i + 1}. ${test.name}`));
      const result = await apiRequest('GET', test.url, null, adminToken);
      
      if (result.success) {
        testResults.posts.tests[test.name] = '✅';
        testResults.posts.passed++;
        console.log(chalk.green('   ✅ Success'));
      } else {
        testResults.posts.tests[test.name] = '❌';
        console.log(chalk.red('   ❌ Failed:'), result.error);
      }
    }

    // ========== BANNERS TESTS ==========
    console.log(chalk.yellow('\n🎨 === BANNERS WITH QUERY MIDDLEWARE ==='));

    const bannerTests = [
      { name: 'Banners Pagination', url: '/banners?page=1&limit=3' },
      { name: 'Banners Active Filter', url: '/banners?filter[isActive]=true' },
      { name: 'Banners Sort', url: '/banners?sort=order&order=asc' }
    ];

    for (let i = 0; i < bannerTests.length; i++) {
      const test = bannerTests[i];
      console.log(chalk.cyan(`${i + 1}. ${test.name}`));
      const result = await apiRequest('GET', test.url, null, adminToken);
      
      if (result.success) {
        testResults.banners.tests[test.name] = '✅';
        testResults.banners.passed++;
        console.log(chalk.green('   ✅ Success'));
      } else {
        testResults.banners.tests[test.name] = '❌';
        console.log(chalk.red('   ❌ Failed:'), result.error);
      }
    }

    // ========== COLORS TESTS ==========
    console.log(chalk.yellow('\n🎨 === COLORS WITH QUERY MIDDLEWARE ==='));

    const colorTests = [
      { name: 'Colors Pagination', url: '/colors?page=1&limit=5' },
      { name: 'Colors Search', url: '/colors?search=red' },
      { name: 'Colors Sort', url: '/colors?sort=name&order=asc' }
    ];

    for (let i = 0; i < colorTests.length; i++) {
      const test = colorTests[i];
      console.log(chalk.cyan(`${i + 1}. ${test.name}`));
      const result = await apiRequest('GET', test.url, null, adminToken);
      
      if (result.success) {
        testResults.colors.tests[test.name] = '✅';
        testResults.colors.passed++;
        console.log(chalk.green('   ✅ Success'));
      } else {
        testResults.colors.tests[test.name] = '❌';
        console.log(chalk.red('   ❌ Failed:'), result.error);
      }
    }

    // ========== SIZES TESTS ==========
    console.log(chalk.yellow('\n📏 === SIZES WITH QUERY MIDDLEWARE ==='));

    const sizeTests = [
      { name: 'Sizes Pagination', url: '/sizes?page=1&limit=5' },
      { name: 'Sizes Search', url: '/sizes?search=large' },
      { name: 'Sizes Sort', url: '/sizes?sort=order&order=asc' }
    ];

    for (let i = 0; i < sizeTests.length; i++) {
      const test = sizeTests[i];
      console.log(chalk.cyan(`${i + 1}. ${test.name}`));
      const result = await apiRequest('GET', test.url, null, adminToken);
      
      if (result.success) {
        testResults.sizes.tests[test.name] = '✅';
        testResults.sizes.passed++;
        console.log(chalk.green('   ✅ Success'));
      } else {
        testResults.sizes.tests[test.name] = '❌';
        console.log(chalk.red('   ❌ Failed:'), result.error);
      }
    }

    // ========== PRODUCT VARIANTS TESTS ==========
    console.log(chalk.yellow('\n🔄 === PRODUCT VARIANTS WITH QUERY MIDDLEWARE ==='));

    const variantTests = [
      { name: 'Product Variants Pagination', url: '/product-variants?page=1&limit=5' },
      { name: 'Product Variants Search', url: '/product-variants?search=variant' },
      { name: 'Product Variants Stock Filter', url: '/product-variants?filter[stock][min]=1' }
    ];

    for (let i = 0; i < variantTests.length; i++) {
      const test = variantTests[i];
      console.log(chalk.cyan(`${i + 1}. ${test.name}`));
      const result = await apiRequest('GET', test.url, null, adminToken);
      
      if (result.success) {
        testResults.productVariants.tests[test.name] = '✅';
        testResults.productVariants.passed++;
        console.log(chalk.green('   ✅ Success'));
      } else {
        testResults.productVariants.tests[test.name] = '❌';
        console.log(chalk.red('   ❌ Failed:'), result.error);
      }
    }

    // ========== VOUCHERS TESTS ==========
    console.log(chalk.yellow('\n🎫 === VOUCHERS WITH QUERY MIDDLEWARE ==='));

    const voucherTests = [
      { name: 'Vouchers Pagination', url: '/vouchers?page=1&limit=5' },
      { name: 'Vouchers Search', url: '/vouchers?search=SAVE' },
      { name: 'Vouchers Active Filter', url: '/vouchers?filter[isActive]=true' }
    ];

    for (let i = 0; i < voucherTests.length; i++) {
      const test = voucherTests[i];
      console.log(chalk.cyan(`${i + 1}. ${test.name}`));
      const result = await apiRequest('GET', test.url, null, adminToken);
      
      if (result.success) {
        testResults.vouchers.tests[test.name] = '✅';
        testResults.vouchers.passed++;
        console.log(chalk.green('   ✅ Success'));
      } else {
        testResults.vouchers.tests[test.name] = '❌';
        console.log(chalk.red('   ❌ Failed:'), result.error);
      }
    }

    // ========== PAYMENT METHODS TESTS ==========
    console.log(chalk.yellow('\n💳 === PAYMENT METHODS WITH QUERY MIDDLEWARE ==='));

    const paymentTests = [
      { name: 'Payment Methods Pagination', url: '/payment-methods?page=1&limit=5' },
      { name: 'Payment Methods Active Filter', url: '/payment-methods?filter[isActive]=true' },
      { name: 'Payment Methods Sort', url: '/payment-methods?sort=order&order=asc' }
    ];

    for (let i = 0; i < paymentTests.length; i++) {
      const test = paymentTests[i];
      console.log(chalk.cyan(`${i + 1}. ${test.name}`));
      const result = await apiRequest('GET', test.url, null, adminToken);
      
      if (result.success) {
        testResults.paymentMethods.tests[test.name] = '✅';
        testResults.paymentMethods.passed++;
        console.log(chalk.green('   ✅ Success'));
      } else {
        testResults.paymentMethods.tests[test.name] = '❌';
        console.log(chalk.red('   ❌ Failed:'), result.error);
      }
    }

    // ========== WISH LISTS TESTS ==========
    console.log(chalk.yellow('\n❤️  === WISH LISTS WITH QUERY MIDDLEWARE ==='));

    const wishlistTests = [
      { name: 'Wish Lists Pagination', url: '/wishlist?page=1&limit=5' },
      { name: 'Wish Lists Search', url: '/wishlist?search=list' }
    ];

    for (let i = 0; i < wishlistTests.length; i++) {
      const test = wishlistTests[i];
      console.log(chalk.cyan(`${i + 1}. ${test.name}`));
      const result = await apiRequest('GET', test.url, null, userToken);
      
      if (result.success) {
        testResults.wishLists.tests[test.name] = '✅';
        testResults.wishLists.passed++;
        console.log(chalk.green('   ✅ Success'));
      } else {
        testResults.wishLists.tests[test.name] = '❌';
        console.log(chalk.red('   ❌ Failed:'), result.error);
      }
    }

  } catch (error) {
    console.log(chalk.red('❌ Test error:'), error.message);
  }

  // ========== FINAL RESULTS ==========
  console.log(chalk.yellow('\n📊 === FINAL COMPREHENSIVE RESULTS ==='));
  console.log('='.repeat(80));

  let totalPassed = 0;
  let totalTests = 0;

  Object.entries(testResults).forEach(([collection, results]) => {
    const percentage = results.total > 0 ? Math.round((results.passed / results.total) * 100) : 0;
    totalPassed += results.passed;
    totalTests += results.total;
    
    const status = percentage === 100 ? '🟢' : percentage >= 80 ? '🟡' : '🔴';
    
    console.log(`${status} ${collection.toUpperCase()}: ${results.passed}/${results.total} (${percentage}%)`);
    
    // Show individual test results
    Object.entries(results.tests).forEach(([testName, status]) => {
      console.log(`   ${status} ${testName}`);
    });
    console.log('');
  });

  const overallPercentage = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;

  console.log('='.repeat(80));
  console.log(chalk.blue(`\n🎯 OVERALL RESULTS:`));
  console.log(chalk.green(`✅ Passed: ${totalPassed}/${totalTests} (${overallPercentage}%)`));
  console.log(chalk.red(`❌ Failed: ${totalTests - totalPassed}/${totalTests} (${100 - overallPercentage}%)`));

  if (overallPercentage >= 95) {
    console.log(chalk.green('\n🎉 EXCELLENT! Query Middleware integration is nearly perfect!'));
  } else if (overallPercentage >= 85) {
    console.log(chalk.yellow('\n⚠️  GOOD! Most Query Middleware features are working well.'));
  } else if (overallPercentage >= 70) {
    console.log(chalk.yellow('\n⚠️  FAIR! Query Middleware needs some improvements.'));
  } else {
    console.log(chalk.red('\n❌ POOR! Query Middleware integration needs significant work.'));
  }

  console.log(chalk.blue('\n🎉 === COMPREHENSIVE API TEST WITH QUERY MIDDLEWARE COMPLETED ==='));
  
  return {
    totalPassed,
    totalTests,
    overallPercentage,
    detailedResults: testResults
  };
}

// Run the test
if (require.main === module) {
  testAllAPIsWithQueryMiddleware().catch(console.error);
}

module.exports = testAllAPIsWithQueryMiddleware;
