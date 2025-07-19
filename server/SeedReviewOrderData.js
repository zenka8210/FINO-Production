/**
 * ENHANCED SAMPLE DATA SEEDING SCRIPT
 * ===================================
 * 
 * Script bổ sung để tạo thêm dữ liệu sample phong phú hơn dựa trên cơ sở dữ liệu hiện có
 * - Tăng số lượng reviews với đa dạng rating và comments
 * - Tạo thêm orders với các trạng thái khác nhau (không duplicate)
 * - Bổ sung cart và wishlist data (không duplicate)
 * - Kiểm tra dữ liệu hiện có trước khi tạo mới
 * 
 * Usage: node enhancedSeedData.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const User = require('./models/UserSchema');
const Category = require('./models/CategorySchema');
const Product = require('./models/ProductSchema');
const ProductVariant = require('./models/ProductVariantSchema');
const Order = require('./models/OrderSchema');
const Review = require('./models/ReviewSchema');
const Cart = require('./models/CartSchema');
const WishList = require('./models/WishListSchema');
const Address = require('./models/AddressSchema');
const PaymentMethod = require('./models/PaymentMethodSchema');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.cyan}\n📋 ${msg}${colors.reset}`)
};

// Database connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.DB_URI || 'mongodb://localhost:27017/asm';
    await mongoose.connect(mongoUri);
    log.success('MongoDB connected successfully');
  } catch (error) {
    log.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

// Vietnamese review templates with more variety
const reviewTemplates = {
  5: [
    'Sản phẩm tuyệt vời! Chất liệu cao cấp, may công chỉnh chu. Giao hàng nhanh, đóng gói cẩn thận.',
    'Rất hài lòng với chất lượng sản phẩm. Form dáng đẹp, size chuẩn. Shop phục vụ nhiệt tình.',
    'Chất liệu vải mềm mại, thoáng mát. Màu sắc đúng như hình. Sẽ ủng hộ shop tiếp!',
    'Đóng gói cẩn thận, giao hàng đúng hẹn. Sản phẩm chất lượng tốt, đáng đồng tiền.',
    'Shop uy tín, sản phẩm chất lượng. Thiết kế đẹp, phù hợp với xu hướng thời trang.'
  ],
  4: [
    'Sản phẩm khá ổn, chất lượng tốt. Có điều giao hàng hơi chậm so với dự kiến.',
    'Đẹp và chất lượng nhưng màu sắc hơi khác một chút so với hình. Nhìn chung OK.',
    'Chất liệu tốt, form đẹp. Size hơi rộng một tí so với bảng size. Vẫn hài lòng.',
    'Sản phẩm ổn, giá cả phải chăng. Có thể cải thiện thêm về đóng gói.'
  ],
  3: [
    'Sản phẩm bình thường, chất lượng tạm ổn với mức giá này. Có thể cân nhắc.',
    'Không tệ nhưng cũng không quá xuất sắc. Phù hợp để mặc hàng ngày.',
    'Chất liệu trung bình, thiết kế basic. Với giá này thì acceptable.'
  ],
  2: [
    'Sản phẩm dưới mong đợi. Chất liệu hơi kém, may công chưa chỉnh chu.',
    'Không hài lòng lắm. Màu sắc khác xa so với hình, size không chuẩn.',
    'Chất lượng chưa tương xứng với giá tiền. Vải hơi mỏng, dễ nhăn.'
  ],
  1: [
    'Rất thất vọng! Chất liệu kém, may công thô. Không đáng đồng tiền bỏ ra.',
    'Tệ quá! Sản phẩm không giống hình, size sai hoàn toàn. Không recommend.',
    'Chất lượng quá kém! Vải mỏng tang, màu sắc phai. Rất tiếc đã mua.'
  ]
};

// Helper function to generate realistic review comment
function generateReviewComment(rating, productName) {
  const templates = reviewTemplates[rating];
  return templates[Math.floor(Math.random() * templates.length)];
}

// Enhanced seed functions
async function enhancedSeedReviews() {
  log.step('STEP 1: Enhanced Review Seeding');
  
  try {
    // Check existing reviews count
    const existingReviewsCount = await Review.countDocuments();
    log.info(`Current reviews in database: ${existingReviewsCount}`);
    
    // Get existing data
    const users = await User.find({ role: 'customer', isActive: true });
    const products = await Product.find({ isActive: true }).populate('category');
    const orders = await Order.find({ status: 'delivered' }).populate({
      path: 'items.productVariant',
      populate: { path: 'product' }
    });
    
    log.info(`Found ${users.length} customers, ${products.length} products, ${orders.length} delivered orders`);
    
    let reviewCount = 0;
    const reviewsToCreate = [];
    
    // Create reviews for delivered orders (80% chance)
    for (const order of orders) {
      if (Math.random() < 0.8) {
        for (const item of order.items) {
          if (item.productVariant && item.productVariant.product) {
            // Check if review already exists
            const existingReview = await Review.findOne({
              product: item.productVariant.product._id,
              user: order.user,
              order: order._id
            });
            
            if (!existingReview) {
              // Rating distribution: 45% 5-star, 25% 4-star, 20% 3-star, 7% 2-star, 3% 1-star
              const ratingRand = Math.random();
              let rating;
              if (ratingRand < 0.45) rating = 5;
              else if (ratingRand < 0.70) rating = 4;
              else if (ratingRand < 0.90) rating = 3;
              else if (ratingRand < 0.97) rating = 2;
              else rating = 1;
              
              const comment = generateReviewComment(rating, item.productVariant.product.name);
              
              // Random review date (1-30 days after order)
              const reviewDate = new Date(order.createdAt.getTime() + (Math.random() * 30 + 1) * 24 * 60 * 60 * 1000);
              
              reviewsToCreate.push({
                product: item.productVariant.product._id,
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
    }
    
    // Batch insert reviews
    if (reviewsToCreate.length > 0) {
      const insertedReviews = await Review.insertMany(reviewsToCreate);
      reviewCount = insertedReviews.length;
    }
    
    log.success(`Created ${reviewCount} additional reviews`);
    
    // Show rating distribution
    const totalReviews = await Review.countDocuments();
    const ratingStats = await Review.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    log.info('Rating Distribution:');
    ratingStats.forEach(stat => {
      const percentage = ((stat.count / totalReviews) * 100).toFixed(1);
      console.log(`   ${stat._id}⭐: ${stat.count} reviews (${percentage}%)`);
    });
    
  } catch (error) {
    log.error(`Error seeding reviews: ${error.message}`);
    throw error;
  }
}

async function enhancedSeedOrders() {
  log.step('STEP 2: Enhanced Order Seeding');
  
  try {
    // Check existing orders count
    const existingOrdersCount = await Order.countDocuments();
    log.info(`Current orders in database: ${existingOrdersCount}`);
    
    // Only add more orders if we have less than 20
    if (existingOrdersCount >= 20) {
      log.warning('Sufficient orders already exist. Skipping order creation.');
      return;
    }
    
    const customers = await User.find({ role: 'customer', isActive: true });
    const variants = await ProductVariant.find({ isActive: true, stock: { $gt: 0 } });
    const addresses = await Address.find({});
    const paymentMethods = await PaymentMethod.find({ isActive: true });
    
    log.info(`Found ${customers.length} customers, ${variants.length} variants, ${addresses.length} addresses`);
    
    let orderCount = 0;
    const ordersToCreate = Math.min(15, 20 - existingOrdersCount);
    log.info(`Will create ${ordersToCreate} additional orders`);
    
    for (let i = 0; i < ordersToCreate; i++) {
      const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
      const customerAddress = addresses.find(addr => 
        addr.user.toString() === randomCustomer._id.toString()
      );
      
      if (!customerAddress) continue;
      
      // Random 1-3 items per order
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const orderItems = [];
      
      for (let j = 0; j < itemCount; j++) {
        const variant = variants[Math.floor(Math.random() * variants.length)];
        const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity
        const itemTotal = variant.price * quantity;
        
        orderItems.push({
          productVariant: variant._id,
          quantity,
          price: variant.price,
          totalPrice: itemTotal
        });
      }
      
      // Calculate totals
      const total = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const shippingFee = 30000; // Fixed shipping fee
      const finalTotal = total + shippingFee;
      
      // Random order status with realistic distribution
      const statusRand = Math.random();
      let status, paymentStatus;
      
      if (statusRand < 0.60) {
        status = 'delivered';
        paymentStatus = 'paid';
      } else if (statusRand < 0.75) {
        status = 'shipped';
        paymentStatus = 'paid';
      } else if (statusRand < 0.85) {
        status = 'processing';
        paymentStatus = Math.random() < 0.8 ? 'paid' : 'unpaid';
      } else if (statusRand < 0.95) {
        status = 'pending';
        paymentStatus = 'unpaid';
      } else {
        status = 'cancelled';
        paymentStatus = 'unpaid';
      }
      
      // Random order date in last 2 months
      const orderDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
      
      const orderCode = `DH${new Date().getFullYear()}${String(Date.now()).slice(-8)}`;
      const randomPaymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      
      const order = new Order({
        orderCode,
        user: randomCustomer._id,
        items: orderItems,
        address: customerAddress._id,
        total,
        shippingFee,
        finalTotal,
        status,
        paymentMethod: randomPaymentMethod._id,
        paymentStatus,
        createdAt: orderDate,
        updatedAt: orderDate
      });
      
      await order.save();
      orderCount++;
    }
    
    log.success(`Created ${orderCount} additional orders`);
    
  } catch (error) {
    log.error(`Error seeding orders: ${error.message}`);
    throw error;
  }
}

async function enhancedSeedCartsAndWishlists() {
  log.step('STEP 3: Enhanced Cart & Wishlist Seeding');
  
  try {
    // Check existing data
    const existingCartsCount = await Cart.countDocuments();
    const existingWishlistsCount = await WishList.countDocuments();
    log.info(`Current carts: ${existingCartsCount}, wishlists: ${existingWishlistsCount}`);
    
    const customers = await User.find({ role: 'customer', isActive: true });
    const variants = await ProductVariant.find({ isActive: true, stock: { $gt: 0 } });
    const products = await Product.find({ isActive: true });
    
    let cartCount = 0;
    let wishlistCount = 0;
    
    // Create carts for customers who don't have one (limit to 5 total)
    const maxCarts = 5;
    if (existingCartsCount < maxCarts) {
      const cartsNeeded = maxCarts - existingCartsCount;
      
      for (let i = 0; i < Math.min(cartsNeeded, customers.length); i++) {
        const customer = customers[i];
        
        // Check if customer already has a cart
        const existingCart = await Cart.findOne({ user: customer._id });
        if (existingCart) continue;
        
        // Random 1-3 items in cart
        const itemCount = Math.floor(Math.random() * 3) + 1;
        const cartItems = [];
        
        for (let j = 0; j < itemCount; j++) {
          const variant = variants[Math.floor(Math.random() * variants.length)];
          const quantity = Math.floor(Math.random() * 2) + 1;
          const itemTotal = variant.price * quantity;
          
          cartItems.push({
            productVariant: variant._id,
            quantity,
            price: variant.price,
            totalPrice: itemTotal
          });
        }
        
        const total = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
        
        const cart = new Cart({
          user: customer._id,
          type: 'cart',
          items: cartItems,
          total,
          finalTotal: total,
          status: 'cart'
        });
        
        await cart.save();
        cartCount++;
      }
    }
    
    // Create wishlists for customers who don't have one (limit to 5 total)
    const maxWishlists = 5;
    if (existingWishlistsCount < maxWishlists) {
      const wishlistsNeeded = maxWishlists - existingWishlistsCount;
      
      for (let i = 0; i < Math.min(wishlistsNeeded, customers.length); i++) {
        const customer = customers[i];
        
        // Check if customer already has a wishlist
        const existingWishlist = await WishList.findOne({ user: customer._id });
        if (existingWishlist) continue;
        
        // Random 3-5 products in wishlist
        const itemCount = Math.floor(Math.random() * 3) + 3;
        const wishlistItems = [];
        
        for (let j = 0; j < itemCount; j++) {
          const product = products[Math.floor(Math.random() * products.length)];
          
          wishlistItems.push({
            product: product._id,
            variant: null
          });
        }
        
        const wishlist = new WishList({
          user: customer._id,
          items: wishlistItems
        });
        
        await wishlist.save();
        wishlistCount++;
      }
    }
    
    log.success(`Created ${cartCount} carts and ${wishlistCount} wishlists`);
    
  } catch (error) {
    log.error(`Error seeding carts and wishlists: ${error.message}`);
    throw error;
  }
}

// Main function
async function enhancedSeedDatabase() {
  try {
    console.log(`${colors.blue}🌟 === ENHANCED FASHION SHOP DATA SEEDING STARTED ===${colors.reset}\n`);
    
    await connectDB();
    
    // Run enhanced seeding functions
    await enhancedSeedReviews();
    await enhancedSeedOrders();
    await enhancedSeedCartsAndWishlists();
    
    // Final statistics
    console.log(`${colors.green}\n🎉 === ENHANCED DATABASE SEEDING COMPLETED ===${colors.reset}`);
    console.log(`${colors.blue}\n📊 FINAL DATABASE STATISTICS:${colors.reset}`);
    
    const stats = {
      users: await User.countDocuments(),
      products: await Product.countDocuments({ isActive: true }),
      productVariants: await ProductVariant.countDocuments({ isActive: true }),
      orders: await Order.countDocuments(),
      reviews: await Review.countDocuments(),
      carts: await Cart.countDocuments(),
      wishlists: await WishList.countDocuments()
    };
    
    Object.entries(stats).forEach(([key, count]) => {
      console.log(`   ${key.charAt(0).toUpperCase() + key.slice(1)}: ${count}`);
    });
    
    log.success('Enhanced database seeding completed successfully!');
    console.log(`${colors.yellow}🚀 Your database now has rich, connected sample data for development and testing!${colors.reset}`);
    
  } catch (error) {
    log.error(`Enhanced database seeding failed: ${error.message}`);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log(`${colors.yellow}🔌 Database connection closed.${colors.reset}`);
  }
}

// Execute if run directly
if (require.main === module) {
  enhancedSeedDatabase();
}

module.exports = {
  enhancedSeedDatabase
};
