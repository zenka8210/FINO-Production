const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Review = require('./models/ReviewSchema');
const User = require('./models/UserSchema');
const Product = require('./models/ProductSchema');
const Order = require('./models/OrderSchema');
const ProductVariant = require('./models/ProductVariantSchema');
const Address = require('./models/AddressSchema');
const PaymentMethod = require('./models/PaymentMethodSchema');

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/datn_database';

// Vietnamese names cho fake users
const vietnameseNames = [
  'Nguyễn Văn Anh', 'Trần Thị Bình', 'Lê Minh Châu', 'Phạm Thu Dung', 'Hoàng Văn Em',
  'Vũ Thị Phương', 'Đặng Minh Quang', 'Bùi Thu Hà', 'Ngô Văn Inh', 'Dương Thị Kim',
  'Lý Minh Luân', 'Tạ Thu Mai', 'Cao Văn Nam', 'Đinh Thị Oanh', 'Hồ Minh Phúc',
  'Phan Thu Quỳnh', 'Võ Văn Rồng', 'Mai Thị Sương', 'Trương Minh Tuấn', 'Lương Thu Uyên',
  'Đỗ Văn Việt', 'Chu Thị Xuân', 'Lại Minh Yên', 'Bạch Thu Zung', 'Kiều Văn An',
  'Từ Thị Bảo', 'Ông Minh Cường', 'Uông Thu Diệu', 'Ứng Văn Đức', 'Âu Thị Ế'
];

// Sample review data với nhiều variation hơn
const reviewTemplates = {
  5: {
    positive_adjectives: ['tuyệt vời', 'xuất sắc', 'hoàn hảo', 'chất lượng cao', 'tuyệt đỉnh'],
    quality_comments: [
      'Chất liệu rất tốt, mặc lên thoải mái',
      'Form dáng đẹp, đúng size',
      'Màu sắc đúng như hình, không phai',
      'May công chỉnh chu, tỉ mỉ',
      'Thiết kế đẹp, thời trang'
    ],
    service_comments: [
      'Giao hàng nhanh chóng', 
      'Đóng gói cẩn thận', 
      'Shop tư vấn nhiệt tình',
      'Dịch vụ tận tâm',
      'Hỗ trợ khách hàng tốt'
    ]
  },
  4: {
    positive_adjectives: ['tốt', 'khá ổn', 'hài lòng', 'đáng giá'],
    minor_issues: [
      'có một chút khác so với hình',
      'giao hàng hơi chậm', 
      'màu sắc hơi nhạt hơn mong đợi',
      'size hơi rộng một chút'
    ]
  },
  3: {
    neutral_phrases: ['bình thường', 'tạm ổn', 'trung bình khá', 'không tệ'],
    mediocre_comments: [
      'chất lượng trung bình với giá tiền này',
      'phù hợp để mặc hàng ngày',
      'có thể tìm được tốt hơn'
    ]
  },
  2: {
    negative_adjectives: ['không như kỳ vọng', 'dưới trung bình', 'chưa hài lòng'],
    issues: [
      'chất liệu hơi kém',
      'may công chưa chỉnh chu', 
      'màu sắc không đúng',
      'form dáng không đẹp'
    ]
  },
  1: {
    very_negative: ['rất thất vọng', 'quá tệ', 'không khuyến khích', 'hoàn toàn không hài lòng'],
    serious_issues: [
      'sản phẩm bị lỗi',
      'chất liệu rách ngay',
      'không đúng với mô tả',
      'dịch vụ kém'
    ]
  }
};

