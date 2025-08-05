require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');

// Import middlewares và services
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();
const port = process.env.PORT || 3000;
const dbUri = process.env.DB_URI;

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',  // Next.js default port
    'http://localhost:3001',  // Alternate Next.js port
    'http://localhost:3002',  // Frontend current port
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'https://accounts.google.com', // Google OAuth
    'https://www.googleapis.com', // Google APIs
    'https://sandbox.vnpayment.vn', // VNPay Sandbox
    'https://vnpay.vn', // VNPay Production
    process.env.FRONTEND_URL, // Frontend URL từ .env
    // Thêm domain production nếu có
  ].filter(Boolean), // Loại bỏ undefined values
  credentials: true, // Cho phép gửi cookies và headers xác thực
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'Pragma',
    'X-CSRF-Token',
    'Access-Control-Allow-Origin'
  ],
  exposedHeaders: ['Set-Cookie'] // Cho phép frontend đọc Set-Cookie header
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Middlewares
app.use(express.json());

// Session middleware for wishlist guest functionality
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-here',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: dbUri || 'mongodb://localhost:27017/asm'
    }),
    cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Route imports
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const userRoutes = require('./routes/userRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
const addressRoutes = require('./routes/addressRoutes');
const postRoutes = require('./routes/postRoutes'); 
const bannerRoutes = require('./routes/bannerRoutes');
const paymentMethodRoutes = require('./routes/paymentMethodRoutes');
const colorRoutes = require('./routes/colorRoutes');
const sizeRoutes = require('./routes/sizeRoutes');
const wishListRoutes = require('./routes/wishListRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const productVariantRoutes = require('./routes/productVariantRoutes');
const cartRoutes = require('./routes/cartRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const homePageRoutes = require('./routes/homePage');
const personalizationRoutes = require('./routes/personalizationRoutes');

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/posts', postRoutes); // Enabled post routes
app.use('/api/banners', bannerRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/colors', colorRoutes);
app.use('/api/sizes', sizeRoutes);
app.use('/api/wishlist', wishListRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/product-variants', productVariantRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payment', paymentRoutes); // VNPay payment routes
app.use('/api/home', homePageRoutes); // Homepage aggregated data routes - Re-enabled with simple service
app.use('/api/personalization', personalizationRoutes); // Personalization routes for category sidebar

app.get('/', (req, res) => {
  res.send('Welcome to E-commerce API System!');
});

// DEBUG ENDPOINT để test Query Middleware
app.get('/debug/products', async (req, res) => {
  try {
    const Product = require('./models/ProductSchema');
    console.log('🔍 Debug: Testing product count...');
    const count = await Product.countDocuments();
    console.log('✅ Product count:', count);
    
    console.log('🔍 Debug: Testing QueryUtils...');
    const { QueryUtils } = require('./utils/queryUtils');
    const result = await QueryUtils.getProducts(Product, { page: 1, limit: 3 });
    console.log('✅ QueryUtils result:', {
      dataLength: result.data.length,
      total: result.pagination.total
    });
    
    res.json({
      success: true,
      productCount: count,
      queryResult: {
        dataLength: result.data.length,
        total: result.pagination.total,
        sample: result.data[0] || null
      }
    });
  } catch (error) {
    console.error('❌ Debug error:', error.message);
    res.json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Error handling middleware (phải đặt cuối cùng sau tất cả routes)
app.use(errorHandler);

// ==========================================
// MONGODB CONNECTION & SERVER STARTUP
// ==========================================
console.log('🔄 Attempting to connect to MongoDB...');
console.log(`📍 Database URI: ${dbUri}`);

mongoose.connect(dbUri)
.then(() => {
  console.log('✅ Successfully connected to MongoDB');
  console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
  
  // Initialize background job service
  const backgroundJobService = require('./services/backgroundJobService');
  console.log('🔧 Background job service initialized');
  
  // Chỉ khởi động server sau khi kết nối MongoDB thành công
  app.listen(port, () => {
    console.log(`🚀 Server chạy ở port http://localhost:${port}`);
    console.log(`🌐 API Docs: http://localhost:${port}/`);
    console.log('📋 Server đã sẵn sàng');
  });
})
.catch(err => {
  console.error('❌ Failed to connect to MongoDB');
  console.error(`🔴 Error: ${err.message}`);
  console.error(`📍 Connection URI: ${dbUri}`);
  console.error('');
  console.error('🛠️  Possible solutions:');
  console.error('   1. Make sure MongoDB is running on your system');
  console.error('   2. Check if MongoDB service is started:');
  console.error('      - Windows: net start MongoDB');
  console.error('      - Or check Services.msc for "MongoDB Server"');
  console.error('   3. Verify the database URI in .env file');
  console.error('   4. Check if port 27017 is available');
  console.error('');
  console.error('💥 Application will now exit...');
  process.exit(1);
});

// Xử lý lỗi kết nối sau khi đã kết nối thành công
mongoose.connection.on('error', err => {
  console.error('❌ MongoDB runtime error:', err.message);
  console.error('🔄 Attempting to reconnect...');
});

// Xử lý khi kết nối bị ngắt
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
});

// Xử lý khi kết nối lại thành công
mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully');
});

// Xử lý shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err.message);
    process.exit(1);
  }
});
