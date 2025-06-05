require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const mongoose = require('mongoose');

// Import middlewares và services
const { errorHandler } = require('./middlewares/errorHandler');
const logger = require('./services/loggerService');

const app = express();
const port = process.env.PORT || 3000;
const dbUri = process.env.DB_URI;

mongoose.connect(dbUri)
.then(() => logger.info('✅ Connected to MongoDB'))
.catch(err => logger.error('❌ MongoDB connection error:', { error: err.message }));

mongoose.connection.on('error', err => {
  logger.error('MongoDB connection error:', { error: err.message });
});

// Middlewares
app.use(express.json()); // Thay thế body-parser
app.use(logger.httpLoggerMiddleware); // HTTP request logging

// Route imports
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const userRoutes = require('./routes/userRoutes');
const cartRoutes = require('./routes/cartRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
const addressRoutes = require('./routes/addressRoutes');
const newsRoutes = require('./routes/newsRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const tagRoutes = require('./routes/tagRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const returnRequestRoutes = require('./routes/returnRequestRoutes');

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/return-requests', returnRequestRoutes);

app.get('/', (req, res) => {
  res.send('Chào mừng đến hệ thống bán hàng!');
});

// Error handling middleware (phải đặt cuối cùng)
app.use(errorHandler);

app.listen(port, () => {
  logger.info(`🚀 Server đang chạy tại http://localhost:${port}`);
});