function generateReviewComment(rating, productName) {
  const templates = reviewTemplates[rating];
  let comment = '';

  switch(rating) {
    case 5:
      const positive = templates.positive_adjectives[Math.floor(Math.random() * templates.positive_adjectives.length)];
      const quality = templates.quality_comments[Math.floor(Math.random() * templates.quality_comments.length)];
      const service = templates.service_comments[Math.floor(Math.random() * templates.service_comments.length)];
      comment = `Sản phẩm ${positive}! ${quality}. ${service}. Rất đáng tiền, sẽ ủng hộ shop tiếp!`;
      break;
      
    case 4:
      const positiveAdj = templates.positive_adjectives[Math.floor(Math.random() * templates.positive_adjectives.length)];
      const minorIssue = templates.minor_issues[Math.floor(Math.random() * templates.minor_issues.length)];
      comment = `Sản phẩm ${positiveAdj}, chất lượng ổn. Chỉ có điều ${minorIssue}. Nhìn chung vẫn hài lòng.`;
      break;
      
    case 3:
      const neutral = templates.neutral_phrases[Math.floor(Math.random() * templates.neutral_phrases.length)];
      const mediocre = templates.mediocre_comments[Math.floor(Math.random() * templates.mediocre_comments.length)];
      comment = `Sản phẩm ${neutral}, ${mediocre}. Có thể cân nhắc nếu không có lựa chọn khác.`;
      break;
      
    case 2:
      const negative = templates.negative_adjectives[Math.floor(Math.random() * templates.negative_adjectives.length)];
      const issue = templates.issues[Math.floor(Math.random() * templates.issues.length)];
      comment = `Sản phẩm ${negative}. Vấn đề chính là ${issue}. Cần cải thiện chất lượng thêm.`;
      break;
      
    case 1:
      const veryNegative = templates.very_negative[Math.floor(Math.random() * templates.very_negative.length)];
      const seriousIssue = templates.serious_issues[Math.floor(Math.random() * templates.serious_issues.length)];
      comment = `${veryNegative}! Sản phẩm ${seriousIssue}. Không đáng tiền bỏ ra, không khuyến khích mua!`;
      break;
  }

  return comment;
}

async function createSampleUsersIfNeeded() {
  const userCount = await User.countDocuments({ role: 'customer' });
  
  if (userCount < 20) {
    console.log('👥 Creating sample users...');
    const usersToCreate = [];
    
    for (let i = 0; i < Math.min(30, vietnameseNames.length); i++) {
      const name = vietnameseNames[i];
      const email = `user${i + 1}@example.com`;
      const phone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;
      
      usersToCreate.push({
        email,
        password: 'password123', // Will be hashed by pre-save middleware
        name,
        phone,
        address: 'Địa chỉ mẫu',
        role: 'customer',
        isActive: true
      });
    }
    
    await User.insertMany(usersToCreate);
    console.log(`✅ Created ${usersToCreate.length} sample users`);
  }
}

async function createSampleOrdersIfNeeded() {
  const orderCount = await Order.countDocuments({ status: 'delivered' });
  
  if (orderCount < 10) {
    console.log('📦 Creating sample delivered orders...');
    
    const customers = await User.find({ role: 'customer' }).limit(20);
    const products = await Product.find({ isActive: true }).limit(10);
    const productVariants = await ProductVariant.find({}).limit(20);
    const addresses = await Address.find({}).limit(10);
    const paymentMethods = await PaymentMethod.find({}).limit(3);
    
    if (productVariants.length === 0 || addresses.length === 0 || paymentMethods.length === 0) {
      console.log('⚠️ Missing required data for orders (variants/addresses/payment methods)');
      return;
    }

    const ordersToCreate = [];
    
    for (let i = 0; i < 15; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const orderCode = `DH${Date.now()}${i}`;
      
      // Random 1-3 items per order
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const items = [];
      let total = 0;
      
      for (let j = 0; j < itemCount; j++) {
        const variant = productVariants[Math.floor(Math.random() * productVariants.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const price = Math.floor(Math.random() * 500000) + 100000; // 100k-600k
        const itemTotal = price * quantity;
        
        items.push({
          productVariant: variant._id,
          quantity,
          price,
          totalPrice: itemTotal
        });
        
        total += itemTotal;
      }
      
      const shippingFee = 30000;
      const finalTotal = total + shippingFee;
      
      // Random date trong 6 tháng qua
      const orderDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);
      
      ordersToCreate.push({
        orderCode,
        user: customer._id,
        items,
        address: addresses[Math.floor(Math.random() * addresses.length)]._id,
        total,
        shippingFee,
        finalTotal,
        status: 'delivered',
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)]._id,
        paymentStatus: 'paid',
        createdAt: orderDate,
        updatedAt: new Date(orderDate.getTime() + 24 * 60 * 60 * 1000) // delivered next day
      });
    }
    
    await Order.insertMany(ordersToCreate);
    console.log(`✅ Created ${ordersToCreate.length} sample orders`);
  }
}

