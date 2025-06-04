const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

dotenv.config();

const User = require('./models/UserSchema');
const Product = require('./models/ProductSchema');
const Order = require('./models/OrderSchema');
const Payment = require('./models/PaymentSchema');

const dbUri = process.env.DB_URI;

async function seed() {
  try {
    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB. Seeding data...');

    // Xoá dữ liệu cũ
    await User.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();
    await Payment.deleteMany();

    // Tạo user thường 1
    const user1 = new User({
      username: 'testuser01',
      email: 'testuser01@example.com',
      password: 'password123',
      role: 'customer',
      full_name: 'Nguyễn Văn A',
      phone: '0111111111',
      address: '123 Đường XYZ, Hà Nội',
      avatar: ''
    });
    await user1.save();

    // Tạo user thường 2
    const user2 = new User({
      username: 'testuser02',
      email: 'testuser02@example.com',
      password: 'password123',
      role: 'customer',
      full_name: 'Nguyễn Văn B',
      phone: '0123456789',
      address: '456 Đường ABC, Hà Nội',
      avatar: ''
    });
    await user2.save();

    // Tạo admin user
    const adminUser = new User({
      username: 'adminuser',
      email: 'admin@example.com',
      password: 'adminpassword',
      role: 'admin',
      full_name: 'Admin User',
      phone: '0987654321',
      address: 'Hà Nội',
      avatar: ''
    });
    await adminUser.save();

    // Tạo sản phẩm
    const product = new Product({
      name: 'Áo thun nam',
      description: 'Áo thun cotton 100%',
      brand: 'Coolmate',
      category: null,
      price: 250000,
      variants: [
        { color: 'Đen', size: 'M', stock: 100, price: 250000 },
        { color: 'Trắng', size: 'L', stock: 50, price: 260000 }
      ]
    });
    await product.save();

    // Tạo đơn hàng cho user1
    const order1 = new Order({
      user: user1._id,
      items: [{
        product: product._id,
        variant: { color: 'Đen', size: 'M' },
        quantity: 2,
        price: 250000
      }],
      shippingAddress: {
        fullName: user1.full_name,
        phone: user1.phone,
        address: user1.address,
        city: 'Hà Nội',
        district: 'Hoàn Kiếm',
        ward: 'Phường A'
      },
      total: 500000,
      discountAmount: 0,
      voucher: null,
      status: 'pending',
      paymentMethod: 'COD',
      paymentStatus: 'unpaid'
    });
    await order1.save();

    // Tạo đơn hàng cho user2
    const order2 = new Order({
      user: user2._id,
      items: [{
        product: product._id,
        variant: { color: 'Trắng', size: 'L' },
        quantity: 1,
        price: 260000
      }],
      shippingAddress: {
        fullName: user2.full_name,
        phone: user2.phone,
        address: user2.address,
        city: 'Hà Nội',
        district: 'Ba Đình',
        ward: 'Phường B'
      },
      total: 260000,
      discountAmount: 0,
      voucher: null,
      status: 'pending',
      paymentMethod: 'COD',
      paymentStatus: 'unpaid'
    });
    await order2.save();

    // Tạo payment cho mỗi đơn hàng
    const payment1 = new Payment({
      order: order1._id,
      method: 'COD',
      amount: order1.total,
      status: 'Pending',
      transactionId: '',
      paymentDate: new Date()
    });
    await payment1.save();

    const payment2 = new Payment({
      order: order2._id,
      method: 'COD',
      amount: order2.total,
      status: 'Pending',
      transactionId: '',
      paymentDate: new Date()
    });
    await payment2.save();

    // Gắn payment vào order
    order1.payment = payment1._id;
    await order1.save();

    order2.payment = payment2._id;
    await order2.save();

    // Kết quả log
    console.log('✅ Seed dữ liệu thành công');
    console.log('--- User ---');
    console.log('User1 ID:', user1._id.toString());
    console.log('User2 ID:', user2._id.toString());
    console.log('Admin  ID:', adminUser._id.toString());
    console.log('--- Order ---');
    console.log('Order1 ID:', order1._id.toString());
    console.log('Order2 ID:', order2._id.toString());
    console.log('--- Product ---');
    console.log('Product ID:', product._id.toString());
    console.log('👉 DB_URI đang dùng:', dbUri);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
