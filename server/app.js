require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const orderRoutes = require('./routes/OrderRoutes'); 
const authRoutes = require('./routes/AuthRoutes');

const app = express();
const port = process.env.PORT || 3000;
const dbUri = process.env.DB_URI;

mongoose.connect(dbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

app.use(express.json()); // Thay thế body-parser

app.use('/api/orders', orderRoutes);
app.get('/', (req, res) => {
  res.send('Chào mừng đến hệ thống bán hàng!');
});

app.use('/api/auth', authRoutes);

app.listen(port, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
});
