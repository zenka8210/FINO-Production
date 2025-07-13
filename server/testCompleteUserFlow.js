const axios = require('axios');
const chalk = require('chalk');

const BASE_URL = 'http://localhost:5000/api';

// Helper function to make API requests
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
      error: error.response?.data?.message || error.message,
      status: error.response?.status,
      data: error.response?.data
    };
  }
}

async function testCompleteUserFlow() {
  console.log(chalk.blue('🚀 === COMPLETE USER FLOW TESTING ==='));
  
  const timestamp = Date.now();
  const testEmail = `testflow${timestamp}@example.com`;
  let testResults = {
    registration: false,
    duplicateEmailBlocked: false,
    login: false,
    profileUpdate: false,
    emailImmutability: false,
    addressManagement: false,
    reviewPermissions: false
  };

  try {
    console.log(chalk.yellow('\n📝 Step 1: User Registration'));
    const registerResult = await apiRequest('POST', '/auth/register', {
      email: testEmail,
      password: 'testpassword123',
      name: 'Test User',
      phone: '0123456789'
    });

    if (registerResult.success) {
      console.log(chalk.green('✅ Registration successful'));
      console.log(`   Role: ${registerResult.data?.data?.user?.role || registerResult.data?.user?.role}`);
      testResults.registration = true;
    } else {
      console.log(chalk.red('❌ Registration failed:'), registerResult.error);
    }

    // Test duplicate email
    console.log(chalk.yellow('\n📝 Step 2: Duplicate Email Prevention'));
    const duplicateResult = await apiRequest('POST', '/auth/register', {
      email: testEmail,
      password: 'testpassword123',
      name: 'Test User 2',
      phone: '0123456790'
    });

    if (!duplicateResult.success && duplicateResult.error.includes('tồn tại')) {
      console.log(chalk.green('✅ Duplicate email correctly blocked'));
      testResults.duplicateEmailBlocked = true;
    } else {
      console.log(chalk.red('❌ Duplicate email not blocked'));
    }

    // Test login
    console.log(chalk.yellow('\n📝 Step 3: User Login'));
    const loginResult = await apiRequest('POST', '/auth/login', {
      email: testEmail,
      password: 'testpassword123'
    });

    let token = null;
    if (loginResult.success) {
      console.log(chalk.green('✅ Login successful'));
      token = loginResult.data?.data?.token || loginResult.data?.token;
      testResults.login = true;
    } else {
      console.log(chalk.red('❌ Login failed:'), loginResult.error);
      return testResults; // Can't continue without token
    }

    // Test profile update (name only)
    console.log(chalk.yellow('\n📝 Step 4: Profile Update (Name)'));
    const profileUpdateResult = await apiRequest('PUT', '/users/me/profile', {
      name: 'Updated Test User',
      phone: '0987654321'
    }, token);

    if (profileUpdateResult.success) {
      console.log(chalk.green('✅ Profile update successful'));
      testResults.profileUpdate = true;
    } else {
      console.log(chalk.red('❌ Profile update failed:'), profileUpdateResult.error);
    }

    // Test email immutability
    console.log(chalk.yellow('\n📝 Step 5: Email Immutability Test'));
    const emailUpdateResult = await apiRequest('PUT', '/users/me/profile', {
      email: 'newemail@example.com',
      name: 'Another Update'
    }, token);

    if (!emailUpdateResult.success && emailUpdateResult.error.includes('thay đổi')) {
      console.log(chalk.green('✅ Email update correctly blocked'));
      testResults.emailImmutability = true;
    } else if (emailUpdateResult.success && emailUpdateResult.data?.data?.email === testEmail) {
      console.log(chalk.green('✅ Email update silently ignored (validation working)'));
      testResults.emailImmutability = true;
    } else {
      console.log(chalk.red('❌ Email update not blocked properly'));
    }

    // Test address management
    console.log(chalk.yellow('\n📝 Step 6: Address Management'));
    
    // Get current addresses
    const addressesResult = await apiRequest('GET', '/users/me/addresses', null, token);
    if (addressesResult.success) {
      console.log(chalk.blue(`📍 Current addresses: ${addressesResult.data?.length || 0}`));
    }

    // Add new address
    const addAddressResult = await apiRequest('POST', '/users/me/addresses', {
      fullName: 'Test User',
      phone: '0123456789',
      addressLine: '123 Test Street',
      city: 'Test City',
      district: 'Test District',
      ward: 'Test Ward'
    }, token);

    if (addAddressResult.success) {
      console.log(chalk.green('✅ Address added successfully'));
      const addressId = addAddressResult.data?.data?._id;
      
      // Check if it's set as default (should be for first address)
      const newAddressesResult = await apiRequest('GET', '/users/me/addresses', null, token);
      const hasDefault = newAddressesResult.data?.data?.some(addr => addr.isDefault);
      
      if (hasDefault) {
        console.log(chalk.green('✅ Default address automatically set'));
        testResults.addressManagement = true;
      }

      // Try to delete address if it's the only one (should fail)
      if (newAddressesResult.data?.data?.length === 1) {
        const deleteResult = await apiRequest('DELETE', `/users/me/addresses/${addressId}`, null, token);
        if (!deleteResult.success && deleteResult.error.includes('cuối cùng')) {
          console.log(chalk.green('✅ Cannot delete last address - correctly blocked'));
        }
      }
    } else {
      console.log(chalk.red('❌ Address add failed:'), addAddressResult.error);
    }

    // Test review permissions
    console.log(chalk.yellow('\n📝 Step 7: Review Permissions'));
    const productId = '6870cc4826df1d529b0b4d0e'; // Sample product ID
    
    const canReviewResult = await apiRequest('GET', `/reviews/can-review/${productId}`, null, token);
    if (canReviewResult.success) {
      console.log(chalk.blue(`🔍 Can review: ${canReviewResult.data?.canReview ? 'YES' : 'NO'}`));
      if (!canReviewResult.data?.canReview) {
        console.log(chalk.green(`   Reason: ${canReviewResult.data?.reason}`));
      }
      testResults.reviewPermissions = true;
    } else {
      console.log(chalk.red('❌ Review permission check failed:'), canReviewResult.error);
    }

    // Try to create review without order (should fail)
    const createReviewResult = await apiRequest('POST', '/reviews', {
      product: productId,
      rating: 5,
      comment: 'Test review'
    }, token);

    if (!createReviewResult.success) {
      console.log(chalk.green('✅ Review creation without order correctly blocked'));
    } else {
      console.log(chalk.red('❌ Review creation should have been blocked'));
    }

  } catch (error) {
    console.error(chalk.red('❌ Test error:'), error.message);
  }

  // Summary
  console.log(chalk.blue('\n📊 === TEST SUMMARY ==='));
  const totalTests = Object.keys(testResults).length;
  const passedTests = Object.values(testResults).filter(Boolean).length;
  
  Object.entries(testResults).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    const color = passed ? chalk.green : chalk.red;
    console.log(color(`${icon} ${test}: ${passed ? 'PASSED' : 'FAILED'}`));
  });

  console.log(chalk.blue(`\n🎯 Overall Score: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`));
  
  if (passedTests === totalTests) {
    console.log(chalk.green('🎉 ALL TESTS PASSED! User management is working perfectly!'));
  } else {
    console.log(chalk.yellow('⚠️  Some tests failed. Please check the implementation.'));
  }

  return testResults;
}

// Run tests
testCompleteUserFlow().catch(console.error);
