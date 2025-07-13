// Test simple query without middleware
const mongoose = require('mongoose');
const Category = require('./models/CategorySchema');

async function testQueryDirect() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/asm');
    console.log('✅ Connected to MongoDB');

    console.log('Testing direct Category query...');
    const categories = await Category.find({}).limit(3);
    console.log('✅ Direct query successful');
    console.log('Categories found:', categories.length);

    // Test QueryBuilder
    console.log('Testing QueryBuilder...');
    const { QueryBuilder } = require('./middlewares/queryMiddleware');
    
    const queryParams = { page: 1, limit: 3 };
    const builder = new QueryBuilder(Category, queryParams);
    builder.paginate();
    
    const result = await builder.execute();
    console.log('✅ QueryBuilder successful');
    console.log('Result:', {
      dataCount: result.data.length,
      total: result.pagination.total
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testQueryDirect();
