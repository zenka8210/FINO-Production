/**
 * COMPREHENSIVE API TESTING SUITE - MAIN RUNNER
 * 
 * This file is the main entry point for running all API tests.
 * It orchestrates the execution of both part 1 and part 2 test suites.
 * 
 * Usage:
 * - Run all tests: node testAllAPIs_main.js
 * - Run specific parts individually:
 *   - node testAllAPIs_part1.js (Basic tests)
 *   - node testAllAPIs_part2.js (Advanced tests)
 */

const chalk = require('chalk');
const { runAllTests } = require('./testAllAPIs_part2');

// Main execution function
async function main() {
  console.log(chalk.yellow.bold('🔥 === COMPREHENSIVE API TESTING SUITE ==='));
  console.log(chalk.blue('📋 This test suite includes:'));
  console.log(chalk.gray('   ✅ Authentication & Authorization'));
  console.log(chalk.gray('   ✅ User Management'));
  console.log(chalk.gray('   ✅ Categories & Hierarchies'));
  console.log(chalk.gray('   ✅ Products & Variants'));
  console.log(chalk.gray('   ✅ Colors & Sizes'));
  console.log(chalk.gray('   ✅ Stock Management & Inventory'));
  console.log(chalk.gray('   ✅ Addresses Management'));
  console.log(chalk.gray('   ✅ Payment Methods'));
  console.log(chalk.gray('   ✅ Wishlist (Complete CRUD + Business Logic)'));
  console.log(chalk.gray('   ✅ Cart Management'));
  console.log(chalk.gray('   ✅ Cart Order Management (Unified Cart & Order)'));
  console.log(chalk.gray('   ✅ Admin Permissions & Restrictions'));
  console.log(chalk.gray('   ✅ Debug & Utility Functions'));
  
  console.log(chalk.blue('\n🚀 Starting comprehensive test execution...'));
  
  try {
    const results = await runAllTests();
    
    // Final summary
    console.log(chalk.blue.bold('\n🎯 === FINAL EXECUTION SUMMARY ==='));
    console.log(chalk.green(`✅ Total Tests Passed: ${results.passed}`));
    console.log(chalk.red(`❌ Total Tests Failed: ${results.failed}`));
    console.log(chalk.gray(`📊 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`));
    console.log(chalk.gray(`⏰ Execution completed at: ${new Date().toLocaleString()}`));
    
    if (results.failed === 0) {
      console.log(chalk.green.bold('\n🎊 🎉 🎊 PERFECT SCORE! ALL TESTS PASSED! 🎊 🎉 🎊'));
      console.log(chalk.green.bold('🚀 Your API is production-ready!'));
      console.log(chalk.green('✨ No issues found in any endpoints.'));
    } else {
      console.log(chalk.yellow.bold('\n⚠️ Some tests failed. Review the detailed results above.'));
      console.log(chalk.yellow('🔧 Please fix the failing endpoints and run tests again.'));
    }
    
    // Exit with appropriate code
    process.exit(results.failed === 0 ? 0 : 1);
    
  } catch (error) {
    console.error(chalk.red.bold('\n💥 === CRITICAL ERROR ==='));
    console.error(chalk.red('❌ Failed to execute test suite:'), error.message);
    console.error(chalk.red('📍 Stack trace:'), error.stack);
    process.exit(1);
  }
}

// Run main function if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  main
};
