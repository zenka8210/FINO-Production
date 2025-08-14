const axios = require('axios');

// Test email validation improvements
const testEmails = [
  // Valid emails
  { email: 'user@gmail.com', expected: true, description: 'Valid Gmail' },
  { email: 'test@yahoo.com', expected: true, description: 'Valid Yahoo' },
  { email: 'admin@hotmail.com', expected: true, description: 'Valid Hotmail' },
  { email: 'contact@outlook.com', expected: true, description: 'Valid Outlook' },
  
  // Invalid emails with common typos
  { email: 'user@gmal.com', expected: false, description: 'Gmail typo - gmal' },
  { email: 'test@gmai.com', expected: false, description: 'Gmail typo - gmai' },
  { email: 'admin@gmial.com', expected: false, description: 'Gmail typo - gmial' },
  { email: 'contact@gnail.com', expected: false, description: 'Gmail typo - gnail' },
  { email: 'user@gamil.com', expected: false, description: 'Gmail typo - gamil' },
  
  { email: 'test@yahho.com', expected: false, description: 'Yahoo typo - yahho' },
  { email: 'admin@yaho.com', expected: false, description: 'Yahoo typo - yaho' },
  
  { email: 'contact@hotmai.com', expected: false, description: 'Hotmail typo - hotmai' },
  { email: 'user@hotmial.com', expected: false, description: 'Hotmail typo - hotmial' },
  { email: 'test@hotmil.com', expected: false, description: 'Hotmail typo - hotmil' },
  
  { email: 'admin@outlok.com', expected: false, description: 'Outlook typo - outlok' },
  { email: 'contact@outloo.com', expected: false, description: 'Outlook typo - outloo' },
  
  // Invalid format emails
  { email: 'invalid-email', expected: false, description: 'No @ symbol' },
  { email: '@gmail.com', expected: false, description: 'No local part' },
  { email: 'user@', expected: false, description: 'No domain' },
  { email: 'user@domain', expected: false, description: 'No TLD' },
];

const BASE_URL = 'http://localhost:5000/api';

async function testEmailValidation() {
  console.log('🔍 Testing Email Validation Improvements\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of testEmails) {
    try {
      const response = await axios.post(`${BASE_URL}/auth/register`, {
        email: test.email,
        password: 'testpassword123',
        name: 'Test User'
      });
      
      if (test.expected) {
        console.log(`✅ PASS: ${test.description} - Correctly accepted`);
        passed++;
        
        // Clean up - delete the created user
        try {
          await axios.delete(`${BASE_URL}/users/email/${encodeURIComponent(test.email)}`);
        } catch (e) {
          // Ignore cleanup errors
        }
      } else {
        console.log(`❌ FAIL: ${test.description} - Should have been rejected but was accepted`);
        failed++;
      }
      
    } catch (error) {
      if (!test.expected) {
        console.log(`✅ PASS: ${test.description} - Correctly rejected`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${test.description} - Should have been accepted but was rejected`);
        console.log(`   Error: ${error.response?.data?.message || error.message}`);
        failed++;
      }
    }
  }
  
  console.log(`\n📊 Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All email validation tests passed!');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the validation logic.');
  }
}

// Test frontend validation function (if available)
function testFrontendValidation() {
  console.log('\n🎯 Testing Frontend Email Validation Function\n');
  
  // Note: This would require importing the validation function
  // For now, just show the test structure
  console.log('Frontend validation tests would include:');
  testEmails.forEach(test => {
    console.log(`- ${test.email} should be ${test.expected ? 'valid' : 'invalid'}: ${test.description}`);
  });
}

async function main() {
  console.log('🚀 Email Validation Testing Suite\n');
  console.log('This test verifies that the improved email validation:');
  console.log('1. Accepts valid email addresses');
  console.log('2. Rejects common domain typos (gmal.com, yahho.com, etc.)');
  console.log('3. Maintains proper email format validation\n');
  
  await testEmailValidation();
  testFrontendValidation();
  
  console.log('\n💡 To run this test:');
  console.log('1. Start the backend server: npm run dev (in /server)');
  console.log('2. Run this test: node testEmailValidation.js');
  console.log('\n📝 Note: Make sure the server is running before executing tests.');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testEmailValidation };
