const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Category = require('./models/CategorySchema');
const Product = require('./models/ProductSchema');
const ProductVariant = require('./models/ProductVariantSchema');
const User = require('./models/UserSchema');
const Order = require('./models/OrderSchema');
const Review = require('./models/ReviewSchema');
const Address = require('./models/AddressSchema');
const PaymentMethod = require('./models/PaymentMethodSchema');
const Color = require('./models/ColorSchema');
const Size = require('./models/SizeSchema');

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/datn_database';

// Sample data
const categories = [
  { name: 'Áo Nam', description: 'Tất cả các loại áo dành cho nam giới' },
  { name: 'Áo Nữ', description: 'Tất cả các loại áo dành cho nữ giới' },
  { name: 'Quần Nam', description: 'Quần áo nam đa dạng phong cách' },
  { name: 'Quần Nữ', description: 'Quần áo nữ thời trang' },
  { name: 'Giày Dép', description: 'Giày dép nam nữ các loại' },
  { name: 'Phụ Kiện', description: 'Phụ kiện thời trang đa dạng' }
];

const colors = [
  { name: 'Đen', hex: '#000000' },
  { name: 'Trắng', hex: '#FFFFFF' },
  { name: 'Xám', hex: '#808080' },
  { name: 'Đỏ', hex: '#FF0000' },
  { name: 'Xanh Navy', hex: '#000080' },
  { name: 'Xanh Dương', hex: '#0000FF' },
  { name: 'Nâu', hex: '#8B4513' },
  { name: 'Hồng', hex: '#FFC0CB' }
];

const sizes = [
  { name: 'XS', description: 'Extra Small' },
  { name: 'S', description: 'Small' },
  { name: 'M', description: 'Medium' },
  { name: 'L', description: 'Large' },
  { name: 'XL', description: 'Extra Large' },
  { name: 'XXL', description: 'Double Extra Large' }
];

const products = [
  {
    name: 'Áo Thun Basic Nam',
    price: 299000,
    description: 'Áo thun cotton cao cấp, form regular fit, phù hợp mọi dáng người',
    category: 'Áo Nam',
    images: ['/images/ao-thun-nam-1.jpg', '/images/ao-thun-nam-2.jpg'],
    salePrice: 249000,
    isActive: true
  },
  {
    name: 'Áo Sơ Mi Công Sở Nam',
    price: 499000,
    description: 'Áo sơ mi công sở sang trọng, chất liệu cotton pha, chống nhăn',
    category: 'Áo Nam',
    images: ['/images/ao-so-mi-nam-1.jpg'],
    isActive: true
  },
  {
    name: 'Váy Maxi Nữ',
    price: 599000,
    description: 'Váy maxi dáng dài thanh lịch, chất liệu voan mềm mại',
    category: 'Áo Nữ',
    images: ['/images/vay-maxi-1.jpg', '/images/vay-maxi-2.jpg'],
    salePrice: 479000,
    isActive: true
  },
  {
    name: 'Quần Jean Nam Slim Fit',
    price: 699000,
    description: 'Quần jean nam dáng slim fit thời trang, chất liệu denim cao cấp',
    category: 'Quần Nam',
    images: ['/images/quan-jean-nam-1.jpg'],
    isActive: true
  },
  {
    name: 'Chân Váy Ngắn Nữ',
    price: 399000,
    description: 'Chân váy ngắn phong cách trẻ trung, chất liệu cotton thoáng mát',
    category: 'Quần Nữ',
    images: ['/images/chan-vay-ngan-1.jpg'],
    salePrice: 319000,
    isActive: true
  },
  {
    name: 'Giày Sneaker Unisex',
    price: 1299000,
    description: 'Giày sneaker phong cách thể thao, đế cao su êm ái',
    category: 'Giày Dép',
    images: ['/images/giay-sneaker-1.jpg', '/images/giay-sneaker-2.jpg'],
    isActive: true
  },
  {
    name: 'Túi Xách Nữ',
    price: 899000,
    description: 'Túi xách nữ cao cấp, chất liệu da PU sang trọng',
    category: 'Phụ Kiện',
    images: ['/images/tui-xach-nu-1.jpg'],
    salePrice: 699000,
    isActive: true
  },
  {
    name: 'Áo Khoác Hoodie',
    price: 599000,
    description: 'Áo khoác hoodie ấm áp, phù hợp mùa đông',
    category: 'Áo Nam',
    images: ['/images/ao-hoodie-1.jpg'],
    isActive: true
  }
];

