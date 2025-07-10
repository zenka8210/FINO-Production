require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const mongoose = require('mongoose');

// Import middlewares và services
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();
const port = process.env.PORT || 3000;
const dbUri = process.env.DB_URI;

// Middlewares
app.use(express.json());

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

app.get('/', (req, res) => {
  res.send('Welcome to E-commerce API System!');
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
