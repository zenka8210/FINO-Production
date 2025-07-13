const express = require('express');
const mongoose = require('mongoose');
const Category = require('./models/CategorySchema');

const app = express();
app.use(express.json());

// Simple test endpoint without Query Middleware
app.get('/test-categories-simple', async (req, res) => {
  try {
    const categories = await Category.find({}).limit(3);
    res.json({ success: true, data: categories, count: categories.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint with QueryBuilder only
app.get('/test-categories-builder', async (req, res) => {
  try {
    const { QueryBuilder } = require('./middlewares/queryMiddleware');
    const builder = new QueryBuilder(Category, req.query);
    builder.paginate();
    const result = await builder.execute();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint with QueryUtils
app.get('/test-categories-utils', async (req, res) => {
  try {
    const { QueryUtils } = require('./utils/queryUtils');
    const result = await QueryUtils.getCategories(Category, req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

mongoose.connect('mongodb://localhost:27017/asm')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(5001, () => {
      console.log('🚀 Test server running on port 5001');
    });
  })
  .catch(err => console.error('❌ MongoDB connection failed:', err));