const paymentMethods = [
  { method: 'COD', isActive: true },
  { method: 'VNPay', isActive: true }
];

// Vietnamese review templates (from previous file)
const reviewTemplates = {
  5: [
    'Sản phẩm tuyệt vời! Chất liệu rất tốt, mặc lên thoải mái. Giao hàng nhanh chóng. Rất đáng tiền, sẽ ủng hộ shop tiếp!',
    'Chất lượng xuất sắc! Form dáng đẹp, đúng size. Đóng gói cẩn thận. Rất hài lòng với sản phẩm này.',
    'Hoàn hảo! Màu sắc đúng như hình, không phai. Shop tư vấn nhiệt tình. Sẽ tiếp tục ủng hộ!',
  ],
  4: [
    'Sản phẩm tốt, chất lượng ổn. Chỉ có điều giao hàng hơi chậm. Nhìn chung vẫn hài lòng.',
    'Khá ổn, chất lượng đáng giá với giá tiền. May công chỉnh chu. Có một chút khác so với hình.',
    'Hài lòng với sản phẩm. Thiết kế đẹp, màu sắc hơi nhạt hơn mong đợi. Size hơi rộng một chút.',
  ],
  3: [
    'Sản phẩm bình thường, chất lượng trung bình với giá tiền này. Có thể cân nhắc nếu không có lựa chọn khác.',
    'Tạm ổn, phù hợp để mặc hàng ngày. Có thể tìm được tốt hơn nhưng cũng không tệ.',
    'Trung bình khá, chất lượng như mong đợi. Form dáng ổn, chỉ cần cải thiện một chút.',
  ],
  2: [
    'Sản phẩm không như kỳ vọng. Vấn đề chính là chất liệu hơi kém. Cần cải thiện chất lượng thêm.',
    'Dưới trung bình, may công chưa chỉnh chu. Màu sắc không đúng với mô tả trên web.',
    'Chưa hài lòng lắm, form dáng không đẹp. Giá tiền so với chất lượng chưa tương xứng.',
  ],
  1: [
    'Rất thất vọng! Sản phẩm bị lỗi ngay khi nhận. Không đáng tiền bỏ ra, không khuyến khích mua!',
    'Quá tệ! Chất liệu rách ngay, không đúng với mô tả. Dịch vụ kém, giao hàng chậm.',
    'Hoàn toàn không hài lòng! Sản phẩm không như quảng cáo. Chất lượng kém, không đáng mua.',
  ]
};

