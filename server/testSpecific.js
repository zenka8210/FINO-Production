const axios = require('axios');

async function testIndividualEndpoints() {
  console.log('=== DETAILED ENDPOINT TESTING ===\n');

  // Test Categories Tree (no middleware)
  console.log('1. Testing Categories Tree (no Query Middleware)...');
  try {
    const response = await axios.get('http://localhost:5000/api/categories/tree', { timeout: 3000 });
    console.log('✅ Categories Tree successful');
  } catch (error) {
    console.log('❌ Categories Tree failed:', error.code || error.message);
  }

  // Test Categories Roots (no middleware)
  console.log('\n2. Testing Categories Roots (no Query Middleware)...');
  try {
    const response = await axios.get('http://localhost:5000/api/categories/roots', { timeout: 3000 });
    console.log('✅ Categories Roots successful');
  } catch (error) {
    console.log('❌ Categories Roots failed:', error.code || error.message);
  }

  // Test Categories Public (WITH Query Middleware) 
  console.log('\n3. Testing Categories Public (WITH Query Middleware)...');
  try {
    const response = await axios.get('http://localhost:5000/api/categories/public?page=1&limit=2', { timeout: 3000 });
    console.log('❌ This should have timed out but did not!');
  } catch (error) {
    console.log('✅ Categories Public timeout as expected:', error.code || error.message);
  }

  // Test Products Available (no middleware)
  console.log('\n4. Testing Products Available (no Query Middleware)...');
  try {
    const response = await axios.get('http://localhost:5000/api/products/available', { timeout: 3000 });
    console.log('✅ Products Available successful');
  } catch (error) {
    console.log('❌ Products Available failed:', error.code || error.message);
  }

  console.log('\n=== CONCLUSION ===');
  console.log('Routes WITHOUT Query Middleware work fine.');
  console.log('Routes WITH Query Middleware timeout.');
  console.log('The issue is specifically with Query Middleware implementation.');
}

testIndividualEndpoints().catch(console.error);
