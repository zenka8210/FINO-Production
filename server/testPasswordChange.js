const axios = require('axios');
const chalk = require('chalk');

const BASE_URL = 'http://localhost:5000/api';

// Test configuration
const testConfig = {
  timeout: 10000,
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Test user data
const testUser = {
  email: `testuser_password_${Date.now()}@example.com`,
  password: 'oldPassword123',
  newPassword: 'newPassword456',
  wrongPassword: 'wrongPassword123',
  name: 'Test User Password Change'
};

let authToken = '';

// Utility functions
const logStep = (step, description) => {
  console.log(chalk.blue(`📝 ${step}: ${description}`));
};

const logSuccess = (message, data = null) => {
  console.log(chalk.green(`✅ ${message}`));
  if (data) {
    console.log(chalk.gray(`   ${JSON.stringify(data, null, 2)}`));
  }
};

const logError = (message, error = null) => {
  console.log(chalk.red(`❌ ${message}`));
  if (error) {
    console.log(chalk.gray(`   ${error}`));
  }
};

const logInfo = (message, data = null) => {
  console.log(chalk.yellow(`🔍 ${message}`));
  if (data) {
    console.log(chalk.gray(`   ${JSON.stringify(data, null, 2)}`));
  }
};

const makeRequest = async (method, url, data = null, token = null) => {
  try {
    const config = { ...testConfig, method, url };
    if (data) config.data = data;
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    
    console.log(chalk.gray(`   🔗 ${method.toUpperCase()} ${url}`));
    if (token) console.log(chalk.gray(`   🔑 Auth: Bearer ${token.substring(0, 20)}...`));
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    console.log(chalk.gray(`   ❌ Error: ${error.response?.status} ${error.response?.statusText}`));
    return { 
      success: false, 
      error: error.response?.data?.message || error.message,
      status: error.response?.status 
    };
  }
};

const testPasswordChangeFlow = async () => {
  console.log(chalk.yellow('🚀 === PASSWORD CHANGE TESTING ===\n'));

  const results = {
    registration: false,
    login: false,
    passwordChangeSuccess: false,
    passwordChangeWrongCurrent: false,
    passwordChangeShort: false,
    loginWithNewPassword: false,
    loginWithOldPassword: false
  };

  try {
    // Step 1: Register new user
    logStep('Step 1', 'User Registration');
    const registerResult = await makeRequest('POST', '/auth/register', {
      email: testUser.email,
      password: testUser.password,
      name: testUser.name
    });

    if (registerResult.success) {
      logSuccess('Registration successful');
      logInfo('User role', registerResult.data.data?.role);
      results.registration = true;
    } else {
      logError('Registration failed', registerResult.error);
      return results;
    }

    // Step 2: Login with original password
    logStep('Step 2', 'User Login');
    const loginResult = await makeRequest('POST', '/auth/login', {
      email: testUser.email,
      password: testUser.password
    });

    if (loginResult.success) {
      console.log(chalk.gray(`   Login response: ${JSON.stringify(loginResult.data, null, 2)}`));
      authToken = loginResult.data.token || loginResult.data.data?.token;
      logSuccess('Login successful');
      logInfo('Auth token available', authToken ? 'Yes' : 'No');
      results.login = true;
    } else {
      logError('Login failed', loginResult.error);
      return results;
    }

    // Step 3: Test password change with wrong current password
    logStep('Step 3', 'Password Change - Wrong Current Password');
    const wrongPasswordResult = await makeRequest('PUT', '/users/me/password', {
      currentPassword: testUser.wrongPassword,
      newPassword: testUser.newPassword
    }, authToken);

    if (!wrongPasswordResult.success && wrongPasswordResult.status === 400) {
      logSuccess('Wrong current password correctly blocked');
      logInfo('Error message', wrongPasswordResult.error);
      results.passwordChangeWrongCurrent = true;
    } else {
      logError('Wrong current password validation failed', wrongPasswordResult.error);
    }

    // Step 4: Test password change with short new password
    logStep('Step 4', 'Password Change - Short New Password');
    const shortPasswordResult = await makeRequest('PUT', '/users/me/password', {
      currentPassword: testUser.password,
      newPassword: '123' // Too short
    }, authToken);

    if (!shortPasswordResult.success && shortPasswordResult.status === 400) {
      logSuccess('Short new password correctly blocked');
      logInfo('Error message', shortPasswordResult.error);
      results.passwordChangeShort = true;
    } else {
      logError('Short password validation failed', shortPasswordResult.error);
    }

    // Step 5: Successful password change
    logStep('Step 5', 'Password Change - Success');
    const changePasswordResult = await makeRequest('PUT', '/users/me/password', {
      currentPassword: testUser.password,
      newPassword: testUser.newPassword
    }, authToken);

    if (changePasswordResult.success) {
      logSuccess('Password change successful');
      logInfo('Response', changePasswordResult.data.message);
      results.passwordChangeSuccess = true;
    } else {
      logError('Password change failed', changePasswordResult.error);
      return results;
    }

    // Step 6: Test login with new password
    logStep('Step 6', 'Login with New Password');
    const loginNewResult = await makeRequest('POST', '/auth/login', {
      email: testUser.email,
      password: testUser.newPassword
    });

    if (loginNewResult.success) {
      logSuccess('Login with new password successful');
      results.loginWithNewPassword = true;
    } else {
      logError('Login with new password failed', loginNewResult.error);
    }

    // Step 7: Test login with old password (should fail)
    logStep('Step 7', 'Login with Old Password (Should Fail)');
    const loginOldResult = await makeRequest('POST', '/auth/login', {
      email: testUser.email,
      password: testUser.password
    });

    if (!loginOldResult.success && loginOldResult.status === 401) {
      logSuccess('Login with old password correctly blocked');
      logInfo('Error message', loginOldResult.error);
      results.loginWithOldPassword = true;
    } else {
      logError('Login with old password should have failed', loginOldResult.error);
    }

  } catch (error) {
    logError('Unexpected error during testing', error.message);
  }

  // Test Summary
  console.log(chalk.yellow('\n📊 === TEST SUMMARY ==='));
  const testItems = [
    { name: 'registration', label: 'User Registration' },
    { name: 'login', label: 'Initial Login' },
    { name: 'passwordChangeWrongCurrent', label: 'Wrong Current Password Blocked' },
    { name: 'passwordChangeShort', label: 'Short Password Blocked' },
    { name: 'passwordChangeSuccess', label: 'Password Change Success' },
    { name: 'loginWithNewPassword', label: 'Login with New Password' },
    { name: 'loginWithOldPassword', label: 'Old Password Blocked' }
  ];

  let passedTests = 0;
  testItems.forEach(test => {
    const status = results[test.name] ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} ${test.label}`);
    if (results[test.name]) passedTests++;
  });

  const successRate = Math.round((passedTests / testItems.length) * 100);
  console.log(chalk.yellow(`\n🎯 Overall Score: ${passedTests}/${testItems.length} (${successRate}%)`));
  
  if (successRate === 100) {
    console.log(chalk.green('🎉 ALL PASSWORD CHANGE TESTS PASSED! Password management is working perfectly!'));
  } else if (successRate >= 80) {
    console.log(chalk.yellow('⚠️  Most tests passed, but some issues need attention.'));
  } else {
    console.log(chalk.red('🚨 Multiple failures detected. Password change functionality needs review.'));
  }

  return results;
};

// Validate server connectivity
const validateServer = async () => {
  try {
    // Try a simple request to check if server is running
    const response = await axios.get(`${BASE_URL.replace('/api', '')}/`, { timeout: 5000 });
    return true;
  } catch (error) {
    try {
      // Try auth endpoint instead
      const response = await axios.get(`${BASE_URL}/auth`, { timeout: 5000 });
      return true;
    } catch (error2) {
      console.log(chalk.red('❌ Server not accessible. Please ensure the backend server is running.'));
      console.log(chalk.gray('   Start server with: npm run dev'));
      console.log(chalk.gray(`   Expected server at: ${BASE_URL.replace('/api', '')}`));
      return false;
    }
  }
};

// Main execution
const main = async () => {
  const isServerReady = await validateServer();
  if (!isServerReady) {
    process.exit(1);
  }

  const results = await testPasswordChangeFlow();
  process.exit(0);
};

// Handle process termination
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n⚠️  Test interrupted by user'));
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.log(chalk.red('\n🚨 Uncaught Exception:'), error.message);
  process.exit(1);
});

main();
