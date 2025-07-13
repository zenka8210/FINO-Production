const Product = require('./models/ProductSchema');
const { QueryUtils } = require('./utils/queryUtils');

async function testQueryUtils() {
  try {
    console.log('🔍 Testing QueryUtils.getProducts...');
    
    // Test 1: Simple query without parameters
    console.log('\n1. Testing simple query...');
    const result1 = await QueryUtils.getProducts(Product, { page: 1, limit: 5 });
    console.log('✅ Simple query successful:', {
      dataLength: result1.data.length,
      total: result1.pagination.total
    });

    // Test 2: Test với QueryBuilder trực tiếp
    console.log('\n2. Testing QueryBuilder directly...');
    const { QueryBuilder } = require('./middlewares/queryMiddleware');
    const builder = new QueryBuilder(Product, { page: 1, limit: 5 });
    const result2 = await builder.paginate().execute();
    console.log('✅ QueryBuilder direct test successful:', {
      dataLength: result2.data.length,
      total: result2.pagination.total
    });

    // Test 3: Test model count
    console.log('\n3. Testing model count...');
    const count = await Product.countDocuments();
    console.log('✅ Product count:', count);

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

require('./config/db');
setTimeout(testQueryUtils, 2000); // Wait for DB connection