async function advancedSeedReviews() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create sample data if needed
    await createSampleUsersIfNeeded();
    await createSampleOrdersIfNeeded();

    // Fetch data
    const customers = await User.find({ role: 'customer', isActive: true });
    const products = await Product.find({ isActive: true });
    const deliveredOrders = await Order.find({ 
      status: 'delivered' 
    }).populate({
      path: 'items.productVariant',
      populate: {
        path: 'product'
      }
    }).populate('user');

    console.log(`👥 ${customers.length} customers found`);
    console.log(`📦 ${products.length} products found`);
    console.log(`🚚 ${deliveredOrders.length} delivered orders found`);

    // Clear existing reviews
    await Review.deleteMany({});
    console.log('🗑️ Cleared existing reviews');

    const reviewsToCreate = [];

    // Create reviews for delivered orders
    for (const order of deliveredOrders) {
      const reviewCount = Math.floor(Math.random() * order.items.length) + 1; // 1 to all items
      const itemsToReview = order.items
        .filter(item => item.productVariant && item.productVariant.product)
        .slice(0, reviewCount);

      for (const item of itemsToReview) {
        // Rating distribution: 60% high (4-5), 25% medium (3), 15% low (1-2)
        const ratingRand = Math.random();
        let rating;
        if (ratingRand < 0.35) rating = 5;
        else if (ratingRand < 0.60) rating = 4;
        else if (ratingRand < 0.85) rating = 3;
        else if (ratingRand < 0.95) rating = 2;
        else rating = 1;

        const productName = item.productVariant.product.name;
        const comment = generateReviewComment(rating, productName);

        // Review date: 1-30 days after order date
        const reviewDate = new Date(
          order.createdAt.getTime() + 
          (Math.random() * 30 + 1) * 24 * 60 * 60 * 1000
        );

        reviewsToCreate.push({
          product: item.productVariant.product._id,
          user: order.user._id,
          order: order._id,
          rating,
          comment,
          createdAt: reviewDate,
          updatedAt: reviewDate
        });
      }
    }

    // Remove duplicates
    const uniqueReviews = [];
    const seen = new Set();
    
    for (const review of reviewsToCreate) {
      const key = `${review.user}-${review.product}-${review.order}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueReviews.push(review);
      }
    }

    // Insert reviews
    console.log(`📝 Creating ${uniqueReviews.length} reviews...`);
    await Review.insertMany(uniqueReviews);

    // Statistics
    const stats = await Review.aggregate([
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalReviews = await Review.countDocuments();
    
    console.log('\n📊 REVIEW STATISTICS:');
    console.log(`📝 Total reviews: ${totalReviews}`);
    stats.forEach(stat => {
      const percentage = ((stat.count / totalReviews) * 100).toFixed(1);
      console.log(`⭐ ${stat._id} stars: ${stat.count} (${percentage}%)`);
    });

    // Sample reviews
    console.log('\n📋 SAMPLE REVIEWS:');
    const samples = await Review.find()
      .populate('product', 'name')
      .populate('user', 'name')
      .populate('order', 'orderCode')
      .limit(3);

    samples.forEach((review, i) => {
      console.log(`\n${i + 1}. 📦 ${review.product.name}`);
      console.log(`   👤 ${review.user.name}`);
      console.log(`   🏷️ ${review.order.orderCode}`);
      console.log(`   ⭐ ${review.rating}/5`);
      console.log(`   💬 ${review.comment}`);
    });

    console.log('\n🎉 Advanced review seeding completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }
}

// Run the advanced seeding
console.log('🌱 Starting advanced review seeding...');
advancedSeedReviews();