async function comprehensiveSeedData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional)
    // await Category.deleteMany({});
    // await Product.deleteMany({});
    // await ProductVariant.deleteMany({});
    // await Color.deleteMany({});
    // await Size.deleteMany({});
    // await PaymentMethod.deleteMany({});
    
    // 1. Create Categories
    console.log('📂 Creating categories...');
    const categoryDocs = await Category.insertMany(categories);
    console.log(`✅ Created ${categoryDocs.length} categories`);

    // 2. Create Colors
    console.log('🎨 Creating colors...');
    const colorDocs = await Color.insertMany(colors);
    console.log(`✅ Created ${colorDocs.length} colors`);

    // 3. Create Sizes
    console.log('📏 Creating sizes...');
    const sizeDocs = await Size.insertMany(sizes);
    console.log(`✅ Created ${sizeDocs.length} sizes`);

    // 4. Create Payment Methods
    console.log('💳 Creating payment methods...');
    const paymentDocs = await PaymentMethod.insertMany(paymentMethods);
    console.log(`✅ Created ${paymentDocs.length} payment methods`);

    // 5. Create Products
    console.log('📦 Creating products...');
    const productDocs = [];
    for (const product of products) {
      // Find category by name
      const category = categoryDocs.find(cat => cat.name === product.category);
      if (category) {
        const productDoc = { 
          ...product, 
          category: category._id 
        };
        
        // Set sale dates for products with sale prices
        if (productDoc.salePrice) {
          productDoc.saleStartDate = new Date();
          productDoc.saleEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
        }
        
        productDocs.push(productDoc);
      } else {
        console.log(`⚠️ Category not found for product: ${product.name}`);
      }
    }
    
    const createdProducts = await Product.insertMany(productDocs);
    console.log(`✅ Created ${createdProducts.length} products`);

    // 6. Create Product Variants
    console.log('🔄 Creating product variants...');
    const variantDocs = [];
    
    for (const product of createdProducts) {
      // Create 2-4 variants per product
      const variantCount = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < variantCount; i++) {
        const randomColor = colorDocs[Math.floor(Math.random() * colorDocs.length)];
        const randomSize = sizeDocs[Math.floor(Math.random() * sizeDocs.length)];
        
        // Price can vary ±10% from product price
        const priceVariation = (Math.random() - 0.5) * 0.2; // -10% to +10%
        const variantPrice = Math.round(product.price * (1 + priceVariation));
        
        variantDocs.push({
          product: product._id,
          color: randomColor._id,
          size: randomSize._id,
          price: variantPrice,
          stock: Math.floor(Math.random() * 100) + 10, // 10-110 stock
          sku: `${product.name.substring(0, 3).toUpperCase()}-${randomColor.name.substring(0, 2)}-${randomSize.name}-${Date.now()}-${i}`,
          isActive: true
        });
      }
    }
    
    const createdVariants = await ProductVariant.insertMany(variantDocs);
    console.log(`✅ Created ${createdVariants.length} product variants`);

    // 7. Create sample addresses for existing users
    console.log('🏠 Creating addresses...');
    const users = await User.find({ role: 'customer' }).limit(20);
    const addressDocs = [];
    
    const sampleAddresses = [
      {
        addressLine: 'Số 123, Đường Nguyễn Văn Cừ',
        ward: 'Phường 4',
        district: 'Quận 5',
        city: 'TP. Hồ Chí Minh'
      },
      {
        addressLine: 'Số 456, Đường Lê Lợi',
        ward: 'Phường Bến Thành',
        district: 'Quận 1',
        city: 'TP. Hồ Chí Minh'
      },
      {
        addressLine: 'Số 789, Đường Trần Hưng Đạo',
        ward: 'Phường 2',
        district: 'Quận 3',
        city: 'TP. Hồ Chí Minh'
      },
      {
        addressLine: 'Số 321, Đường Hai Bà Trưng',
        ward: 'Phường Đa Kao',
        district: 'Quận 1',
        city: 'TP. Hồ Chí Minh'
      },
      {
        addressLine: 'Số 654, Đường Võ Văn Tần',
        ward: 'Phường 6',
        district: 'Quận 3',
        city: 'TP. Hồ Chí Minh'
      }
    ];
    
    for (const user of users) {
      const randomAddress = sampleAddresses[Math.floor(Math.random() * sampleAddresses.length)];
      addressDocs.push({
        user: user._id,
        fullName: user.name,
        phone: user.phone || '0901234567',
        addressLine: randomAddress.addressLine,
        ward: randomAddress.ward,
        district: randomAddress.district,
        city: randomAddress.city,
        isDefault: true
      });
    }
    
    const createdAddresses = await Address.insertMany(addressDocs);
    console.log(`✅ Created ${createdAddresses.length} addresses`);

    // 8. Create Orders
    console.log('🛒 Creating orders...');
    const orderDocs = [];
    
    for (let i = 0; i < 20; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const userAddress = createdAddresses.find(addr => addr.user.toString() === randomUser._id.toString());
      const randomPayment = paymentDocs[Math.floor(Math.random() * paymentDocs.length)];
      
      // Random 1-3 items per order
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const items = [];
      let total = 0;
      
      for (let j = 0; j < itemCount; j++) {
        const randomVariant = createdVariants[Math.floor(Math.random() * createdVariants.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        
        // Find the product to get price
        const productForVariant = createdProducts.find(p => p._id.toString() === randomVariant.product.toString());
        const price = productForVariant.salePrice && productForVariant.saleStartDate && productForVariant.saleEndDate
          ? productForVariant.salePrice 
          : productForVariant.price;
        
        const itemTotal = price * quantity;
        
        items.push({
          productVariant: randomVariant._id,
          quantity,
          price,
          totalPrice: itemTotal
        });
        
        total += itemTotal;
      }
      
      const shippingFee = 30000;
      const finalTotal = total + shippingFee;
      
      // Random order date in last 3 months
      const orderDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
      
      // 70% delivered, 30% other statuses
      const statuses = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];
      const status = Math.random() < 0.7 ? 'delivered' : statuses[Math.floor(Math.random() * statuses.length)];
      
      orderDocs.push({
        orderCode: `FINO${Date.now()}${i}`,
        user: randomUser._id,
        items,
        address: userAddress._id,
        total,
        shippingFee,
        finalTotal,
        status,
        paymentMethod: randomPayment._id,
        paymentStatus: status === 'delivered' ? 'paid' : 'pending',
        createdAt: orderDate,
        updatedAt: status === 'delivered' 
          ? new Date(orderDate.getTime() + 3 * 24 * 60 * 60 * 1000) 
          : orderDate
      });
    }
    
    const createdOrders = await Order.insertMany(orderDocs);
    console.log(`✅ Created ${createdOrders.length} orders`);

    // 9. Create Reviews for delivered orders
    console.log('⭐ Creating reviews...');
    const deliveredOrders = createdOrders.filter(order => order.status === 'delivered');
    const reviewDocs = [];
    
    for (const order of deliveredOrders) {
      // 60% chance to have reviews
      if (Math.random() < 0.6) {
        const itemCount = Math.min(order.items.length, Math.floor(Math.random() * order.items.length) + 1);
        
        for (let i = 0; i < itemCount; i++) {
          const item = order.items[i];
          
          // Rating distribution: 50% 5-star, 30% 4-star, 15% 3-star, 5% 1-2 star
          const ratingRand = Math.random();
          let rating;
          if (ratingRand < 0.5) rating = 5;
          else if (ratingRand < 0.8) rating = 4;
          else if (ratingRand < 0.95) rating = 3;
          else rating = Math.floor(Math.random() * 2) + 1; // 1 or 2
          
          const comments = reviewTemplates[rating];
          const comment = comments[Math.floor(Math.random() * comments.length)];
          
          // Review date: 1-14 days after order date
          const reviewDate = new Date(
            order.createdAt.getTime() + 
            (Math.random() * 14 + 1) * 24 * 60 * 60 * 1000
          );
          
          // Get product from variant
          const variant = createdVariants.find(v => v._id.toString() === item.productVariant.toString());
          if (variant) {
            reviewDocs.push({
              product: variant.product,
              user: order.user,
              order: order._id,
              rating,
              comment,
              createdAt: reviewDate,
              updatedAt: reviewDate
            });
          }
        }
      }
    }
    
    const createdReviews = await Review.insertMany(reviewDocs);
    console.log(`✅ Created ${createdReviews.length} reviews`);

    // Final Statistics
    console.log('\n📊 COMPREHENSIVE SEEDING COMPLETED!');
    console.log('═══════════════════════════════════');
    console.log(`📂 Categories: ${categoryDocs.length}`);
    console.log(`🎨 Colors: ${colorDocs.length}`);
    console.log(`📏 Sizes: ${sizeDocs.length}`);
    console.log(`💳 Payment Methods: ${paymentDocs.length}`);
    console.log(`📦 Products: ${createdProducts.length}`);
    console.log(`🔄 Product Variants: ${createdVariants.length}`);
    console.log(`🏠 Addresses: ${createdAddresses.length}`);
    console.log(`🛒 Orders: ${createdOrders.length}`);
    console.log(`⭐ Reviews: ${createdReviews.length}`);
    
    // Review statistics
    const reviewStats = await Review.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\n⭐ REVIEW BREAKDOWN:');
    reviewStats.forEach(stat => {
      const percentage = ((stat.count / createdReviews.length) * 100).toFixed(1);
      console.log(`   ${stat._id} ⭐: ${stat.count} reviews (${percentage}%)`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run comprehensive seeding
console.log('🌱 Starting comprehensive database seeding...');
console.log('═══════════════════════════════════════════════');
comprehensiveSeedData();
