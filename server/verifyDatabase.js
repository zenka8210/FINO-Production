/**
 * VERIFY DATABASE CONTENT
 * =======================
 * Quick script to verify all collections have data
 */

const mongoose = require('mongoose');
require('dotenv').config();
const chalk = require('chalk');

// Import models
const User = require('./models/UserSchema');
const Category = require('./models/CategorySchema');
const Color = require('./models/ColorSchema');
const Size = require('./models/SizeSchema');
const Product = require('./models/ProductSchema');
const ProductVariant = require('./models/ProductVariantSchema');
const PaymentMethod = require('./models/PaymentMethodSchema');
const Address = require('./models/AddressSchema');
const Order = require('./models/OrderSchema');
const Review = require('./models/ReviewSchema');
const Banner = require('./models/BannerSchema');
const Post = require('./models/PostSchema');
const Voucher = require('./models/VoucherSchema');
const WishList = require('./models/WishListSchema');
const Cart = require('./models/CartSchema');

async function verifyDatabase() {
  try {
    console.log(chalk.blue('🔍 === DATABASE VERIFICATION ===\n'));
    
    // Connect to database
    const mongoUri = process.env.MONGO_URI || process.env.DB_URI || 'mongodb://localhost:27017/asm';
    await mongoose.connect(mongoUri);
    console.log(chalk.green('✅ MongoDB connected successfully\n'));
    
    // Count documents in each collection
    const collections = [
      { name: 'Users', model: User, emoji: '👥' },
      { name: 'Categories', model: Category, emoji: '📂' },
      { name: 'Colors', model: Color, emoji: '🎨' },
      { name: 'Sizes', model: Size, emoji: '📏' },
      { name: 'Products', model: Product, emoji: '🛍️' },
      { name: 'Product Variants', model: ProductVariant, emoji: '🔧' },
      { name: 'Payment Methods', model: PaymentMethod, emoji: '💳' },
      { name: 'Addresses', model: Address, emoji: '📍' },
      { name: 'Orders', model: Order, emoji: '🛒' },
      { name: 'Reviews', model: Review, emoji: '⭐' },
      { name: 'Carts', model: Cart, emoji: '🛍️' },
      { name: 'Wishlists', model: WishList, emoji: '💝' },
      { name: 'Banners', model: Banner, emoji: '🎪' },
      { name: 'Posts', model: Post, emoji: '📝' },
      { name: 'Vouchers', model: Voucher, emoji: '🎫' }
    ];
    
    console.log(chalk.yellow('📊 COLLECTION COUNTS:'));
    let totalDocs = 0;
    
    for (const collection of collections) {
      const count = await collection.model.countDocuments();
      totalDocs += count;
      
      const status = count > 0 ? chalk.green('✅') : chalk.red('❌');
      console.log(`${status} ${collection.emoji} ${collection.name}: ${chalk.cyan(count)} documents`);
    }
    
    console.log(chalk.blue(`\n📈 Total documents: ${chalk.cyan(totalDocs)}`));
    
    // Sample data verification
    console.log(chalk.yellow('\n🔍 SAMPLE DATA VERIFICATION:'));
    
    // Check cart contents
    const sampleCart = await Cart.findOne({ type: 'cart' }).populate({
      path: 'items.productVariant',
      populate: [
        { path: 'product', select: 'name' },
        { path: 'color', select: 'name' },
        { path: 'size', select: 'name' }
      ]
    });
    
    if (sampleCart) {
      console.log(chalk.green('✅ Sample Cart found:'));
      console.log(`   User: ${sampleCart.user}`);
      console.log(`   Items: ${sampleCart.items.length}`);
      console.log(`   Total: ${sampleCart.finalTotal?.toLocaleString()}đ`);
      
      if (sampleCart.items.length > 0 && sampleCart.items[0].productVariant) {
        const firstItem = sampleCart.items[0];
        console.log(`   First item: ${firstItem.productVariant.product?.name} - ${firstItem.productVariant.color?.name} - ${firstItem.productVariant.size?.name}`);
      }
    } else {
      console.log(chalk.red('❌ No cart data found'));
    }
    
    // Check wishlist contents
    const sampleWishlist = await WishList.findOne().populate('items.product', 'name');
    
    if (sampleWishlist) {
      console.log(chalk.green('✅ Sample Wishlist found:'));
      console.log(`   User: ${sampleWishlist.user}`);
      console.log(`   Items: ${sampleWishlist.items.length}`);
      
      if (sampleWishlist.items.length > 0) {
        const firstItem = sampleWishlist.items[0];
        console.log(`   First item: ${firstItem.product?.name}`);
      }
    } else {
      console.log(chalk.red('❌ No wishlist data found'));
    }
    
    // Check review contents
    const sampleReview = await Review.findOne().populate([
      { path: 'product', select: 'name' },
      { path: 'user', select: 'name' }
    ]);
    
    if (sampleReview) {
      console.log(chalk.green('✅ Sample Review found:'));
      console.log(`   Product: ${sampleReview.product?.name}`);
      console.log(`   User: ${sampleReview.user?.name}`);
      console.log(`   Rating: ${sampleReview.rating}/5`);
      console.log(`   Comment: ${sampleReview.comment.substring(0, 50)}...`);
    } else {
      console.log(chalk.red('❌ No review data found'));
    }
    
    // Check order contents
    const sampleOrder = await Order.findOne().populate([
      { path: 'user', select: 'name' },
      { path: 'address', select: 'city district' }
    ]);
    
    if (sampleOrder) {
      console.log(chalk.green('✅ Sample Order found:'));
      console.log(`   Order Code: ${sampleOrder.orderCode}`);
      console.log(`   User: ${sampleOrder.user?.name}`);
      console.log(`   Status: ${sampleOrder.status}`);
      console.log(`   Total: ${sampleOrder.finalTotal?.toLocaleString()}đ`);
      console.log(`   Location: ${sampleOrder.address?.city}, ${sampleOrder.address?.district}`);
    } else {
      console.log(chalk.red('❌ No order data found'));
    }
    
    console.log(chalk.green('\n🎉 === DATABASE VERIFICATION COMPLETED ==='));
    
  } catch (error) {
    console.error(chalk.red('❌ Verification failed:'), error.message);
  } finally {
    await mongoose.connection.close();
    console.log(chalk.yellow('🔌 Database connection closed.'));
  }
}

// Run verification
if (require.main === module) {
  verifyDatabase();
}

module.exports = verifyDatabase;
