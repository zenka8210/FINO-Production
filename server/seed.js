const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

dotenv.config();

const User = require('./models/userSchema');
const Product = require('./models/productSchema');
const Order = require('./models/orderSchema');
const Payment = require('./models/paymentSchema');

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
      password: await bcrypt.hash('password123', 10), // hash password
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
        { color: 'Đen', size: 'M', stock: 100, price: 250000, weight: 100 },
        { color: 'Trắng', size: 'L', stock: 50, price: 260000, weight: 150 }
      ],
      images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
    });
    await product.save();

    // Tạo đơn hàng cho user1
    const order1Items = [{
      product: product._id,
      variant: { color: 'Đen', size: 'M' },
      name: product.name,
      quantity: 2,
      price: 250000,
      images: product.images[0]
    }];
    const order1Total = order1Items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order1ShippingFee = 30000;
    const order1FinalTotal = order1Total + order1ShippingFee;

    const order1 = new Order({
      user: user1._id,
      items: order1Items,
      shippingAddress: {
        fullName: user1.full_name,
        phone: user1.phone,
        address: user1.address,
        city: 'Hà Nội',
        district: 'Hoàn Kiếm',
        ward: 'Phường A'
      },
      total: order1Total,
      discountAmount: 0,
      voucher: null,
      shippingFee: order1ShippingFee,
      shippingMethod: 'standard',
      note: '',
      finalTotal: order1FinalTotal,
      status: 'pending',
      paymentMethod: 'COD',
      paymentStatus: 'unpaid'
    });
    await order1.save();

    // Tạo đơn hàng cho user2
    const order2Items = [{
      product: product._id,
      variant: { color: 'Trắng', size: 'L' },
      name: product.name,
      quantity: 1,
      price: 260000,
      images: product.images[1]
    }];
    const order2Total = order2Items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order2ShippingFee = 30000;
    const order2FinalTotal = order2Total + order2ShippingFee;

    const order2 = new Order({
      user: user2._id,
      items: order2Items,
      shippingAddress: {
        fullName: user2.full_name,
        phone: user2.phone,
        address: user2.address,
        city: 'Hà Nội',
        district: 'Ba Đình',
        ward: 'Phường B'
      },
      total: order2Total,
      discountAmount: 0,
      voucher: null,
      shippingFee: order2ShippingFee,
      shippingMethod: 'standard',
      note: '',
      finalTotal: order2FinalTotal,
      status: 'pending',
      paymentMethod: 'COD',
      paymentStatus: 'unpaid'
    });
    await order2.save();

    // Tạo payment cho mỗi đơn hàng
    const payment1 = new Payment({
      order: order1._id,
      method: 'COD',
      amount: order1.finalTotal,
      status: 'Pending',
      transactionId: '',
      paymentDate: new Date()
    });
    await payment1.save();

    const payment2 = new Payment({
      order: order2._id,
      method: 'COD',
      amount: order2.finalTotal,
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

    // Log kết quả
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
